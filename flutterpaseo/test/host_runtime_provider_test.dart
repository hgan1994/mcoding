import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/host_connection.dart';
import 'package:paseo/src/providers/host_registry_provider.dart';
import 'package:paseo/src/providers/host_runtime_provider.dart';
import 'package:paseo/src/services/websocket_service.dart';

class _FakeDaemonClient extends DaemonClient {
  _FakeDaemonClient({
    required super.serverId,
    required super.uri,
    super.daemonPublicKeyB64,
    required this.onConnect,
  });

  final void Function(_FakeDaemonClient client) onConnect;
  final _stateController = StreamController<DaemonConnectionState>.broadcast();
  DaemonConnectionState _currentState = const DaemonConnectionState();
  bool disconnected = false;

  @override
  Stream<DaemonConnectionState> get stateChanges => _stateController.stream;

  @override
  DaemonConnectionState get state => _currentState;

  void emitState(DaemonConnectionState nextState) {
    _currentState = nextState;
    _stateController.add(nextState);
  }

  @override
  Future<void> connect() async {
    onConnect(this);
  }

  @override
  void disconnect() {
    disconnected = true;
  }

  @override
  void dispose() {
    _stateController.close();
    super.dispose();
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'falls back to relay when preferred direct TCP connection fails',
    () async {
      final registry = HostRegistryNotifier();
      final attemptedUris = <Uri>[];
      final createdClients = <_FakeDaemonClient>[];

      final notifier = HostRuntimeNotifier(
        registry,
        clientFactory:
            ({
              required String serverId,
              required Uri uri,
              String? daemonPublicKeyB64,
            }) {
              final client = _FakeDaemonClient(
                serverId: serverId,
                uri: uri,
                daemonPublicKeyB64: daemonPublicKeyB64,
                onConnect: (client) {
                  attemptedUris.add(uri);
                  scheduleMicrotask(() {
                    if (uri.host == '192.168.31.47' && uri.port == 65399) {
                      client.emitState(
                        const DaemonConnectionState(
                          error: 'Connection failed: direct tcp refused',
                        ),
                      );
                      return;
                    }
                    client.emitState(
                      const DaemonConnectionState(isConnected: true),
                    );
                  });
                },
              );
              createdClients.add(client);
              return client;
            },
      );

      addTearDown(() {
        notifier.dispose();
        for (final client in createdClients) {
          client.dispose();
        }
        registry.dispose();
      });

      final profile = HostProfile(
        serverId: 'srv-1',
        label: 'mac-mini',
        connections: const [
          DirectTcpHostConnection(
            id: 'direct:192.168.31.47:65399',
            endpoint: '192.168.31.47:65399',
          ),
          RelayHostConnection(
            id: 'relay:192.168.31.47:8787',
            relayEndpoint: '192.168.31.47:8787',
            daemonPublicKeyB64: 'a2V5LTE=',
          ),
        ],
        preferredConnectionId: 'direct:192.168.31.47:65399',
        createdAt: DateTime.now().toIso8601String(),
        updatedAt: DateTime.now().toIso8601String(),
      );

      final runtime = await notifier.connectProfileAndWait(profile);

      expect(attemptedUris, hasLength(2));
      expect(attemptedUris.first.toString(), 'ws://192.168.31.47:65399/ws');
      expect(
        attemptedUris.last.toString(),
        'ws://192.168.31.47:8787/ws?serverId=srv-1&role=client&v=2',
      );
      expect(runtime.connectionState, HostConnectionState.online);
      expect(notifier.clientFor('srv-1'), same(createdClients.last));
      expect(createdClients.first.disconnected, isTrue);
    },
  );
}
