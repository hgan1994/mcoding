import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../l10n_ext.dart';
import '../models/workspace.dart';
import '../providers/session_provider.dart';

class WorkspaceDrawer extends ConsumerWidget {
  final String serverId;
  final String? currentWorkspaceId;
  final String? currentCwd;

  const WorkspaceDrawer({
    super.key,
    required this.serverId,
    this.currentWorkspaceId,
    this.currentCwd,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final session = ref.watch(sessionProvider(serverId));
    final workspaces = session.workspaces.values.toList()
      ..sort(_sortWorkspaces);

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 12, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    context.l10n.projectList,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.settings_outlined),
                    color: theme.colorScheme.onSurface,
                    onPressed: () {
                      Navigator.of(context).pop();
                      context.push('/h/$serverId/settings');
                    },
                    tooltip: context.l10n.settings,
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: workspaces.isEmpty
                  ? Center(
                      child: Text(
                        context.l10n.noProjects,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                      itemCount: workspaces.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final workspace = workspaces[index];
                        final isSelected = _isSelected(workspace);
                        return _WorkspaceDrawerItem(
                          workspace: workspace,
                          selected: isSelected,
                          onTap: () {
                            Navigator.of(context).pop();
                            if (isSelected) {
                              return;
                            }
                            context.go(
                              Uri(
                                path: '/h/$serverId/new-chat',
                                queryParameters: {
                                  'cwd': workspace.workspaceDirectory,
                                  'workspaceId': workspace.id,
                                  'name': workspace.projectDisplayName,
                                },
                              ).toString(),
                            );
                          },
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    context.push('/h/$serverId/open-project');
                  },
                  icon: const Icon(Icons.widgets_outlined, size: 18),
                  label: Text(context.l10n.viewAllProjects),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _isSelected(WorkspaceDescriptor workspace) {
    return workspace.id == currentWorkspaceId ||
        workspace.workspaceDirectory == currentCwd ||
        workspace.projectRootPath == currentCwd;
  }

  int _sortWorkspaces(WorkspaceDescriptor a, WorkspaceDescriptor b) {
    final aTime = a.activityAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    final bTime = b.activityAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    return bTime.compareTo(aTime);
  }
}

class _WorkspaceDrawerItem extends StatelessWidget {
  final WorkspaceDescriptor workspace;
  final bool selected;
  final VoidCallback onTap;

  const _WorkspaceDrawerItem({
    required this.workspace,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: selected
          ? theme.colorScheme.primaryContainer.withValues(alpha: 0.5)
          : theme.colorScheme.surfaceContainerLow,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: selected
                      ? theme.colorScheme.primary.withValues(alpha: 0.14)
                      : theme.colorScheme.surfaceContainerHighest.withValues(
                          alpha: 0.7,
                        ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  selected ? Icons.folder_rounded : Icons.folder_open_outlined,
                  size: 18,
                  color: selected
                      ? theme.colorScheme.primary
                      : theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      workspace.projectDisplayName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      workspace.workspaceDirectory,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              if (selected)
                Padding(
                  padding: const EdgeInsets.only(left: 8, top: 2),
                  child: Icon(
                    Icons.check_circle,
                    size: 18,
                    color: theme.colorScheme.primary,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
