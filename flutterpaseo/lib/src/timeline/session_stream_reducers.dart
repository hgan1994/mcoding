import 'dart:async';
import '../models/agent.dart';
import '../models/stream.dart';
import '../utils/stream_reducer.dart';
import 'session_timeline_seq_gate.dart';
import 'session_timeline_bootstrap_policy.dart';
import 'session_stream_lifecycle.dart';
import 'timeline_cursor.dart';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const _agentStreamReducerFlushDelayMs = 16 * 3;

// ---------------------------------------------------------------------------
// Timeline unit — typed wrapper for parsed timeline entries
// ---------------------------------------------------------------------------

class _TimelineUnit {
  final int seq;
  final int seqEnd;
  final Map<String, dynamic> event;
  final DateTime timestamp;
  const _TimelineUnit({
    required this.seq,
    required this.seqEnd,
    required this.event,
    required this.timestamp,
  });
}

// ---------------------------------------------------------------------------
// Side-effect types
// ---------------------------------------------------------------------------

sealed class TimelineReducerSideEffect {}

class CatchUpSideEffect extends TimelineReducerSideEffect {
  final TimelineCursor cursor;
  CatchUpSideEffect({required this.cursor});
}

class FlushPendingUpdatesSideEffect extends TimelineReducerSideEffect {}

class AgentStreamCatchUpSideEffect {
  final TimelineCursor cursor;
  AgentStreamCatchUpSideEffect({required this.cursor});
}

// ---------------------------------------------------------------------------
// processTimelineResponse
// ---------------------------------------------------------------------------

class TimelineResponseEntry {
  final int seqStart;
  final int seqEnd;
  final String provider;
  final Map<String, dynamic> item;
  final String timestamp;

  const TimelineResponseEntry({
    required this.seqStart,
    required this.seqEnd,
    required this.provider,
    required this.item,
    required this.timestamp,
  });
}

class ProcessTimelineResponseInput {
  final Map<String, dynamic> payload;
  final List<StreamItem> currentTail;
  final List<StreamItem> currentHead;
  final TimelineCursor? currentCursor;
  final bool isInitializing;
  final bool hasActiveInitDeferred;
  final String initRequestDirection;

  const ProcessTimelineResponseInput({
    required this.payload,
    required this.currentTail,
    required this.currentHead,
    this.currentCursor,
    this.isInitializing = false,
    this.hasActiveInitDeferred = false,
    this.initRequestDirection = 'tail',
  });
}

class ProcessTimelineResponseOutput {
  final List<StreamItem> tail;
  final List<StreamItem> head;
  final TimelineCursor? cursor;
  final bool cursorChanged;
  final String? initResolution; // 'resolve' | 'reject' | null
  final bool clearInitializing;
  final String? error;
  final List<TimelineReducerSideEffect> sideEffects;

  const ProcessTimelineResponseOutput({
    required this.tail,
    required this.head,
    this.cursor,
    this.cursorChanged = false,
    this.initResolution,
    this.clearInitializing = false,
    this.error,
    this.sideEffects = const [],
  });
}

ProcessTimelineResponseOutput processTimelineResponse(
  ProcessTimelineResponseInput input,
) {
  final payload = input.payload;
  final currentTail = input.currentTail;
  final currentHead = input.currentHead;
  final currentCursor = input.currentCursor;
  final isInitializing = input.isInitializing;
  final hasActiveInitDeferred = input.hasActiveInitDeferred;
  final initRequestDirection = input.initRequestDirection;

  // ------------------------------------------------------------------
  // Error path: reject init and leave stream state unchanged
  // ------------------------------------------------------------------
  final error = payload['error'] as String?;
  if (error != null) {
    return ProcessTimelineResponseOutput(
      tail: currentTail,
      head: currentHead,
      cursor: currentCursor,
      cursorChanged: false,
      initResolution: hasActiveInitDeferred ? 'reject' : null,
      clearInitializing: isInitializing,
      error: error,
      sideEffects: [],
    );
  }

  // ------------------------------------------------------------------
  // Convert entries to timeline units
  // ------------------------------------------------------------------
  final rawEntries = payload['entries'] as List<dynamic>? ?? [];
  final timelineUnits = rawEntries.map((e) {
    final entry = e as Map<String, dynamic>;
    return _TimelineUnit(
      seq: entry['seqStart'] as int,
      seqEnd: entry['seqEnd'] as int,
      event: <String, dynamic>{
        'type': 'timeline',
        'provider': entry['provider'],
        'item': entry['item'],
      },
      timestamp:
          DateTime.tryParse(entry['timestamp'] as String? ?? '') ??
          DateTime.now(),
    );
  }).toList();

  List<Map<String, dynamic>> toHydratedEvents(List<_TimelineUnit> units) =>
      units
          .map(
            (u) => {
              'type': u.event['type'],
              'provider': u.event['provider'],
              'item': u.event['item'],
              'timestamp': u.timestamp.toIso8601String(),
            },
          )
          .toList();

  // ------------------------------------------------------------------
  // Derive bootstrap policy (replace vs incremental)
  // ------------------------------------------------------------------
  final direction = payload['direction'] as String? ?? 'tail';
  final reset = payload['reset'] as bool? ?? false;
  final epoch = payload['epoch'] as String? ?? '';
  final startCursorSeq =
      (payload['startCursor'] as Map<String, dynamic>?)?['seq'] as int?;
  final endCursorRaw = payload['endCursor'] as Map<String, dynamic>?;
  final endCursorSeq = endCursorRaw?['seq'] as int?;

  final bootstrapPolicy = deriveBootstrapTailTimelinePolicy(
    direction: direction,
    reset: reset,
    epoch: epoch,
    endCursor: BootstrapTailCursor(seq: endCursorSeq),
    isInitializing: isInitializing,
    hasActiveInitDeferred: hasActiveInitDeferred,
  );
  final replace = bootstrapPolicy.replace;

  var nextTail = currentTail;
  var nextHead = currentHead;
  TimelineCursor? nextCursor = currentCursor;
  var cursorChanged = false;
  final sideEffects = <TimelineReducerSideEffect>[];

  if (replace) {
    // ----------------------------------------------------------------
    // Replace path: full hydration from scratch
    // ----------------------------------------------------------------
    nextTail = hydrateStreamState(
      toHydratedEvents(timelineUnits),
      source: 'canonical',
    );
    nextHead = [];

    if (startCursorSeq != null && endCursorSeq != null) {
      nextCursor = TimelineCursor(
        epoch: epoch,
        startSeq: startCursorSeq,
        endSeq: endCursorSeq,
      );
      cursorChanged = true;
    } else {
      nextCursor = null;
      cursorChanged = true;
    }

    if (bootstrapPolicy.catchUpCursor != null) {
      sideEffects.add(
        CatchUpSideEffect(cursor: bootstrapPolicy.catchUpCursor!),
      );
    }
  } else if (timelineUnits.isNotEmpty && direction == 'before') {
    // ----------------------------------------------------------------
    // Older history prepend path
    // ----------------------------------------------------------------
    final acceptedUnits = <_TimelineUnit>[];
    final cursor = currentCursor;

    for (final unit in timelineUnits) {
      if (cursor != null) {
        if (cursor.epoch != epoch) {
          continue;
        }
        if (unit.seqEnd >= cursor.startSeq) {
          continue;
        }
      }
      acceptedUnits.add(unit);
    }

    if (acceptedUnits.isNotEmpty) {
      final olderTail = hydrateStreamState(
        toHydratedEvents(acceptedUnits),
        source: 'canonical',
      );
      nextTail = mergeAdjacentThoughtItems([...olderTail, ...currentTail]);

      final nextStartSeq = acceptedUnits.first.seq;
      final nextEndSeq = cursor?.endSeq ?? acceptedUnits.last.seqEnd;
      nextCursor = TimelineCursor(
        epoch: epoch,
        startSeq: nextStartSeq,
        endSeq: nextEndSeq,
      );
      cursorChanged = currentCursor == null || currentCursor != nextCursor;
    }
  } else if (timelineUnits.isNotEmpty) {
    // ----------------------------------------------------------------
    // Incremental append path
    // ----------------------------------------------------------------
    final acceptedUnits = <_TimelineUnit>[];
    var cursor = currentCursor;
    TimelineCursor? gapCursor;

    for (final unit in timelineUnits) {
      final seq = unit.seq;
      final unitEpoch = epoch;
      final seqEnd = unit.seqEnd;

      final decision = classifySessionTimelineSeq(
        cursor: cursor != null
            ? SeqGateCursor(epoch: cursor.epoch, endSeq: cursor.endSeq)
            : null,
        epoch: unitEpoch,
        seq: seq,
      );

      if (decision == SessionTimelineSeqDecision.gap) {
        gapCursor = cursor;
        break;
      }
      if (decision == SessionTimelineSeqDecision.dropStale) {
        if (cursor != null && seqEnd > cursor.endSeq) {
          gapCursor = TimelineCursor(
            epoch: cursor.epoch,
            startSeq: cursor.startSeq,
            endSeq: cursor.endSeq,
          );
          break;
        }
        continue;
      }
      if (decision == SessionTimelineSeqDecision.dropEpoch) {
        continue;
      }

      acceptedUnits.add(unit);
      if (decision == SessionTimelineSeqDecision.init) {
        cursor = TimelineCursor(
          epoch: unitEpoch,
          startSeq: seq,
          endSeq: seqEnd,
        );
        continue;
      }
      if (cursor == null) {
        continue;
      }
      cursor = cursor.copyWith(endSeq: seqEnd);
    }

    if (acceptedUnits.isNotEmpty) {
      // Flush head to tail before appending canonical entries.
      final baseTail = currentHead.isNotEmpty
          ? flushHeadToTail(currentTail, currentHead)
          : currentTail;
      if (currentHead.isNotEmpty) {
        nextHead = [];
      }

      nextTail = acceptedUnits.fold<List<StreamItem>>(baseTail, (state, unit) {
        return reduceStreamUpdate(
          state,
          unit.event,
          unit.timestamp,
          source: 'canonical',
        );
      });
    }

    if (cursor != null &&
        (currentCursor == null ||
            currentCursor.epoch != cursor.epoch ||
            currentCursor.startSeq != cursor.startSeq ||
            currentCursor.endSeq != cursor.endSeq)) {
      nextCursor = cursor;
      cursorChanged = true;
    }

    if (gapCursor != null) {
      sideEffects.add(CatchUpSideEffect(cursor: gapCursor));
    }
  }

  // ------------------------------------------------------------------
  // Flush pending agent updates side effect
  // ------------------------------------------------------------------
  sideEffects.add(FlushPendingUpdatesSideEffect());

  // ------------------------------------------------------------------
  // Init resolution
  // ------------------------------------------------------------------
  final shouldResolveDeferredInit = shouldResolveTimelineInit(
    hasActiveInitDeferred: hasActiveInitDeferred,
    isInitializing: isInitializing,
    initRequestDirection: initRequestDirection,
    responseDirection: direction,
    reset: reset,
  );
  final clearInitializing =
      shouldResolveDeferredInit || (isInitializing && !hasActiveInitDeferred);
  final initResolution = shouldResolveDeferredInit ? 'resolve' : null;

  return ProcessTimelineResponseOutput(
    tail: nextTail,
    head: nextHead,
    cursor: nextCursor,
    cursorChanged: cursorChanged,
    initResolution: initResolution,
    clearInitializing: clearInitializing,
    error: null,
    sideEffects: sideEffects,
  );
}

// ---------------------------------------------------------------------------
// processAgentStreamEvent
// ---------------------------------------------------------------------------

class ProcessAgentStreamEventInput {
  final Map<String, dynamic> event;
  final int? seq;
  final String? epoch;
  final List<StreamItem> currentTail;
  final List<StreamItem> currentHead;
  final TimelineCursor? currentCursor;
  final AgentStreamReducerAgentSnapshot? currentAgent;
  final DateTime timestamp;

  const ProcessAgentStreamEventInput({
    required this.event,
    this.seq,
    this.epoch,
    required this.currentTail,
    required this.currentHead,
    this.currentCursor,
    this.currentAgent,
    required this.timestamp,
  });
}

class AgentPatch {
  final AgentLifecycleStatus status;
  final DateTime updatedAt;
  final DateTime lastActivityAt;

  const AgentPatch({
    required this.status,
    required this.updatedAt,
    required this.lastActivityAt,
  });
}

class ProcessAgentStreamEventOutput {
  final List<StreamItem> tail;
  final List<StreamItem> head;
  final bool changedTail;
  final bool changedHead;
  final TimelineCursor? cursor;
  final bool cursorChanged;
  final AgentPatch? agent;
  final bool agentChanged;
  final List<AgentStreamCatchUpSideEffect> sideEffects;

  const ProcessAgentStreamEventOutput({
    required this.tail,
    required this.head,
    this.changedTail = false,
    this.changedHead = false,
    this.cursor,
    this.cursorChanged = false,
    this.agent,
    this.agentChanged = false,
    this.sideEffects = const [],
  });
}

class AgentStreamReducerEvent {
  final Map<String, dynamic> event;
  final int? seq;
  final String? epoch;
  final DateTime timestamp;

  const AgentStreamReducerEvent({
    required this.event,
    this.seq,
    this.epoch,
    required this.timestamp,
  });
}

class AgentStreamReducerAgentSnapshot {
  final AgentLifecycleStatus status;
  final DateTime updatedAt;
  final DateTime lastActivityAt;

  const AgentStreamReducerAgentSnapshot({
    required this.status,
    required this.updatedAt,
    required this.lastActivityAt,
  });
}

typedef AgentStreamReducerSnapshot = ({
  List<StreamItem> currentTail,
  List<StreamItem> currentHead,
  TimelineCursor? currentCursor,
  AgentStreamReducerAgentSnapshot? currentAgent,
});

AgentStreamReducerAgentSnapshot? _applyAgentPatch(
  AgentStreamReducerAgentSnapshot? current,
  AgentPatch? patch,
) {
  if (current == null || patch == null) return current;
  return AgentStreamReducerAgentSnapshot(
    status: patch.status,
    updatedAt: patch.updatedAt,
    lastActivityAt: patch.lastActivityAt,
  );
}

ProcessAgentStreamEventOutput processAgentStreamEvent(
  ProcessAgentStreamEventInput input,
) {
  final event = input.event;
  final seq = input.seq;
  final epoch = input.epoch;
  final currentTail = input.currentTail;
  final currentHead = input.currentHead;
  final currentCursor = input.currentCursor;
  final currentAgent = input.currentAgent;
  final timestamp = input.timestamp;

  var shouldApplyStreamEvent = true;
  TimelineCursor? nextTimelineCursor;
  var cursorChanged = false;
  final sideEffects = <AgentStreamCatchUpSideEffect>[];

  // ------------------------------------------------------------------
  // Timeline sequencing gate
  // ------------------------------------------------------------------
  final eventType = event['type'] as String?;
  if (eventType == 'timeline' && seq != null && epoch != null) {
    final decision = classifySessionTimelineSeq(
      cursor: currentCursor != null
          ? SeqGateCursor(
              epoch: currentCursor.epoch,
              endSeq: currentCursor.endSeq,
            )
          : null,
      epoch: epoch,
      seq: seq,
    );

    switch (decision) {
      case SessionTimelineSeqDecision.init:
        nextTimelineCursor = TimelineCursor(
          epoch: epoch,
          startSeq: seq,
          endSeq: seq,
        );
        cursorChanged = true;
      case SessionTimelineSeqDecision.accept:
        nextTimelineCursor =
            (currentCursor ??
                    TimelineCursor(epoch: epoch, startSeq: seq, endSeq: seq))
                .copyWith(endSeq: seq);
        cursorChanged = true;
      case SessionTimelineSeqDecision.gap:
        shouldApplyStreamEvent = false;
        if (currentCursor != null) {
          sideEffects.add(
            AgentStreamCatchUpSideEffect(
              cursor: TimelineCursor(
                epoch: currentCursor.epoch,
                startSeq: currentCursor.startSeq,
                endSeq: currentCursor.endSeq,
              ),
            ),
          );
        }
      case SessionTimelineSeqDecision.dropStale:
      case SessionTimelineSeqDecision.dropEpoch:
        shouldApplyStreamEvent = false;
    }
  }

  // ------------------------------------------------------------------
  // Apply stream event to tail/head
  // ------------------------------------------------------------------
  final ApplyStreamEventResult streamResult;
  if (shouldApplyStreamEvent) {
    streamResult = applyStreamEvent(
      tail: currentTail,
      head: currentHead,
      event: event,
      timestamp: timestamp,
      source: 'live',
    );
  } else {
    streamResult = ApplyStreamEventResult(
      tail: currentTail,
      head: currentHead,
      changedTail: false,
      changedHead: false,
    );
  }

  // ------------------------------------------------------------------
  // Optimistic lifecycle status
  // ------------------------------------------------------------------
  AgentPatch? agentPatch;
  var agentChanged = false;

  if (currentAgent != null &&
      (eventType == 'turn_started' ||
          eventType == 'turn_completed' ||
          eventType == 'turn_canceled' ||
          eventType == 'turn_failed')) {
    final optimisticStatus = deriveOptimisticLifecycleStatus(
      currentStatus: currentAgent.status,
      eventType: eventType!,
    );
    if (optimisticStatus != null) {
      final nextUpdatedAtMs = currentAgent.updatedAt.millisecondsSinceEpoch
          .clamp(0, timestamp.millisecondsSinceEpoch);
      final nextLastActivityAtMs = currentAgent
          .lastActivityAt
          .millisecondsSinceEpoch
          .clamp(0, timestamp.millisecondsSinceEpoch);
      agentPatch = AgentPatch(
        status: optimisticStatus,
        updatedAt: DateTime.fromMillisecondsSinceEpoch(
          timestamp.millisecondsSinceEpoch > nextUpdatedAtMs
              ? timestamp.millisecondsSinceEpoch
              : nextUpdatedAtMs,
        ),
        lastActivityAt: DateTime.fromMillisecondsSinceEpoch(
          timestamp.millisecondsSinceEpoch > nextLastActivityAtMs
              ? timestamp.millisecondsSinceEpoch
              : nextLastActivityAtMs,
        ),
      );
      agentChanged = true;
    }
  }

  return ProcessAgentStreamEventOutput(
    tail: streamResult.tail,
    head: streamResult.head,
    changedTail: streamResult.changedTail,
    changedHead: streamResult.changedHead,
    cursor: nextTimelineCursor,
    cursorChanged: cursorChanged,
    agent: agentPatch,
    agentChanged: agentChanged,
    sideEffects: sideEffects,
  );
}

// ---------------------------------------------------------------------------
// processAgentStreamEvents (batch)
// ---------------------------------------------------------------------------

ProcessAgentStreamEventOutput processAgentStreamEvents({
  required List<AgentStreamReducerEvent> events,
  required List<StreamItem> currentTail,
  required List<StreamItem> currentHead,
  required TimelineCursor? currentCursor,
  required AgentStreamReducerAgentSnapshot? currentAgent,
}) {
  var tail = currentTail;
  var head = currentHead;
  TimelineCursor? cursor = currentCursor;
  var agent = currentAgent;
  var changedTail = false;
  var changedHead = false;
  var cursorChanged = false;
  AgentPatch? agentPatch;
  var agentChanged = false;
  final sideEffects = <AgentStreamCatchUpSideEffect>[];

  for (final reducerEvent in events) {
    final result = processAgentStreamEvent(
      ProcessAgentStreamEventInput(
        event: reducerEvent.event,
        seq: reducerEvent.seq,
        epoch: reducerEvent.epoch,
        currentTail: tail,
        currentHead: head,
        currentCursor: cursor,
        currentAgent: agent,
        timestamp: reducerEvent.timestamp,
      ),
    );

    tail = result.tail;
    head = result.head;
    changedTail = changedTail || result.changedTail;
    changedHead = changedHead || result.changedHead;
    sideEffects.addAll(result.sideEffects);

    if (result.cursorChanged) {
      cursor = result.cursor;
      cursorChanged = true;
    }

    if (result.agentChanged) {
      agentPatch = result.agent;
      agentChanged = true;
      agent = _applyAgentPatch(agent, result.agent);
    }
  }

  return ProcessAgentStreamEventOutput(
    tail: tail,
    head: head,
    changedTail: changedTail,
    changedHead: changedHead,
    cursor: cursor,
    cursorChanged: cursorChanged,
    agent: agentPatch,
    agentChanged: agentChanged,
    sideEffects: sideEffects,
  );
}

// ---------------------------------------------------------------------------
// AgentStreamReducerQueue
// ---------------------------------------------------------------------------

typedef GetSnapshotFn = AgentStreamReducerSnapshot Function(String agentId);
typedef CommitFn =
    void Function(
      String agentId,
      ProcessAgentStreamEventOutput result,
      List<AgentStreamReducerEvent> events,
    );
typedef HandleSideEffectsFn =
    void Function(
      String agentId,
      List<AgentStreamCatchUpSideEffect> sideEffects,
    );
typedef ScheduleFlushFn =
    Timer Function(Duration duration, void Function() callback);
typedef CancelFlushFn = void Function(Timer timer);

class AgentStreamReducerQueue {
  final void Function(String agentId, AgentStreamReducerEvent event) enqueue;
  final void Function() flush;
  final void Function(String agentId) flushAgent;
  final void Function({bool flush}) dispose;

  AgentStreamReducerQueue({
    required this.enqueue,
    required this.flush,
    required this.flushAgent,
    required this.dispose,
  });
}

AgentStreamReducerQueue createAgentStreamReducerQueue({
  required GetSnapshotFn getSnapshot,
  required CommitFn commit,
  required HandleSideEffectsFn handleSideEffects,
  required ScheduleFlushFn scheduleFlush,
  required CancelFlushFn cancelFlush,
}) {
  final pendingByAgentId = <String, List<AgentStreamReducerEvent>>{};
  Timer? scheduledFlush;

  void cancelScheduledFlush() {
    if (scheduledFlush == null) return;
    cancelFlush(scheduledFlush!);
    scheduledFlush = null;
  }

  void flushAgent(String agentId) {
    final events = pendingByAgentId.remove(agentId);
    if (events == null || events.isEmpty) return;
    if (pendingByAgentId.isEmpty) {
      cancelScheduledFlush();
    }

    final snapshot = getSnapshot(agentId);
    final result = processAgentStreamEvents(
      events: events,
      currentTail: snapshot.currentTail,
      currentHead: snapshot.currentHead,
      currentCursor: snapshot.currentCursor,
      currentAgent: snapshot.currentAgent,
    );

    commit(agentId, result, events);
    if (result.sideEffects.isNotEmpty) {
      handleSideEffects(agentId, result.sideEffects);
    }
  }

  void flushAll() {
    final agentIds = pendingByAgentId.keys.toList();
    for (final agentId in agentIds) {
      flushAgent(agentId);
    }
  }

  void scheduleNextFlush() {
    if (scheduledFlush != null) return;
    scheduledFlush = scheduleFlush(
      const Duration(milliseconds: _agentStreamReducerFlushDelayMs),
      () {
        scheduledFlush = null;
        flushAll();
      },
    );
  }

  return AgentStreamReducerQueue(
    enqueue: (agentId, event) {
      final pending = pendingByAgentId[agentId];
      if (pending != null) {
        pending.add(event);
      } else {
        pendingByAgentId[agentId] = [event];
      }
      scheduleNextFlush();
    },
    flush: flushAll,
    flushAgent: flushAgent,
    dispose: ({flush = false}) {
      cancelScheduledFlush();
      if (flush) {
        flushAll();
      } else {
        pendingByAgentId.clear();
      }
    },
  );
}
