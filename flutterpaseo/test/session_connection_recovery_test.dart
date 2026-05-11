import 'dart:async';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/message.dart';
import 'package:paseo/src/providers/session_provider.dart';
import 'package:paseo/src/services/websocket_service.dart';

class _FakeDaemonClient extends DaemonClient {
  _FakeDaemonClient({required super.serverId})
    : super(uri: Uri.parse('ws://localhost/ws'));

  final _messagesController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _terminalController = StreamController<TerminalStreamEvent>.broadcast();
  final _stateController = StreamController<DaemonConnectionState>.broadcast();
  final List<DaemonMessage> sentMessages = <DaemonMessage>[];
  DaemonConnectionState _currentState = const DaemonConnectionState();

  @override
  Stream<Map<String, dynamic>> get messages => _messagesController.stream;

  @override
  Stream<TerminalStreamEvent> get terminalStreamEvents =>
      _terminalController.stream;

  @override
  Stream<DaemonConnectionState> get stateChanges => _stateController.stream;

  @override
  DaemonConnectionState get state => _currentState;

  void emitState(DaemonConnectionState nextState) {
    _currentState = nextState;
    _stateController.add(nextState);
  }

  @override
  void send(DaemonMessage message) {
    sentMessages.add(message);
  }

  @override
  void sendBinaryFrame(Uint8List bytes) {}

  @override
  void disconnect() {}

  @override
  void dispose() {
    _messagesController.close();
    _terminalController.close();
    _stateController.close();
  }
}

void main() {
  test('pending sends fail immediately when the daemon disconnects', () async {
    final client = _FakeDaemonClient(serverId: 'server-1');
    final notifier = SessionNotifier('server-1');
    addTearDown(() {
      notifier.dispose();
      client.dispose();
    });

    notifier.attachClient(client);
    client.emitState(const DaemonConnectionState(isConnected: true));
    await Future<void>.delayed(Duration.zero);

    final pendingSend = notifier.sendMessage('agent-1', 'hello');
    await Future<void>.delayed(Duration.zero);

    client.emitState(const DaemonConnectionState(error: 'Connection closed'));

    await expectLater(pendingSend, throwsA(isA<StateError>()));
  });

  test(
    'reconnect refreshes agents and workspaces after coming back online',
    () async {
      final client = _FakeDaemonClient(serverId: 'server-1');
      final notifier = SessionNotifier('server-1');
      addTearDown(() {
        notifier.dispose();
        client.dispose();
      });

      notifier.attachClient(client);
      client.sentMessages.clear();

      client.emitState(const DaemonConnectionState(isConnected: true));
      await Future<void>.delayed(Duration.zero);
      expect(
        client.sentMessages.whereType<FetchAgentsRequestMessage>(),
        hasLength(1),
      );
      expect(
        client.sentMessages.whereType<FetchWorkspacesRequestMessage>(),
        hasLength(1),
      );

      client.sentMessages.clear();
      client.emitState(const DaemonConnectionState(error: 'Connection closed'));
      client.emitState(const DaemonConnectionState(isConnected: true));
      await Future<void>.delayed(Duration.zero);

      expect(
        client.sentMessages.whereType<FetchAgentsRequestMessage>(),
        hasLength(1),
      );
      expect(
        client.sentMessages.whereType<FetchWorkspacesRequestMessage>(),
        hasLength(1),
      );
    },
  );
}
