import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

class QwenAsrResult {
  final String text;
  final String stash;
  final bool isFinal;

  const QwenAsrResult({
    this.text = '',
    this.stash = '',
    this.isFinal = false,
  });

  String get fullText => text + stash;
}

class QwenAsrService {
  static const String _baseUrl = 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime';
  static const String _model = 'qwen3-asr-flash-realtime-2026-02-10';

  QwenAsrService({required String apiKey}) : _apiKey = apiKey.trim();

  final String _apiKey;

  WebSocket? _ws;
  final StreamController<QwenAsrResult> _resultController = StreamController.broadcast();
  bool _connected = false;
  int _eventId = 0;
  Completer<void>? _sessionReady;

  Stream<QwenAsrResult> get results => _resultController.stream;
  bool get isConnected => _connected;

  Future<void> connect() async {
    if (_apiKey.isEmpty) {
      throw StateError('Missing ASR API key');
    }
    _sessionReady = Completer<void>();
    final url = '$_baseUrl?model=$_model';
    _ws = await WebSocket.connect(url, headers: {
      'Authorization': 'Bearer $_apiKey',
      'OpenAI-Beta': 'realtime=v1',
    });
    _connected = true;

    _ws!.listen(
      _handleMessage,
      onDone: _handleDone,
      onError: _handleError,
      cancelOnError: false,
    );

    _sendSessionUpdate();
  }

  void _sendSessionUpdate() {
    final event = {
      'event_id': 'event_${_eventId++}',
      'type': 'session.update',
      'session': {
        'modalities': ['text'],
        'input_audio_format': 'pcm',
        'sample_rate': 16000,
        'input_audio_transcription': {
          'language': 'zh',
        },
        'turn_detection': null,
      },
    };
    _ws!.add(jsonEncode(event));
  }

  void sendAudio(Uint8List pcmData) {
    if (!_connected || _ws == null) return;
    final encoded = base64Encode(pcmData);
    final event = {
      'event_id': 'event_${_eventId++}',
      'type': 'input_audio_buffer.append',
      'audio': encoded,
    };
    _ws!.add(jsonEncode(event));
  }

  void commitAudio() {
    if (!_connected || _ws == null) return;
    final event = {
      'event_id': 'event_${_eventId++}',
      'type': 'input_audio_buffer.commit',
    };
    _ws!.add(jsonEncode(event));
  }

  Future<void> finishSession() async {
    if (!_connected || _ws == null) return;
    final event = {
      'event_id': 'event_${_eventId++}',
      'type': 'session.finish',
    };
    _ws!.add(jsonEncode(event));
  }

  void _handleMessage(dynamic message) {
    if (message is! String) return;
    try {
      final data = jsonDecode(message) as Map<String, dynamic>;
      final type = data['type'] as String?;

      switch (type) {
        case 'session.created':
          if (_sessionReady != null && !_sessionReady!.isCompleted) {
            _sessionReady!.complete();
          }
          break;
        case 'conversation.item.input_audio_transcription.text':
          final text = (data['text'] as String?) ?? '';
          final stash = (data['stash'] as String?) ?? '';
          if (!_resultController.isClosed) {
            _resultController.add(QwenAsrResult(text: text, stash: stash, isFinal: false));
          }
          break;
        case 'conversation.item.input_audio_transcription.completed':
          final transcript = (data['transcript'] as String?) ?? '';
          if (!_resultController.isClosed) {
            _resultController.add(QwenAsrResult(text: transcript, isFinal: true));
          }
          break;
        case 'session.finished':
          final transcript = (data['transcript'] as String?) ?? '';
          if (!_resultController.isClosed) {
            _resultController.add(QwenAsrResult(text: transcript, isFinal: true));
          }
          break;
      }
    } catch (_) {}
  }

  void _handleDone() {
    _connected = false;
  }

  void _handleError(dynamic error) {
    _connected = false;
  }

  Future<void> disconnect() async {
    _connected = false;
    await _ws?.close(1000, 'client disconnect');
    _ws = null;
  }

  void dispose() {
    disconnect();
    _resultController.close();
  }
}
