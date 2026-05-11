import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/notification.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';

class NotificationState {
  final List<AppNotification> items;
  final bool isLoading;
  final bool hasMore;
  final int unreadCount;
  final String? error;

  const NotificationState({
    this.items = const [],
    this.isLoading = false,
    this.hasMore = false,
    this.unreadCount = 0,
    this.error,
  });

  NotificationState copyWith({
    List<AppNotification>? items,
    bool? isLoading,
    bool? hasMore,
    int? unreadCount,
    String? error,
  }) =>
      NotificationState(
        items: items ?? this.items,
        isLoading: isLoading ?? this.isLoading,
        hasMore: hasMore ?? this.hasMore,
        unreadCount: unreadCount ?? this.unreadCount,
        error: error,
      );
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final AuthService _authService;
  final String? _token;

  NotificationNotifier(this._authService, this._token)
      : super(const NotificationState());

  Future<void> load() async {
    final token = _token;
    if (token == null) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _authService.getNotifications(token, limit: 20);
      if (!mounted) return;
      state = state.copyWith(
        items: result.items,
        hasMore: result.hasMore,
        unreadCount: result.unreadCount,
        isLoading: false,
      );
    } catch (e) {
      if (!mounted) return;
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadMore() async {
    final token = _token;
    if (token == null || state.isLoading || !state.hasMore) return;
    state = state.copyWith(isLoading: true);
    try {
      final lastId = state.items.isNotEmpty ? state.items.last.id : null;
      final result = await _authService.getNotifications(
        token,
        cursor: lastId,
        limit: 20,
      );
      if (!mounted) return;
      state = state.copyWith(
        items: [...state.items, ...result.items],
        hasMore: result.hasMore,
        unreadCount: result.unreadCount,
        isLoading: false,
      );
    } catch (e) {
      if (!mounted) return;
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> markAsRead(String id) async {
    final token = _token;
    if (token == null) return;
    try {
      final updated = await _authService.markNotificationRead(token, id);
      if (!mounted) return;
      final newItems = state.items.map((n) => n.id == id ? updated : n).toList();
      final newUnread = newItems.where((n) => !n.isRead).length;
      state = state.copyWith(items: newItems, unreadCount: newUnread);
    } catch (_) {}
  }

  Future<void> markAllAsRead() async {
    final token = _token;
    if (token == null) return;
    try {
      await _authService.markAllNotificationsRead(token);
      if (!mounted) return;
      final newItems = state.items.map((n) {
        if (n.isRead) return n;
        return AppNotification(
          id: n.id,
          type: n.type,
          title: n.title,
          content: n.content,
          summary: n.summary,
          isRead: true,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        );
      }).toList();
      state = state.copyWith(items: newItems, unreadCount: 0);
    } catch (_) {}
  }

  Future<void> refreshUnreadCount() async {
    final token = _token;
    if (token == null) return;
    try {
      final count = await _authService.getUnreadNotificationCount(token);
      if (!mounted) return;
      state = state.copyWith(unreadCount: count);
    } catch (_) {}
  }
}

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  final token = ref.watch(authProvider).token;
  final authService = ref.watch(authServiceProvider);
  return NotificationNotifier(authService, token);
});

final unreadNotificationCountProvider = Provider<int>((ref) {
  return ref.watch(notificationProvider).unreadCount;
});
