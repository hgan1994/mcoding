import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/agent.dart';
import 'package:paseo/src/utils/default_agent_mode.dart';

void main() {
  group('resolveDefaultConversationMode', () {
    test('prefers Claude bypassPermissions over provider default', () {
      final mode = resolveDefaultConversationMode(
        modes: const [
          AgentMode(id: 'default', label: 'Always Ask'),
          AgentMode(id: 'bypassPermissions', label: 'Bypass'),
        ],
        providerDefaultModeId: 'default',
      );

      expect(mode, 'bypassPermissions');
    });

    test('prefers full-access for Codex and OpenCode style modes', () {
      final mode = resolveDefaultConversationMode(
        modes: const [
          AgentMode(id: 'auto', label: 'Default Permissions'),
          AgentMode(id: 'full-access', label: 'Full Access'),
        ],
        providerDefaultModeId: 'auto',
      );

      expect(mode, 'full-access');
    });

    test('falls back to provider default when no bypass-like mode exists', () {
      final mode = resolveDefaultConversationMode(
        modes: const [
          AgentMode(id: 'plan', label: 'Plan'),
          AgentMode(id: 'build', label: 'Build'),
        ],
        providerDefaultModeId: 'build',
      );

      expect(mode, 'build');
    });
  });
}
