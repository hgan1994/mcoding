import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/agent.dart';
import '../providers/session_provider.dart';
import '../l10n_ext.dart';
import '../theme.dart';

class SessionsScreen extends ConsumerWidget {
  final String serverId;
  const SessionsScreen({super.key, required this.serverId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allAgents = ref.watch(sessionProvider(serverId)).agents.values.toList()
      ..sort((a, b) => b.lastActivityAt.compareTo(a.lastActivityAt));
    final active = allAgents.where((a) => a.archivedAt == null).toList();
    final archived = allAgents.where((a) => a.archivedAt != null).toList();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(context.l10n.history),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, size: 20),
              onPressed: () => ref.read(sessionProvider(serverId).notifier).fetchAgents(),
            ),
          ],
          bottom: TabBar(
            tabs: [
              Tab(text: context.l10n.active),
              Tab(text: context.l10n.archived),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _AgentList(
              agents: active,
              serverId: serverId,
              emptyText: context.l10n.noActiveSessions,
            ),
            _AgentList(
              agents: archived,
              serverId: serverId,
              emptyText: context.l10n.noArchivedSessions,
            ),
          ],
        ),
      ),
    );
  }
}

class _AgentList extends ConsumerWidget {
  final List<Agent> agents;
  final String serverId;
  final String emptyText;

  const _AgentList({required this.agents, required this.serverId, required this.emptyText});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    if (agents.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.history, size: 48, color: cs.onSurfaceVariant.withValues(alpha: 0.4)),
            const SizedBox(height: 12),
            Text(
              emptyText,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async => ref.read(sessionProvider(serverId).notifier).fetchAgents(),
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: agents.length,
        itemBuilder: (context, index) => _HistoryCard(
          agent: agents[index],
          serverId: serverId,
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final Agent agent;
  final String serverId;
  const _HistoryCard({required this.agent, required this.serverId});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: cs.outline.withValues(alpha: 0.12)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/h/$serverId/agent/${agent.id}'),
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: _statusColor(agent.status, theme),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        agent.title ?? agent.id,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        agent.cwd,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _timeAgo(agent.lastActivityAt),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _statusColor(AgentLifecycleStatus status, ThemeData theme) {
    return switch (status) {
      AgentLifecycleStatus.running => theme.colorScheme.primary,
      AgentLifecycleStatus.error => theme.colorScheme.error,
      AgentLifecycleStatus.idle => AppColors.light.success,
      AgentLifecycleStatus.initializing => Colors.orange,
      AgentLifecycleStatus.closed => theme.colorScheme.onSurfaceVariant,
    };
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}
