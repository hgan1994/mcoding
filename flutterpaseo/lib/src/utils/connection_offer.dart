import 'dart:convert';

import '../models/host_connection.dart';

class PairingConnectionOffer {
  const PairingConnectionOffer({
    required this.serverId,
    required this.label,
    required this.connections,
    required this.preferredConnectionId,
  });

  final String serverId;
  final String label;
  final List<HostConnection> connections;
  final String preferredConnectionId;

  bool get hasRelayConnection =>
      connections.any((connection) => connection is RelayHostConnection);

  HostProfile toHostProfile({
    required String createdAt,
    required String updatedAt,
  }) {
    return HostProfile(
      serverId: serverId,
      label: label,
      connections: connections,
      preferredConnectionId: preferredConnectionId,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

String? extractOfferUrl(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return null;
  if (trimmed.contains('#offer=')) return trimmed;
  return null;
}

dynamic decodeOfferFragmentPayload(String encoded) {
  var base64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
  final mod = base64.length % 4;
  if (mod != 0) {
    base64 = base64.padRight(base64.length + (4 - mod), '=');
  }
  final bytes = base64Decode(base64);
  final json = utf8.decode(bytes);
  return jsonDecode(json);
}

PairingConnectionOffer parseOfferFromUrl(String url) {
  const marker = '#offer=';
  final idx = url.indexOf(marker);
  if (idx == -1) throw const FormatException('Missing #offer= fragment');
  final encoded = url.substring(idx + marker.length).trim();
  if (encoded.isEmpty) throw const FormatException('Offer payload is empty');
  final payload = decodeOfferFragmentPayload(encoded);
  if (payload is! Map<String, dynamic>) {
    throw const FormatException('Offer payload is not an object');
  }

  final v = payload['v'];
  return switch (v) {
    2 => _parseRelayOfferV2(payload),
    3 => _parseConnectionOfferV3(payload),
    _ => throw FormatException('Unsupported offer version: $v'),
  };
}

PairingConnectionOffer _parseRelayOfferV2(Map<String, dynamic> payload) {
  final serverId = payload['serverId'] as String?;
  final daemonPublicKeyB64 = payload['daemonPublicKeyB64'] as String?;
  final relay = payload['relay'] as Map<String, dynamic>?;

  if (serverId == null || serverId.isEmpty) {
    throw const FormatException('Missing serverId in offer');
  }
  if (daemonPublicKeyB64 == null || daemonPublicKeyB64.isEmpty) {
    throw const FormatException('Missing daemonPublicKeyB64 in offer');
  }
  if (relay == null || relay['endpoint'] == null) {
    throw const FormatException('Missing relay endpoint in offer');
  }

  final endpoint = relay['endpoint'] as String;
  final connection = RelayHostConnection(
    id: 'relay:$endpoint',
    relayEndpoint: endpoint,
    daemonPublicKeyB64: daemonPublicKeyB64,
  );
  return PairingConnectionOffer(
    serverId: serverId,
    label: serverId,
    connections: [connection],
    preferredConnectionId: connection.id,
  );
}

PairingConnectionOffer _parseConnectionOfferV3(Map<String, dynamic> payload) {
  final serverId = payload['serverId'] as String?;
  final label = payload['label'] as String?;
  final preferredConnectionId = payload['preferredConnectionId'] as String?;
  final rawConnections = payload['connections'];

  if (serverId == null || serverId.trim().isEmpty) {
    throw const FormatException('Missing serverId in offer');
  }
  if (rawConnections is! List || rawConnections.isEmpty) {
    throw const FormatException('Offer does not include any connections');
  }

  final connections = rawConnections
      .whereType<Map>()
      .map((item) => HostConnection.fromJson(Map<String, dynamic>.from(item)))
      .toList(growable: false);
  if (connections.isEmpty) {
    throw const FormatException('Offer does not include any valid connections');
  }

  final preferred = preferredConnectionId?.trim();
  final resolvedPreferred =
      preferred != null &&
          preferred.isNotEmpty &&
          connections.any((connection) => connection.id == preferred)
      ? preferred
      : connections.first.id;

  return PairingConnectionOffer(
    serverId: serverId,
    label: label?.trim().isNotEmpty == true ? label!.trim() : serverId,
    connections: connections,
    preferredConnectionId: resolvedPreferred,
  );
}
