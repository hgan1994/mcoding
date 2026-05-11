import '../models/stream.dart';
import 'split_markdown_blocks.dart';

class ApplyStreamEventResult {
  final List<StreamItem> tail;
  final List<StreamItem> head;
  final bool changedTail;
  final bool changedHead;
  ApplyStreamEventResult({
    required this.tail,
    required this.head,
    required this.changedTail,
    required this.changedHead,
  });
}

// =============================================================================
// ID generation
// =============================================================================

String _simpleHash(String str) {
  int hash = 0;
  for (int i = 0; i < str.length; i++) {
    int char = str.codeUnitAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash.abs().toRadixString(36);
}

String _createTimelineId(String prefix, String text, DateTime timestamp) {
  return '${prefix}_${timestamp.millisecondsSinceEpoch}_${_simpleHash(text)}';
}

String _createUniqueTimelineId(
  List<StreamItem> state,
  String prefix,
  String text,
  DateTime timestamp,
) {
  final base = _createTimelineId(prefix, text, timestamp);
  final suffix = state.length.toRadixString(36);
  return '${base}_$suffix';
}

// =============================================================================
// Chunk normalization
// =============================================================================

({String chunk, bool hasContent}) _normalizeChunk(String text) {
  final chunk = text.replaceAll('\r', '');
  if (chunk.isEmpty) return (chunk: '', hasContent: false);
  return (chunk: chunk, hasContent: chunk.contains(RegExp(r'\S')));
}

// =============================================================================
// Thought helpers
// =============================================================================

ThoughtItem _markThoughtReady(ThoughtItem item) {
  if (item.status == ThoughtStatus.ready) return item;
  return item.copyWith(status: ThoughtStatus.ready);
}

ThoughtItem _mergeThoughtItems(ThoughtItem existing, ThoughtItem incoming) {
  final status =
      existing.status == ThoughtStatus.loading ||
          incoming.status == ThoughtStatus.loading
      ? ThoughtStatus.loading
      : ThoughtStatus.ready;
  return existing.copyWith(
    text: existing.text + incoming.text,
    timestamp: incoming.timestamp,
    status: status,
  );
}

List<StreamItem> mergeAdjacentThoughtItems(List<StreamItem> items) {
  if (items.length < 2) return items;

  var mutated = false;
  final merged = <StreamItem>[];
  for (final item in items) {
    if (merged.isNotEmpty &&
        merged.last is ThoughtItem &&
        item is ThoughtItem) {
      merged[merged.length - 1] = _mergeThoughtItems(
        merged.last as ThoughtItem,
        item,
      );
      mutated = true;
      continue;
    }
    merged.add(item);
  }

  return mutated ? merged : items;
}

List<StreamItem> _finalizeActiveThoughts(List<StreamItem> state) {
  bool mutated = false;
  final next = state.map((entry) {
    if (entry is ThoughtItem && entry.status != ThoughtStatus.ready) {
      mutated = true;
      return _markThoughtReady(entry);
    }
    return entry;
  }).toList();
  return mutated ? next : state;
}

// =============================================================================
// User message
// =============================================================================

List<StreamItem> _appendUserMessage(
  List<StreamItem> state,
  String text,
  DateTime timestamp, {
  String? messageId,
  List<Map<String, dynamic>>? images,
}) {
  final normalized = _normalizeChunk(text);
  if (!normalized.hasContent && (images == null || images.isEmpty)) {
    return state;
  }

  final chunkSeed = normalized.chunk.trim().isNotEmpty
      ? normalized.chunk.trim()
      : normalized.chunk;
  final entryId =
      messageId ?? _createUniqueTimelineId(state, 'user', chunkSeed, timestamp);
  final existingIndex = state.indexWhere(
    (e) => e is UserMessageItem && e.id == entryId,
  );

  final preservedImages =
      existingIndex >= 0 && state[existingIndex] is UserMessageItem
      ? (state[existingIndex] as UserMessageItem).images
      : null;

  final nextImages = images ?? preservedImages;

  final nextItem = UserMessageItem(
    id: entryId,
    text: normalized.chunk,
    timestamp: timestamp,
    images: nextImages,
  );

  if (existingIndex >= 0) {
    final next = List<StreamItem>.from(state);
    next[existingIndex] = nextItem;
    return next;
  }
  return [...state, nextItem];
}

// =============================================================================
// Assistant message
// =============================================================================

List<StreamItem> _appendAssistantMessage(
  List<StreamItem> state,
  String text,
  DateTime timestamp,
  String source,
) {
  final normalized = _normalizeChunk(text);
  if (normalized.chunk.isEmpty) return state;

  if (state.isNotEmpty && state.last is AssistantMessageItem) {
    final last = state.last as AssistantMessageItem;
    return [
      ...state.sublist(0, state.length - 1),
      last.copyWith(text: last.text + normalized.chunk, timestamp: timestamp),
    ];
  }

  if (source == 'live' &&
      state.length >= 2 &&
      state.last is UserMessageItem &&
      state[state.length - 2] is AssistantMessageItem) {
    final secondLast = state[state.length - 2] as AssistantMessageItem;
    return [
      ...state.sublist(0, state.length - 2),
      secondLast.copyWith(
        text: secondLast.text + normalized.chunk,
        timestamp: timestamp,
      ),
      state.last,
    ];
  }

  if (!normalized.hasContent) return state;

  final idSeed = normalized.chunk.trim().isNotEmpty
      ? normalized.chunk.trim()
      : normalized.chunk;
  final item = AssistantMessageItem(
    id: _createUniqueTimelineId(state, 'assistant', idSeed, timestamp),
    text: normalized.chunk,
    timestamp: timestamp,
  );
  return [...state, item];
}

// =============================================================================
// Thought
// =============================================================================

List<StreamItem> _appendThought(
  List<StreamItem> state,
  String text,
  DateTime timestamp,
) {
  final normalized = _normalizeChunk(text);
  if (normalized.chunk.isEmpty) return state;

  if (state.isNotEmpty && state.last is ThoughtItem) {
    final last = state.last as ThoughtItem;
    return [
      ...state.sublist(0, state.length - 1),
      last.copyWith(
        text: last.text + normalized.chunk,
        timestamp: timestamp,
        status: ThoughtStatus.loading,
      ),
    ];
  }

  if (!normalized.hasContent) return state;

  final idSeed = normalized.chunk.trim().isNotEmpty
      ? normalized.chunk.trim()
      : normalized.chunk;
  final item = ThoughtItem(
    id: _createUniqueTimelineId(state, 'thought', idSeed, timestamp),
    text: normalized.chunk,
    timestamp: timestamp,
    status: ThoughtStatus.loading,
  );
  return [...state, item];
}

// =============================================================================
// Tool call helpers
// =============================================================================

bool _isRecord(dynamic value) => value is Map<String, dynamic>;

bool _hasNonEmptyObject(dynamic value) =>
    _isRecord(value) && (value as Map<String, dynamic>).isNotEmpty;

dynamic _mergeUnknownValue(dynamic existing, dynamic incoming) {
  if (incoming == null) {
    return existing;
  }
  if (!_hasNonEmptyObject(incoming) && _hasNonEmptyObject(existing)) {
    return existing;
  }
  return incoming;
}

bool _hasSameIncomingFields(
  Map<String, dynamic> existing,
  Map<String, dynamic> incoming,
) {
  return incoming.entries.every((e) => existing[e.key] == e.value);
}

Map<String, dynamic>? _mergeToolCallMetadata(
  Map<String, dynamic>? existing,
  Map<String, dynamic>? incoming,
) {
  if (incoming == null) {
    return existing;
  }
  if (existing == null) {
    return incoming;
  }
  if (_hasSameIncomingFields(existing, incoming)) {
    return existing;
  }
  return {...existing, ...incoming};
}

Map<String, dynamic> _mergeToolCallDetail(
  Map<String, dynamic> existing,
  Map<String, dynamic> incoming,
) {
  if (existing['type'] == 'unknown' && incoming['type'] != 'unknown') {
    return incoming;
  }
  if (incoming['type'] == 'unknown' && existing['type'] != 'unknown') {
    return existing;
  }
  if (existing['type'] == 'unknown' && incoming['type'] == 'unknown') {
    final input = _mergeUnknownValue(existing['input'], incoming['input']);
    final output = _mergeUnknownValue(existing['output'], incoming['output']);
    if (input == existing['input'] && output == existing['output']) {
      return existing;
    }
    return {'type': 'unknown', 'input': input, 'output': output};
  }
  if (existing['type'] == incoming['type']) {
    if (_hasSameIncomingFields(existing, incoming)) {
      return existing;
    }
    return {...existing, ...incoming};
  }
  return incoming;
}

String _mergeAgentToolCallStatus(String existing, String incoming) {
  if (existing == 'failed' || incoming == 'failed') {
    return 'failed';
  }
  if (existing == 'canceled') {
    return 'canceled';
  }
  if (incoming == 'canceled') {
    return existing == 'completed' ? 'completed' : 'canceled';
  }
  if (existing == 'completed' || incoming == 'completed') {
    return 'completed';
  }
  return 'running';
}

int _findExistingAgentToolCallIndex(List<StreamItem> state, String callId) {
  return state.indexWhere(
    (e) =>
        e is ToolCallItem &&
        e.payload.source == 'agent' &&
        e.payload.data['callId'] == callId,
  );
}

// =============================================================================
// Tool call append
// =============================================================================

List<StreamItem> _appendAgentToolCall(
  List<StreamItem> state,
  Map<String, dynamic> data,
  DateTime timestamp,
) {
  final callId = data['callId'] as String? ?? '';
  final existingIndex = _findExistingAgentToolCallIndex(state, callId);

  if (existingIndex >= 0) {
    final existing = state[existingIndex];
    if (existing is! ToolCallItem) return state;
    final existingData = existing.payload.data;

    final mergedStatus = _mergeAgentToolCallStatus(
      existingData['status'] as String? ?? 'running',
      data['status'] as String? ?? 'running',
    );
    final mergedError = mergedStatus == 'failed'
        ? (data['error'] ??
              existingData['error'] ??
              {'message': 'Tool call failed'})
        : null;
    final mergedMetadata = _mergeToolCallMetadata(
      existingData['metadata'] as Map<String, dynamic>?,
      data['metadata'] as Map<String, dynamic>?,
    );
    final mergedDetail = _mergeToolCallDetail(
      Map<String, dynamic>.from(existingData['detail'] as Map? ?? {}),
      Map<String, dynamic>.from(data['detail'] as Map? ?? {}),
    );

    if (data['provider'] == existingData['provider'] &&
        data['callId'] == existingData['callId'] &&
        data['name'] == existingData['name'] &&
        mergedStatus == existingData['status'] &&
        mergedError == existingData['error'] &&
        mergedDetail == existingData['detail'] &&
        mergedMetadata == existingData['metadata']) {
      return state;
    }

    final next = List<StreamItem>.from(state);
    next[existingIndex] = existing.copyWith(
      timestamp: timestamp,
      payload: ToolCallPayload(
        source: 'agent',
        data: {
          ...existingData,
          ...data,
          'status': mergedStatus,
          'error': mergedError,
          'detail': mergedDetail,
          'metadata': mergedMetadata,
        },
      ),
    );
    return next;
  }

  final item = ToolCallItem(
    id: 'agent_tool_$callId',
    timestamp: timestamp,
    payload: ToolCallPayload(
      source: 'agent',
      data: {
        ...data,
        'error': data['status'] == 'failed' ? data['error'] : null,
      },
    ),
  );
  return [...state, item];
}

// =============================================================================
// Activity log
// =============================================================================

List<StreamItem> _appendActivityLog(
  List<StreamItem> state,
  ActivityLogItem entry,
) {
  final index = state.indexWhere((e) => e.id == entry.id);
  if (index >= 0) {
    final next = List<StreamItem>.from(state);
    next[index] = entry;
    return next;
  }
  return [...state, entry];
}

String _formatErrorMessage(String message) => 'Agent error\n$message';

// =============================================================================
// Todo list
// =============================================================================

List<StreamItem> _appendTodoList(
  List<StreamItem> state,
  String provider,
  List<TodoEntry> items,
  DateTime timestamp,
) {
  final normalized = items
      .map((e) => TodoEntry(text: e.text, completed: e.completed))
      .toList();

  if (state.isNotEmpty &&
      state.last is TodoListItem &&
      (state.last as TodoListItem).provider == provider) {
    final next = List<StreamItem>.from(state);
    next[next.length - 1] = (state.last as TodoListItem).copyWith(
      items: normalized,
      timestamp: timestamp,
    );
    return next;
  }

  final idSeed = '$provider:${normalized.map((e) => e.text).join(',')}';
  final entry = TodoListItem(
    id: _createUniqueTimelineId(state, 'todo', idSeed, timestamp),
    timestamp: timestamp,
    provider: provider,
    items: normalized,
  );
  return [...state, entry];
}

// =============================================================================
// Compaction
// =============================================================================

List<StreamItem> _appendCompaction(
  List<StreamItem> state,
  Map<String, dynamic> item,
  DateTime timestamp,
) {
  final status = item['status'] as String;
  if (status == 'completed') {
    final loadingIdx = state.indexWhere(
      (s) => s is CompactionItem && s.status == 'loading',
    );
    if (loadingIdx >= 0) {
      final next = List<StreamItem>.from(state);
      next[loadingIdx] = (state[loadingIdx] as CompactionItem).copyWith(
        status: 'completed',
        trigger: item['trigger'] as String?,
        preTokens: item['preTokens'] as int?,
      );
      return next;
    }
  }
  final compaction = CompactionItem(
    id: _createTimelineId('compaction', status, timestamp),
    timestamp: timestamp,
    status: status,
    trigger: item['trigger'] as String?,
    preTokens: item['preTokens'] as int?,
  );
  return [...state, compaction];
}

// =============================================================================
// Task extraction
// =============================================================================

List<TodoEntry>? _extractTaskEntries(String toolName, dynamic detail) {
  if (detail == null) return null;
  if (detail is! Map<String, dynamic>) return null;
  final input = detail['input'];
  if (input is! Map<String, dynamic>) return null;
  final todos = input['todos'] ?? input['tasks'];
  if (todos is! List<dynamic>) return null;
  final entries = todos
      .map((t) {
        if (t is Map<String, dynamic>) {
          final activeForm = (t['activeForm'] as String?)?.trim();
          final content = (t['content'] as String?)?.trim() ?? '';
          final text = t['text'] as String?;
          final entryText =
              text ??
              (activeForm != null && activeForm.isNotEmpty
                  ? activeForm
                  : content);
          final statusStr = t['status'] as String?;
          final completed =
              t['completed'] as bool? ?? (statusStr == 'completed');
          return TodoEntry(text: entryText, completed: completed);
        }
        return null;
      })
      .whereType<TodoEntry>()
      .toList();
  return entries.isNotEmpty ? entries : null;
}

// =============================================================================
// reduceStreamUpdate
// =============================================================================

List<StreamItem> reduceStreamUpdate(
  List<StreamItem> state,
  Map<String, dynamic> event,
  DateTime timestamp, {
  String source = 'live',
}) {
  final eventType = event['type'] as String?;
  if (eventType != 'timeline') return _finalizeActiveThoughts(state);

  final item = event['item'] as Map<String, dynamic>?;
  if (item == null) return state;

  final itemType = item['type'] as String?;
  final provider = event['provider'] as String? ?? '';
  var nextState = state;

  switch (itemType) {
    case 'user_message':
      final rawImages = item['images'] as List<dynamic>?;
      final images = rawImages?.cast<Map<String, dynamic>>();
      nextState = _appendUserMessage(
        state,
        item['text'] as String? ?? '',
        timestamp,
        messageId: item['messageId'] as String?,
        images: images,
      );
    case 'assistant_message':
      nextState = _appendAssistantMessage(
        state,
        item['text'] as String? ?? '',
        timestamp,
        source,
      );
    case 'reasoning':
      return _appendThought(state, item['text'] as String? ?? '', timestamp);
    case 'tool_call':
      final normalizedToolName = (item['name'] as String? ?? '')
          .trim()
          .replaceAll(RegExp(r'[.\s-]+'), '_')
          .toLowerCase();
      if (provider == 'claude' && normalizedToolName == 'exitplanmode') {
        break;
      }
      if (provider == 'claude' &&
          (normalizedToolName == 'todowrite' ||
              normalizedToolName == 'todo_write')) {
        final tasks = _extractTaskEntries(
          item['name'] as String? ?? '',
          item['detail'],
        );
        if (tasks != null) {
          nextState = _appendTodoList(state, provider, tasks, timestamp);
        }
        break;
      }
      final tasks = _extractTaskEntries(
        item['name'] as String? ?? '',
        item['detail'],
      );
      if (tasks != null) {
        nextState = _appendTodoList(state, provider, tasks, timestamp);
        break;
      }
      nextState = _appendAgentToolCall(state, {
        'provider': provider,
        'callId': item['callId'] as String? ?? '',
        'name': item['name'] as String? ?? '',
        'status': item['status'] as String? ?? 'running',
        'error': item['error'],
        'detail': item['detail'],
        'metadata': item['metadata'],
      }, timestamp);
    case 'todo':
      if (provider == 'claude') break;
      final items = (item['items'] as List<dynamic>? ?? [])
          .map((todo) {
            if (todo is Map<String, dynamic>) {
              final activeForm = (todo['activeForm'] as String?)?.trim();
              final content = (todo['content'] as String?)?.trim() ?? '';
              final text = todo['text'] as String?;
              final entryText =
                  text ??
                  (activeForm != null && activeForm.isNotEmpty
                      ? activeForm
                      : content);
              final statusStr = todo['status'] as String?;
              final completed =
                  todo['completed'] as bool? ?? (statusStr == 'completed');
              return TodoEntry(text: entryText, completed: completed);
            }
            return null;
          })
          .whereType<TodoEntry>()
          .toList();
      nextState = _appendTodoList(state, provider, items, timestamp);
    case 'error':
      final activity = ActivityLogItem(
        id: _createTimelineId(
          'error',
          item['message'] as String? ?? 'Unknown error',
          timestamp,
        ),
        timestamp: timestamp,
        activityType: ActivityLogType.error,
        message: _formatErrorMessage(
          item['message'] as String? ?? 'Unknown error',
        ),
      );
      nextState = _appendActivityLog(state, activity);
    case 'compaction':
      nextState = _appendCompaction(state, item, timestamp);
    default:
      return state;
  }

  return _finalizeActiveThoughts(nextState);
}

// =============================================================================
// hydrateStreamState
// =============================================================================

List<StreamItem> hydrateStreamState(
  List<Map<String, dynamic>> events, {
  String source = 'canonical',
}) {
  var state = <StreamItem>[];
  for (final event in events) {
    final ts =
        DateTime.tryParse(event['timestamp'] as String? ?? '') ??
        DateTime.now();
    state = reduceStreamUpdate(state, event, ts, source: source);
  }
  return mergeAdjacentThoughtItems(_finalizeActiveThoughts(state));
}

// =============================================================================
// Head / tail model helpers
// =============================================================================

const _streamableKinds = <StreamItemKind>{
  StreamItemKind.assistantMessage,
  StreamItemKind.thought,
};

bool _isStreamableKind(StreamItemKind kind) => _streamableKinds.contains(kind);

StreamItemKind? _getEventItemKind(Map<String, dynamic> event) {
  if (event['type'] != 'timeline') return null;
  final item = event['item'] as Map<String, dynamic>?;
  if (item == null) return null;
  switch (item['type']) {
    case 'user_message':
      return StreamItemKind.userMessage;
    case 'assistant_message':
      return StreamItemKind.assistantMessage;
    case 'reasoning':
      return StreamItemKind.thought;
    case 'tool_call':
      return StreamItemKind.toolCall;
    case 'todo':
      return StreamItemKind.todoList;
    case 'error':
      return StreamItemKind.activityLog;
    default:
      return null;
  }
}

bool _shouldFlushHead(List<StreamItem> head, StreamItemKind? incomingKind) {
  if (head.isEmpty) return false;
  if (incomingKind == null) return false;
  if (!_isStreamableKind(incomingKind)) return true;

  StreamItem? lastStreamable;
  for (int i = head.length - 1; i >= 0; i--) {
    if (_isStreamableKind(head[i].kind)) {
      lastStreamable = head[i];
      break;
    }
  }
  if (lastStreamable == null) return true;
  if (lastStreamable.kind != incomingKind) return true;
  return false;
}

// =============================================================================
// finalizeHeadItems
// =============================================================================

List<StreamItem> finalizeHeadItems(List<StreamItem> head) {
  final finalized = head.map((item) {
    if (item is ThoughtItem && item.status != ThoughtStatus.ready) {
      return _markThoughtReady(item);
    }
    if (item is AssistantMessageItem && item.blockGroupId != null) {
      return item.copyWith(
        id: _createAssistantBlockId(
          groupId: item.blockGroupId!,
          blockIndex: item.blockIndex ?? 0,
        ),
      );
    }
    return item;
  }).toList();
  return mergeAdjacentThoughtItems(finalized);
}

String _createAssistantBlockId({
  required String groupId,
  required int blockIndex,
}) {
  return '$groupId:block:$blockIndex';
}

// =============================================================================
// flushHeadToTail
// =============================================================================

List<StreamItem> flushHeadToTail(List<StreamItem> tail, List<StreamItem> head) {
  if (head.isEmpty) return tail;

  final finalized = finalizeHeadItems(head);
  final tailIds = tail.map((i) => i.id).toSet();
  final newItems = finalized.where((i) => !tailIds.contains(i.id)).toList();

  if (newItems.isEmpty) return tail;

  var nextTail = List<StreamItem>.from(tail);
  for (final item in newItems) {
    nextTail = _appendFlushedItem(nextTail, item);
  }
  return nextTail;
}

List<StreamItem> _appendFlushedItem(List<StreamItem> tail, StreamItem item) {
  if (tail.isNotEmpty && tail.last is ThoughtItem && item is ThoughtItem) {
    return [
      ...tail.sublist(0, tail.length - 1),
      _mergeThoughtItems(tail.last as ThoughtItem, item),
    ];
  }
  return [...tail, item];
}

// =============================================================================
// promoteCompletedAssistantBlocks
// =============================================================================

int _getActiveAssistantHeadIndex(List<StreamItem> head) {
  for (int i = head.length - 1; i >= 0; i--) {
    if (head[i] is AssistantMessageItem) return i;
  }
  return -1;
}

ApplyStreamEventResult promoteCompletedAssistantBlocks({
  required List<StreamItem> tail,
  required List<StreamItem> head,
}) {
  final assistantIndex = _getActiveAssistantHeadIndex(head);
  final activeItem = assistantIndex >= 0 ? head[assistantIndex] : null;
  if (assistantIndex < 0 || activeItem is! AssistantMessageItem) {
    return ApplyStreamEventResult(
      tail: tail,
      head: head,
      changedTail: false,
      changedHead: false,
    );
  }

  final blocks = splitMarkdownBlocks(activeItem.text);
  if (blocks.length < 2) {
    return ApplyStreamEventResult(
      tail: tail,
      head: head,
      changedTail: false,
      changedHead: false,
    );
  }

  final blockGroupId = activeItem.blockGroupId ?? activeItem.id;
  final firstBlockIndex = activeItem.blockIndex ?? 0;
  final completedBlocks = blocks.sublist(0, blocks.length - 1);
  final liveBlock = blocks.last;

  final promotedItems = <AssistantMessageItem>[];
  for (int offset = 0; offset < completedBlocks.length; offset++) {
    promotedItems.add(
      AssistantMessageItem(
        id: _createAssistantBlockId(
          groupId: blockGroupId,
          blockIndex: firstBlockIndex + offset,
        ),
        timestamp: activeItem.timestamp,
        text: completedBlocks[offset],
        blockGroupId: blockGroupId,
        blockIndex: firstBlockIndex + offset,
      ),
    );
  }

  final nextTail = flushHeadToTail(tail, promotedItems);
  final liveItem = AssistantMessageItem(
    id: '$blockGroupId:head',
    timestamp: activeItem.timestamp,
    text: liveBlock,
    blockGroupId: blockGroupId,
    blockIndex: firstBlockIndex + completedBlocks.length,
  );
  final nextHead = [
    ...head.sublist(0, assistantIndex),
    liveItem,
    ...head.sublist(assistantIndex + 1),
  ];

  return ApplyStreamEventResult(
    tail: nextTail,
    head: nextHead,
    changedTail: nextTail != tail,
    changedHead: true,
  );
}

// =============================================================================
// applyStreamEvent
// =============================================================================

const _streamCompletionEvents = <String>{
  'turn_completed',
  'turn_failed',
  'turn_canceled',
};

ApplyStreamEventResult applyStreamEvent({
  required List<StreamItem> tail,
  required List<StreamItem> head,
  required Map<String, dynamic> event,
  required DateTime timestamp,
  String source = 'live',
}) {
  var nextTail = tail;
  var nextHead = head;
  var changedTail = false;
  var changedHead = false;

  void flushHead() {
    if (nextHead.isEmpty) return;
    final flushed = flushHeadToTail(nextTail, nextHead);
    if (flushed != nextTail) {
      nextTail = flushed;
      changedTail = true;
    }
    nextHead = [];
    changedHead = true;
  }

  final eventType = event['type'] as String?;

  // Turn completion events flush everything.
  if (_streamCompletionEvents.contains(eventType)) {
    flushHead();
    final finalized = _finalizeActiveThoughts(nextTail);
    if (finalized != nextTail) {
      nextTail = finalized;
      changedTail = true;
    }
    return ApplyStreamEventResult(
      tail: nextTail,
      head: nextHead,
      changedTail: changedTail,
      changedHead: changedHead,
    );
  }

  final incomingKind = _getEventItemKind(event);

  if (_shouldFlushHead(nextHead, incomingKind)) {
    flushHead();
  }

  // Streamable kinds go to head.
  if (incomingKind != null && _isStreamableKind(incomingKind)) {
    final reduced = reduceStreamUpdate(
      nextHead,
      event,
      timestamp,
      source: source,
    );
    if (reduced != nextHead) {
      nextHead = reduced;
      changedHead = true;
    }
    if (incomingKind == StreamItemKind.assistantMessage) {
      final promoted = promoteCompletedAssistantBlocks(
        tail: nextTail,
        head: nextHead,
      );
      nextTail = promoted.tail;
      nextHead = promoted.head;
      changedTail = changedTail || promoted.changedTail;
      changedHead = changedHead || promoted.changedHead;
    }
    return ApplyStreamEventResult(
      tail: nextTail,
      head: nextHead,
      changedTail: changedTail,
      changedHead: changedHead,
    );
  }

  // Non-streamable kinds go to tail.
  final reduced = reduceStreamUpdate(
    nextTail,
    event,
    timestamp,
    source: source,
  );
  if (reduced != nextTail) {
    nextTail = reduced;
    changedTail = true;
  }

  return ApplyStreamEventResult(
    tail: nextTail,
    head: nextHead,
    changedTail: changedTail,
    changedHead: changedHead,
  );
}
