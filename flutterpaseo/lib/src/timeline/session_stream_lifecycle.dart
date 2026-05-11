import '../models/agent.dart';

/// Derives an optimistic lifecycle status update from a stream event.
///
/// Returns a new status for foreground lifecycle stream events.
/// Returns null otherwise.
AgentLifecycleStatus? deriveOptimisticLifecycleStatus({
  required AgentLifecycleStatus currentStatus,
  required String eventType,
}) {
  switch (eventType) {
    case 'turn_started':
      return currentStatus == AgentLifecycleStatus.running
          ? null
          : AgentLifecycleStatus.running;
    case 'turn_completed':
      return currentStatus == AgentLifecycleStatus.running
          ? AgentLifecycleStatus.idle
          : null;
    case 'turn_failed':
      return currentStatus == AgentLifecycleStatus.running
          ? AgentLifecycleStatus.error
          : null;
    case 'turn_canceled':
      // A canceled turn can be either a final user cancel or an interrupt before
      // a replacement turn starts. The daemon snapshot is authoritative here.
      return null;
    default:
      return null;
  }
}
