import 'package:equatable/equatable.dart';

enum StreamItemKind {
  userMessage,
  assistantMessage,
  thought,
  toolCall,
  todoList,
  activityLog,
  compaction,
}

enum ThoughtStatus { loading, ready }

enum AgentToolCallStatus { running, completed, failed, canceled }

enum OrchestratorToolCallStatus { executing, completed, failed }

enum ActivityLogType { system, info, success, error }

sealed class StreamItem extends Equatable {
  final StreamItemKind kind;
  final String id;
  final DateTime timestamp;

  const StreamItem({required this.kind, required this.id, required this.timestamp});
}

class UserMessageItem extends StreamItem {
  final String text;
  final List<Map<String, dynamic>>? images;

  const UserMessageItem({required super.id, required super.timestamp, required this.text, this.images})
      : super(kind: StreamItemKind.userMessage);

  @override
  List<Object?> get props => [id, timestamp, text, images];

  UserMessageItem copyWith({String? id, DateTime? timestamp, String? text, List<Map<String, dynamic>>? images}) =>
      UserMessageItem(id: id ?? this.id, timestamp: timestamp ?? this.timestamp, text: text ?? this.text, images: images ?? this.images);
}

class AssistantMessageItem extends StreamItem {
  final String text;
  final String? blockGroupId;
  final int? blockIndex;

  const AssistantMessageItem({
    required super.id,
    required super.timestamp,
    required this.text,
    this.blockGroupId,
    this.blockIndex,
  }) : super(kind: StreamItemKind.assistantMessage);

  @override
  List<Object?> get props => [id, timestamp, text, blockGroupId, blockIndex];

  AssistantMessageItem copyWith({
    String? id,
    DateTime? timestamp,
    String? text,
    String? blockGroupId,
    int? blockIndex,
  }) =>
      AssistantMessageItem(
        id: id ?? this.id,
        timestamp: timestamp ?? this.timestamp,
        text: text ?? this.text,
        blockGroupId: blockGroupId ?? this.blockGroupId,
        blockIndex: blockIndex ?? this.blockIndex,
      );
}

class ThoughtItem extends StreamItem {
  final String text;
  final ThoughtStatus status;

  const ThoughtItem({required super.id, required super.timestamp, required this.text, this.status = ThoughtStatus.loading})
      : super(kind: StreamItemKind.thought);

  @override
  List<Object?> get props => [id, timestamp, text, status];

  ThoughtItem copyWith({String? id, DateTime? timestamp, String? text, ThoughtStatus? status}) =>
      ThoughtItem(id: id ?? this.id, timestamp: timestamp ?? this.timestamp, text: text ?? this.text, status: status ?? this.status);
}

class ToolCallPayload extends Equatable {
  final String source;
  final Map<String, dynamic> data;

  const ToolCallPayload({required this.source, required this.data});

  @override
  List<Object?> get props => [source, data];
}

class ToolCallItem extends StreamItem {
  final ToolCallPayload payload;

  const ToolCallItem({required super.id, required super.timestamp, required this.payload})
      : super(kind: StreamItemKind.toolCall);

  @override
  List<Object?> get props => [id, timestamp, payload];

  ToolCallItem copyWith({String? id, DateTime? timestamp, ToolCallPayload? payload}) =>
      ToolCallItem(id: id ?? this.id, timestamp: timestamp ?? this.timestamp, payload: payload ?? this.payload);
}

class TodoEntry extends Equatable {
  final String text;
  final bool completed;

  const TodoEntry({required this.text, required this.completed});

  @override
  List<Object?> get props => [text, completed];

  Map<String, dynamic> toJson() => {'text': text, 'completed': completed};
  factory TodoEntry.fromJson(Map<String, dynamic> json) => TodoEntry(text: json['text'] as String, completed: json['completed'] as bool);
}

class TodoListItem extends StreamItem {
  final String provider;
  final List<TodoEntry> items;

  const TodoListItem({required super.id, required super.timestamp, required this.provider, required this.items})
      : super(kind: StreamItemKind.todoList);

  @override
  List<Object?> get props => [id, timestamp, provider, items];

  TodoListItem copyWith({String? id, DateTime? timestamp, String? provider, List<TodoEntry>? items}) =>
      TodoListItem(id: id ?? this.id, timestamp: timestamp ?? this.timestamp, provider: provider ?? this.provider, items: items ?? this.items);
}

class ActivityLogItem extends StreamItem {
  final ActivityLogType activityType;
  final String message;
  final Map<String, dynamic>? metadata;

  const ActivityLogItem({required super.id, required super.timestamp, required this.activityType, required this.message, this.metadata})
      : super(kind: StreamItemKind.activityLog);

  @override
  List<Object?> get props => [id, timestamp, activityType, message, metadata];

  ActivityLogItem copyWith({String? id, DateTime? timestamp, ActivityLogType? activityType, String? message, Map<String, dynamic>? metadata}) =>
      ActivityLogItem(id: id ?? this.id, timestamp: timestamp ?? this.timestamp, activityType: activityType ?? this.activityType, message: message ?? this.message, metadata: metadata ?? this.metadata);
}

class CompactionItem extends StreamItem {
  final String status;
  final String? trigger;
  final int? preTokens;

  const CompactionItem({required super.id, required super.timestamp, required this.status, this.trigger, this.preTokens})
      : super(kind: StreamItemKind.compaction);

  @override
  List<Object?> get props => [id, timestamp, status, trigger, preTokens];

  CompactionItem copyWith({String? id, DateTime? timestamp, String? status, String? trigger, int? preTokens}) =>
      CompactionItem(id: id ?? this.id, timestamp: timestamp ?? this.timestamp, status: status ?? this.status, trigger: trigger ?? this.trigger, preTokens: preTokens ?? this.preTokens);
}
