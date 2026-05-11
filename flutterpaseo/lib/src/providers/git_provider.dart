import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:equatable/equatable.dart';

class GitState extends Equatable {
  final List<String> branches;
  final String? currentBranch;
  final bool isLoading;
  final String? error;

  const GitState({
    this.branches = const [],
    this.currentBranch,
    this.isLoading = false,
    this.error,
  });

  @override
  List<Object?> get props => [branches, currentBranch, isLoading, error];

  GitState copyWith({
    List<String>? branches,
    String? currentBranch,
    bool? isLoading,
    String? error,
  }) => GitState(
    branches: branches ?? this.branches,
    currentBranch: currentBranch ?? this.currentBranch,
    isLoading: isLoading ?? this.isLoading,
    error: error ?? this.error,
  );
}

class GitNotifier extends StateNotifier<GitState> {
  GitNotifier() : super(const GitState());

  void setBranches(List<String> branches, {String? current}) {
    state = state.copyWith(branches: branches, currentBranch: current ?? state.currentBranch);
  }

  void checkout(String branch) {
    state = state.copyWith(currentBranch: branch);
  }
}

final gitProvider = StateNotifierProvider<GitNotifier, GitState>((ref) => GitNotifier());
