import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:equatable/equatable.dart';

enum AppTab { agents, agentDetail, terminal, files, settings }

class PanelState extends Equatable {
  final AppTab activeTab;
  final String? activeAgentId;
  final bool isSidebarOpen;

  const PanelState({
    this.activeTab = AppTab.agents,
    this.activeAgentId,
    this.isSidebarOpen = false,
  });

  PanelState copyWith({
    AppTab? activeTab,
    String? activeAgentId,
    bool? isSidebarOpen,
    bool clearAgentId = false,
  }) {
    return PanelState(
      activeTab: activeTab ?? this.activeTab,
      activeAgentId: clearAgentId ? null : (activeAgentId ?? this.activeAgentId),
      isSidebarOpen: isSidebarOpen ?? this.isSidebarOpen,
    );
  }

  @override
  List<Object?> get props => [activeTab, activeAgentId, isSidebarOpen];
}

class PanelNotifier extends StateNotifier<PanelState> {
  PanelNotifier() : super(const PanelState());

  void setActiveTab(AppTab tab) {
    state = state.copyWith(activeTab: tab);
  }

  void openAgentDetail(String agentId) {
    state = state.copyWith(
      activeTab: AppTab.agentDetail,
      activeAgentId: agentId,
    );
  }

  void closeAgentDetail() {
    state = state.copyWith(
      activeTab: AppTab.agents,
      clearAgentId: true,
    );
  }

  void toggleSidebar() {
    state = state.copyWith(isSidebarOpen: !state.isSidebarOpen);
  }
}

final panelProvider =
    StateNotifierProvider<PanelNotifier, PanelState>((ref) => PanelNotifier());
