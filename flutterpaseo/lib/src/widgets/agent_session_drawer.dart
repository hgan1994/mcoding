import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../l10n_ext.dart';
import '../theme.dart';
import '../models/agent.dart';
import '../providers/session_provider.dart';

class AgentSessionDrawer extends ConsumerWidget {
  final String serverId;
  final String? currentAgentId;
  final String? currentCwd;
  final ValueChanged<Agent>? onSelectAgent;

  const AgentSessionDrawer({
    super.key,
    required this.serverId,
    this.currentAgentId,
    this.currentCwd,
    this.onSelectAgent,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final agents = ref.watch(sessionAgentsProvider(serverId)).values.toList()
      ..sort((a, b) => b.lastActivityAt.compareTo(a.lastActivityAt));
    final isHydrated = ref.watch(sessionHydratedProvider(serverId));
    final isOnline = ref.watch(sessionOnlineProvider(serverId));
    final workspaceAgents = agents.where(_matchesWorkspace).toList();
    final activeAgents = workspaceAgents
        .where((agent) => agent.archivedAt == null)
        .toList();
    final archivedAgents = workspaceAgents
        .where((agent) => agent.archivedAt != null)
        .toList();

    return Drawer(
      child: SafeArea(
        bottom: false,
        child: _DrawerBody(
          theme: theme,
          isHydrated: isHydrated,
          isOnline: isOnline,
          activeAgents: activeAgents,
          archivedAgents: archivedAgents,
          serverId: serverId,
          currentAgentId: currentAgentId,
          currentCwd: currentCwd,
          onSelectAgent: onSelectAgent,
        ),
      ),
    );
  }

  bool _matchesWorkspace(Agent agent) {
    final cwd = currentCwd?.trim();
    if (cwd == null || cwd.isEmpty) return true;
    return agent.cwd == cwd;
  }
}

class _DrawerBody extends ConsumerWidget {
  final ThemeData theme;
  final bool isHydrated;
  final bool isOnline;
  final List<Agent> activeAgents;
  final List<Agent> archivedAgents;
  final String serverId;
  final String? currentAgentId;
  final String? currentCwd;
  final ValueChanged<Agent>? onSelectAgent;

  const _DrawerBody({
    required this.theme,
    required this.isHydrated,
    required this.isOnline,
    required this.activeAgents,
    required this.archivedAgents,
    required this.serverId,
    required this.currentAgentId,
    required this.currentCwd,
    required this.onSelectAgent,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!isHydrated && isOnline) {
      return const Center(child: CircularProgressIndicator());
    }

    if (activeAgents.isEmpty && archivedAgents.isEmpty) {
      final emptyText = isOnline
          ? context.l10n.noActiveSessions
          : context.l10n.hostOffline;
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isOnline ? Icons.history : Icons.cloud_off,
                size: 40,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 12),
              Text(
                emptyText,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async =>
          ref.read(sessionProvider(serverId).notifier).fetchAgents(),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
        children: [
          _NewChatTile(
            serverId: serverId,
            currentCwd: currentCwd,
          ),
          if (activeAgents.isNotEmpty) ...[
            _SectionLabel(label: context.l10n.history),
            ...activeAgents.map(
              (agent) => _AgentTile(
                agent: agent,
                serverId: serverId,
                isCurrent: agent.id == currentAgentId,
                onSelectAgent: onSelectAgent,
              ),
            ),
          ],
          if (archivedAgents.isNotEmpty) ...[
            _SectionLabel(label: context.l10n.archived),
            ...archivedAgents.map(
              (agent) => _AgentTile(
                agent: agent,
                serverId: serverId,
                isCurrent: agent.id == currentAgentId,
                onSelectAgent: onSelectAgent,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;

  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 6),
      child: Text(
        label,
        style: theme.textTheme.labelMedium?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _AgentTile extends StatelessWidget {
  final Agent agent;
  final String serverId;
  final bool isCurrent;
  final ValueChanged<Agent>? onSelectAgent;

  const _AgentTile({
    required this.agent,
    required this.serverId,
    required this.isCurrent,
    required this.onSelectAgent,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final providerLabel = agent.provider;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: isCurrent
          ? theme.colorScheme.primaryContainer.withValues(alpha: 0.4)
          : null,
      clipBehavior: Clip.antiAlias,
      child: ListTile(
            title: Text(
              agent.title ?? agent.id,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            subtitle: Text(
              providerLabel,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            trailing: agent.status == AgentLifecycleStatus.running
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: theme.colorScheme.primary,
                    ),
                  )
                : Text(
                    _timeAgo(agent.lastActivityAt),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
            onTap: () {
              Navigator.of(context).pop();
              if (isCurrent) return;
              final callback = onSelectAgent;
              if (callback != null) {
                callback(agent);
                return;
              }
              context.go('/h/$serverId/agent/${agent.id}');
            },
          ),
      );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}

class _NewChatTile extends StatelessWidget {
  final String serverId;
  final String? currentCwd;

  const _NewChatTile({
    required this.serverId,
    required this.currentCwd,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: _DashedBorder(
        color: AppColors.tintLight.withValues(alpha: 0.5),
        strokeWidth: 1.5,
        child: Card(
          margin: EdgeInsets.zero,
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () {
              Navigator.of(context).pop();
              final cwd = currentCwd?.trim();
              final uri = Uri(
                path: '/h/$serverId/new-chat',
                queryParameters: {
                  if (cwd != null && cwd.isNotEmpty) 'cwd': cwd,
                  'newSession': DateTime.now().microsecondsSinceEpoch.toString(),
                },
              );
              context.go(uri.toString());
            },
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.add,
                    color: AppColors.tintLight,
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Text(
                    context.l10n.newSession,
                    style: TextStyle(
                      color: AppColors.tintLight,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _DashedBorder extends StatelessWidget {
  final Widget child;
  final Color color;
  final double strokeWidth;

  const _DashedBorder({
    required this.child,
    required this.color,
    this.strokeWidth = 1.5,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedBorderPainter(
        color: color,
        strokeWidth: strokeWidth,
      ),
      child: child,
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;

  _DashedBorderPainter({
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    const dashWidth = 6.0;
    const dashSpace = 4.0;
    final radius = 12.0;

    final path = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        Radius.circular(radius),
      ));

    final dashPath = Path();
    for (final metric in path.computeMetrics()) {
      double distance = 0.0;
      bool draw = true;
      while (distance < metric.length) {
        final finalLength = draw
            ? dashWidth
            : dashSpace;
        if (draw) {
          dashPath.addPath(
            metric.extractPath(distance, distance + finalLength),
            Offset.zero,
          );
        }
        distance += finalLength;
        draw = !draw;
      }
    }
    canvas.drawPath(dashPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
