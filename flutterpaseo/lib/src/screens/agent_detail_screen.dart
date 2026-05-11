import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/agent.dart';
import '../widgets/agent_stream_view.dart';
import '../widgets/composer.dart';
import '../widgets/connection_status_bar.dart';
import '../widgets/voice_panel.dart';
import '../widgets/permission_panel.dart';
import '../widgets/agent_session_drawer.dart';
import '../widgets/workspace_drawer.dart';
import '../providers/session_provider.dart';
import '../l10n_ext.dart';
import '../utils/keyboard_dismiss.dart';
import '../widgets/animated_pause_icon.dart';

class AgentDetailScreen extends ConsumerStatefulWidget {
  final String serverId;
  final String agentId;
  const AgentDetailScreen({
    super.key,
    required this.serverId,
    required this.agentId,
  });

  @override
  ConsumerState<AgentDetailScreen> createState() => _AgentDetailScreenState();
}

class _AgentDetailScreenState extends ConsumerState<AgentDetailScreen> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  final _scrollCtrl = ScrollController();
  final _quoteNotifier = ValueNotifier<String>('');
  late String _activeAgentId;
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    _activeAgentId = widget.agentId;
    Future.microtask(() {
      ref
          .read(sessionProvider(widget.serverId).notifier)
          .setFocusedAgent(_activeAgentId);
      ref.read(sessionProvider(widget.serverId).notifier).fetchAgents();
      ref
          .read(sessionProvider(widget.serverId).notifier)
          .fetchAgentTimeline(_activeAgentId);
    });
  }

  void _loadMore() {
    if (_isLoadingMore) return;
    final tail = ref
        .read(sessionProvider(widget.serverId))
        .agentStreamTail[_activeAgentId];
    if (tail == null || tail.isEmpty) return;
    _isLoadingMore = true;
    ref
        .read(sessionProvider(widget.serverId).notifier)
        .fetchAgentTimelineBefore(_activeAgentId);
    Future.delayed(const Duration(seconds: 1), () => _isLoadingMore = false);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _openAgentDrawer() {
    dismissSoftKeyboard(context);
    ref.read(sessionProvider(widget.serverId).notifier).fetchAgents();
    _scaffoldKey.currentState?.openEndDrawer();
  }

  void _openWorkspaceDrawer() {
    dismissSoftKeyboard(context);
    ref.read(sessionProvider(widget.serverId).notifier).fetchWorkspaces();
    _scaffoldKey.currentState?.openDrawer();
  }

  void _selectAgentFromDrawer(Agent agent) {
    if (_activeAgentId == agent.id) {
      return;
    }
    setState(() {
      _activeAgentId = agent.id;
    });
    ref.read(sessionProvider(widget.serverId).notifier)
      ..setFocusedAgent(agent.id)
      ..fetchAgentTimeline(agent.id);
    _scrollToBottom();
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _quoteNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider(widget.serverId));
    final agent = session.agents[_activeAgentId];
    final isTimelineLoading = ref.watch(
      agentTimelineInitializingProvider(
        (widget.serverId, _activeAgentId),
      ),
    );
    final items = ref.watch(
      agentStreamProvider((widget.serverId, _activeAgentId)),
    );
    final perms = ref.watch(
      agentPermissionsProvider((widget.serverId, _activeAgentId)),
    );

    ref.listen(agentStreamProvider((widget.serverId, _activeAgentId)), (
      previous,
      next,
    ) {
      if (!mounted || next.isEmpty) return;
      if (previous?.length == next.length) return;
      _scrollToBottom();
    });

    ref.listen(sessionOnlineProvider(widget.serverId), (previous, next) {
      if (previous == false && next == true) {
        ref
            .read(sessionProvider(widget.serverId).notifier)
            .fetchAgentTimeline(_activeAgentId);
      }
    });

    final theme = Theme.of(context);
    return Scaffold(
      key: _scaffoldKey,
      drawer: WorkspaceDrawer(
        serverId: widget.serverId,
        currentCwd: agent?.cwd,
      ),
      endDrawer: AgentSessionDrawer(
        serverId: widget.serverId,
        currentAgentId: _activeAgentId,
        currentCwd: agent?.cwd,
        onSelectAgent: _selectAgentFromDrawer,
      ),
      appBar: AppBar(
        leading: IconButton(
          tooltip: context.l10n.menu,
          onPressed: _openWorkspaceDrawer,
          icon: const Icon(Icons.menu),
        ),
        title: Text(
          agent?.title ?? _activeAgentId,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          if (agent?.status == AgentLifecycleStatus.running)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: FilledButton.tonalIcon(
                onPressed: () => ref
                    .read(sessionProvider(widget.serverId).notifier)
                    .cancelAgent(_activeAgentId),
                icon: AnimatedPauseIcon(size: 18),
                label: Text(context.l10n.stop),
                style: FilledButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: IconButton(
              tooltip: context.l10n.menu,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints.tightFor(width: 44, height: 44),
              onPressed: _openAgentDrawer,
              icon: const Icon(Icons.menu),
            ),
          ),
          PopupMenuButton<String>(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            onSelected: (value) {
              if (value == 'archive') {
                ref
                    .read(sessionProvider(widget.serverId).notifier)
                    .archiveAgent(_activeAgentId);
                Navigator.pop(context);
              } else if (value == 'delete') {
                ref
                    .read(sessionProvider(widget.serverId).notifier)
                    .deleteAgent(_activeAgentId);
                Navigator.pop(context);
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                value: 'archive',
                child: Row(
                  children: [
                    Icon(
                      Icons.archive_outlined,
                      size: 18,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 12),
                    Text(context.l10n.archive),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(
                      Icons.delete_outline,
                      size: 18,
                      color: theme.colorScheme.error,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      context.l10n.delete,
                      style: TextStyle(color: theme.colorScheme.error),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          ConnectionStatusBar(serverId: widget.serverId),
          Expanded(
            child: isTimelineLoading && items.isEmpty
                ? Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                    ),
                  )
                : AgentStreamView(
                    serverId: widget.serverId,
                    agentId: _activeAgentId,
                    items: items,
                    scrollController: _scrollCtrl,
                    isAgentWorking:
                        agent?.status == AgentLifecycleStatus.running ||
                        agent?.status == AgentLifecycleStatus.initializing,
                    onLoadMore: _loadMore,
                    onQuote: (text) {
                      _quoteNotifier.value = '';
                      _quoteNotifier.value = text;
                    },
                  ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (perms.isNotEmpty)
                PermissionPanel(
                  serverId: widget.serverId,
                  agentId: _activeAgentId,
                  permission: perms.first,
                ),
              VoicePanel(serverId: widget.serverId, agentId: _activeAgentId),
              Composer(
                serverId: widget.serverId,
                agentId: _activeAgentId,
                onSend: _scrollToBottom,
                quoteNotifier: _quoteNotifier,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
