import 'package:audioplayers/audioplayers.dart';
import 'storage_service.dart';

class CompletionSoundService {
  static final CompletionSoundService _instance = CompletionSoundService._internal();
  factory CompletionSoundService() => _instance;

  CompletionSoundService._internal();

  final AudioPlayer _player = AudioPlayer();

  bool _isEnabled = true;
  bool _loaded = false;

  Future<void> loadEnabled() async {
    if (_loaded) return;
    _isEnabled = await StorageService().getCompletionSoundEnabled();
    _loaded = true;
  }

  Future<void> setEnabled(bool value) async {
    _isEnabled = value;
    await StorageService().setCompletionSoundEnabled(value);
  }

  bool get isEnabled => _isEnabled;

  Future<void> playCompletionSound() async {
    if (!_isEnabled) return;
    try {
      await _player.play(AssetSource('sounds/completion.wav'));
    } catch (_) {}
  }

  Future<void> dispose() async {
    await _player.dispose();
  }
}
