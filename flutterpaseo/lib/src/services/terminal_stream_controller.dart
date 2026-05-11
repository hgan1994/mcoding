import 'dart:async';
import 'dart:convert';
import '../models/terminal_state.dart';
import '../services/websocket_service.dart';

class TerminalStreamControllerSize {
  final int rows;
  final int cols;
  TerminalStreamControllerSize({required this.rows, required this.cols});
}

class TerminalStreamControllerStatus {
  final String? terminalId;
  final bool isAttaching;
  final String? error;
  TerminalStreamControllerStatus({this.terminalId, this.isAttaching = false, this.error});
}

class TerminalStreamController {
  final DaemonClient client;
  final TerminalStreamControllerSize? Function() getPreferredSize;
  final void Function({required String terminalId, required String text}) onOutput;
  final void Function({required String terminalId, required TerminalState state}) onSnapshot;
  final void Function(TerminalStreamControllerStatus)? onStatusChange;

  final _decoder = Utf8Decoder();
  StreamSubscription? _streamSub;
  String? _terminalId;
  bool _disposed = false;

  TerminalStreamController({
    required this.client,
    required this.getPreferredSize,
    required this.onOutput,
    required this.onSnapshot,
    this.onStatusChange,
  }) {
    _streamSub = client.terminalStreamEvents.listen((event) {
      if (_disposed) return;
      if (event.terminalId != _terminalId) return;
      if (event is TerminalSnapshotEvent) {
        _decoder.convert(<int>[]); // flush decoder
        onSnapshot(terminalId: event.terminalId, state: event.state);
        return;
      }
      if (event is TerminalOutputEvent) {
        final text = _decoder.convert(event.data);
        if (text.isNotEmpty) {
          onOutput(terminalId: event.terminalId, text: text);
        }
      }
    });
  }

  void setTerminal({String? terminalId}) {
    if (_disposed || terminalId == _terminalId) return;
    final nextTerminalId = terminalId;
    final previousTerminalId = _terminalId;
    _terminalId = nextTerminalId;
    _decoder.convert(<int>[]); // flush decoder
    if (previousTerminalId != null) {
      client.unsubscribeTerminal(previousTerminalId);
    }
    if (nextTerminalId == null) {
      onStatusChange?.call(TerminalStreamControllerStatus(terminalId: null, isAttaching: false, error: null));
      return;
    }
    onStatusChange?.call(TerminalStreamControllerStatus(terminalId: nextTerminalId, isAttaching: true, error: null));
    client.subscribeTerminal(nextTerminalId).then((payload) {
      if (_disposed || _terminalId != nextTerminalId) return;
      final error = payload['error'];
      if (error != null) {
        _terminalId = null;
        onStatusChange?.call(TerminalStreamControllerStatus(
          terminalId: nextTerminalId,
          isAttaching: false,
          error: error is String ? error : 'Unable to subscribe to terminal',
        ));
        return;
      }
      final preferredSize = getPreferredSize();
      if (preferredSize != null) {
        client.sendTerminalInput(nextTerminalId, {
          'type': 'resize',
          'rows': preferredSize.rows,
          'cols': preferredSize.cols,
        });
      }
      onStatusChange?.call(TerminalStreamControllerStatus(
        terminalId: nextTerminalId,
        isAttaching: false,
        error: null,
      ));
    }).catchError((Object error) {
      if (_disposed || _terminalId != nextTerminalId) return;
      _terminalId = null;
      onStatusChange?.call(TerminalStreamControllerStatus(
        terminalId: nextTerminalId,
        isAttaching: false,
        error: error is Error ? error.toString() : 'Unable to subscribe to terminal',
      ));
    });
  }

  void handleTerminalExit({required String terminalId}) {
    if (_disposed || terminalId != _terminalId) return;
    _decoder.convert(<int>[]); // flush decoder
    _terminalId = null;
    onStatusChange?.call(TerminalStreamControllerStatus(
      terminalId: terminalId,
      isAttaching: false,
      error: 'Terminal exited',
    ));
  }

  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _decoder.convert(<int>[]); // flush decoder
    final terminalId = _terminalId;
    _terminalId = null;
    if (terminalId != null) {
      client.unsubscribeTerminal(terminalId);
    }
    _streamSub?.cancel();
    onStatusChange?.call(TerminalStreamControllerStatus(terminalId: null, isAttaching: false, error: null));
  }
}
