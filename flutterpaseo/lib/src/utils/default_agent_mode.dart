import '../models/agent.dart';

const _preferredBypassModeIds = <String>[
  'bypassPermissions',
  'full-access',
  'https://agentclientprotocol.com/protocol/session-modes#autopilot',
];

String? resolveDefaultConversationMode({
  required List<AgentMode> modes,
  required String? providerDefaultModeId,
}) {
  if (modes.isEmpty) return null;

  final modeIds = modes.map((mode) => mode.id).toSet();
  for (final modeId in _preferredBypassModeIds) {
    if (modeIds.contains(modeId)) return modeId;
  }

  for (final mode in modes) {
    if (mode.label.trim().toLowerCase() == 'bypass') return mode.id;
  }

  if (providerDefaultModeId != null &&
      modeIds.contains(providerDefaultModeId)) {
    return providerDefaultModeId;
  }

  return modes.first.id;
}
