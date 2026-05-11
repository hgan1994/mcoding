import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/agent.dart';
import '../providers/session_provider.dart';

class AgentStatusBar extends ConsumerWidget {
  final String serverId;
  final String agentId;

  const AgentStatusBar({super.key, required this.serverId, required this.agentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider(serverId));
    final agent = session.agents[agentId];
    if (agent == null) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final labelSmall = theme.textTheme.labelSmall!;

    final providerIcon = switch (agent.provider) {
      'claude' => Icons.smart_toy,
      'codex' => Icons.code,
      'opencode' => Icons.open_in_new,
      _ => Icons.psychology,
    };

    final (:dotColor, :statusText) = switch (agent.status) {
      AgentLifecycleStatus.running => (dotColor: Colors.green, statusText: 'Running'),
      AgentLifecycleStatus.idle => (dotColor: Colors.grey, statusText: 'Idle'),
      AgentLifecycleStatus.error => (dotColor: theme.colorScheme.error, statusText: 'Error'),
      AgentLifecycleStatus.initializing => (dotColor: Colors.orange, statusText: 'Starting'),
      AgentLifecycleStatus.closed => (dotColor: Colors.grey.shade600, statusText: 'Closed'),
    };

    final modelName = agent.model ?? agent.runtimeInfo?.model;

    return Container(
      height: 36,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(providerIcon, size: 16),
          const SizedBox(width: 4),
          Text(agent.provider, style: labelSmall),
          Text(' · ', style: labelSmall.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          if (modelName != null) Text(modelName, style: labelSmall),
          const Spacer(),
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(statusText, style: labelSmall),
        ],
      ),
    );
  }
}
