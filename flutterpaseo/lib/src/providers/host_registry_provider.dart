import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/host_connection.dart';
import '../services/device_sync_service.dart';
import '../providers/auth_provider.dart';
import '../services/storage_service.dart';

final deviceSyncServiceProvider = Provider<DeviceSyncService?>((ref) {
  final auth = ref.watch(authProvider);
  final baseUrl = ref.watch(relayBaseUrlProvider);
  if (auth.status != AuthStatus.authenticated || auth.token == null) {
    return null;
  }
  return DeviceSyncService(baseUrl: baseUrl, token: auth.token!);
});

/// Manages the user's device list. Server is the single source of truth.
/// Local state is just a cache of what the API returns.
final hostRegistryProvider =
    StateNotifierProvider<HostRegistryNotifier, List<HostProfile>>((ref) {
      final notifier = HostRegistryNotifier();
      notifier.setSyncService(ref.read(deviceSyncServiceProvider));
      ref.listen<DeviceSyncService?>(deviceSyncServiceProvider, (
        previous,
        next,
      ) {
        notifier.setSyncService(next);
      });
      return notifier;
    });

class HostRegistryNotifier extends StateNotifier<List<HostProfile>> {
  DeviceSyncService? _syncService;
  final StorageService _storage = StorageService();

  HostRegistryNotifier() : super([]) {
    unawaited(_restoreLocalProfiles().catchError(_logSyncFailure));
  }

  void setSyncService(DeviceSyncService? service) {
    _syncService = service;
    if (service == null) {
      unawaited(_restoreLocalProfiles().catchError(_logSyncFailure));
      return;
    }
    unawaited(loadFromServer().catchError(_logSyncFailure));
  }

  Future<void> _restoreLocalProfiles() async {
    final localProfiles = await _storage.loadHostRegistry();
    state = localProfiles;
  }

  /// Fetch devices from server and replace local state entirely.
  Future<void> loadFromServer() async {
    final service = _requireSyncService();
    final devices = await service.fetchDevices();
    final serverProfiles = devices
        .where((d) => d.relayEndpoint != null && d.daemonPublicKeyB64 != null)
        .map((d) {
          final connection = RelayHostConnection(
            id: 'relay:${d.relayEndpoint}',
            relayEndpoint: d.relayEndpoint!,
            daemonPublicKeyB64: d.daemonPublicKeyB64!,
          );
          return HostProfile(
            serverId: d.serverId,
            label: d.label ?? d.serverId,
            connections: [connection],
            preferredConnectionId: connection.id,
            createdAt: d.createdAt ?? DateTime.now().toIso8601String(),
            updatedAt: d.updatedAt ?? DateTime.now().toIso8601String(),
          );
        })
        .toList();
    state = _mergeServerProfiles(
      serverProfiles: serverProfiles,
      existing: state,
    );
    await _persistState();
  }

  /// Bind a new device (after QR scan) to server and add to local state.
  Future<void> addProfile(HostProfile profile) async {
    String? relayEndpoint;
    String? daemonPublicKeyB64;
    for (final c in profile.connections) {
      if (c is RelayHostConnection) {
        relayEndpoint = c.relayEndpoint;
        daemonPublicKeyB64 = c.daemonPublicKeyB64;
        break;
      }
    }
    if (relayEndpoint == null || daemonPublicKeyB64 == null) {
      _upsertLocalProfile(profile);
      return;
    }
    final service = _syncService;
    if (service == null) {
      _upsertLocalProfile(profile);
      await _persistState();
      return;
    }
    await service.bindDevice(
      serverId: profile.serverId,
      label: profile.label,
      relayEndpoint: relayEndpoint,
      daemonPublicKeyB64: daemonPublicKeyB64,
    );
    await loadFromServer();
  }

  Future<void> removeProfile(String serverId) async {
    final profile = _findProfile(serverId);
    if (profile == null || !_hasRelayConnection(profile)) {
      state = state.where((item) => item.serverId != serverId).toList();
      await _persistState();
      return;
    }
    final service = _syncService;
    if (service == null) {
      state = state.where((item) => item.serverId != serverId).toList();
      await _persistState();
      return;
    }
    await service.unbindDevice(serverId);
    await loadFromServer();
  }

  Future<void> updateLabel(String serverId, String label) async {
    final trimmed = label.trim();
    final profile = _findProfile(serverId);
    if (profile == null || !_hasRelayConnection(profile)) {
      state = state
          .map(
            (item) => item.serverId == serverId
                ? item.copyWith(
                    label: trimmed,
                    updatedAt: DateTime.now().toIso8601String(),
                  )
                : item,
          )
          .toList();
      await _persistState();
      return;
    }
    final service = _syncService;
    if (service == null) {
      state = state
          .map(
            (item) => item.serverId == serverId
                ? item.copyWith(
                    label: trimmed,
                    updatedAt: DateTime.now().toIso8601String(),
                  )
                : item,
          )
          .toList();
      await _persistState();
      return;
    }
    await service.updateLabel(serverId, trimmed);
    await loadFromServer();
  }

  void addConnection(String serverId, HostConnection connection) {
    state = state.map((p) {
      if (p.serverId != serverId) return p;
      final connections = List<HostConnection>.from(p.connections);
      final idx = connections.indexWhere((c) => c.id == connection.id);
      if (idx >= 0) {
        connections[idx] = connection;
      } else {
        connections.add(connection);
      }
      return p.copyWith(
        connections: connections,
        preferredConnectionId: p.preferredConnectionId ?? connection.id,
      );
    }).toList();
    unawaited(_persistState());
  }

  void removeConnection(String serverId, String connectionId) {
    state = state.map((p) {
      if (p.serverId != serverId) return p;
      final connections = p.connections
          .where((c) => c.id != connectionId)
          .toList();
      final preferred = p.preferredConnectionId == connectionId
          ? (connections.isNotEmpty ? connections.first.id : null)
          : p.preferredConnectionId;
      return p.copyWith(
        connections: connections,
        preferredConnectionId: preferred,
      );
    }).toList();
    unawaited(_persistState());
  }

  void setPreferredConnection(String serverId, String connectionId) {
    state = state.map((p) {
      if (p.serverId != serverId) return p;
      return p.copyWith(preferredConnectionId: connectionId);
    }).toList();
    unawaited(_persistState());
  }

  DeviceSyncService _requireSyncService() {
    final service = _syncService;
    if (service == null) {
      throw StateError(
        'Device sync is unavailable; user is not authenticated.',
      );
    }
    return service;
  }

  void _logSyncFailure(Object error, StackTrace stackTrace) {
    debugPrint('Device sync failed: $error');
  }

  HostProfile? _findProfile(String serverId) {
    for (final profile in state) {
      if (profile.serverId == serverId) {
        return profile;
      }
    }
    return null;
  }

  bool _hasRelayConnection(HostProfile profile) {
    return profile.connections.any(
      (connection) => connection is RelayHostConnection,
    );
  }

  void _upsertLocalProfile(HostProfile profile) {
    final next = [...state];
    final index = next.indexWhere((item) => item.serverId == profile.serverId);
    if (index == -1) {
      next.add(profile);
    } else {
      next[index] = _mergeProfile(
        serverProfile: profile,
        existingProfile: next[index],
      );
    }
    state = next;
  }

  Future<void> _persistState() {
    return _storage.saveHostRegistry(state);
  }

  List<HostProfile> _mergeServerProfiles({
    required List<HostProfile> serverProfiles,
    required List<HostProfile> existing,
  }) {
    final existingById = {
      for (final profile in existing) profile.serverId: profile,
    };
    final serverIds = serverProfiles.map((profile) => profile.serverId).toSet();
    final merged = serverProfiles.map((profile) {
      final local = existingById[profile.serverId];
      if (local == null) {
        return profile;
      }
      return _mergeProfile(serverProfile: profile, existingProfile: local);
    }).toList();

    for (final profile in existing) {
      if (serverIds.contains(profile.serverId) ||
          _hasRelayConnection(profile)) {
        continue;
      }
      merged.add(profile);
    }

    return merged;
  }

  HostProfile _mergeProfile({
    required HostProfile serverProfile,
    required HostProfile existingProfile,
  }) {
    final mergedConnections = <String, HostConnection>{
      for (final connection in serverProfile.connections)
        connection.id: connection,
    };
    for (final connection in existingProfile.connections) {
      mergedConnections.putIfAbsent(connection.id, () => connection);
    }

    final preferredConnectionId =
        existingProfile.preferredConnectionId != null &&
            mergedConnections.containsKey(existingProfile.preferredConnectionId)
        ? existingProfile.preferredConnectionId
        : (serverProfile.preferredConnectionId != null &&
                  mergedConnections.containsKey(
                    serverProfile.preferredConnectionId,
                  )
              ? serverProfile.preferredConnectionId
              : mergedConnections.keys.first);

    final label =
        serverProfile.label == serverProfile.serverId &&
            existingProfile.label != existingProfile.serverId
        ? existingProfile.label
        : serverProfile.label;

    return serverProfile.copyWith(
      label: label,
      connections: mergedConnections.values.toList(),
      preferredConnectionId: preferredConnectionId,
      updatedAt: existingProfile.updatedAt,
    );
  }
}
