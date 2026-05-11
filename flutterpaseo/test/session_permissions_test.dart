import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/permission.dart';
import 'package:paseo/src/providers/session_provider.dart';

void main() {
  group('mergeAgentPendingPermissions', () {
    test('hydrates question permissions from agent snapshots', () {
      final merged = mergeAgentPendingPermissions(
        current: const {},
        agentId: 'agent-1',
        pendingPermissions: [
          {
            'id': 'permission-call-question-1',
            'provider': 'codex',
            'name': 'request_user_input',
            'kind': 'question',
            'title': 'Question',
            'input': {
              'questions': [
                {
                  'id': 'favorite_drink',
                  'header': 'Drink',
                  'question': 'Which drink do you want?',
                  'options': [
                    {'label': 'Coffee'},
                    {'label': 'Tea'},
                  ],
                },
              ],
            },
          },
        ],
      );

      expect(merged, hasLength(1));
      final permission = merged['agent-1:permission-call-question-1'];
      expect(permission, isNotNull);
      expect(permission!.kind, PermissionKind.question);
      expect(permission.name, 'request_user_input');
      expect(permission.input?['questions'], isA<List<dynamic>>());
    });

    test('clears stale permissions for the same agent only', () {
      const existing = AgentPermissionRequest(
        id: 'old',
        provider: 'codex',
        name: 'request_user_input',
        kind: PermissionKind.question,
      );
      const other = AgentPermissionRequest(
        id: 'keep',
        provider: 'codex',
        name: 'request_user_input',
        kind: PermissionKind.question,
      );

      final merged = mergeAgentPendingPermissions(
        current: const {'agent-1:old': existing, 'agent-2:keep': other},
        agentId: 'agent-1',
        pendingPermissions: const [],
      );

      expect(merged.containsKey('agent-1:old'), isFalse);
      expect(merged['agent-2:keep'], other);
    });
  });
}
