import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../attachments/attachment_gc_scheduler.dart';
import '../models/agent.dart';
import '../models/message.dart';
import '../models/provider_snapshot.dart';
import '../models/stream.dart';
import '../models/workspace.dart';
import '../models/permission.dart';
import '../services/websocket_service.dart';
import '../timeline/session_stream_reducers.dart';
import '../timeline/session_workspace_scripts.dart';
import '../timeline/timeline_cursor.dart';

String _fileExplorerCacheKey(String cwd, String path, String? searchQuery) {
  final normalizedSearch = searchQuery?.trim().toLowerCase();
  if (normalizedSearch == null || normalizedSearch.isEmpty) {
    return '$cwd::$path';
  }
  return '$cwd::$path::search=$normalizedSearch';
}

String _directorySuggestionsCacheKey(String query) =>
    query.trim().toLowerCase();

String _providerSnapshotCacheKey(String? cwd) {
  final normalized = cwd?.trim();
  return normalized == null || normalized.isEmpty ? '__global__' : normalized;
}

@visibleForTesting
Map<String, AgentPermissionRequest> mergeAgentPendingPermissions({
  required Map<String, AgentPermissionRequest> current,
  required String agentId,
  required List<dynamic> pendingPermissions,
}) {
  final next = Map<String, AgentPermissionRequest>.from(current)
    ..removeWhere((key, _) => key.startsWith('$agentId:'));

  for (final raw in pendingPermissions) {
    if (raw is! Map) continue;
    try {
      final permission = AgentPermissionRequest.fromJson(
        Map<String, dynamic>.from(raw),
      );
      next['$agentId:${permission.id}'] = permission;
    } catch (_) {
      continue;
    }
  }

  return next;
}

class _PendingUserMessagePreview {
  final String text;
  final String messageId;
  final List<Map<String, dynamic>>? images;

  const _PendingUserMessagePreview({
    required this.text,
    required this.messageId,
    this.images,
  });
}

class SessionState {
  final String serverId;
  final DaemonClient? client;
  final bool isOnline;
  final Map<String, Agent> agents;
  final Map<String, WorkspaceDescriptor> workspaces;
  final Map<String, List<StreamItem>> agentStreamTail;
  final Map<String, List<StreamItem>> agentStreamHead;
  final Map<String, TimelineCursor> agentTimelineCursor;
  final Map<String, bool> agentTimelineInitializing;
  final Map<String, Completer<void>> agentTimelineInitDeferred;
  final bool hasHydratedAgents;
  final bool hasHydratedWorkspaces;
  final String? focusedAgentId;
  final Map<String, AgentPermissionRequest> pendingPermissions;
  final Map<String, List<Map<String, dynamic>>> fileExplorerEntries;
  final Map<String, List<String>> directorySuggestions;
  final Map<String, List<ProviderSnapshotEntry>> providerSnapshots;
  final Map<String, List<Map<String, dynamic>>> terminals;

  const SessionState({
    required this.serverId,
    this.client,
    this.isOnline = false,
    this.agents = const {},
    this.workspaces = const {},
    this.agentStreamTail = const {},
    this.agentStreamHead = const {},
    this.agentTimelineCursor = const {},
    this.agentTimelineInitializing = const {},
    this.agentTimelineInitDeferred = const {},
    this.hasHydratedAgents = false,
    this.hasHydratedWorkspaces = false,
    this.focusedAgentId,
    this.pendingPermissions = const <String, AgentPermissionRequest>{},
    this.fileExplorerEntries = const {},
    this.directorySuggestions = const {},
    this.providerSnapshots = const {},
    this.terminals = const {},
  });

  SessionState copyWith({
    String? serverId,
    DaemonClient? client,
    bool clearClient = false,
    bool? isOnline,
    Map<String, Agent>? agents,
    Map<String, WorkspaceDescriptor>? workspaces,
    Map<String, List<StreamItem>>? agentStreamTail,
    Map<String, List<StreamItem>>? agentStreamHead,
    Map<String, TimelineCursor>? agentTimelineCursor,
    Map<String, bool>? agentTimelineInitializing,
    Map<String, Completer<void>>? agentTimelineInitDeferred,
    bool? hasHydratedAgents,
    bool? hasHydratedWorkspaces,
    String? focusedAgentId,
    bool clearFocusedAgentId = false,
    Map<String, AgentPermissionRequest>? pendingPermissions,
    Map<String, List<Map<String, dynamic>>>? fileExplorerEntries,
    Map<String, List<String>>? directorySuggestions,
    Map<String, List<ProviderSnapshotEntry>>? providerSnapshots,
    Map<String, List<Map<String, dynamic>>>? terminals,
  }) => SessionState(
    serverId: serverId ?? this.serverId,
    client: clearClient ? null : (client ?? this.client),
    isOnline: isOnline ?? this.isOnline,
    agents: agents ?? this.agents,
    workspaces: workspaces ?? this.workspaces,
    agentStreamTail: agentStreamTail ?? this.agentStreamTail,
    agentStreamHead: agentStreamHead ?? this.agentStreamHead,
    agentTimelineCursor: agentTimelineCursor ?? this.agentTimelineCursor,
    agentTimelineInitializing:
        agentTimelineInitializing ?? this.agentTimelineInitializing,
    agentTimelineInitDeferred:
        agentTimelineInitDeferred ?? this.agentTimelineInitDeferred,
    hasHydratedAgents: hasHydratedAgents ?? this.hasHydratedAgents,
    hasHydratedWorkspaces: hasHydratedWorkspaces ?? this.hasHydratedWorkspaces,
    focusedAgentId: clearFocusedAgentId
        ? null
        : (focusedAgentId ?? this.focusedAgentId),
    pendingPermissions: pendingPermissions ?? this.pendingPermissions,
    fileExplorerEntries: fileExplorerEntries ?? this.fileExplorerEntries,
    directorySuggestions: directorySuggestions ?? this.directorySuggestions,
    providerSnapshots: providerSnapshots ?? this.providerSnapshots,
    terminals: terminals ?? this.terminals,
  );
}

class SessionNotifier extends StateNotifier<SessionState> {
  StreamSubscription? _messageSub;
  StreamSubscription? _stateSub;
  StreamSubscription? _terminalStreamSub;
  AgentStreamReducerQueue? _reducerQueue;
  final Map<String, Completer<WorkspaceDescriptor>> _openProjectCompleters = {};
  final Map<String, Completer<void>> _archiveWorkspaceCompleters = {};
  final Map<String, Completer<Agent>> _createAgentCompleters = {};
  final Map<String, Completer<void>> _sendAgentMessageCompleters = {};
  final Map<String, Completer<void>> _setAgentModeCompleters = {};
  final Map<String, Completer<void>> _setAgentModelCompleters = {};
  final Map<String, Completer<void>> _setAgentThinkingCompleters = {};
  final Map<String, _PendingUserMessagePreview> _createAgentInitialPreviews =
      {};
  final Map<String, String> _directorySuggestionQueriesByRequestId = {};
  final Map<String, String?> _providerSnapshotCwdsByRequestId = {};

  /// Registry of all serverIds that currently have a live SessionNotifier.
  static final Set<String> activeServerIds = <String>{};

  SessionNotifier(String serverId) : super(SessionState(serverId: serverId)) {
    activeServerIds.add(serverId);
    _reducerQueue = createAgentStreamReducerQueue(
      getSnapshot: _getAgentSnapshot,
      commit: _commitReducerResult,
      handleSideEffects: _handleReducerSideEffects,
      scheduleFlush: (duration, callback) => Timer(duration, callback),
      cancelFlush: (timer) => timer.cancel(),
    );
  }

  void attachClient(DaemonClient client) {
    state = state.copyWith(client: client, isOnline: client.state.isConnected);
    _messageSub?.cancel();
    _stateSub?.cancel();
    _terminalStreamSub?.cancel();
    _messageSub = client.messages.listen(_handleMessage);
    _terminalStreamSub = client.terminalStreamEvents.listen(
      _handleTerminalStreamEvent,
    );
    _stateSub = client.stateChanges.listen((connState) {
      final wasOnline = state.isOnline;
      state = state.copyWith(isOnline: connState.isConnected);
      if (connState.isConnected) {
        if (!wasOnline) {
          fetchAgents();
          fetchWorkspaces();
          refetchFocusedAgentTimeline();
        }
        return;
      }
      if (wasOnline || connState.error != null) {
        _failPendingOperations(
          StateError(connState.error ?? 'Device disconnected'),
        );
      }
    });
    fetchAgents();
    fetchWorkspaces();
  }

  void detachClient() {
    _messageSub?.cancel();
    _stateSub?.cancel();
    _terminalStreamSub?.cancel();
    _failPendingOperations(StateError('Device disconnected'));
    state = state.copyWith(clearClient: true, isOnline: false);
  }

  void _failPendingOperations(Object error) {
    for (final completer in _openProjectCompleters.values) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    }
    for (final completer in _archiveWorkspaceCompleters.values) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    }
    for (final completer in _createAgentCompleters.values) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    }
    for (final completer in _sendAgentMessageCompleters.values) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    }
    for (final completer in _setAgentModeCompleters.values) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    }
    for (final completer in _setAgentModelCompleters.values) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    }
    for (final completer in _setAgentThinkingCompleters.values) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    }
    for (final completer in state.agentTimelineInitDeferred.values) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    }
    _openProjectCompleters.clear();
    _archiveWorkspaceCompleters.clear();
    _createAgentCompleters.clear();
    _sendAgentMessageCompleters.clear();
    _createAgentInitialPreviews.clear();
    _setAgentModeCompleters.clear();
    _setAgentModelCompleters.clear();
    _setAgentThinkingCompleters.clear();
    if (state.agentTimelineInitDeferred.isNotEmpty ||
        state.agentTimelineInitializing.isNotEmpty) {
      state = state.copyWith(
        agentTimelineInitDeferred: const {},
        agentTimelineInitializing: const {},
      );
    }
  }

  void _handleMessage(Map<String, dynamic> msg) {
    final type = msg['type'] as String?;
    switch (type) {
      case 'agent_update':
        _handleAgentUpdate(msg);
      case 'agent_stream':
        _handleAgentStream(msg);
      case 'script_status_update':
        _handleScriptStatusUpdate(msg);
      case 'workspace_update':
        _handleWorkspaceUpdate(msg);
      case 'agent_permission_request':
        _handlePermissionRequest(msg);
      case 'agent_permission_resolved':
        _handlePermissionResolved(msg);
      case 'fetch_agents_response':
        _handleFetchAgentsResponse(msg);
      case 'fetch_workspaces_response':
        _handleFetchWorkspacesResponse(msg);
      case 'open_project_response':
        _handleOpenProjectResponse(msg);
      case 'archive_workspace_response':
        _handleArchiveWorkspaceResponse(msg);
      case 'fetch_agent_timeline_response':
        _handleFetchAgentTimelineResponse(msg);
      case 'send_agent_message_response':
        _handleSendAgentMessageResponse(msg);
      case 'set_agent_mode_response':
        _handleSetAgentModeResponse(msg);
      case 'set_agent_model_response':
        _handleSetAgentModelResponse(msg);
      case 'set_agent_thinking_response':
        _handleSetAgentThinkingResponse(msg);
      case 'file_explorer_response':
        _handleFileExplorerResponse(msg);
      case 'directory_suggestions_response':
        _handleDirectorySuggestionsResponse(msg);
      case 'get_providers_snapshot_response':
        _handleGetProvidersSnapshotResponse(msg);
      case 'providers_snapshot_update':
        _handleProvidersSnapshotUpdate(msg);
      case 'status':
        _handleStatusMessage(msg);
      case 'terminals_changed':
      case 'list_terminals_response':
        _handleTerminalsResponse(msg);
      case 'terminal_stream_exit':
        _handleTerminalStreamExit(msg);
      default:
        break;
    }
  }

  void _handleAgentUpdate(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    if (payload == null) return;

    if (payload['kind'] == 'remove') {
      final agentId = payload['agentId'] as String?;
      if (agentId == null || agentId.isEmpty) return;
      final next = Map<String, Agent>.from(state.agents);
      next.remove(agentId);
      final nextPermissions = Map<String, AgentPermissionRequest>.from(
        state.pendingPermissions,
      )..removeWhere((key, _) => key.startsWith('$agentId:'));
      state = state.copyWith(
        agents: next,
        pendingPermissions: nextPermissions,
        hasHydratedAgents: true,
      );
      return;
    }

    final rawAgent = payload['kind'] == 'upsert' ? payload['agent'] : payload;
    if (rawAgent is! Map) return;

    final agent = Agent.fromSnapshot(
      state.serverId,
      Map<String, dynamic>.from(rawAgent),
    );
    final next = Map<String, Agent>.from(state.agents);
    next[agent.id] = agent;
    state = state.copyWith(
      agents: next,
      pendingPermissions: mergeAgentPendingPermissions(
        current: state.pendingPermissions,
        agentId: agent.id,
        pendingPermissions: agent.pendingPermissions,
      ),
      hasHydratedAgents: true,
    );
  }

  void _handleAgentStream(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    if (payload == null) return;
    final agentId = payload['agentId'] as String?;
    final event = payload['event'] as Map<String, dynamic>?;
    if (agentId == null || event == null) return;

    final seq = payload['seq'] as int?;
    final epoch = payload['epoch'] as String?;
    final timestamp = DateTime.now();

    _reducerQueue?.enqueue(
      agentId,
      AgentStreamReducerEvent(
        event: event,
        seq: seq,
        epoch: epoch,
        timestamp: timestamp,
      ),
    );

    // Schedule attachment GC for user_message images.
    final eventItem = event['item'] as Map<String, dynamic>?;
    if (eventItem != null && eventItem['type'] == 'user_message') {
      final images = eventItem['images'] as List<dynamic>?;
      if (images != null && images.isNotEmpty) {
        scheduleAttachmentGc();
      }
    }
  }

  AgentStreamReducerSnapshot _getAgentSnapshot(String agentId) {
    final agent = state.agents[agentId];
    return (
      currentTail: state.agentStreamTail[agentId] ?? [],
      currentHead: state.agentStreamHead[agentId] ?? [],
      currentCursor: state.agentTimelineCursor[agentId],
      currentAgent: agent != null
          ? AgentStreamReducerAgentSnapshot(
              status: agent.status,
              updatedAt: agent.updatedAt,
              lastActivityAt: agent.lastActivityAt,
            )
          : null,
    );
  }

  void _commitReducerResult(
    String agentId,
    ProcessAgentStreamEventOutput result,
    List<AgentStreamReducerEvent> events,
  ) {
    var nextState = state;

    if (result.changedTail || result.changedHead) {
      final nextTail = Map<String, List<StreamItem>>.from(
        state.agentStreamTail,
      );
      final nextHead = Map<String, List<StreamItem>>.from(
        state.agentStreamHead,
      );

      if (result.changedTail) nextTail[agentId] = result.tail;
      if (result.changedHead) {
        if (result.head.isEmpty) {
          nextHead.remove(agentId);
        } else {
          nextHead[agentId] = result.head;
        }
      }
      nextState = nextState.copyWith(
        agentStreamTail: nextTail,
        agentStreamHead: nextHead,
      );
    }

    if (result.cursorChanged && result.cursor != null) {
      final nextCursors = Map<String, TimelineCursor>.from(
        state.agentTimelineCursor,
      );
      final lastEvent = events.isNotEmpty ? events.last : null;
      final current = nextCursors[agentId];
      if (!(current != null &&
          lastEvent != null &&
          lastEvent.seq != null &&
          lastEvent.epoch != null &&
          current.epoch == lastEvent.epoch &&
          lastEvent.seq! >= current.startSeq &&
          lastEvent.seq! <= current.endSeq)) {
        if (!(current != null &&
            current.epoch == result.cursor!.epoch &&
            current.startSeq == result.cursor!.startSeq &&
            current.endSeq == result.cursor!.endSeq)) {
          nextCursors[agentId] = result.cursor!;
          nextState = nextState.copyWith(agentTimelineCursor: nextCursors);
        }
      }
    }

    if (result.agentChanged && result.agent != null) {
      final nextAgents = Map<String, Agent>.from(state.agents);
      final current = nextAgents[agentId];
      if (current != null) {
        nextAgents[agentId] = current.copyWith(
          status: result.agent!.status,
          updatedAt: result.agent!.updatedAt,
          lastActivityAt: result.agent!.lastActivityAt,
        );
        nextState = nextState.copyWith(agents: nextAgents);
      }
    }

    state = nextState;
  }

  void _handleReducerSideEffects(
    String agentId,
    List<AgentStreamCatchUpSideEffect> sideEffects,
  ) {
    for (final effect in sideEffects) {
      _requestCanonicalCatchUp(agentId, effect.cursor);
    }
  }

  void _requestCanonicalCatchUp(String agentId, TimelineCursor cursor) {
    state.client?.send(
      FetchAgentTimelineRequestMessage(
        agentId: agentId,
        requestId: 'catchup-${DateTime.now().millisecondsSinceEpoch}',
        direction: 'after',
        startSeq: cursor.endSeq,
        epoch: cursor.epoch,
      ),
    );
  }

  void _handlePermissionRequest(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final agentId = payload?['agentId'] as String?;
    final request = payload?['request'] as Map<String, dynamic>?;
    if (agentId == null || request == null) return;
    final perm = AgentPermissionRequest.fromJson(request);
    final next = Map<String, AgentPermissionRequest>.from(
      state.pendingPermissions,
    );
    next['$agentId:${perm.id}'] = perm;
    state = state.copyWith(pendingPermissions: next);
  }

  void respondToPermission(
    String agentId,
    String requestId,
    Map<String, dynamic> response,
  ) {
    state.client?.send(
      AgentPermissionResponseMessage(
        agentId: agentId,
        requestId: requestId,
        response: response,
      ),
    );
    final next = Map<String, AgentPermissionRequest>.from(
      state.pendingPermissions,
    );
    next.remove('$agentId:$requestId');
    state = state.copyWith(pendingPermissions: next);
  }

  void _handlePermissionResolved(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final agentId = payload?['agentId'] as String?;
    final requestId = payload?['requestId'] as String?;
    if (agentId == null || requestId == null) return;
    final next = Map<String, AgentPermissionRequest>.from(
      state.pendingPermissions,
    );
    next.remove('$agentId:$requestId');
    state = state.copyWith(pendingPermissions: next);
  }

  void _handleWorkspaceUpdate(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    if (payload == null) return;

    if (payload['kind'] == 'remove') {
      final id = payload['id'] as String?;
      if (id == null) return;
      final next = Map<String, WorkspaceDescriptor>.from(state.workspaces);
      next.remove(id);
      state = state.copyWith(workspaces: next);
      return;
    }

    final rawWorkspace = payload['workspace'] is Map
        ? Map<String, dynamic>.from(payload['workspace'] as Map)
        : payload;
    final workspace = WorkspaceDescriptor.fromJson(rawWorkspace);
    final next = Map<String, WorkspaceDescriptor>.from(state.workspaces);
    next[workspace.id] = workspace;
    state = state.copyWith(workspaces: next);
  }

  void _handleScriptStatusUpdate(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    if (payload == null) return;
    final next = patchWorkspaceScripts(
      workspaces: state.workspaces,
      update: payload,
    );
    if (!identical(next, state.workspaces)) {
      state = state.copyWith(workspaces: next);
    }
  }

  void _handleFetchAgentsResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final next = Map<String, Agent>.from(state.agents);
    var nextPermissions = state.pendingPermissions;
    for (final raw in _agentSnapshotsFromFetchPayload(payload)) {
      final a = Agent.fromSnapshot(state.serverId, raw);
      next[a.id] = a;
      nextPermissions = mergeAgentPendingPermissions(
        current: nextPermissions,
        agentId: a.id,
        pendingPermissions: a.pendingPermissions,
      );
    }
    state = state.copyWith(
      agents: next,
      pendingPermissions: nextPermissions,
      hasHydratedAgents: true,
    );
  }

  Iterable<Map<String, dynamic>> _agentSnapshotsFromFetchPayload(
    Map<String, dynamic>? payload,
  ) sync* {
    if (payload == null) return;

    final legacyAgents = payload['agents'] as List<dynamic>? ?? const [];
    for (final raw in legacyAgents) {
      if (raw is Map) {
        yield Map<String, dynamic>.from(raw);
      }
    }

    final entries = payload['entries'] as List<dynamic>? ?? const [];
    for (final rawEntry in entries) {
      if (rawEntry is! Map) continue;
      final rawAgent = rawEntry['agent'];
      if (rawAgent is Map) {
        yield Map<String, dynamic>.from(rawAgent);
      }
    }
  }

  void _handleFetchAgentTimelineResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    if (payload == null) return;
    final agentId = payload['agentId'] as String?;
    if (agentId == null) return;

    final result = processTimelineResponse(
      ProcessTimelineResponseInput(
        payload: payload,
        currentTail: state.agentStreamTail[agentId] ?? [],
        currentHead: state.agentStreamHead[agentId] ?? [],
        currentCursor: state.agentTimelineCursor[agentId],
        isInitializing: state.agentTimelineInitializing[agentId] ?? false,
        hasActiveInitDeferred: state.agentTimelineInitDeferred.containsKey(
          agentId,
        ),
        initRequestDirection: 'tail',
      ),
    );

    final nextTail = Map<String, List<StreamItem>>.from(state.agentStreamTail);
    final nextHead = Map<String, List<StreamItem>>.from(state.agentStreamHead);
    nextTail[agentId] = result.tail;
    if (result.head.isEmpty) {
      nextHead.remove(agentId);
    } else {
      nextHead[agentId] = result.head;
    }

    var nextState = state.copyWith(
      agentStreamTail: nextTail,
      agentStreamHead: nextHead,
    );

    if (result.cursorChanged) {
      final nextCursors = Map<String, TimelineCursor>.from(
        state.agentTimelineCursor,
      );
      if (result.cursor != null) {
        nextCursors[agentId] = result.cursor!;
      } else {
        nextCursors.remove(agentId);
      }
      nextState = nextState.copyWith(agentTimelineCursor: nextCursors);
    }

    if (result.clearInitializing) {
      final nextInit = Map<String, bool>.from(state.agentTimelineInitializing);
      nextInit.remove(agentId);
      nextState = nextState.copyWith(agentTimelineInitializing: nextInit);
    }

    if (result.initResolution == 'resolve') {
      final nextDeferred = Map<String, Completer<void>>.from(
        state.agentTimelineInitDeferred,
      );
      final completer = nextDeferred.remove(agentId);
      completer?.complete();
      nextState = nextState.copyWith(agentTimelineInitDeferred: nextDeferred);
    } else if (result.initResolution == 'reject') {
      final nextDeferred = Map<String, Completer<void>>.from(
        state.agentTimelineInitDeferred,
      );
      final completer = nextDeferred.remove(agentId);
      completer?.completeError(result.error ?? 'Timeline init failed');
      nextState = nextState.copyWith(agentTimelineInitDeferred: nextDeferred);
    }

    // Handle side effects (catch-up requests, flush pending updates).
    for (final effect in result.sideEffects) {
      if (effect is CatchUpSideEffect) {
        _requestCanonicalCatchUp(agentId, effect.cursor);
      }
    }

    state = nextState;
  }

  void _handleSetAgentModeResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final requestId = payload?['requestId'] as String?;
    if (requestId == null) return;
    final completer = _setAgentModeCompleters.remove(requestId);
    if (completer == null || completer.isCompleted) return;
    final accepted = payload?['accepted'] == true;
    if (accepted) {
      completer.complete();
      return;
    }
    completer.completeError(
      Exception(payload?['error'] ?? 'Failed to update agent mode'),
    );
  }

  void _handleSendAgentMessageResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final requestId = payload?['requestId'] as String?;
    if (requestId == null) return;
    final completer = _sendAgentMessageCompleters.remove(requestId);
    if (completer == null || completer.isCompleted) return;
    final accepted = payload?['accepted'] == true;
    if (accepted) {
      completer.complete();
      return;
    }
    completer.completeError(
      Exception(payload?['error'] ?? 'Failed to send message'),
    );
  }

  void _handleSetAgentModelResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final requestId = payload?['requestId'] as String?;
    if (requestId == null) return;
    final completer = _setAgentModelCompleters.remove(requestId);
    if (completer == null || completer.isCompleted) return;
    final accepted = payload?['accepted'] == true;
    if (accepted) {
      completer.complete();
      return;
    }
    completer.completeError(
      Exception(payload?['error'] ?? 'Failed to update agent model'),
    );
  }

  void _handleSetAgentThinkingResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final requestId = payload?['requestId'] as String?;
    if (requestId == null) return;
    final completer = _setAgentThinkingCompleters.remove(requestId);
    if (completer == null || completer.isCompleted) return;
    final accepted = payload?['accepted'] == true;
    if (accepted) {
      completer.complete();
      return;
    }
    completer.completeError(
      Exception(payload?['error'] ?? 'Failed to update agent thinking option'),
    );
  }

  void _handleTerminalStreamEvent(TerminalStreamEvent event) {
    // Binary terminal frames (output/snapshot) are consumed by TerminalStreamController in the UI layer.
    // The session layer subscribes here only to keep the stream alive.
  }

  void _handleTerminalStreamExit(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final terminalId = payload?['terminalId'] as String?;
    if (terminalId == null) return;
    debugPrint('SessionNotifier: terminal $terminalId exited');
  }

  void _handleFileExplorerResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final cwd = payload?['cwd'] as String? ?? '.';
    final directory = payload?['directory'] as Map<String, dynamic>?;
    final entries =
        payload?['entries'] as List<dynamic>? ??
        directory?['entries'] as List<dynamic>? ??
        [];
    final responsePath =
        directory?['path'] as String? ?? payload?['path'] as String?;
    final searchQuery = payload?['searchQuery'] as String?;
    final next = Map<String, List<Map<String, dynamic>>>.from(
      state.fileExplorerEntries,
    );
    final normalizedEntries = entries
        .whereType<Map>()
        .map((entry) => Map<String, dynamic>.from(entry))
        .toList();
    if (searchQuery == null || searchQuery.trim().isEmpty) {
      next[cwd] = normalizedEntries;
    }
    if (responsePath != null && responsePath.isNotEmpty) {
      if (searchQuery == null || searchQuery.trim().isEmpty) {
        next[responsePath] = normalizedEntries;
      }
      next[_fileExplorerCacheKey(cwd, responsePath, searchQuery)] =
          normalizedEntries;
    }
    state = state.copyWith(fileExplorerEntries: next);
  }

  void _handleDirectorySuggestionsResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final requestId = payload?['requestId'] as String?;
    final query = requestId == null
        ? null
        : _directorySuggestionQueriesByRequestId.remove(requestId);
    if (query == null) return;

    final entries = payload?['entries'] as List<dynamic>? ?? [];
    final directories = payload?['directories'] as List<dynamic>? ?? [];
    final paths = entries.isNotEmpty
        ? entries
              .whereType<Map>()
              .where((entry) => entry['kind'] == 'directory')
              .map((entry) => entry['path'])
              .whereType<String>()
              .toList()
        : directories.whereType<String>().toList();
    final next = Map<String, List<String>>.from(state.directorySuggestions);
    next[_directorySuggestionsCacheKey(query)] = paths;
    state = state.copyWith(directorySuggestions: next);
  }

  void _handleGetProvidersSnapshotResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final requestId = payload?['requestId'] as String?;
    final cwd = requestId == null
        ? null
        : _providerSnapshotCwdsByRequestId.remove(requestId);
    final entries = _parseProviderSnapshotEntries(payload?['entries']);
    final next = Map<String, List<ProviderSnapshotEntry>>.from(
      state.providerSnapshots,
    );
    next[_providerSnapshotCacheKey(cwd)] = entries;
    state = state.copyWith(providerSnapshots: next);
  }

  void _handleProvidersSnapshotUpdate(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final entries = _parseProviderSnapshotEntries(payload?['entries']);
    final next = Map<String, List<ProviderSnapshotEntry>>.from(
      state.providerSnapshots,
    );
    next[_providerSnapshotCacheKey(payload?['cwd'] as String?)] = entries;
    state = state.copyWith(providerSnapshots: next);
  }

  List<ProviderSnapshotEntry> _parseProviderSnapshotEntries(
    dynamic rawEntries,
  ) {
    return (rawEntries as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map(
          (entry) =>
              ProviderSnapshotEntry.fromJson(Map<String, dynamic>.from(entry)),
        )
        .toList();
  }

  void _handleStatusMessage(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    if (payload == null) return;
    final status = payload['status'] as String?;
    final requestId = payload['requestId'] as String?;
    if (requestId == null) return;

    if (status == 'agent_created') {
      final completer = _createAgentCompleters.remove(requestId);
      final pendingPreview = _createAgentInitialPreviews.remove(requestId);
      final rawAgent = payload['agent'];
      final agentId = payload['agentId'] as String?;
      if (rawAgent is Map) {
        final agent = Agent.fromSnapshot(
          state.serverId,
          Map<String, dynamic>.from(rawAgent),
        );
        final nextAgents = Map<String, Agent>.from(state.agents);
        nextAgents[agent.id] = agent;
        state = state.copyWith(
          agents: nextAgents,
          pendingPermissions: mergeAgentPendingPermissions(
            current: state.pendingPermissions,
            agentId: agent.id,
            pendingPermissions: agent.pendingPermissions,
          ),
          hasHydratedAgents: true,
        );
        if (pendingPreview != null) {
          _appendPendingUserMessagePreview(agent.id, pendingPreview);
        }
        completer?.complete(agent);
        return;
      }
      if (agentId != null && agentId.isNotEmpty) {
        final existing = state.agents[agentId];
        if (existing != null) {
          if (pendingPreview != null) {
            _appendPendingUserMessagePreview(existing.id, pendingPreview);
          }
          completer?.complete(existing);
        } else {
          completer?.completeError(Exception('Agent created without snapshot'));
        }
      }
      return;
    }

    if (status == 'agent_create_failed') {
      final completer = _createAgentCompleters.remove(requestId);
      _createAgentInitialPreviews.remove(requestId);
      final error = payload['error'] as String? ?? 'Failed to create agent';
      completer?.completeError(Exception(error));
    }
  }

  void _appendPendingUserMessagePreview(
    String agentId,
    _PendingUserMessagePreview preview,
  ) {
    if (preview.text.trim().isEmpty &&
        (preview.images == null || preview.images!.isEmpty)) {
      return;
    }

    List<StreamItem> mergePreview(List<StreamItem> current) {
      final existingIndex = current.indexWhere(
        (item) => item is UserMessageItem && item.id == preview.messageId,
      );
      if (existingIndex >= 0) {
        final existing = current[existingIndex] as UserMessageItem;
        final hasImages =
            existing.images != null && existing.images!.isNotEmpty;
        if (hasImages || preview.images == null || preview.images!.isEmpty) {
          return current;
        }
        final next = List<StreamItem>.from(current);
        next[existingIndex] = existing.copyWith(images: preview.images);
        return next;
      }
      return [
        ...current,
        UserMessageItem(
          id: preview.messageId,
          timestamp: DateTime.now(),
          text: preview.text,
          images: preview.images,
        ),
      ];
    }

    final nextTail = Map<String, List<StreamItem>>.from(state.agentStreamTail);
    final nextHead = Map<String, List<StreamItem>>.from(state.agentStreamHead);
    if ((nextHead[agentId] ?? const <StreamItem>[]).isNotEmpty) {
      nextHead[agentId] = mergePreview(nextHead[agentId] ?? const []);
      state = state.copyWith(agentStreamHead: nextHead);
      return;
    }
    nextTail[agentId] = mergePreview(nextTail[agentId] ?? const []);
    state = state.copyWith(agentStreamTail: nextTail);
  }

  void _handleTerminalsResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final terminals = payload?['terminals'] as List<dynamic>? ?? [];
    final next = Map<String, List<Map<String, dynamic>>>.from(state.terminals);
    next['default'] = terminals.cast<Map<String, dynamic>>();
    state = state.copyWith(terminals: next);
  }

  void _handleFetchWorkspacesResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final workspaces =
        payload?['workspaces'] as List<dynamic>? ??
        payload?['entries'] as List<dynamic>? ??
        [];
    final next = Map<String, WorkspaceDescriptor>.from(state.workspaces);
    for (final raw in workspaces) {
      if (raw is! Map) continue;
      final w = WorkspaceDescriptor.fromJson(Map<String, dynamic>.from(raw));
      next[w.id] = w;
    }
    state = state.copyWith(workspaces: next, hasHydratedWorkspaces: true);
  }

  void _handleOpenProjectResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final requestId = payload?['requestId'] as String?;
    final completer = requestId == null
        ? null
        : _openProjectCompleters.remove(requestId);
    final error = payload?['error'] as String?;
    final rawWorkspace = payload?['workspace'];

    if (error != null && error.isNotEmpty) {
      completer?.completeError(Exception(error));
      return;
    }
    if (rawWorkspace is! Map) {
      completer?.completeError(Exception('Failed to open project'));
      return;
    }

    final workspace = WorkspaceDescriptor.fromJson(
      Map<String, dynamic>.from(rawWorkspace),
    );
    final next = Map<String, WorkspaceDescriptor>.from(state.workspaces);
    next[workspace.id] = workspace;
    state = state.copyWith(workspaces: next, hasHydratedWorkspaces: true);
    completer?.complete(workspace);
  }

  void _handleArchiveWorkspaceResponse(Map<String, dynamic> msg) {
    final payload = msg['payload'] as Map<String, dynamic>?;
    final requestId = payload?['requestId'] as String?;
    final completer = requestId == null
        ? null
        : _archiveWorkspaceCompleters.remove(requestId);
    final error = payload?['error'] as String?;
    if (error != null && error.isNotEmpty) {
      completer?.completeError(Exception(error));
      return;
    }

    final workspaceId = payload?['workspaceId'] as String?;
    if (workspaceId != null && workspaceId.isNotEmpty) {
      final next = Map<String, WorkspaceDescriptor>.from(state.workspaces);
      next.remove(workspaceId);
      state = state.copyWith(workspaces: next);
    }
    completer?.complete();
  }

  void fetchAgents() {
    state.client?.send(
      FetchAgentsRequestMessage(
        requestId: 'fetch-agents-${DateTime.now().millisecondsSinceEpoch}',
        subscribe: {'subscriptionId': 'agents-${state.serverId}'},
      ),
    );
  }

  void fetchWorkspaces() {
    state.client?.send(
      FetchWorkspacesRequestMessage(
        requestId: 'fetch-workspaces-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  Future<WorkspaceDescriptor> openProject(String cwd) {
    final client = state.client;
    if (client == null || !state.isOnline) {
      return Future.error(StateError('Device is not connected'));
    }

    final requestId = 'open-project-${DateTime.now().millisecondsSinceEpoch}';
    final completer = Completer<WorkspaceDescriptor>();
    _openProjectCompleters[requestId] = completer;
    client.send(OpenProjectRequestMessage(cwd: cwd, requestId: requestId));

    return completer.future.timeout(
      const Duration(seconds: 15),
      onTimeout: () {
        _openProjectCompleters.remove(requestId);
        throw TimeoutException('Open project timed out');
      },
    );
  }

  Future<void> archiveWorkspace(String workspaceId) {
    final client = state.client;
    if (client == null || !state.isOnline) {
      return Future.error(StateError('Device is not connected'));
    }

    final requestId =
        'archive-workspace-${DateTime.now().millisecondsSinceEpoch}';
    final completer = Completer<void>();
    _archiveWorkspaceCompleters[requestId] = completer;
    client.send(
      ArchiveWorkspaceRequestMessage(
        workspaceId: workspaceId,
        requestId: requestId,
      ),
    );

    return completer.future.timeout(
      const Duration(seconds: 10),
      onTimeout: () {
        _archiveWorkspaceCompleters.remove(requestId);
        throw TimeoutException('Archive workspace timed out');
      },
    );
  }

  Future<void> sendMessage(
    String agentId,
    String text, {
    List<Map<String, String>>? images,
  }) {
    final client = state.client;
    if (client == null || !state.isOnline) {
      return Future.error(StateError('Device is not connected'));
    }

    final nowUs = DateTime.now().microsecondsSinceEpoch;
    final messageId = 'msg-$nowUs';
    final requestId = 'send-agent-message-$nowUs';
    final completer = Completer<void>();
    _sendAgentMessageCompleters[requestId] = completer;

    // Optimistic update: immediately show the user message in the stream.
    final tail = List<StreamItem>.from(state.agentStreamTail[agentId] ?? []);
    final head = List<StreamItem>.from(state.agentStreamHead[agentId] ?? []);

    final currentHead = state.agentStreamHead[agentId];
    final userMessage = UserMessageItem(
      id: messageId,
      text: text,
      timestamp: DateTime.now(),
      images: images?.cast<Map<String, dynamic>>(),
    );

    if (currentHead != null && currentHead.isNotEmpty) {
      final nextHead = Map<String, List<StreamItem>>.from(
        state.agentStreamHead,
      );
      nextHead[agentId] = [...head, userMessage];
      state = state.copyWith(agentStreamHead: nextHead);
    } else {
      final nextTail = Map<String, List<StreamItem>>.from(
        state.agentStreamTail,
      );
      nextTail[agentId] = [...tail, userMessage];
      state = state.copyWith(agentStreamTail: nextTail);
    }

    client.send(
      SendAgentMessage(
        agentId: agentId,
        text: text,
        requestId: requestId,
        messageId: messageId,
        images: images,
      ),
    );

    return completer.future.timeout(
      const Duration(seconds: 20),
      onTimeout: () {
        _sendAgentMessageCompleters.remove(requestId);
        throw TimeoutException('Send message timed out');
      },
    );
  }

  void cancelAgent(String agentId) {
    state.client?.send(CancelAgentRequestMessage(agentId: agentId));
  }

  Future<void> setAgentMode(String agentId, String modeId) {
    final client = state.client;
    if (client == null || !state.isOnline) {
      return Future.error(StateError('Device is not connected'));
    }

    final requestId = 'set-mode-${DateTime.now().millisecondsSinceEpoch}';
    final completer = Completer<void>();
    _setAgentModeCompleters[requestId] = completer;
    client.send(
      SetAgentModeRequestMessage(
        agentId: agentId,
        modeId: modeId,
        requestId: requestId,
      ),
    );

    return completer.future.timeout(
      const Duration(seconds: 10),
      onTimeout: () {
        _setAgentModeCompleters.remove(requestId);
        throw TimeoutException('Set agent mode timed out');
      },
    );
  }

  Future<void> setAgentModel(String agentId, String? modelId) {
    final client = state.client;
    if (client == null || !state.isOnline) {
      return Future.error(StateError('Device is not connected'));
    }

    final requestId = 'set-model-${DateTime.now().millisecondsSinceEpoch}';
    final completer = Completer<void>();
    _setAgentModelCompleters[requestId] = completer;
    client.send(
      SetAgentModelRequestMessage(
        agentId: agentId,
        modelId: modelId,
        requestId: requestId,
      ),
    );

    return completer.future.timeout(
      const Duration(seconds: 10),
      onTimeout: () {
        _setAgentModelCompleters.remove(requestId);
        throw TimeoutException('Set agent model timed out');
      },
    );
  }

  Future<void> setAgentThinkingOption(
    String agentId,
    String? thinkingOptionId,
  ) {
    final client = state.client;
    if (client == null || !state.isOnline) {
      return Future.error(StateError('Device is not connected'));
    }

    final requestId = 'set-thinking-${DateTime.now().millisecondsSinceEpoch}';
    final completer = Completer<void>();
    _setAgentThinkingCompleters[requestId] = completer;
    client.send(
      SetAgentThinkingRequestMessage(
        agentId: agentId,
        thinkingOptionId: thinkingOptionId,
        requestId: requestId,
      ),
    );

    return completer.future.timeout(
      const Duration(seconds: 10),
      onTimeout: () {
        _setAgentThinkingCompleters.remove(requestId);
        throw TimeoutException('Set agent thinking option timed out');
      },
    );
  }

  void createAgent(Map<String, dynamic> config, {String? initialPrompt}) {
    state.client?.send(
      CreateAgentRequestMessage(
        config: _withPromptDerivedTitle(config, initialPrompt),
        initialPrompt: initialPrompt,
        requestId: 'create-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  Future<Agent> createAgentAndWait({
    required Map<String, dynamic> config,
    String? workspaceId,
    String? initialPrompt,
    String? clientMessageId,
    List<Map<String, String>>? images,
    List<Map<String, dynamic>>? attachments,
    Map<String, String>? labels,
  }) {
    final client = state.client;
    if (client == null || !state.isOnline) {
      return Future.error(StateError('Device is not connected'));
    }

    final requestId = 'create-${DateTime.now().millisecondsSinceEpoch}';
    final completer = Completer<Agent>();
    _createAgentCompleters[requestId] = completer;
    if (clientMessageId != null &&
        clientMessageId.isNotEmpty &&
        (initialPrompt?.trim().isNotEmpty == true ||
            (images != null && images.isNotEmpty))) {
      _createAgentInitialPreviews[requestId] = _PendingUserMessagePreview(
        text: initialPrompt ?? '',
        messageId: clientMessageId,
        images: images
            ?.map((image) => Map<String, dynamic>.from(image))
            .toList(),
      );
    }
    client.send(
      CreateAgentRequestMessage(
        config: _withPromptDerivedTitle(config, initialPrompt),
        workspaceId: workspaceId,
        initialPrompt: initialPrompt,
        clientMessageId: clientMessageId,
        images: images,
        attachments: attachments,
        labels: labels,
        requestId: requestId,
      ),
    );

    return completer.future.timeout(
      const Duration(seconds: 30),
      onTimeout: () {
        _createAgentCompleters.remove(requestId);
        _createAgentInitialPreviews.remove(requestId);
        throw TimeoutException('Create agent timed out');
      },
    );
  }

  Map<String, dynamic> _withPromptDerivedTitle(
    Map<String, dynamic> config,
    String? initialPrompt,
  ) {
    final explicitTitle = config['title'];
    if (explicitTitle is String && explicitTitle.trim().isNotEmpty) {
      return config;
    }
    final title = _deriveInitialAgentTitle(initialPrompt);
    if (title == null) {
      return config;
    }
    return {...config, 'title': title};
  }

  String? _deriveInitialAgentTitle(String? prompt) {
    final trimmedPrompt = prompt?.trim();
    if (trimmedPrompt == null || trimmedPrompt.isEmpty) {
      return null;
    }
    final firstLine = trimmedPrompt
        .split(RegExp(r'[\r\n]+'))
        .map((line) => line.trim())
        .firstWhere((line) => line.isNotEmpty, orElse: () => '');
    if (firstLine.isEmpty) {
      return null;
    }
    final normalized = firstLine.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (normalized.isEmpty) {
      return null;
    }
    const maxTitleChars = 60;
    if (normalized.length <= maxTitleChars) {
      return normalized;
    }
    return normalized.substring(0, maxTitleChars).trim();
  }

  void fetchProvidersSnapshot({String? cwd}) {
    final client = state.client;
    if (client == null) return;
    final requestId =
        'providers-snapshot-${DateTime.now().millisecondsSinceEpoch}';
    _providerSnapshotCwdsByRequestId[requestId] = cwd;
    client.send(
      GetProvidersSnapshotRequestMessage(cwd: cwd, requestId: requestId),
    );
  }

  void refreshProvidersSnapshot({String? cwd, List<String>? providers}) {
    final client = state.client;
    if (client == null) return;
    client.send(
      RefreshProvidersSnapshotRequestMessage(
        cwd: cwd,
        providers: providers,
        requestId: 'refresh-providers-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  void fetchAgentTimelineBefore(String agentId) {
    final cursor = state.agentTimelineCursor[agentId];
    if (cursor == null) return;
    state.client?.send(
      FetchAgentTimelineRequestMessage(
        agentId: agentId,
        requestId: 'timeline-before-${DateTime.now().millisecondsSinceEpoch}',
        direction: 'before',
        startSeq: cursor.startSeq,
        epoch: cursor.epoch,
      ),
    );
  }

  void fetchAgentTimeline(String agentId, {String direction = 'tail'}) {
    final nextInit = Map<String, bool>.from(state.agentTimelineInitializing);
    nextInit[agentId] = true;
    state = state.copyWith(agentTimelineInitializing: nextInit);

    state.client?.send(
      FetchAgentTimelineRequestMessage(
        agentId: agentId,
        requestId: 'timeline-${DateTime.now().millisecondsSinceEpoch}',
        direction: direction,
      ),
    );
  }

  void setFocusedAgent(String? agentId) {
    state = state.copyWith(focusedAgentId: agentId);
  }

  void refetchFocusedAgentTimeline() {
    final agentId = state.focusedAgentId;
    if (agentId == null || agentId.isEmpty) return;
    final agent = state.agents[agentId];
    if (agent == null) return;
    fetchAgentTimeline(agentId);
  }

  void archiveAgent(String agentId) {
    state.client?.send(
      ArchiveAgentRequestMessage(
        agentId: agentId,
        requestId: 'archive-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  void sendVoiceMode(bool enabled, {String? agentId}) {
    state.client?.send(
      SetVoiceModeMessage(
        enabled: enabled,
        agentId: agentId,
        requestId: 'voice-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  void deleteAgent(String agentId) {
    state.client?.send(
      DeleteAgentRequestMessage(
        agentId: agentId,
        requestId: 'delete-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  void fetchFileExplorer(
    String cwd, {
    String? path,
    String? searchQuery,
    bool recursive = false,
    bool directoriesOnly = false,
  }) {
    state.client?.send(
      FileExplorerRequestMessage(
        cwd: cwd,
        path: path,
        searchQuery: searchQuery,
        recursive: recursive,
        directoriesOnly: directoriesOnly,
        requestId: 'files-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  void fetchDirectorySuggestions(String query, {int limit = 30}) {
    final client = state.client;
    if (client == null) return;
    final requestId =
        'dir-suggestions-${DateTime.now().millisecondsSinceEpoch}';
    _directorySuggestionQueriesByRequestId[requestId] = query;
    client.send(
      DirectorySuggestionsRequestMessage(
        query: query,
        includeDirectories: true,
        includeFiles: false,
        limit: limit,
        requestId: requestId,
      ),
    );
  }

  void subscribeTerminals(String cwd) {
    state.client?.subscribeTerminals(cwd);
  }

  void unsubscribeTerminals(String cwd) {
    state.client?.unsubscribeTerminals(cwd);
  }

  void listTerminals({String? cwd}) {
    state.client?.send(
      ListTerminalsRequestMessage(
        cwd: cwd,
        requestId: 'terminals-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  void createTerminal(
    String cwd, {
    String? name,
    String? agentId,
    String? command,
    List<String>? args,
  }) {
    state.client?.send(
      CreateTerminalRequestMessage(
        cwd: cwd,
        name: name,
        agentId: agentId,
        command: command,
        args: args,
        requestId: 'create-term-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  Future<Map<String, dynamic>> subscribeTerminal(String terminalId) async {
    final client = state.client;
    if (client == null) return {'error': 'Not connected'};
    return client.subscribeTerminal(terminalId);
  }

  void unsubscribeTerminal(String terminalId) {
    state.client?.unsubscribeTerminal(terminalId);
  }

  void sendTerminalInput(String terminalId, Map<String, dynamic> message) {
    state.client?.sendTerminalInput(terminalId, message);
  }

  void killTerminal(String terminalId) {
    state.client?.send(
      KillTerminalRequestMessage(
        terminalId: terminalId,
        requestId: 'kill-term-${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
  }

  @override
  void dispose() {
    activeServerIds.remove(state.serverId);
    _reducerQueue?.dispose();
    _messageSub?.cancel();
    _stateSub?.cancel();
    _terminalStreamSub?.cancel();
    _failPendingOperations(StateError('Session disposed'));
    _directorySuggestionQueriesByRequestId.clear();
    _providerSnapshotCwdsByRequestId.clear();
    super.dispose();
  }
}

final sessionProvider =
    StateNotifierProvider.family<SessionNotifier, SessionState, String>((
      ref,
      serverId,
    ) {
      return SessionNotifier(serverId);
    });

// ============================================================================
// Optimized selectors - use these in UI to avoid full-tree rebuilds
// ============================================================================

final sessionAgentsProvider = Provider.family<Map<String, Agent>, String>((
  ref,
  serverId,
) {
  return ref.watch(sessionProvider(serverId).select((s) => s.agents));
});

final sessionAgentListProvider = Provider.family<List<Agent>, String>((
  ref,
  serverId,
) {
  return ref.watch(
    sessionProvider(serverId).select((s) {
      return s.agents.values.where((a) => a.archivedAt == null).toList()
        ..sort((a, b) => b.lastActivityAt.compareTo(a.lastActivityAt));
    }),
  );
});

final sessionHydratedProvider = Provider.family<bool, String>((ref, serverId) {
  return ref.watch(
    sessionProvider(serverId).select((s) => s.hasHydratedAgents),
  );
});

final sessionOnlineProvider = Provider.family<bool, String>((ref, serverId) {
  return ref.watch(sessionProvider(serverId).select((s) => s.isOnline));
});

final agentStreamProvider = Provider.family<List<StreamItem>, (String, String)>(
  (ref, params) {
    final (serverId, agentId) = params;
    return ref.watch(
      sessionProvider(serverId).select((s) {
        final tail = s.agentStreamTail[agentId] ?? [];
        final head = s.agentStreamHead[agentId] ?? [];
        return [...tail, ...head];
      }),
    );
  },
);

final agentTimelineInitializingProvider =
    Provider.family<bool, (String, String)>((ref, params) {
  final (serverId, agentId) = params;
  return ref.watch(
    sessionProvider(serverId)
        .select((s) => s.agentTimelineInitializing[agentId] ?? false),
  );
});

final agentPermissionsProvider =
    Provider.family<List<AgentPermissionRequest>, (String, String)>((
      ref,
      params,
    ) {
      final (serverId, agentId) = params;
      return ref.watch(
        sessionProvider(serverId).select((s) {
          return s.pendingPermissions.entries
              .where((e) => e.key.startsWith('$agentId:'))
              .map((e) => e.value)
              .toList();
        }),
      );
    });

final fileExplorerEntriesProvider =
    Provider.family<List<Map<String, dynamic>>, (String, String)>((
      ref,
      params,
    ) {
      final (serverId, path) = params;
      return ref.watch(
        sessionProvider(
          serverId,
        ).select((s) => s.fileExplorerEntries[path] ?? []),
      );
    });

final terminalListProvider =
    Provider.family<List<Map<String, dynamic>>, String>((ref, serverId) {
      return ref.watch(
        sessionProvider(serverId).select((s) => s.terminals['default'] ?? []),
      );
    });

final providerSnapshotEntriesProvider =
    Provider.family<List<ProviderSnapshotEntry>, (String, String?)>((
      ref,
      params,
    ) {
      final (serverId, cwd) = params;
      return ref.watch(
        sessionProvider(serverId).select(
          (s) =>
              s.providerSnapshots[_providerSnapshotCacheKey(cwd)] ??
              s.providerSnapshots[_providerSnapshotCacheKey(null)] ??
              const <ProviderSnapshotEntry>[],
        ),
      );
    });
