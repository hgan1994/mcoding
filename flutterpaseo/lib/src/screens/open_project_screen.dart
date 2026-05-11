import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n_ext.dart';
import '../models/workspace.dart';
import '../providers/host_runtime_provider.dart';
import '../providers/session_provider.dart';
import '../theme.dart';
import '../widgets/app_snack_bar.dart';

class OpenProjectScreen extends ConsumerStatefulWidget {
  final String serverId;
  const OpenProjectScreen({super.key, required this.serverId});

  @override
  ConsumerState<OpenProjectScreen> createState() => _OpenProjectScreenState();
}

class _OpenProjectScreenState extends ConsumerState<OpenProjectScreen> {
  final Set<String> _pinnedWorkspaceIds = <String>{};
  final List<String> _workspaceOrder = <String>[];

  String get _pinnedStorageKey => 'open_project_pinned_${widget.serverId}';
  String get _orderStorageKey => 'open_project_order_${widget.serverId}';

  @override
  void initState() {
    super.initState();
    _loadPinnedWorkspaces();
    _loadWorkspaceOrder();
  }

  Future<void> _loadPinnedWorkspaces() async {
    final prefs = await SharedPreferences.getInstance();
    final ids = prefs.getStringList(_pinnedStorageKey) ?? const <String>[];
    if (!mounted) return;
    setState(() {
      _pinnedWorkspaceIds
        ..clear()
        ..addAll(ids.where((id) => id.trim().isNotEmpty));
    });
  }

  Future<void> _loadWorkspaceOrder() async {
    final prefs = await SharedPreferences.getInstance();
    final order = prefs.getStringList(_orderStorageKey) ?? const <String>[];
    if (!mounted) return;
    setState(() {
      _workspaceOrder
        ..clear()
        ..addAll(order.where((id) => id.trim().isNotEmpty));
    });
  }

  Future<void> _savePinnedWorkspaces() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_pinnedStorageKey, _pinnedWorkspaceIds.toList());
  }

  Future<void> _saveWorkspaceOrder() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_orderStorageKey, _workspaceOrder.toList());
  }

  Future<void> _deleteWorkspace(WorkspaceDescriptor workspace) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(context.l10n.deleteProjectTitle),
        content: Text(
          context.l10n.confirmDeleteProjectContent(workspace.projectDisplayName),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(context.l10n.cancel),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(dialogContext).colorScheme.error,
              foregroundColor: Theme.of(dialogContext).colorScheme.onError,
            ),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(context.l10n.delete),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ref
          .read(sessionProvider(widget.serverId).notifier)
          .archiveWorkspace(workspace.id);
      if (context.mounted) {
        AppSnackBar.showSuccess(
          context,
          context.l10n.projectDeleted(workspace.projectDisplayName),
        );
      }
      if (mounted && _pinnedWorkspaceIds.remove(workspace.id)) {
        setState(() {});
        await _savePinnedWorkspaces();
      }
      if (mounted) {
        setState(() {
          _workspaceOrder.remove(workspace.id);
        });
        await _saveWorkspaceOrder();
      }
    } catch (e) {
      if (context.mounted) {
        AppSnackBar.showError(context, context.l10n.deleteProjectFailed(e.toString()));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(hostRuntimeProvider, (previous, next) {
      final previousClient = previous?[widget.serverId]?.client;
      final nextClient = next[widget.serverId]?.client;
      if (nextClient != null && !identical(previousClient, nextClient)) {
        ref
            .read(sessionProvider(widget.serverId).notifier)
            .attachClient(nextClient);
      }
    });

    final runtimeClient = ref
        .watch(hostRuntimeProvider)[widget.serverId]
        ?.client;
    final session = ref.watch(sessionProvider(widget.serverId));
    if (runtimeClient != null && !identical(session.client, runtimeClient)) {
      Future.microtask(() {
        ref
            .read(sessionProvider(widget.serverId).notifier)
            .attachClient(runtimeClient);
      });
    }

    final bottomPadding = MediaQuery.of(context).padding.bottom;

    // 根据自定义顺序排序，如果有新项目则添加到末尾
    List<WorkspaceDescriptor> orderedWorkspaces = session.workspaces.values.toList();
    orderedWorkspaces.sort((a, b) {
      final aIndex = _workspaceOrder.indexOf(a.id);
      final bIndex = _workspaceOrder.indexOf(b.id);

      // 置顶的项目排在前面
      final aPinned = _pinnedWorkspaceIds.contains(a.id);
      final bPinned = _pinnedWorkspaceIds.contains(b.id);
      if (aPinned != bPinned) return aPinned ? -1 : 1;

      // 如果都在自定义顺序中，按自定义顺序
      if (aIndex >= 0 && bIndex >= 0) return aIndex.compareTo(bIndex);
      // 如果只有a在自定义顺序中，a排前面
      if (aIndex >= 0) return -1;
      // 如果只有b在自定义顺序中，b排前面
      if (bIndex >= 0) return 1;

      // 都不在自定义顺序中，按活动时间排序
      return (b.activityAt ?? DateTime.now()).compareTo(
        a.activityAt ?? DateTime.now(),
      );
    });

    // 更新 _workspaceOrder 以包含所有项目
    final currentIds = orderedWorkspaces.map((w) => w.id).toList();
    if (_workspaceOrder.length != currentIds.length ||
        !_workspaceOrder.every((id) => currentIds.contains(id))) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _workspaceOrder
              ..clear()
              ..addAll(currentIds);
          });
          _saveWorkspaceOrder();
        }
      });
    }

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.myProjects), leading: BackButton()),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (orderedWorkspaces.isNotEmpty)
            Expanded(
              child: ReorderableListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                itemCount: orderedWorkspaces.length,
                onReorder: (oldIndex, newIndex) {
                  setState(() {
                    if (newIndex > oldIndex) {
                      newIndex -= 1;
                    }
                    final item = orderedWorkspaces.removeAt(oldIndex);
                    orderedWorkspaces.insert(newIndex, item);

                    // 更新顺序
                    _workspaceOrder
                      ..clear()
                      ..addAll(orderedWorkspaces.map((w) => w.id));
                    _saveWorkspaceOrder();
                  });
                },
                itemBuilder: (context, index) {
                  final ws = orderedWorkspaces[index];
                  return _ProjectListItem(
                    key: ValueKey(ws.id),
                    index: index,
                    workspace: ws,
                    onTap: () {
                      final location = Uri(
                        path: '/h/${widget.serverId}/new-chat',
                        queryParameters: {
                          'cwd': ws.workspaceDirectory,
                          'workspaceId': ws.id,
                          'name': ws.projectDisplayName,
                          'fromProjects': '1',
                        },
                      ).toString();
                      context.go(location);
                    },
                    onDismissed: () => _deleteWorkspace(ws),
                  );
                },
              ),
            )
          else
            Expanded(child: SizedBox.shrink()),
          SafeArea(
            bottom: bottomPadding > 0,
            child: Padding(
              padding: bottomPadding > 0
                  ? const EdgeInsets.fromLTRB(16, 16, 16, 0)
                  : const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () =>
                      context.push('/h/${widget.serverId}/project-directory'),
                  icon: const Icon(Icons.add),
                  label: Text(context.l10n.addProject),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProjectListItem extends StatefulWidget {
  final WorkspaceDescriptor workspace;
  final VoidCallback onTap;
  final VoidCallback onDismissed;
  final int index;

  const _ProjectListItem({
    required this.workspace,
    required this.onTap,
    required this.onDismissed,
    required this.index,
    super.key,
  });

  @override
  State<_ProjectListItem> createState() => _ProjectListItemState();
}

class _ProjectListItemState extends State<_ProjectListItem> {
  bool _pressed = false;
  double _dragOffset = 0;
  bool _revealed = false;

  static const double _kRevealThreshold = 60.0;
  static const double _kMaxDrag = 100.0;
  static const double _kRevealedOffset = 80.0;

  void _setPressed(bool value) {
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  void _resetSwipe() {
    setState(() {
      _dragOffset = 0;
      _revealed = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pressedColor = Color.lerp(
      theme.colorScheme.surface,
      theme.colorScheme.onSurface,
      0.06,
    )!;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: theme.colorScheme.outline.withValues(alpha: 0.12)),
      ),
      child: ClipRect(
        child: Stack(
          children: [
            Positioned.fill(
              child: Container(
                color: theme.colorScheme.error,
                child: Row(
                  children: [
                    const Spacer(),
                    GestureDetector(
                      onTap: widget.onDismissed,
                      child: SizedBox(
                        width: _kRevealedOffset,
                        height: double.infinity,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.delete,
                              color: theme.colorScheme.onError,
                              size: 24,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              context.l10n.delete,
                              style: TextStyle(
                                color: theme.colorScheme.onError,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            GestureDetector(
              onHorizontalDragUpdate: (details) {
                setState(() {
                  _dragOffset -= details.delta.dx;
                  _dragOffset = _dragOffset.clamp(0.0, _kMaxDrag);
                });
              },
              onHorizontalDragEnd: (details) {
                if (_dragOffset > _kRevealThreshold) {
                  setState(() {
                    _revealed = true;
                    _dragOffset = _kRevealedOffset;
                  });
                } else if (!_revealed) {
                  setState(() {
                    _dragOffset = 0;
                  });
                }
              },
              onTapCancel: () {
                setState(() {
                  _pressed = false;
                });
                if (_revealed) {
                  _resetSwipe();
                }
              },
              onTap: () {
                if (_revealed) {
                  _resetSwipe();
                  return;
                }
                if (_dragOffset < 10) {
                  widget.onTap();
                }
                setState(() {
                  _dragOffset = 0;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                transform: Matrix4.translationValues(-_dragOffset, 0, 0),
                decoration: BoxDecoration(
                  color: _pressed ? pressedColor : theme.colorScheme.surface,
                ),
                child: Row(
                  children: [
                    ReorderableDragStartListener(
                      index: widget.index,
                      child: Container(
                        width: 40,
                        height: 68,
                        alignment: Alignment.center,
                        color: Colors.transparent,
                        child: Icon(
                          Icons.menu,
                          color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                          size: 20,
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTapDown: (_) => _setPressed(true),
                        onTapUp: (_) => _setPressed(false),
                        onTapCancel: () => _setPressed(false),
                        onTap: () {
                          if (_revealed) {
                            _resetSwipe();
                            return;
                          }
                          widget.onTap();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                          child: Row(
                            children: [
                              Icon(Icons.folder, color: theme.colorScheme.onSurfaceVariant),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      widget.workspace.projectDisplayName,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: theme.textTheme.bodyLarge,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      widget.workspace.workspaceDirectory,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: theme.colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                Icons.chevron_right,
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
