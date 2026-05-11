import 'package:equatable/equatable.dart';

enum AgentLifecycleStatus { initializing, idle, running, error, closed }

class AgentCapabilityFlags extends Equatable {
  final bool supportsStreaming;
  final bool supportsSessionPersistence;
  final bool supportsDynamicModes;
  final bool supportsMcpServers;
  final bool supportsReasoningStream;
  final bool supportsToolInvocations;

  const AgentCapabilityFlags({
    required this.supportsStreaming,
    required this.supportsSessionPersistence,
    required this.supportsDynamicModes,
    required this.supportsMcpServers,
    required this.supportsReasoningStream,
    required this.supportsToolInvocations,
  });

  @override
  List<Object?> get props => [
    supportsStreaming,
    supportsSessionPersistence,
    supportsDynamicModes,
    supportsMcpServers,
    supportsReasoningStream,
    supportsToolInvocations,
  ];

  Map<String, dynamic> toJson() => {
    'supportsStreaming': supportsStreaming,
    'supportsSessionPersistence': supportsSessionPersistence,
    'supportsDynamicModes': supportsDynamicModes,
    'supportsMcpServers': supportsMcpServers,
    'supportsReasoningStream': supportsReasoningStream,
    'supportsToolInvocations': supportsToolInvocations,
  };

  factory AgentCapabilityFlags.fromJson(Map<String, dynamic> json) =>
      AgentCapabilityFlags(
        supportsStreaming: json['supportsStreaming'] as bool,
        supportsSessionPersistence: json['supportsSessionPersistence'] as bool,
        supportsDynamicModes: json['supportsDynamicModes'] as bool,
        supportsMcpServers: json['supportsMcpServers'] as bool,
        supportsReasoningStream: json['supportsReasoningStream'] as bool,
        supportsToolInvocations: json['supportsToolInvocations'] as bool,
      );
}

class AgentMode extends Equatable {
  final String id;
  final String label;
  final String? description;

  const AgentMode({required this.id, required this.label, this.description});

  @override
  List<Object?> get props => [id, label, description];

  Map<String, dynamic> toJson() => {
    'id': id,
    'label': label,
    'description': description,
  };
  factory AgentMode.fromJson(Map<String, dynamic> json) => AgentMode(
    id: json['id'] as String,
    label: json['label'] as String,
    description: json['description'] as String?,
  );
}

class AgentUsage extends Equatable {
  final int? inputTokens;
  final int? cachedInputTokens;
  final int? outputTokens;
  final double? totalCostUsd;

  const AgentUsage({
    this.inputTokens,
    this.cachedInputTokens,
    this.outputTokens,
    this.totalCostUsd,
  });

  @override
  List<Object?> get props => [
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalCostUsd,
  ];

  Map<String, dynamic> toJson() => {
    'inputTokens': inputTokens,
    'cachedInputTokens': cachedInputTokens,
    'outputTokens': outputTokens,
    'totalCostUsd': totalCostUsd,
  };

  static int? _readInt(Object? value) => value is num ? value.toInt() : null;

  static double? _readDouble(Object? value) =>
      value is num ? value.toDouble() : null;

  factory AgentUsage.fromJson(Map<String, dynamic> json) => AgentUsage(
    inputTokens: _readInt(json['inputTokens']),
    cachedInputTokens: _readInt(json['cachedInputTokens']),
    outputTokens: _readInt(json['outputTokens']),
    totalCostUsd: _readDouble(json['totalCostUsd']),
  );
}

class AgentPersistenceHandle extends Equatable {
  final String provider;
  final String sessionId;
  final String? nativeHandle;
  final Map<String, dynamic>? metadata;

  const AgentPersistenceHandle({
    required this.provider,
    required this.sessionId,
    this.nativeHandle,
    this.metadata,
  });

  @override
  List<Object?> get props => [provider, sessionId, nativeHandle, metadata];

  Map<String, dynamic> toJson() => {
    'provider': provider,
    'sessionId': sessionId,
    'nativeHandle': nativeHandle,
    'metadata': metadata,
  };

  factory AgentPersistenceHandle.fromJson(Map<String, dynamic> json) =>
      AgentPersistenceHandle(
        provider: json['provider'] as String,
        sessionId: json['sessionId'] as String,
        nativeHandle: json['nativeHandle'] as String?,
        metadata: json['metadata'] as Map<String, dynamic>?,
      );
}

class AgentRuntimeInfo extends Equatable {
  final String provider;
  final String? sessionId;
  final String? model;
  final String? thinkingOptionId;
  final String? modeId;
  final Map<String, dynamic>? extra;

  const AgentRuntimeInfo({
    required this.provider,
    this.sessionId,
    this.model,
    this.thinkingOptionId,
    this.modeId,
    this.extra,
  });

  @override
  List<Object?> get props => [
    provider,
    sessionId,
    model,
    thinkingOptionId,
    modeId,
    extra,
  ];

  Map<String, dynamic> toJson() => {
    'provider': provider,
    'sessionId': sessionId,
    'model': model,
    'thinkingOptionId': thinkingOptionId,
    'modeId': modeId,
    'extra': extra,
  };

  factory AgentRuntimeInfo.fromJson(Map<String, dynamic> json) =>
      AgentRuntimeInfo(
        provider: json['provider'] as String,
        sessionId: json['sessionId'] as String?,
        model: json['model'] as String?,
        thinkingOptionId: json['thinkingOptionId'] as String?,
        modeId: json['modeId'] as String?,
        extra: json['extra'] as Map<String, dynamic>?,
      );
}

class Agent extends Equatable {
  final String serverId;
  final String id;
  final String provider;
  final AgentLifecycleStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? lastUserMessageAt;
  final DateTime lastActivityAt;
  final AgentCapabilityFlags capabilities;
  final String? currentModeId;
  final List<AgentMode> availableModes;
  final List<dynamic> pendingPermissions;
  final AgentPersistenceHandle? persistence;
  final AgentRuntimeInfo? runtimeInfo;
  final AgentUsage? lastUsage;
  final String? lastError;
  final String? title;
  final String cwd;
  final String? model;
  final String? thinkingOptionId;
  final bool requiresAttention;
  final String? attentionReason;
  final DateTime? attentionTimestamp;
  final DateTime? archivedAt;
  final Map<String, String> labels;

  const Agent({
    required this.serverId,
    required this.id,
    required this.provider,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.lastUserMessageAt,
    required this.lastActivityAt,
    required this.capabilities,
    this.currentModeId,
    required this.availableModes,
    required this.pendingPermissions,
    this.persistence,
    this.runtimeInfo,
    this.lastUsage,
    this.lastError,
    this.title,
    required this.cwd,
    this.model,
    this.thinkingOptionId,
    this.requiresAttention = false,
    this.attentionReason,
    this.attentionTimestamp,
    this.archivedAt,
    this.labels = const {},
  });

  @override
  List<Object?> get props => [
    serverId,
    id,
    provider,
    status,
    createdAt,
    updatedAt,
    lastUserMessageAt,
    lastActivityAt,
    capabilities,
    currentModeId,
    availableModes,
    pendingPermissions,
    persistence,
    runtimeInfo,
    lastUsage,
    lastError,
    title,
    cwd,
    model,
    thinkingOptionId,
    requiresAttention,
    attentionReason,
    attentionTimestamp,
    archivedAt,
    labels,
  ];

  Agent copyWith({
    String? serverId,
    String? id,
    String? provider,
    AgentLifecycleStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? lastUserMessageAt,
    DateTime? lastActivityAt,
    AgentCapabilityFlags? capabilities,
    String? currentModeId,
    List<AgentMode>? availableModes,
    List<dynamic>? pendingPermissions,
    AgentPersistenceHandle? persistence,
    AgentRuntimeInfo? runtimeInfo,
    AgentUsage? lastUsage,
    String? lastError,
    String? title,
    String? cwd,
    String? model,
    String? thinkingOptionId,
    bool? requiresAttention,
    String? attentionReason,
    DateTime? attentionTimestamp,
    DateTime? archivedAt,
    Map<String, String>? labels,
  }) => Agent(
    serverId: serverId ?? this.serverId,
    id: id ?? this.id,
    provider: provider ?? this.provider,
    status: status ?? this.status,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    lastUserMessageAt: lastUserMessageAt ?? this.lastUserMessageAt,
    lastActivityAt: lastActivityAt ?? this.lastActivityAt,
    capabilities: capabilities ?? this.capabilities,
    currentModeId: currentModeId ?? this.currentModeId,
    availableModes: availableModes ?? this.availableModes,
    pendingPermissions: pendingPermissions ?? this.pendingPermissions,
    persistence: persistence ?? this.persistence,
    runtimeInfo: runtimeInfo ?? this.runtimeInfo,
    lastUsage: lastUsage ?? this.lastUsage,
    lastError: lastError ?? this.lastError,
    title: title ?? this.title,
    cwd: cwd ?? this.cwd,
    model: model ?? this.model,
    thinkingOptionId: thinkingOptionId ?? this.thinkingOptionId,
    requiresAttention: requiresAttention ?? this.requiresAttention,
    attentionReason: attentionReason ?? this.attentionReason,
    attentionTimestamp: attentionTimestamp ?? this.attentionTimestamp,
    archivedAt: archivedAt ?? this.archivedAt,
    labels: labels ?? this.labels,
  );

  factory Agent.fromSnapshot(String serverId, Map<String, dynamic> json) {
    return Agent(
      serverId: serverId,
      id: json['id'] as String,
      provider: json['provider'] as String,
      status: AgentLifecycleStatus.values.byName(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      lastUserMessageAt: json['lastUserMessageAt'] != null
          ? DateTime.parse(json['lastUserMessageAt'] as String)
          : null,
      lastActivityAt: json['lastActivityAt'] != null
          ? DateTime.parse(json['lastActivityAt'] as String)
          : DateTime.parse(json['updatedAt'] as String),
      capabilities: AgentCapabilityFlags.fromJson(
        json['capabilities'] as Map<String, dynamic>,
      ),
      currentModeId: json['currentModeId'] as String?,
      availableModes: (json['availableModes'] as List<dynamic>)
          .map((m) => AgentMode.fromJson(m as Map<String, dynamic>))
          .toList(),
      pendingPermissions: json['pendingPermissions'] as List<dynamic>? ?? [],
      persistence: json['persistence'] != null
          ? AgentPersistenceHandle.fromJson(
              json['persistence'] as Map<String, dynamic>,
            )
          : null,
      runtimeInfo: json['runtimeInfo'] != null
          ? AgentRuntimeInfo.fromJson(
              json['runtimeInfo'] as Map<String, dynamic>,
            )
          : null,
      lastUsage: json['lastUsage'] != null
          ? AgentUsage.fromJson(json['lastUsage'] as Map<String, dynamic>)
          : null,
      lastError: json['lastError'] as String?,
      title: json['title'] as String?,
      cwd: json['cwd'] as String,
      model: json['model'] as String?,
      thinkingOptionId: json['thinkingOptionId'] as String?,
      requiresAttention: json['requiresAttention'] as bool? ?? false,
      attentionReason: json['attentionReason'] as String?,
      attentionTimestamp: json['attentionTimestamp'] != null
          ? DateTime.parse(json['attentionTimestamp'] as String)
          : null,
      archivedAt: json['archivedAt'] != null
          ? DateTime.parse(json['archivedAt'] as String)
          : null,
      labels:
          (json['labels'] as Map<String, dynamic>?)?.map(
            (k, v) => MapEntry(k, v as String),
          ) ??
          {},
    );
  }
}
