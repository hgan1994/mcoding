import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

enum ToastType { success, error, info }

class ToastMessage extends Equatable {
  final String id;
  final String message;
  final ToastType type;
  final DateTime createdAt;

  const ToastMessage({
    required this.id,
    required this.message,
    required this.type,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, message, type, createdAt];
}

class ToastNotifier extends StateNotifier<List<ToastMessage>> {
  final _uuid = const Uuid();
  final Map<String, Timer> _timers = {};

  ToastNotifier() : super([]);

  void show(String message, {ToastType type = ToastType.info}) {
    final toast = ToastMessage(
      id: _uuid.v4(),
      message: message,
      type: type,
      createdAt: DateTime.now(),
    );

    state = [...state, toast];

    _timers[toast.id] = Timer(const Duration(seconds: 3), () {
      dismiss(toast.id);
    });
  }

  void success(String message) => show(message, type: ToastType.success);
  void error(String message) => show(message, type: ToastType.error);
  void info(String message) => show(message, type: ToastType.info);

  void dismiss(String id) {
    _timers[id]?.cancel();
    _timers.remove(id);
    state = state.where((t) => t.id != id).toList();
  }

  @override
  void dispose() {
    for (final timer in _timers.values) {
      timer.cancel();
    }
    _timers.clear();
    super.dispose();
  }
}

final toastProvider = StateNotifierProvider<ToastNotifier, List<ToastMessage>>((ref) {
  return ToastNotifier();
});
