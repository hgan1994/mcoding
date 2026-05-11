import '../models/agent.dart';

/// Reconciles previous agent statuses with the current session agent list.
///
/// Preserves statuses for existing agents, removes statuses for agents no
/// longer present, and seeds new agents from the current snapshot.
Map<String, AgentLifecycleStatus> reconcilePreviousAgentStatuses({
  required Map<String, AgentLifecycleStatus> previousStatuses,
  required Map<String, Agent>? sessionAgents,
}) {
  if (sessionAgents == null) {
    return {};
  }

  final nextStatuses = Map<String, AgentLifecycleStatus>.from(previousStatuses);
  final seenAgentIds = <String>{};

  for (final agent in sessionAgents.values) {
    seenAgentIds.add(agent.id);
    if (!nextStatuses.containsKey(agent.id)) {
      nextStatuses[agent.id] = agent.status;
    }
  }

  nextStatuses.removeWhere((agentId, _) => !seenAgentIds.contains(agentId));

  return nextStatuses;
}
