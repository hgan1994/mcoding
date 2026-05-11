import 'dart:convert';

import 'logging_http_client.dart';

class DeviceSyncException implements Exception {
  final String operation;
  final int statusCode;
  final String body;

  const DeviceSyncException(this.operation, this.statusCode, this.body);

  @override
  String toString() => '$operation failed: $statusCode';
}

class RemoteDevice {
  final String id;
  final String serverId;
  final String? label;
  final String? relayEndpoint;
  final String? daemonPublicKeyB64;
  final String? createdAt;
  final String? updatedAt;

  const RemoteDevice({
    required this.id,
    required this.serverId,
    this.label,
    this.relayEndpoint,
    this.daemonPublicKeyB64,
    this.createdAt,
    this.updatedAt,
  });

  factory RemoteDevice.fromJson(Map<String, dynamic> json) => RemoteDevice(
    id: json['id'] as String,
    serverId: json['serverId'] as String,
    label: json['label'] as String?,
    relayEndpoint: json['relayEndpoint'] as String?,
    daemonPublicKeyB64: json['daemonPublicKeyB64'] as String?,
    createdAt: json['createdAt'] as String?,
    updatedAt: json['updatedAt'] as String?,
  );
}

class DeviceSyncService {
  final String baseUrl;
  final String token;
  final LoggingHttpClient _http;

  DeviceSyncService({
    required this.baseUrl,
    required this.token,
    LoggingHttpClient? httpClient,
  }) : _http = httpClient ?? const LoggingHttpClient();

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  Future<List<RemoteDevice>> fetchDevices() async {
    final uri = _uri('/auth/devices');
    final res = await _http.get(uri, headers: _headers);
    if (res.statusCode != 200) {
      throw DeviceSyncException('fetchDevices', res.statusCode, res.body);
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    final list = (json['items'] ?? json['devices']) as List<dynamic>;
    return list
        .map((e) => RemoteDevice.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<RemoteDevice> bindDevice({
    required String serverId,
    String? label,
    String? relayEndpoint,
    String? daemonPublicKeyB64,
  }) async {
    final body = <String, dynamic>{'serverId': serverId};
    if (label != null) body['label'] = label;
    if (relayEndpoint != null) body['relayEndpoint'] = relayEndpoint;
    if (daemonPublicKeyB64 != null) {
      body['daemonPublicKeyB64'] = daemonPublicKeyB64;
    }

    final uri = _uri('/auth/devices');
    final res = await _http.post(
      uri,
      headers: _headers,
      body: jsonEncode(body),
    );
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw DeviceSyncException('bindDevice', res.statusCode, res.body);
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return RemoteDevice.fromJson(
      (json['item'] ?? json['device']) as Map<String, dynamic>,
    );
  }

  Future<void> updateLabel(String serverId, String label) async {
    final uri = _uri('/auth/devices/${Uri.encodeComponent(serverId)}/label');
    final res = await _http.patch(
      uri,
      headers: _headers,
      body: jsonEncode({'label': label}),
    );
    if (res.statusCode != 200) {
      throw DeviceSyncException('updateLabel', res.statusCode, res.body);
    }
  }

  Future<void> unbindDevice(String serverId) async {
    final uri = _uri('/auth/devices/${Uri.encodeComponent(serverId)}');
    final res = await _http.delete(uri, headers: _headers);
    if (res.statusCode != 200) {
      throw DeviceSyncException('unbindDevice', res.statusCode, res.body);
    }
  }

  Uri _uri(String path) {
    final normalized = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    return Uri.parse('$normalized$path');
  }
}
