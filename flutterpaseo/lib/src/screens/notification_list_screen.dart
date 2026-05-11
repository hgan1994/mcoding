import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../l10n_ext.dart';
import '../providers/notification_provider.dart';
import '../theme.dart';
import '../widgets/app_snack_bar.dart';

class NotificationListScreen extends ConsumerStatefulWidget {
  const NotificationListScreen({super.key});

  @override
  ConsumerState<NotificationListScreen> createState() =>
      _NotificationListScreenState();
}

class _NotificationListScreenState
    extends ConsumerState<NotificationListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(notificationProvider.notifier).load());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final notifState = ref.watch(notificationProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/settings');
            }
          },
        ),
        title: Text(context.l10n.notifications),
        actions: [
          if (notifState.unreadCount > 0)
            TextButton(
              onPressed: () async {
                await ref.read(notificationProvider.notifier).markAllAsRead();
                if (!context.mounted) return;
                AppSnackBar.showSuccess(
                  context,
                  context.l10n.allNotificationsRead,
                );
              },
              child: Text(context.l10n.markAllRead),
            ),
        ],
      ),
      body: _buildBody(theme, notifState),
    );
  }

  Widget _buildBody(ThemeData theme, NotificationState notifState) {
    if (notifState.isLoading && notifState.items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (notifState.error != null && notifState.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              notifState.error!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.error,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: () =>
                  ref.read(notificationProvider.notifier).load(),
              child: Text(context.l10n.retry),
            ),
          ],
        ),
      );
    }

    if (notifState.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.notifications_none_outlined,
              size: 64,
              color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              context.l10n.noNotifications,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(notificationProvider.notifier).load(),
      child: ListView.builder(
        itemCount: notifState.items.length + (notifState.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == notifState.items.length) {
            ref.read(notificationProvider.notifier).loadMore();
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            );
          }

          final item = notifState.items[index];
          final typeIcon = switch (item.type) {
            'update' => Icons.system_update_outlined,
            'promotion' => Icons.local_offer_outlined,
            'account' => Icons.account_circle_outlined,
            _ => Icons.notifications_outlined,
          };

          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: theme.colorScheme.outline.withValues(alpha: 0.12)),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () async {
                  await context.push('/notifications/${item.id}');
                  if (mounted && !item.isRead) {
                    ref.read(notificationProvider.notifier).markAsRead(item.id);
                  }
                },
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: item.isRead
                              ? theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5)
                              : theme.colorScheme.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: Center(
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Icon(
                                typeIcon,
                                color: item.isRead
                                    ? theme.colorScheme.onSurfaceVariant
                                    : theme.colorScheme.primary,
                                size: 20,
                              ),
                              if (!item.isRead)
                                Positioned(
                                  right: -2,
                                  top: -2,
                                  child: Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.error,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.title,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight:
                                    item.isRead ? FontWeight.normal : FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item.summary ?? item.content,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatDate(item.createdAt),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _formatDate(String isoDate) {
    if (isoDate.isEmpty) return '';
    try {
      final dt = DateTime.parse(isoDate).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inDays == 0) {
        return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      } else if (diff.inDays == 1) {
        return context.l10n.yesterday;
      } else if (diff.inDays < 7) {
        return context.l10n.daysAgo(diff.inDays);
      } else {
        return '${dt.month}/${dt.day}';
      }
    } catch (_) {
      return '';
    }
  }
}
