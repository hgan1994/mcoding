import 'package:equatable/equatable.dart';

enum PermissionKind { tool, plan, question, mode, other }

class AgentPermissionRequest extends Equatable {
  final String id;
  final String provider;
  final String name;
  final PermissionKind kind;
  final String? title;
  final String? description;
  final Map<String, dynamic>? input;
  final List<Map<String, dynamic>>? suggestions;
  final Map<String, dynamic>? metadata;

  const AgentPermissionRequest({
    required this.id,
    required this.provider,
    required this.name,
    required this.kind,
    this.title,
    this.description,
    this.input,
    this.suggestions,
    this.metadata,
  });

  @override
  List<Object?> get props => [id, provider, name, kind, title, description, input, suggestions, metadata];

  factory AgentPermissionRequest.fromJson(Map<String, dynamic> json) => AgentPermissionRequest(
    id: json['id'] as String,
    provider: json['provider'] as String,
    name: json['name'] as String,
    kind: PermissionKind.values.byName(json['kind'] as String),
    title: json['title'] as String?,
    description: json['description'] as String?,
    input: json['input'] as Map<String, dynamic>?,
    suggestions: (json['suggestions'] as List<dynamic>?)?.cast<Map<String, dynamic>>(),
    metadata: json['metadata'] as Map<String, dynamic>?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'provider': provider,
    'name': name,
    'kind': kind.name,
    'title': title,
    'description': description,
    'input': input,
    'suggestions': suggestions,
    'metadata': metadata,
  };
}
