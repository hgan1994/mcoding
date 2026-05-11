import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/host_connection.dart';

const _registryKey = 'paseo_daemon_registry';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  SharedPreferences? _prefs;
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<List<HostProfile>> loadHostRegistry() async {
    await init();
    final raw = _prefs!.getString(_registryKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => HostProfile.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> saveHostRegistry(List<HostProfile> profiles) async {
    await init();
    final raw = jsonEncode(profiles.map((p) => p.toJson()).toList());
    await _prefs!.setString(_registryKey, raw);
  }

  Future<void> clearHostRegistry() async {
    await init();
    await _prefs!.remove(_registryKey);
  }

  Future<String?> getString(String key) async {
    await init();
    return _prefs!.getString(key);
  }

  Future<void> setString(String key, String value) async {
    await init();
    await _prefs!.setString(key, value);
  }

  Future<void> removeString(String key) async {
    await init();
    await _prefs!.remove(key);
  }

  static const _lastProviderKey = 'last_selected_provider';
  static const _lastModelKeyPrefix = 'last_selected_model_';
  static const _lastThinkingKeyPrefix = 'last_selected_thinking_';
  static const _lastModeKeyPrefix = 'last_selected_mode_';

  Future<String?> getLastSelectedProvider() async {
    await init();
    return _prefs!.getString(_lastProviderKey);
  }

  Future<void> setLastSelectedProvider(String provider) async {
    await init();
    await _prefs!.setString(_lastProviderKey, provider);
  }

  Future<String?> getLastSelectedModel(String provider) async {
    await init();
    return _prefs!.getString('$_lastModelKeyPrefix$provider');
  }

  Future<void> setLastSelectedModel(String provider, String model) async {
    await init();
    await _prefs!.setString('$_lastModelKeyPrefix$provider', model);
  }

  Future<String?> getLastSelectedThinking(String provider) async {
    await init();
    return _prefs!.getString('$_lastThinkingKeyPrefix$provider');
  }

  Future<void> setLastSelectedThinking(String provider, String thinking) async {
    await init();
    await _prefs!.setString('$_lastThinkingKeyPrefix$provider', thinking);
  }

  Future<String?> getLastSelectedMode(String provider) async {
    await init();
    return _prefs!.getString('$_lastModeKeyPrefix$provider');
  }

  Future<void> setLastSelectedMode(String provider, String mode) async {
    await init();
    await _prefs!.setString('$_lastModeKeyPrefix$provider', mode);
  }

  static const _completionSoundKey = 'completion_sound_enabled';
  static const _qwenAsrApiKey = 'qwen_asr_api_key';

  Future<bool> getCompletionSoundEnabled() async {
    await init();
    return _prefs!.getBool(_completionSoundKey) ?? true;
  }

  Future<void> setCompletionSoundEnabled(bool enabled) async {
    await init();
    await _prefs!.setBool(_completionSoundKey, enabled);
  }

  Future<String?> getQwenAsrApiKey() async {
    await init();
    try {
      final secureValue = (await _secureStorage.read(
        key: _qwenAsrApiKey,
      ))?.trim();
      if (secureValue != null && secureValue.isNotEmpty) {
        return secureValue;
      }
    } catch (_) {}

    final legacyValue = _prefs!.getString(_qwenAsrApiKey)?.trim();
    if (legacyValue == null || legacyValue.isEmpty) {
      return null;
    }

    try {
      await _secureStorage.write(key: _qwenAsrApiKey, value: legacyValue);
      await _prefs!.remove(_qwenAsrApiKey);
    } catch (_) {
      // Keep the legacy value as a temporary fallback if secure storage is unavailable.
    }
    return legacyValue;
  }

  Future<void> setQwenAsrApiKey(String value) async {
    await init();
    final normalized = value.trim();
    if (normalized.isEmpty) {
      await clearQwenAsrApiKey();
      return;
    }
    await _secureStorage.write(key: _qwenAsrApiKey, value: normalized);
    await _prefs!.remove(_qwenAsrApiKey);
  }

  Future<void> clearQwenAsrApiKey() async {
    await init();
    try {
      await _secureStorage.delete(key: _qwenAsrApiKey);
    } catch (_) {}
    await _prefs!.remove(_qwenAsrApiKey);
  }

  Future<void> clearLegacyVoiceSecrets() async {
    await clearQwenAsrApiKey();
  }
}
