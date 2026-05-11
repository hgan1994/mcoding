import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import 'auth_provider.dart';

class VoiceUsageState {
  final bool allowed;
  final int used;
  final int remaining;
  final int? limit;
  final bool isLoading;

  const VoiceUsageState({
    this.allowed = true,
    this.used = 0,
    this.remaining = 0,
    this.limit,
    this.isLoading = false,
  });

  bool get isUnlimited => limit == null;
  int get maxDurationSeconds => (isUnlimited || (limit ?? 0) > freeDailyLimit) ? 0 : 30;

  static const int freeDailyLimit = 4;

  VoiceUsageState copyWith({
    bool? allowed,
    int? used,
    int? remaining,
    int? limit,
    bool? isLoading,
  }) =>
      VoiceUsageState(
        allowed: allowed ?? this.allowed,
        used: used ?? this.used,
        remaining: remaining ?? this.remaining,
        limit: limit ?? this.limit,
        isLoading: isLoading ?? this.isLoading,
      );
}

class VoiceUsageNotifier extends StateNotifier<VoiceUsageState> {
  final AuthService _authService;
  final AuthNotifier _authNotifier;

  VoiceUsageNotifier(this._authService, this._authNotifier)
      : super(const VoiceUsageState());

  Future<bool> checkAndIncrement() async {
    final token = _authNotifier.state.token;
    if (token == null) return true;

    state = state.copyWith(isLoading: true);
    try {
      final result = await _authService.incrementVoiceUsage(token);
      state = VoiceUsageState(
        allowed: result.allowed,
        used: result.used,
        remaining: result.remaining,
        limit: result.limit,
        isLoading: false,
      );
      return result.allowed;
    } catch (_) {
      state = state.copyWith(isLoading: false);
      return false;
    }
  }

  Future<void> refresh() async {
    final token = _authNotifier.state.token;
    if (token == null) {
      state = const VoiceUsageState();
      return;
    }

    try {
      final result = await _authService.getVoiceUsage(token);
      state = VoiceUsageState(
        allowed: result.remaining > 0 || result.isUnlimited,
        used: result.used,
        remaining: result.remaining,
        limit: result.limit,
      );
    } catch (_) {}
  }
}

final voiceUsageProvider =
    StateNotifierProvider<VoiceUsageNotifier, VoiceUsageState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final authNotifier = ref.watch(authProvider.notifier);
  return VoiceUsageNotifier(authService, authNotifier);
});
