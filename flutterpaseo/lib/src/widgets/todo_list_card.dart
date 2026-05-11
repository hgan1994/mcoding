import 'package:flutter/material.dart';
import '../models/stream.dart';

class TodoListCard extends StatelessWidget {
  final TodoListItem item;

  const TodoListCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final completedCount = item.items.where((e) => e.completed).length;
    final totalCount = item.items.length;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.checklist, size: 18, color: theme.colorScheme.primary),
              const SizedBox(width: 8),
              Text('Todo', style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
              const Spacer(),
              Text(
                '$completedCount/$totalCount completed',
                style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ),
          if (item.items.isNotEmpty) ...[
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: totalCount == 0 ? 0 : completedCount / totalCount,
                backgroundColor: theme.colorScheme.surfaceContainerLow,
                valueColor: AlwaysStoppedAnimation<Color>(
                  completedCount == totalCount
                      ? Colors.green
                      : theme.colorScheme.primary,
                ),
                minHeight: 4,
              ),
            ),
            const SizedBox(height: 8),
          ],
          ...item.items.map((entry) => _TodoEntryRow(entry: entry)),
        ],
      ),
    );
  }
}

class _TodoEntryRow extends StatelessWidget {
  final TodoEntry entry;

  const _TodoEntryRow({required this.entry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            entry.completed ? Icons.check_box : Icons.check_box_outline_blank,
            size: 18,
            color: entry.completed ? Colors.green : theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              entry.text,
              style: theme.textTheme.bodySmall?.copyWith(
                decoration: entry.completed ? TextDecoration.lineThrough : null,
                color: entry.completed ? theme.colorScheme.onSurfaceVariant : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
