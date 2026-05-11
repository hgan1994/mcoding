import 'dart:convert';

sealed class DaemonMessage {
  final String type;
  const DaemonMessage({required this.type});

  Map<String, dynamic> toJson();
  String toJsonString() => jsonEncode(toJson());
}

class WSHelloMessage extends DaemonMessage {
  final String id;
  final String clientId;
  final String version;
  final int timestamp;

  const WSHelloMessage({
    required this.id,
    required this.clientId,
    this.version = '1.0',
    required this.timestamp,
  }) : super(type: 'ws_hello');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'id': id,
    'clientId': clientId,
    'version': version,
    'timestamp': timestamp,
  };
}

class FetchAgentsRequestMessage extends DaemonMessage {
  final String requestId;
  final Map<String, dynamic>? filter;
  final Map<String, dynamic>? subscribe;

  const FetchAgentsRequestMessage({
    required this.requestId,
    this.filter,
    this.subscribe,
  }) : super(type: 'fetch_agents_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'requestId': requestId,
    if (filter != null) 'filter': filter,
    if (subscribe != null) 'subscribe': subscribe,
  };
}

class FetchWorkspacesRequestMessage extends DaemonMessage {
  final String requestId;

  const FetchWorkspacesRequestMessage({required this.requestId})
    : super(type: 'fetch_workspaces_request');

  @override
  Map<String, dynamic> toJson() => {'type': type, 'requestId': requestId};
}

class OpenProjectRequestMessage extends DaemonMessage {
  final String cwd;
  final String requestId;

  const OpenProjectRequestMessage({required this.cwd, required this.requestId})
    : super(type: 'open_project_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'cwd': cwd,
    'requestId': requestId,
  };
}

class ArchiveWorkspaceRequestMessage extends DaemonMessage {
  final String workspaceId;
  final String requestId;

  const ArchiveWorkspaceRequestMessage({
    required this.workspaceId,
    required this.requestId,
  }) : super(type: 'archive_workspace_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'workspaceId': workspaceId,
    'requestId': requestId,
  };
}

class SendAgentMessage extends DaemonMessage {
  final String agentId;
  final String text;
  final String requestId;
  final String? messageId;
  final List<Map<String, String>>? images;
  final List<Map<String, dynamic>>? attachments;

  const SendAgentMessage({
    required this.agentId,
    required this.text,
    required this.requestId,
    this.messageId,
    this.images,
    this.attachments,
  }) : super(type: 'send_agent_message_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'requestId': requestId,
    'agentId': agentId,
    'text': text,
    if (messageId != null) 'messageId': messageId,
    if (images != null && images!.isNotEmpty) 'images': images,
    if (attachments != null && attachments!.isNotEmpty)
      'attachments': attachments,
  };
}

class CancelAgentRequestMessage extends DaemonMessage {
  final String agentId;

  const CancelAgentRequestMessage({required this.agentId})
    : super(type: 'cancel_agent_request');

  @override
  Map<String, dynamic> toJson() => {'type': type, 'agentId': agentId};
}

class CreateAgentRequestMessage extends DaemonMessage {
  final Map<String, dynamic> config;
  final String? workspaceId;
  final String? initialPrompt;
  final String? clientMessageId;
  final List<Map<String, String>>? images;
  final List<Map<String, dynamic>>? attachments;
  final Map<String, String>? labels;
  final String requestId;

  const CreateAgentRequestMessage({
    required this.config,
    this.workspaceId,
    this.initialPrompt,
    this.clientMessageId,
    this.images,
    this.attachments,
    this.labels,
    required this.requestId,
  }) : super(type: 'create_agent_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'config': config,
    if (workspaceId != null) 'workspaceId': workspaceId,
    if (initialPrompt != null) 'initialPrompt': initialPrompt,
    if (clientMessageId != null) 'clientMessageId': clientMessageId,
    if (images != null && images!.isNotEmpty) 'images': images,
    if (attachments != null && attachments!.isNotEmpty)
      'attachments': attachments,
    if (labels != null && labels!.isNotEmpty) 'labels': labels,
    'requestId': requestId,
  };
}

class GetProvidersSnapshotRequestMessage extends DaemonMessage {
  final String? cwd;
  final String requestId;

  const GetProvidersSnapshotRequestMessage({this.cwd, required this.requestId})
    : super(type: 'get_providers_snapshot_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    if (cwd != null && cwd!.isNotEmpty) 'cwd': cwd,
    'requestId': requestId,
  };
}

class RefreshProvidersSnapshotRequestMessage extends DaemonMessage {
  final String? cwd;
  final List<String>? providers;
  final String requestId;

  const RefreshProvidersSnapshotRequestMessage({
    this.cwd,
    this.providers,
    required this.requestId,
  }) : super(type: 'refresh_providers_snapshot_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    if (cwd != null && cwd!.isNotEmpty) 'cwd': cwd,
    if (providers != null && providers!.isNotEmpty) 'providers': providers,
    'requestId': requestId,
  };
}

class FetchAgentTimelineRequestMessage extends DaemonMessage {
  final String agentId;
  final String requestId;
  final String? direction;
  final int? startSeq;
  final String? epoch;
  final int? limit;
  final String? projection;

  const FetchAgentTimelineRequestMessage({
    required this.agentId,
    required this.requestId,
    this.direction,
    this.startSeq,
    this.epoch,
    this.limit,
    this.projection,
  }) : super(type: 'fetch_agent_timeline_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'agentId': agentId,
    'requestId': requestId,
    if (direction != null) 'direction': direction,
    if (startSeq != null && epoch != null)
      'cursor': {'epoch': epoch, 'seq': startSeq},
    if (limit != null) 'limit': limit,
    if (projection != null) 'projection': projection,
  };
}

class AgentPermissionResponseMessage extends DaemonMessage {
  final String agentId;
  final String requestId;
  final Map<String, dynamic> response;

  const AgentPermissionResponseMessage({
    required this.agentId,
    required this.requestId,
    required this.response,
  }) : super(type: 'agent_permission_response');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'agentId': agentId,
    'requestId': requestId,
    'response': response,
  };
}

class DeleteAgentRequestMessage extends DaemonMessage {
  final String agentId;
  final String requestId;

  const DeleteAgentRequestMessage({
    required this.agentId,
    required this.requestId,
  }) : super(type: 'delete_agent_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'agentId': agentId,
    'requestId': requestId,
  };
}

class ArchiveAgentRequestMessage extends DaemonMessage {
  final String agentId;
  final String requestId;

  const ArchiveAgentRequestMessage({
    required this.agentId,
    required this.requestId,
  }) : super(type: 'archive_agent_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'agentId': agentId,
    'requestId': requestId,
  };
}

class UpdateAgentRequestMessage extends DaemonMessage {
  final String agentId;
  final String requestId;
  final String? name;
  final Map<String, String>? labels;

  const UpdateAgentRequestMessage({
    required this.agentId,
    required this.requestId,
    this.name,
    this.labels,
  }) : super(type: 'update_agent_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'agentId': agentId,
    'requestId': requestId,
    if (name != null) 'name': name,
    if (labels != null) 'labels': labels,
  };
}

class SetAgentModeRequestMessage extends DaemonMessage {
  final String agentId;
  final String modeId;
  final String requestId;

  const SetAgentModeRequestMessage({
    required this.agentId,
    required this.modeId,
    required this.requestId,
  }) : super(type: 'set_agent_mode_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'agentId': agentId,
    'modeId': modeId,
    'requestId': requestId,
  };
}

class SetAgentModelRequestMessage extends DaemonMessage {
  final String agentId;
  final String? modelId;
  final String requestId;

  const SetAgentModelRequestMessage({
    required this.agentId,
    required this.modelId,
    required this.requestId,
  }) : super(type: 'set_agent_model_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'agentId': agentId,
    'modelId': modelId,
    'requestId': requestId,
  };
}

class SetAgentThinkingRequestMessage extends DaemonMessage {
  final String agentId;
  final String? thinkingOptionId;
  final String requestId;

  const SetAgentThinkingRequestMessage({
    required this.agentId,
    required this.thinkingOptionId,
    required this.requestId,
  }) : super(type: 'set_agent_thinking_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'agentId': agentId,
    'thinkingOptionId': thinkingOptionId,
    'requestId': requestId,
  };
}

class SetVoiceModeMessage extends DaemonMessage {
  final bool enabled;
  final String? agentId;
  final String? requestId;

  const SetVoiceModeMessage({
    required this.enabled,
    this.agentId,
    this.requestId,
  }) : super(type: 'set_voice_mode');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'enabled': enabled,
    if (agentId != null) 'agentId': agentId,
    if (requestId != null) 'requestId': requestId,
  };
}

class FileExplorerRequestMessage extends DaemonMessage {
  final String cwd;
  final String? path;
  final String mode;
  final String? searchQuery;
  final bool recursive;
  final bool directoriesOnly;
  final String requestId;

  const FileExplorerRequestMessage({
    required this.cwd,
    this.path,
    this.mode = 'list',
    this.searchQuery,
    this.recursive = false,
    this.directoriesOnly = false,
    required this.requestId,
  }) : super(type: 'file_explorer_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'cwd': cwd,
    if (path != null) 'path': path,
    'mode': mode,
    if (searchQuery != null && searchQuery!.isNotEmpty)
      'searchQuery': searchQuery,
    if (recursive) 'recursive': recursive,
    if (directoriesOnly) 'directoriesOnly': directoriesOnly,
    'requestId': requestId,
  };
}

class DirectorySuggestionsRequestMessage extends DaemonMessage {
  final String query;
  final bool includeDirectories;
  final bool includeFiles;
  final int limit;
  final String requestId;

  const DirectorySuggestionsRequestMessage({
    required this.query,
    this.includeDirectories = true,
    this.includeFiles = false,
    this.limit = 30,
    required this.requestId,
  }) : super(type: 'directory_suggestions_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'query': query,
    'includeDirectories': includeDirectories,
    'includeFiles': includeFiles,
    'limit': limit,
    'requestId': requestId,
  };
}

class SubscribeTerminalsRequestMessage extends DaemonMessage {
  final String cwd;
  const SubscribeTerminalsRequestMessage({required this.cwd})
    : super(type: 'subscribe_terminals_request');
  @override
  Map<String, dynamic> toJson() => {'type': type, 'cwd': cwd};
}

class UnsubscribeTerminalsRequestMessage extends DaemonMessage {
  final String cwd;
  const UnsubscribeTerminalsRequestMessage({required this.cwd})
    : super(type: 'unsubscribe_terminals_request');
  @override
  Map<String, dynamic> toJson() => {'type': type, 'cwd': cwd};
}

class ListTerminalsRequestMessage extends DaemonMessage {
  final String? cwd;
  final String requestId;
  const ListTerminalsRequestMessage({this.cwd, required this.requestId})
    : super(type: 'list_terminals_request');
  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    if (cwd != null) 'cwd': cwd,
    'requestId': requestId,
  };
}

class CreateTerminalRequestMessage extends DaemonMessage {
  final String cwd;
  final String? name;
  final String? agentId;
  final String? command;
  final List<String>? args;
  final String requestId;

  const CreateTerminalRequestMessage({
    required this.cwd,
    this.name,
    this.agentId,
    this.command,
    this.args,
    required this.requestId,
  }) : super(type: 'create_terminal_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'cwd': cwd,
    if (name != null) 'name': name,
    if (agentId != null) 'agentId': agentId,
    if (command != null) 'command': command,
    if (args != null) 'args': args,
    'requestId': requestId,
  };
}

class SubscribeTerminalRequestMessage extends DaemonMessage {
  final String terminalId;
  final String requestId;

  const SubscribeTerminalRequestMessage({
    required this.terminalId,
    required this.requestId,
  }) : super(type: 'subscribe_terminal_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'terminalId': terminalId,
    'requestId': requestId,
  };
}

class UnsubscribeTerminalRequestMessage extends DaemonMessage {
  final String terminalId;

  const UnsubscribeTerminalRequestMessage({required this.terminalId})
    : super(type: 'unsubscribe_terminal_request');

  @override
  Map<String, dynamic> toJson() => {'type': type, 'terminalId': terminalId};
}

class TerminalInputMessage extends DaemonMessage {
  final String terminalId;
  final Map<String, dynamic> message;

  const TerminalInputMessage({required this.terminalId, required this.message})
    : super(type: 'terminal_input');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'terminalId': terminalId,
    'message': message,
  };
}

class KillTerminalRequestMessage extends DaemonMessage {
  final String terminalId;
  final String requestId;

  const KillTerminalRequestMessage({
    required this.terminalId,
    required this.requestId,
  }) : super(type: 'kill_terminal_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'terminalId': terminalId,
    'requestId': requestId,
  };
}

class FetchAgentRequestMessage extends DaemonMessage {
  final String agentId;
  final String requestId;

  const FetchAgentRequestMessage({
    required this.agentId,
    required this.requestId,
  }) : super(type: 'fetch_agent_request');

  @override
  Map<String, dynamic> toJson() => {
    'type': type,
    'agentId': agentId,
    'requestId': requestId,
  };
}
