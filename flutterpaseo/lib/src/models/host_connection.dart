import 'package:equatable/equatable.dart';

sealed class HostConnection extends Equatable {
  final String id;
  const HostConnection({required this.id});

  Map<String, dynamic> toJson();

  factory HostConnection.fromJson(Map<String, dynamic> json) {
    final type = json['type'] as String?;
    switch (type) {
      case 'directTcp':
        return DirectTcpHostConnection.fromJson(json);
      case 'directSocket':
        return DirectSocketHostConnection.fromJson(json);
      case 'directPipe':
        return DirectPipeHostConnection.fromJson(json);
      case 'relay':
        return RelayHostConnection.fromJson(json);
      default:
        throw ArgumentError('Unknown connection type: $type');
    }
  }
}

class DirectTcpHostConnection extends HostConnection {
  final String endpoint;
  const DirectTcpHostConnection({required super.id, required this.endpoint});
  @override
  List<Object?> get props => [id, endpoint];
  @override
  Map<String, dynamic> toJson() => {'id': id, 'type': 'directTcp', 'endpoint': endpoint};
  factory DirectTcpHostConnection.fromJson(Map<String, dynamic> json) =>
      DirectTcpHostConnection(id: json['id'] as String, endpoint: json['endpoint'] as String);
}

class DirectSocketHostConnection extends HostConnection {
  final String path;
  const DirectSocketHostConnection({required super.id, required this.path});
  @override
  List<Object?> get props => [id, path];
  @override
  Map<String, dynamic> toJson() => {'id': id, 'type': 'directSocket', 'path': path};
  factory DirectSocketHostConnection.fromJson(Map<String, dynamic> json) =>
      DirectSocketHostConnection(id: json['id'] as String, path: json['path'] as String);
}

class DirectPipeHostConnection extends HostConnection {
  final String path;
  const DirectPipeHostConnection({required super.id, required this.path});
  @override
  List<Object?> get props => [id, path];
  @override
  Map<String, dynamic> toJson() => {'id': id, 'type': 'directPipe', 'path': path};
  factory DirectPipeHostConnection.fromJson(Map<String, dynamic> json) =>
      DirectPipeHostConnection(id: json['id'] as String, path: json['path'] as String);
}

class RelayHostConnection extends HostConnection {
  final String relayEndpoint;
  final String daemonPublicKeyB64;
  const RelayHostConnection({required super.id, required this.relayEndpoint, required this.daemonPublicKeyB64});
  @override
  List<Object?> get props => [id, relayEndpoint, daemonPublicKeyB64];
  @override
  Map<String, dynamic> toJson() => {'id': id, 'type': 'relay', 'relayEndpoint': relayEndpoint, 'daemonPublicKeyB64': daemonPublicKeyB64};
  factory RelayHostConnection.fromJson(Map<String, dynamic> json) => RelayHostConnection(
        id: json['id'] as String,
        relayEndpoint: json['relayEndpoint'] as String,
        daemonPublicKeyB64: json['daemonPublicKeyB64'] as String,
      );
}

class HostProfile extends Equatable {
  final String serverId;
  final String label;
  final List<HostConnection> connections;
  final String? preferredConnectionId;
  final String createdAt;
  final String updatedAt;

  const HostProfile({
    required this.serverId,
    required this.label,
    required this.connections,
    this.preferredConnectionId,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [serverId, label, connections, preferredConnectionId, createdAt, updatedAt];

  Map<String, dynamic> toJson() => {
        'serverId': serverId,
        'label': label,
        'connections': connections.map((c) => c.toJson()).toList(),
        'preferredConnectionId': preferredConnectionId,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory HostProfile.fromJson(Map<String, dynamic> json) => HostProfile(
        serverId: json['serverId'] as String,
        label: json['label'] as String,
        connections: (json['connections'] as List<dynamic>).map((c) => HostConnection.fromJson(c as Map<String, dynamic>)).toList(),
        preferredConnectionId: json['preferredConnectionId'] as String?,
        createdAt: json['createdAt'] as String,
        updatedAt: json['updatedAt'] as String,
      );

  HostProfile copyWith({
    String? serverId,
    String? label,
    List<HostConnection>? connections,
    String? preferredConnectionId,
    String? createdAt,
    String? updatedAt,
  }) =>
      HostProfile(
        serverId: serverId ?? this.serverId,
        label: label ?? this.label,
        connections: connections ?? this.connections,
        preferredConnectionId: preferredConnectionId ?? this.preferredConnectionId,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );
}
