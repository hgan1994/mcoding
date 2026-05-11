import 'package:equatable/equatable.dart';

import 'agent.dart';

class AgentSelectOption extends Equatable {
  final String id;
  final String label;
  final String? description;
  final bool isDefault;

  const AgentSelectOption({
    required this.id,
    required this.label,
    this.description,
    this.isDefault = false,
  });

  factory AgentSelectOption.fromJson(Map<String, dynamic> json) {
    return AgentSelectOption(
      id: json['id'] as String,
      label: json['label'] as String? ?? json['id'] as String,
      description: json['description'] as String?,
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }

  @override
  List<Object?> get props => [id, label, description, isDefault];
}

class AgentModelDefinition extends Equatable {
  final String provider;
  final String id;
  final String label;
  final String? description;
  final bool isDefault;
  final List<AgentSelectOption> thinkingOptions;
  final String? defaultThinkingOptionId;

  const AgentModelDefinition({
    required this.provider,
    required this.id,
    required this.label,
    this.description,
    this.isDefault = false,
    this.thinkingOptions = const [],
    this.defaultThinkingOptionId,
  });

  factory AgentModelDefinition.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['thinkingOptions'] as List<dynamic>? ?? const [];
    return AgentModelDefinition(
      provider: json['provider'] as String? ?? '',
      id: json['id'] as String,
      label: json['label'] as String? ?? json['id'] as String,
      description: json['description'] as String?,
      isDefault: json['isDefault'] as bool? ?? false,
      thinkingOptions: rawOptions
          .whereType<Map>()
          .map(
            (option) =>
                AgentSelectOption.fromJson(Map<String, dynamic>.from(option)),
          )
          .toList(),
      defaultThinkingOptionId: json['defaultThinkingOptionId'] as String?,
    );
  }

  @override
  List<Object?> get props => [
    provider,
    id,
    label,
    description,
    isDefault,
    thinkingOptions,
    defaultThinkingOptionId,
  ];
}

class ProviderSnapshotEntry extends Equatable {
  final String provider;
  final String status;
  final bool enabled;
  final String? error;
  final List<AgentModelDefinition> models;
  final List<AgentMode> modes;
  final String? fetchedAt;
  final String? label;
  final String? description;
  final String? defaultModeId;

  const ProviderSnapshotEntry({
    required this.provider,
    required this.status,
    this.enabled = true,
    this.error,
    this.models = const [],
    this.modes = const [],
    this.fetchedAt,
    this.label,
    this.description,
    this.defaultModeId,
  });

  bool get isResolvable =>
      enabled && (status == 'ready' || status == 'loading');

  bool get isSelectable => enabled && status == 'ready';

  factory ProviderSnapshotEntry.fromJson(Map<String, dynamic> json) {
    final rawModels = json['models'] as List<dynamic>? ?? const [];
    final rawModes = json['modes'] as List<dynamic>? ?? const [];
    return ProviderSnapshotEntry(
      provider: json['provider'] as String,
      status: json['status'] as String? ?? 'unavailable',
      enabled: json['enabled'] as bool? ?? true,
      error: json['error'] as String?,
      models: rawModels
          .whereType<Map>()
          .map(
            (model) =>
                AgentModelDefinition.fromJson(Map<String, dynamic>.from(model)),
          )
          .toList(),
      modes: rawModes
          .whereType<Map>()
          .map((mode) => AgentMode.fromJson(Map<String, dynamic>.from(mode)))
          .toList(),
      fetchedAt: json['fetchedAt'] as String?,
      label: json['label'] as String?,
      description: json['description'] as String?,
      defaultModeId: json['defaultModeId'] as String?,
    );
  }

  @override
  List<Object?> get props => [
    provider,
    status,
    enabled,
    error,
    models,
    modes,
    fetchedAt,
    label,
    description,
    defaultModeId,
  ];
}
