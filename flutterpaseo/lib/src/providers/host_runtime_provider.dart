import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/host_connection.dart';
import '../services/websocket_service.dart';
import 'host_registry_provider.dart';

enum HostConnectionState { booting, connecting, online, offline, error }

typedef DaemonClientFactory =
    DaemonClient Function({
      required String serverId,
      required Uri uri,
      String? daemonPublicKeyB64,
    });

class HostRuntime {
  final String serverId;
  final HostConnectionState connectionState;
  final String? error;
  final DateTime? connectedAt;
  final int? rttMs;
  final DaemonClient? client;

  const HostRuntime({
    required this.serverId,
    this.connectionState = HostConnectionState.booting,
    this.error,
    this.connectedAt,
    this.rttMs,
    this.client,
  });

  HostRuntime copyWith({
    String? serverId,
    HostConnectionState? connectionState,
    String? error,
    DateTime? connectedAt,
    int? rttMs,
    DaemonClient? client,
  }) => HostRuntime(
    serverId: serverId ?? this.serverId,
    connectionState: connectionState ?? this.connectionState,
    error: error,
    connectedAt: connectedAt ?? this.connectedAt,
    rttMs: rttMs ?? this.rttMs,
    client: client ?? this.client,
  );
}

class HostRuntimeNotifier extends StateNotifier<Map<String, HostRuntime>> {
  final HostRegistryNotifier _registry;
  final DaemonClientFactory _clientFactory;
  final Map<String, DaemonClient> _clients = {};
  final Map<String, Timer> _probeTimers = {};
  final Map<String, StreamSubscription<DaemonConnectionState>>
  _stateSubscriptions = {};

  HostRuntimeNotifier(this._registry, {DaemonClientFactory? clientFactory})
    : _clientFactory = clientFactory ?? _defaultDaemonClientFactory,
      super({}) {
    _bootstrap();
  }

  static DaemonClient _defaultDaemonClientFactory({
    required String serverId,
    required Uri uri,
    String? daemonPublicKeyB64,
  }) {
    return DaemonClient(
      serverId: serverId,
      uri: uri,
      daemonPublicKeyB64: daemonPublicKeyB64,
    );
  }

  Future<void> _bootstrap() async {
    for (final profile in _registry.state) {
      state = {
        ...state,
        profile.serverId: HostRuntime(serverId: profile.serverId),
      };
      _attemptConnect(profile.serverId);
    }
    if (_shouldAutoDiscoverLocalDaemon) {
      _attemptAutoDiscover();
    }
  }

  bool get _shouldAutoDiscoverLocalDaemon =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.macOS;

  Uri _buildUri(String serverId, HostConnection conn) {
    if (conn is DirectTcpHostConnection) {
      return _buildDirectTcpUri(conn.endpoint);
    }
    if (conn is RelayHostConnection) {
      final endpoint = conn.relayEndpoint;
      var protocol = 'ws';
      final lastColon = endpoint.lastIndexOf(':');
      if (lastColon > 0) {
        final portStr = endpoint.substring(lastColon + 1);
        final port = int.tryParse(portStr);
        if (port != null && (port == 443 || port == 8443)) {
          protocol = 'wss';
        }
      }
      final uri = Uri.parse('$protocol://$endpoint/ws');
      return uri.replace(
        queryParameters: {
          ...uri.queryParameters,
          'serverId': serverId,
          'role': 'client',
          'v': '2',
        },
      );
    }
    throw UnsupportedError('Unsupported connection type: ${conn.runtimeType}');
  }

  void _attemptAutoDiscover() {
    const candidates = ['localhost:6767', '127.0.0.1:6767'];
    for (final endpoint in candidates) {
      final serverId = endpoint.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '-');
      if (state.containsKey(serverId)) continue;
      final client = DaemonClient(
        serverId: serverId,
        uri: _buildDirectTcpUri(endpoint),
      );
      client.stateChanges.first
          .then((conn) {
            if (conn.isConnected) {
              final profile = HostProfile(
                serverId: serverId,
                label: endpoint,
                connections: [
                  DirectTcpHostConnection(
                    id: 'direct:$endpoint',
                    endpoint: endpoint,
                  ),
                ],
                preferredConnectionId: 'direct:$endpoint',
                createdAt: DateTime.now().toIso8601String(),
                updatedAt: DateTime.now().toIso8601String(),
              );
              unawaited(_registry.addProfile(profile).catchError((_) {}));
              state = {
                ...state,
                serverId: HostRuntime(
                  serverId: serverId,
                  connectionState: HostConnectionState.online,
                  client: client,
                  connectedAt: DateTime.now(),
                ),
              };
              _clients[serverId] = client;
            }
          })
          .catchError((_) {});
      client.connect();
    }
  }

  void _attemptConnect(String serverId) async {
    try {
      final profile = _registry.state.firstWhere(
        (p) => p.serverId == serverId,
        orElse: () => throw Exception('not found'),
      );
      _startProfileConnection(profile);
    } catch (e) {
      state = {
        ...state,
        serverId: HostRuntime(
          serverId: serverId,
          connectionState: HostConnectionState.error,
          error: '$e',
        ),
      };
    }
  }

  Uri _buildDirectTcpUri(String endpoint) {
    final raw = endpoint.contains('://') ? endpoint : 'ws://$endpoint';
    final parsed = Uri.parse(raw);
    final path = parsed.path.isEmpty || parsed.path == '/'
        ? '/ws'
        : parsed.path;
    return parsed.replace(
      scheme: parsed.scheme.isEmpty ? 'ws' : parsed.scheme,
      path: path,
    );
  }

  void connectProfile(HostProfile profile) {
    _startProfileConnection(profile);
  }

  Future<HostRuntime> connectProfileAndWait(
    HostProfile profile, {
    Duration timeout = const Duration(seconds: 15),
  }) async {
    final completer = Completer<HostRuntime>();
    _startProfileConnection(profile, firstResult: completer);

    return completer.future.timeout(
      timeout,
      onTimeout: () {
        disconnect(profile.serverId);
        throw TimeoutException(
          'Connection timed out after ${timeout.inSeconds} seconds',
          timeout,
        );
      },
    );
  }

  void _startProfileConnection(
    HostProfile profile, {
    Completer<HostRuntime>? firstResult,
  }) {
    state = {
      ...state,
      profile.serverId: HostRuntime(
        serverId: profile.serverId,
        connectionState: HostConnectionState.connecting,
      ),
    };

    _probeTimers[profile.serverId]?.cancel();
    _stateSubscriptions[profile.serverId]?.cancel();
    _clients[profile.serverId]?.disconnect();
    _attemptConnectionSequence(
      profile: profile,
      connections: _orderedConnections(profile),
      connectionIndex: 0,
      firstResult: firstResult,
    );
  }

  List<HostConnection> _orderedConnections(HostProfile profile) {
    final preferredId = profile.preferredConnectionId;
    if (preferredId == null || preferredId.isEmpty) {
      return List<HostConnection>.from(profile.connections);
    }

    final preferred = profile.connections.where((c) => c.id == preferredId);
    final fallback = profile.connections.where((c) => c.id != preferredId);
    return [...preferred, ...fallback];
  }

  void _attemptConnectionSequence({
    required HostProfile profile,
    required List<HostConnection> connections,
    required int connectionIndex,
    Completer<HostRuntime>? firstResult,
  }) {
    final conn = connections[connectionIndex];
    final uri = _buildUri(profile.serverId, conn);

    _stateSubscriptions[profile.serverId]?.cancel();
    _clients[profile.serverId]?.disconnect();

    final client = _clientFactory(
      serverId: profile.serverId,
      uri: uri,
      daemonPublicKeyB64: conn is RelayHostConnection
          ? conn.daemonPublicKeyB64
          : null,
    );
    _clients[profile.serverId] = client;

    _stateSubscriptions[profile.serverId] = client.stateChanges.listen((
      connState,
    ) {
      if (connState.isConnected) {
        final runtime = HostRuntime(
          serverId: profile.serverId,
          connectionState: HostConnectionState.online,
          client: client,
          connectedAt: DateTime.now(),
        );
        state = {...state, profile.serverId: runtime};
        _startProbe(profile.serverId, client);
        if (firstResult != null && !firstResult.isCompleted) {
          firstResult.complete(runtime);
        }
        return;
      }

      if (connState.error == null) {
        return;
      }

      final nextIndex = connectionIndex + 1;
      if (nextIndex < connections.length) {
        _attemptConnectionSequence(
          profile: profile,
          connections: connections,
          connectionIndex: nextIndex,
          firstResult: firstResult,
        );
        return;
      }

      final runtime = HostRuntime(
        serverId: profile.serverId,
        connectionState: HostConnectionState.error,
        error: connState.error,
      );
      state = {...state, profile.serverId: runtime};
      if (firstResult != null && !firstResult.isCompleted) {
        firstResult.completeError(Exception(connState.error));
      }
    });

    client.connect();
  }

  void _startProbe(String serverId, DaemonClient client) {
    _probeTimers[serverId]?.cancel();
    _probeTimers[serverId] = Timer.periodic(const Duration(seconds: 2), (
      _,
    ) async {
      final start = DateTime.now();
      if (!client.state.isConnected) {
        state = {
          ...state,
          serverId: HostRuntime(
            serverId: serverId,
            connectionState: HostConnectionState.offline,
          ),
        };
        _probeTimers[serverId]?.cancel();
        return;
      }
      final rtt = DateTime.now().difference(start).inMilliseconds;
      final current = state[serverId];
      if (current != null) {
        state = {...state, serverId: current.copyWith(rttMs: rtt)};
      }
    });
  }

  void disconnect(String serverId) {
    _probeTimers[serverId]?.cancel();
    _stateSubscriptions[serverId]?.cancel();
    _stateSubscriptions.remove(serverId);
    _clients[serverId]?.disconnect();
    _clients.remove(serverId);
    state = {
      ...state,
      serverId: HostRuntime(
        serverId: serverId,
        connectionState: HostConnectionState.offline,
      ),
    };
  }

  DaemonClient? clientFor(String serverId) => _clients[serverId];

  void refreshConnections() {
    for (final profile in _registry.state) {
      final client = _clients[profile.serverId];
      if (client != null) {
        client.checkHealthNow();
        continue;
      }
      _startProfileConnection(profile);
    }
  }

  void syncWithRegistry(List<HostProfile> profiles) {
    for (final profile in profiles) {
      if (!state.containsKey(profile.serverId)) {
        connectProfile(profile);
      }
    }
    for (final serverId in state.keys.toList()) {
      if (profiles.every((p) => p.serverId != serverId)) {
        disconnect(serverId);
      }
    }
  }

  @override
  void dispose() {
    for (final timer in _probeTimers.values) {
      timer.cancel();
    }
    for (final subscription in _stateSubscriptions.values) {
      subscription.cancel();
    }
    for (final client in _clients.values) {
      client.disconnect();
    }
    super.dispose();
  }
}

final hostRuntimeProvider =
    StateNotifierProvider<HostRuntimeNotifier, Map<String, HostRuntime>>((ref) {
      final registry = ref.watch(hostRegistryProvider.notifier);
      final notifier = HostRuntimeNotifier(registry);
      ref.listen<List<HostProfile>>(hostRegistryProvider, (previous, next) {
        notifier.syncWithRegistry(next);
      });
      return notifier;
    });
