import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final String? token;
  final AuthUser? user;
  const AuthState({
    this.status = AuthStatus.unauthenticated,
    this.token,
    this.user,
  });

  AuthState copyWith({AuthStatus? status, String? token, AuthUser? user}) =>
      AuthState(
        status: status ?? this.status,
        token: token ?? this.token,
        user: user ?? this.user,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  Future<void> initialize() async {}

  Future<void> login(String phone, String code) async {
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> updateUser(AuthUser user) async {
    state = state.copyWith(user: user);
  }

  Future<void> refreshProfile() async {}

  Future<void> deleteAccount() async {}

  Future<void> logout() async {}
}

final relayBaseUrlProvider = Provider<String>((ref) {
  return const String.fromEnvironment(
    'RELAY_BASE_URL',
    defaultValue: '',
  ).trim();
});

final authServiceProvider = Provider<AuthService>((ref) {
  final baseUrl = ref.watch(relayBaseUrlProvider);
  return AuthService(baseUrl: baseUrl);
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
