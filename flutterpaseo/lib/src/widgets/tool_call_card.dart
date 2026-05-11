import 'package:flutter/material.dart';

import '../models/stream.dart';
import '../utils/tool_call_detail_state.dart';
import '../utils/tool_call_display.dart';
import '../utils/tool_call_icon.dart';
import '../utils/tool_call_parsers.dart';
import 'simple_diff_viewer.dart';

class ToolCallCard extends StatefulWidget {
  final ToolCallItem item;

  const ToolCallCard({super.key, required this.item});

  @override
  State<ToolCallCard> createState() => _ToolCallCardState();
}

class _ToolCallCardState extends State<ToolCallCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final data = widget.item.payload.data;
    final status = (data['status'] ?? 'running') as String;
    final detail = data['detail'] as Map<String, dynamic>?;
    final error = data['error'];

    final model = buildToolCallDisplayModel(data);
    final displayName = model.displayName;
    final summary = model.summary;
    final errorText = model.errorText;
    final icon = resolveToolCallIcon(data['name'] as String? ?? '', detail);
    final isLoading = status == 'running' || status == 'executing';
    final isPending = isPendingToolCallDetail(
      detail: detail,
      status: status,
      error: error,
    );
    final canExpand =
        errorText != null || hasMeaningfulToolCallDetail(detail) || isPending;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 2),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.35),
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: canExpand
              ? () => setState(() => _expanded = !_expanded)
              : null,
          child: AnimatedSize(
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeOutCubic,
            alignment: Alignment.topCenter,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildHeader(
                  theme: theme,
                  icon: icon,
                  displayName: displayName,
                  summary: summary,
                  isLoading: isLoading,
                  isError: status == 'failed' || status == 'error',
                  canExpand: canExpand,
                ),
                if (_expanded && canExpand)
                  _buildExpanded(theme, errorText, detail, isPending),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader({
    required ThemeData theme,
    required IconData icon,
    required String displayName,
    required String? summary,
    required bool isLoading,
    required bool isError,
    required bool canExpand,
  }) {
    final foreground = isError
        ? theme.colorScheme.error
        : theme.colorScheme.onSurfaceVariant;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: foreground.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Center(child: Icon(icon, size: 14, color: foreground)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Row(
              children: [
                Flexible(
                  child: Text(
                    displayName,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: isError ? theme.colorScheme.error : null,
                      fontWeight: FontWeight.w600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (summary != null && summary.isNotEmpty) ...[
                  const SizedBox(width: 6),
                  Flexible(
                    flex: 2,
                    child: Text(
                      summary,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (isLoading) ...[
            const SizedBox(width: 8),
            SizedBox(
              width: 13,
              height: 13,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: theme.colorScheme.primary,
              ),
            ),
          ] else if (canExpand) ...[
            const SizedBox(width: 4),
            Icon(
              _expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
              size: 18,
              color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.8),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildExpanded(
    ThemeData theme,
    String? errorText,
    Map<String, dynamic>? detail,
    bool isPending,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Divider(
            height: 1,
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.35),
          ),
          const SizedBox(height: 10),
          if (errorText != null)
            _ErrorBlock(errorText: errorText)
          else if (isPending)
            LinearProgressIndicator(
              borderRadius: BorderRadius.circular(4),
              minHeight: 2,
            )
          else if (detail != null)
            ..._buildDetails(theme, detail)
          else
            Text(
              'No details',
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _buildDetails(ThemeData theme, Map<String, dynamic> detail) {
    final type = detail['type'] as String?;
    final details = <Widget>[];

    void addPath() {
      final filePath =
          _readString(detail['filePath']) ??
          _readString(detail['path']) ??
          _readString(detail['file']);
      if (filePath == null) return;
      details.add(
        _DetailRow(
          label: 'Path',
          child: _MonospaceText(text: filePath, selectable: true),
        ),
      );
    }

    switch (type) {
      case 'read':
        addPath();
        final content = _readString(detail['content']);
        if (content != null) {
          details.add(
            _DetailRow(
              label: 'Content',
              child: _CodeBlock(text: content),
            ),
          );
        }
      case 'edit':
        addPath();
        final unifiedDiff = _readString(detail['unifiedDiff']);
        if (unifiedDiff != null) {
          details.add(
            _DetailRow(
              label: 'Diff',
              child: SimpleDiffViewer(
                diffLines: parseUnifiedDiff(unifiedDiff),
                maxHeight: 260,
              ),
            ),
          );
        } else {
          final oldString = _readString(detail['oldString']);
          final newString = _readString(detail['newString']);
          if (oldString != null || newString != null) {
            details.add(
              _DetailRow(
                label: 'Diff',
                child: SimpleDiffViewer(
                  diffLines: buildLineDiff(oldString ?? '', newString ?? ''),
                  maxHeight: 260,
                ),
              ),
            );
          }
        }
      case 'write':
        addPath();
        final content = _readString(detail['content']);
        if (content != null) {
          details.add(
            _DetailRow(
              label: 'Content',
              child: _CodeBlock(text: content),
            ),
          );
        }
      case 'shell':
        final command = _readString(detail['command']);
        if (command != null) {
          details.add(
            _DetailRow(
              label: 'Command',
              child: _CodeBlock(text: command),
            ),
          );
        }
        final output =
            _readString(detail['output']) ?? _readString(detail['result']);
        if (output != null) {
          details.add(
            _DetailRow(
              label: 'Output',
              child: _CodeBlock(text: output),
            ),
          );
        }
      case 'search':
        final query = _readString(detail['query']);
        if (query != null) {
          details.add(
            _DetailRow(
              label: 'Query',
              child: _MonospaceText(text: query),
            ),
          );
        }
      case 'fetch':
        final url = _readString(detail['url']);
        if (url != null) {
          details.add(
            _DetailRow(
              label: 'URL',
              child: _MonospaceText(text: url),
            ),
          );
        }
      case 'unknown':
        final input = detail['input'];
        final output = detail['output'];
        final inputText = _formatUnknownValue(input);
        final outputText = _formatUnknownValue(output);
        if (inputText != null) {
          details.add(
            _DetailRow(
              label: 'Input',
              child: _TextBlock(text: inputText),
            ),
          );
        }
        if (outputText != null) {
          details.add(
            _DetailRow(
              label: 'Output',
              child: _TextBlock(text: outputText),
            ),
          );
        }
      default:
        addPath();
        for (final key in const [
          'command',
          'query',
          'url',
          'content',
          'output',
          'result',
        ]) {
          final value = _readString(detail[key]);
          if (value == null) continue;
          details.add(
            _DetailRow(
              label: key[0].toUpperCase() + key.substring(1),
              child: _TextBlock(text: value),
            ),
          );
        }
    }

    if (details.isEmpty) {
      details.add(
        Text(
          'No details',
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }

    return details;
  }
}

String? _readString(dynamic value) {
  if (value is String && value.trim().isNotEmpty) return value;
  return null;
}

String? _formatUnknownValue(dynamic value) {
  if (value == null) return null;
  if (value is String) return value.trim().isEmpty ? null : value;
  return value.toString();
}

class _ErrorBlock extends StatelessWidget {
  final String errorText;

  const _ErrorBlock({required this.errorText});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        errorText,
        style: theme.textTheme.labelSmall?.copyWith(
          color: theme.colorScheme.onErrorContainer,
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final Widget child;

  const _DetailRow({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          child,
        ],
      ),
    );
  }
}

class _MonospaceText extends StatelessWidget {
  final String text;
  final bool selectable;

  const _MonospaceText({required this.text, this.selectable = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final style = theme.textTheme.labelSmall?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
      fontFamily: 'monospace',
    );
    if (selectable) {
      return SelectableText(text, style: style);
    }
    return Text(text, style: style);
  }
}

class _TextBlock extends StatelessWidget {
  final String text;

  const _TextBlock({required this.text});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Text(
      text,
      maxLines: 12,
      overflow: TextOverflow.ellipsis,
      style: theme.textTheme.labelSmall?.copyWith(
        color: theme.colorScheme.onSurfaceVariant,
        height: 1.45,
      ),
    );
  }
}

class _CodeBlock extends StatelessWidget {
  final String text;

  const _CodeBlock({required this.text});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxHeight: 260),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(10),
      ),
      child: SingleChildScrollView(
        child: SelectableText(
          text,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurface,
            fontFamily: 'monospace',
            height: 1.45,
          ),
        ),
      ),
    );
  }
}
