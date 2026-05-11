import 'dart:async';
import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:pinenacl/api.dart';
import 'package:pinenacl/x25519.dart'
    show Box, EncryptedMessage, PrivateKey, PublicKey;
import 'package:web_socket_channel/web_socket_channel.dart';
import '../utils/terminal_stream_protocol.dart';
import '../models/message.dart';
import '../models/terminal_state.dart';

class DaemonConnectionState {
  final bool isConnected;
  final bool isConnecting;
  final String? error;
  final DateTime? connectedAt;

  const DaemonConnectionState({
    this.isConnected = false,
    this.isConnecting = false,
    this.error,
    this.connectedAt,
  });

  DaemonConnectionState copyWith({
    bool? isConnected,
    bool? isConnecting,
    String? error,
    DateTime? connectedAt,
  }) => DaemonConnectionState(
    isConnected: isConnected ?? this.isConnected,
    isConnecting: isConnecting ?? this.isConnecting,
    error: error,
    connectedAt: connectedAt ?? this.connectedAt,
  );
}

sealed class TerminalStreamEvent {
  final String terminalId;
  const TerminalStreamEvent({required this.terminalId});
}

class TerminalOutputEvent extends TerminalStreamEvent {
  final Uint8List data;
  const TerminalOutputEvent({required super.terminalId, required this.data});
}

class TerminalSnapshotEvent extends TerminalStreamEvent {
  final TerminalState state;
  const TerminalSnapshotEvent({required super.terminalId, required this.state});
}

class DaemonClient {
  static const _healthCheckInterval = Duration(seconds: 15);
  static const _idleHealthCheckThreshold = Duration(seconds: 20);
  static const _healthCheckTimeout = Duration(seconds: 8);

  final String serverId;
  final Uri uri;
  final String? daemonPublicKeyB64;
  final Logger _logger;
  WebSocketChannel? _channel;
  Timer? _reconnectTimer;
  Timer? _e2eeHelloRetryTimer;
  Timer? _healthCheckTimer;
  Timer? _healthCheckTimeoutTimer;
  Box? _relayBox;
  PrivateKey? _relayPrivateKey;
  String? _hostname;
  String? _platform;
  bool _relayHandshakeOpen = false;
  bool _shouldReconnect = false;
  DateTime? _lastInboundActivityAt;
  String? _pendingHealthCheckRequestId;
  final Set<String> _healthCheckRequestIds = <String>{};
  final _controller = StreamController<Map<String, dynamic>>.broadcast();
  final _terminalStreamController =
      StreamController<TerminalStreamEvent>.broadcast();
  final _stateController = StreamController<DaemonConnectionState>.broadcast();
  final _hostnameController = StreamController<String>.broadcast();

  DaemonConnectionState _state = const DaemonConnectionState();
  int _reconnectDelayMs = 1000;
  static const _maxReconnectDelayMs = 30000;

  final _terminalSlots = <String, int>{};
  final _slotTerminals = <int, String>{};
  final _terminalDirectorySubscriptions = <String>{};

  DaemonClient({
    required this.serverId,
    required this.uri,
    this.daemonPublicKeyB64,
  }) : _logger = Logger();

  Stream<Map<String, dynamic>> get messages => _controller.stream;
  Stream<TerminalStreamEvent> get terminalStreamEvents =>
      _terminalStreamController.stream;
  Stream<DaemonConnectionState> get stateChanges => _stateController.stream;
  DaemonConnectionState get state => _state;

  Future<void> connect() async {
    if (_state.isConnecting || _state.isConnected) return;
    _shouldReconnect = true;
    _updateState(_state.copyWith(isConnecting: true, error: null));

    try {
      _prepareRelayE2ee();
      _channel = WebSocketChannel.connect(uri);
      await _channel!.ready;
      _reconnectDelayMs = 1000;

      _channel!.stream.listen(
        _handleIncomingData,
        onError: (err) {
          _logger.e('WebSocket error', error: err);
          _handleDisconnect('WebSocket error: $err');
        },
        onDone: () {
          _logger.i('WebSocket closed');
          _handleDisconnect('Connection closed');
        },
      );

      if (_relayBox != null) {
        _sendRelayE2eeHello();
        _startRelayE2eeHelloRetry();
      } else {
        _markConnected();
      }
    } catch (e) {
      _logger.e('Connection failed', error: e);
      _handleDisconnect('Connection failed: $e');
    }
  }

  void _prepareRelayE2ee() {
    _relayHandshakeOpen = false;
    _relayBox = null;
    _relayPrivateKey = null;

    final publicKeyB64 = daemonPublicKeyB64;
    if (publicKeyB64 == null || publicKeyB64.trim().isEmpty) return;

    final privateKey = PrivateKey.generate();
    final daemonPublicKey = PublicKey(base64Decode(publicKeyB64.trim()));
    _relayPrivateKey = privateKey;
    _relayBox = Box(myPrivateKey: privateKey, theirPublicKey: daemonPublicKey);
  }

  void _sendRelayE2eeHello() {
    final privateKey = _relayPrivateKey;
    if (_channel == null || privateKey == null || _relayHandshakeOpen) return;
    final msg = {
      'type': 'e2ee_hello',
      'key': base64Encode(privateKey.publicKey.asTypedList),
    };
    _channel!.sink.add(jsonEncode(msg));
  }

  void _startRelayE2eeHelloRetry() {
    _e2eeHelloRetryTimer?.cancel();
    _e2eeHelloRetryTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _sendRelayE2eeHello();
    });
  }

  void _stopRelayE2eeHelloRetry() {
    _e2eeHelloRetryTimer?.cancel();
    _e2eeHelloRetryTimer = null;
  }

  void _markConnected() {
    _relayHandshakeOpen = true;
    _stopRelayE2eeHelloRetry();
    _lastInboundActivityAt = DateTime.now();
    _startHealthMonitoring();
    _updateState(
      DaemonConnectionState(isConnected: true, connectedAt: DateTime.now()),
    );
    _sendHello();
    _resubscribeTerminalDirectorySubscriptions();
  }

  void _handleIncomingData(dynamic data) {
    try {
      final payload = _decryptRelayPayloadIfNeeded(data);
      if (payload == null) return;
      _recordInboundActivity();

      final bytes = asUint8Array(payload);
      if (bytes != null && isTerminalStreamFrame(bytes)) {
        final frame = decodeTerminalStreamFrame(bytes);
        if (frame != null) {
          _handleTerminalStreamFrame(frame);
        }
      } else if (payload is String) {
        final msg = jsonDecode(payload) as Map<String, dynamic>;
        final sessionMessage = _unwrapRelaySessionMessage(msg);
        if (_isHealthCheckResponse(sessionMessage)) {
          return;
        }
        _controller.add(sessionMessage);
      }
    } catch (e) {
      _logger.w('Failed to parse message: $e');
    }
  }

  Map<String, dynamic> _unwrapRelaySessionMessage(Map<String, dynamic> msg) {
    final resolved = _relayBox == null || msg['type'] != 'session'
        ? msg
        : (msg['message'] is Map
              ? Map<String, dynamic>.from(msg['message'] as Map)
              : msg);

    // Capture daemon metadata from server_info messages.
    if (resolved['status'] == 'server_info' && _hostname == null) {
      final h = resolved['hostname'];
      if (h is String && h.isNotEmpty) {
        _hostname = h;
        _hostnameController.add(h);
      }
    }
    if (resolved['status'] == 'server_info' && _platform == null) {
      final p = resolved['platform'];
      if (p is String && p.isNotEmpty) _platform = p;
    }

    return resolved;
  }

  String? get hostname => _hostname;
  String? get platform => _platform;
  Stream<String> get hostnameChanges => _hostnameController.stream;

  dynamic _decryptRelayPayloadIfNeeded(dynamic data) {
    final box = _relayBox;
    if (box == null) return data;

    final text = data is String
        ? data
        : data is List<int>
        ? utf8.decode(data)
        : data.toString();

    if (!_relayHandshakeOpen) {
      final msg = jsonDecode(text) as Map<String, dynamic>;
      if (msg['type'] == 'e2ee_ready') {
        _markConnected();
      }
      return null;
    }

    final encrypted = EncryptedMessage.fromList(base64Decode(text.trim()));
    final decrypted = box.decrypt(encrypted);
    try {
      return utf8.decode(decrypted, allowMalformed: false);
    } on FormatException {
      return decrypted;
    }
  }

  void _sendHello() {
    if (_relayBox != null) {
      _sendPayload(
        jsonEncode({
          'type': 'hello',
          'clientId': serverId,
          'clientType': 'mobile',
          'protocolVersion': 1,
        }),
      );
      return;
    }
    send(
      WSHelloMessage(
        id: '${DateTime.now().millisecondsSinceEpoch}',
        clientId: serverId,
        timestamp: DateTime.now().millisecondsSinceEpoch,
      ),
    );
  }

  void _startHealthMonitoring() {
    _healthCheckTimer?.cancel();
    _healthCheckTimer = Timer.periodic(_healthCheckInterval, (_) {
      _checkConnectionHealth();
    });
  }

  void _stopHealthMonitoring() {
    _healthCheckTimer?.cancel();
    _healthCheckTimer = null;
    _healthCheckTimeoutTimer?.cancel();
    _healthCheckTimeoutTimer = null;
    _pendingHealthCheckRequestId = null;
    _healthCheckRequestIds.clear();
    _lastInboundActivityAt = null;
  }

  void _recordInboundActivity() {
    _lastInboundActivityAt = DateTime.now();
    _healthCheckTimeoutTimer?.cancel();
    _healthCheckTimeoutTimer = null;
    _pendingHealthCheckRequestId = null;
  }

  bool _isHealthCheckResponse(Map<String, dynamic> msg) {
    if (msg['type'] != 'fetch_workspaces_response') return false;
    final payload = msg['payload'];
    if (payload is! Map) return false;
    final requestId = payload['requestId'];
    if (requestId is! String) return false;
    return _healthCheckRequestIds.remove(requestId);
  }

  void _checkConnectionHealth({bool force = false}) {
    if (_channel == null || !_state.isConnected) return;
    if (_pendingHealthCheckRequestId != null) return;

    final now = DateTime.now();
    final lastInboundActivityAt = _lastInboundActivityAt;
    if (!force &&
        lastInboundActivityAt != null &&
        now.difference(lastInboundActivityAt) < _idleHealthCheckThreshold) {
      return;
    }

    final requestId = 'health-${now.microsecondsSinceEpoch}';
    _pendingHealthCheckRequestId = requestId;
    _healthCheckRequestIds.add(requestId);
    send(FetchWorkspacesRequestMessage(requestId: requestId));

    _healthCheckTimeoutTimer?.cancel();
    _healthCheckTimeoutTimer = Timer(_healthCheckTimeout, () {
      if (_pendingHealthCheckRequestId != requestId) return;
      _pendingHealthCheckRequestId = null;
      _healthCheckRequestIds.remove(requestId);
      _logger.w('Health check timed out for $serverId');
      _handleDisconnect('Connection timed out');
    });
  }

  void checkHealthNow() {
    if (_state.isConnected) {
      _checkConnectionHealth(force: true);
      return;
    }
    if (_shouldReconnect && !_state.isConnecting) {
      connect();
    }
  }

  void _resubscribeTerminalDirectorySubscriptions() {
    if (_terminalDirectorySubscriptions.isEmpty) return;
    if (_channel == null || !_state.isConnected) return;
    for (final cwd in _terminalDirectorySubscriptions) {
      send(SubscribeTerminalsRequestMessage(cwd: cwd));
    }
  }

  void sendBinaryFrame(Uint8List bytes) {
    if (_channel == null || !_state.isConnected) {
      _logger.w('Cannot send binary, not connected');
      return;
    }
    try {
      _sendPayload(bytes);
    } catch (e) {
      _logger.e('Send binary error', error: e);
    }
  }

  void send(DaemonMessage message) {
    if (_channel == null || !_state.isConnected) {
      _logger.w('Cannot send, not connected');
      return;
    }
    try {
      final payload = _relayBox == null
          ? message.toJson()
          : {'type': 'session', 'message': message.toJson()};
      _sendPayload(jsonEncode(payload));
    } catch (e) {
      _logger.e('Send error', error: e);
    }
  }

  void _sendPayload(dynamic payload) {
    final box = _relayBox;
    if (box == null) {
      _channel!.sink.add(payload);
      return;
    }

    final bytes = payload is String
        ? Uint8List.fromList(utf8.encode(payload))
        : asUint8Array(payload);
    if (bytes == null) {
      throw ArgumentError(
        'Unsupported relay payload type: ${payload.runtimeType}',
      );
    }
    final encrypted = box.encrypt(bytes);
    _channel!.sink.add(base64Encode(encrypted.asTypedList));
  }

  void _handleDisconnect(String reason) {
    _stopRelayE2eeHelloRetry();
    _stopHealthMonitoring();
    _channel?.sink.close();
    _channel = null;
    _relayHandshakeOpen = false;
    _terminalSlots.clear();
    _slotTerminals.clear();
    _updateState(DaemonConnectionState(error: reason));
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (!_shouldReconnect) return;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(Duration(milliseconds: _reconnectDelayMs), () {
      _reconnectDelayMs = (_reconnectDelayMs * 2).clamp(
        1000,
        _maxReconnectDelayMs,
      );
      connect();
    });
  }

  void _updateState(DaemonConnectionState newState) {
    _state = newState;
    _stateController.add(newState);
  }

  void disconnect() {
    _shouldReconnect = false;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _stopRelayE2eeHelloRetry();
    _stopHealthMonitoring();
    _channel?.sink.close();
    _channel = null;
    _relayHandshakeOpen = false;
    _terminalSlots.clear();
    _slotTerminals.clear();
    _terminalDirectorySubscriptions.clear();
    _updateState(const DaemonConnectionState());
  }

  void dispose() {
    disconnect();
    _controller.close();
    _terminalStreamController.close();
    _stateController.close();
    _hostnameController.close();
  }

  // ============================================================================
  // Terminal Directory
  // ============================================================================

  void subscribeTerminals(String cwd) {
    _terminalDirectorySubscriptions.add(cwd);
    if (_channel == null || !_state.isConnected) return;
    send(SubscribeTerminalsRequestMessage(cwd: cwd));
  }

  void unsubscribeTerminals(String cwd) {
    _terminalDirectorySubscriptions.remove(cwd);
    if (_channel == null || !_state.isConnected) return;
    send(UnsubscribeTerminalsRequestMessage(cwd: cwd));
  }

  // ============================================================================
  // Terminal Stream
  // ============================================================================

  Future<Map<String, dynamic>> subscribeTerminal(String terminalId) async {
    final requestId = 'sub-term-${DateTime.now().millisecondsSinceEpoch}';
    final completer = Completer<Map<String, dynamic>>();
    StreamSubscription? sub;

    sub = messages.listen((msg) {
      if (msg['type'] == 'subscribe_terminal_response' &&
          msg['requestId'] == requestId) {
        sub?.cancel();
        final payload = msg['payload'] as Map<String, dynamic>?;
        if (payload != null && payload['error'] == null) {
          final slot = payload['slot'] as int?;
          if (slot != null) {
            _setTerminalSlot(terminalId, slot);
          }
        }
        completer.complete(payload ?? {});
      }
    });

    send(
      SubscribeTerminalRequestMessage(
        terminalId: terminalId,
        requestId: requestId,
      ),
    );

    return completer.future.timeout(
      const Duration(seconds: 10),
      onTimeout: () {
        sub?.cancel();
        return {'error': 'Timeout waiting for subscribe terminal response'};
      },
    );
  }

  void unsubscribeTerminal(String terminalId) {
    _removeTerminalSlot(terminalId);
    send(UnsubscribeTerminalRequestMessage(terminalId: terminalId));
  }

  void sendTerminalInput(String terminalId, Map<String, dynamic> message) {
    final slot = _terminalSlots[terminalId];
    if (slot != null) {
      final type = message['type'] as String?;
      if (type == 'input') {
        final data = message['data'] as String? ?? '';
        sendBinaryFrame(
          encodeTerminalStreamFrame(
            opcode: TerminalStreamOpcode.input.value,
            slot: slot,
            payload: asUint8Array(data),
          ),
        );
        return;
      }
      if (type == 'resize') {
        final rows = message['rows'] as int? ?? 24;
        final cols = message['cols'] as int? ?? 80;
        sendBinaryFrame(
          encodeTerminalStreamFrame(
            opcode: TerminalStreamOpcode.resize.value,
            slot: slot,
            payload: encodeTerminalResizePayload(rows: rows, cols: cols),
          ),
        );
        return;
      }
    }
    send(TerminalInputMessage(terminalId: terminalId, message: message));
  }

  // ============================================================================
  // Terminal Slots
  // ============================================================================

  void _setTerminalSlot(String terminalId, int slot) {
    final existingTerminalId = _slotTerminals[slot];
    if (existingTerminalId != null && existingTerminalId != terminalId) {
      _terminalSlots.remove(existingTerminalId);
    }
    final existingSlot = _terminalSlots[terminalId];
    if (existingSlot != null && existingSlot != slot) {
      _slotTerminals.remove(existingSlot);
    }
    _terminalSlots[terminalId] = slot;
    _slotTerminals[slot] = terminalId;
  }

  void _removeTerminalSlot(String terminalId) {
    final slot = _terminalSlots[terminalId];
    if (slot == null) return;
    _terminalSlots.remove(terminalId);
    if (_slotTerminals[slot] == terminalId) {
      _slotTerminals.remove(slot);
    }
  }

  // ============================================================================
  // Binary Frame Handling
  // ============================================================================

  void _handleTerminalStreamFrame(TerminalStreamFrame frame) {
    final terminalId = _slotTerminals[frame.slot];
    if (terminalId == null) return;

    if (frame.opcode == TerminalStreamOpcode.output.value) {
      _terminalStreamController.add(
        TerminalOutputEvent(terminalId: terminalId, data: frame.payload),
      );
      return;
    }

    if (frame.opcode == TerminalStreamOpcode.snapshot.value) {
      final state = decodeTerminalSnapshotPayload(frame.payload);
      if (state != null) {
        try {
          final terminalState = TerminalState.fromJson(state);
          _terminalStreamController.add(
            TerminalSnapshotEvent(terminalId: terminalId, state: terminalState),
          );
        } catch (_) {
          // ignore malformed snapshot
        }
      }
    }
  }
}
