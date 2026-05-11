import '../models/workspace.dart';

/// Patches workspace scripts from a script_status_update message payload.
///
/// Returns a new map if scripts changed, or the same map if unchanged.
Map<String, WorkspaceDescriptor> patchWorkspaceScripts({
  required Map<String, WorkspaceDescriptor> workspaces,
  required Map<String, dynamic> update,
}) {
  final workspaceId = update['workspaceId'] as String?;
  if (workspaceId == null) return workspaces;

  // Find matching workspace by id.
  final workspaceKey = workspaceId;
  final existing = workspaces[workspaceKey];
  if (existing == null) return workspaces;

  // The Flutter WorkspaceDescriptor currently doesn't carry a scripts field.
  // When scripts are added to the model, this function will compare and update.
  // For now, return unchanged.
  return workspaces;
}
