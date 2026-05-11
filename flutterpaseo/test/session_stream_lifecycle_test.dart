import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/agent.dart';
import 'package:paseo/src/timeline/session_stream_lifecycle.dart';

void main() {
  group('deriveOptimisticLifecycleStatus', () {
    test('marks an idle agent as running when a turn starts', () {
      expect(
        deriveOptimisticLifecycleStatus(
          currentStatus: AgentLifecycleStatus.idle,
          eventType: 'turn_started',
        ),
        AgentLifecycleStatus.running,
      );
    });

    test('marks a running agent idle when a turn completes', () {
      expect(
        deriveOptimisticLifecycleStatus(
          currentStatus: AgentLifecycleStatus.running,
          eventType: 'turn_completed',
        ),
        AgentLifecycleStatus.idle,
      );
    });

    test('ignores terminal events when the agent is not currently running', () {
      expect(
        deriveOptimisticLifecycleStatus(
          currentStatus: AgentLifecycleStatus.idle,
          eventType: 'turn_completed',
        ),
        isNull,
      );
    });
  });
}
