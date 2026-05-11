import 'dart:math';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

import '../attachments/attachment_utils.dart';
import '../models/stream.dart';
import '../utils/markdown_styles.dart';
import '../attachments/attachment_lightbox.dart';
import '../l10n_ext.dart';
import 'tool_call_card.dart';
import 'todo_list_card.dart';

class AgentStreamView extends ConsumerStatefulWidget {

  final String serverId;
  final String agentId;
  final List<StreamItem> items;
  final ScrollController scrollController;
  final bool isAgentWorking;
  final VoidCallback? onLoadMore;
  final ValueChanged<String>? onQuote;

  const AgentStreamView({
    super.key,
    required this.serverId,
    required this.agentId,
    required this.items,
    required this.scrollController,
    this.isAgentWorking = false,
    this.onLoadMore,
    this.onQuote,
  });

  @override
  ConsumerState<AgentStreamView> createState() => _AgentStreamViewState();
}

class _AgentStreamViewState extends ConsumerState<AgentStreamView> {
  bool _lastWorkingIndicatorVisible = false;

  @override
  void initState() {
    super.initState();
    if (widget.onLoadMore != null) {
      widget.scrollController.addListener(_onScroll);
    }
    _lastWorkingIndicatorVisible = _showWorkingIndicatorFor(widget.items);
  }

  @override
  void dispose() {
    if (widget.onLoadMore != null) {
      widget.scrollController.removeListener(_onScroll);
    }
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant AgentStreamView oldWidget) {
    super.didUpdateWidget(oldWidget);
    final isVisibleNow = _showWorkingIndicatorFor(widget.items);
    final becameVisible = !_lastWorkingIndicatorVisible && isVisibleNow;
    _lastWorkingIndicatorVisible = isVisibleNow;

    // Check if items list changed (length or content)
    bool itemsChanged = false;
    if (oldWidget.items.length != widget.items.length) {
      itemsChanged = true;
    } else if (oldWidget.items.isNotEmpty && widget.items.isNotEmpty) {
      itemsChanged = oldWidget.items.last != widget.items.last;
    }

    // When agent is working, scroll on any content change
    if (widget.isAgentWorking && (becameVisible || itemsChanged)) {
      _scrollToBottom();
    }
  }

  void _onScroll() {
    if (widget.scrollController.position.pixels <= 50) {
      widget.onLoadMore?.call();
    }
  }

  bool _shouldShowTimestamp(List<StreamItem> items, int index) {
    if (index == 0) return true;
    final current = items[index];
    final previous = items[index - 1];
    final diff = current.timestamp.difference(previous.timestamp);
    if (diff.inMinutes >= 5) return true;
    return false;
  }

  double _itemSpacing(List<StreamItem> items, int index) {
    if (index == items.length - 1) return 0;
    final current = items[index];
    final next = items[index + 1];
    final switchesBetweenUserAndAssistant =
        (current is UserMessageItem && next is AssistantMessageItem) ||
        (current is AssistantMessageItem && next is UserMessageItem);
    return switchesBetweenUserAndAssistant ? 10 : 4;
  }

  List<StreamItem> get _displayItems => _coalesceAssistantBlocks(widget.items);

  bool get _showWorkingIndicator => _showWorkingIndicatorFor(_displayItems);

  bool _showWorkingIndicatorFor(List<StreamItem> items) =>
      widget.isAgentWorking && _isAwaitingAssistantMessage(items);

  bool _isAwaitingAssistantMessage(List<StreamItem> items) {
    final lastUserIndex = items.lastIndexWhere(
      (item) => item is UserMessageItem,
    );
    if (lastUserIndex < 0) {
      return false;
    }

    for (final item in items.skip(lastUserIndex + 1)) {
      if (item is ThoughtItem || item is ToolCallItem || item is TodoListItem) {
        return false;
      }
      if (item is AssistantMessageItem && item.text.trim().isNotEmpty) {
        return false;
      }
    }

    return true;
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !widget.scrollController.hasClients) return;
      try {
        final position = widget.scrollController.position;
        widget.scrollController.animateTo(
          position.maxScrollExtent,
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
        );
      } catch (_) {
        // Ignore scroll errors during keyboard transitions
      }
    });
  }

  List<StreamItem> _coalesceAssistantBlocks(List<StreamItem> items) {
    if (items.length < 2) return items;

    final next = <StreamItem>[];
    for (final item in items) {
      final previous = next.isNotEmpty ? next.last : null;
      if (previous is AssistantMessageItem &&
          item is AssistantMessageItem &&
          _isSameAssistantBlockGroup(previous, item)) {
        next[next.length - 1] = previous.copyWith(
          text: _joinAssistantBlocks(previous.text, item.text),
          timestamp: item.timestamp,
          blockGroupId: previous.blockGroupId ?? item.blockGroupId,
        );
        continue;
      }
      next.add(item);
    }
    return next;
  }

  bool _isSameAssistantBlockGroup(
    AssistantMessageItem previous,
    AssistantMessageItem next,
  ) {
    final previousGroup = previous.blockGroupId;
    final nextGroup = next.blockGroupId;
    return previousGroup != null &&
        nextGroup != null &&
        previousGroup == nextGroup;
  }

  String _joinAssistantBlocks(String previous, String next) {
    if (previous.isEmpty) return next;
    if (next.isEmpty) return previous;
    return '$previous\n\n$next';
  }

  Widget _buildTimestampDivider(BuildContext context, DateTime timestamp) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final diff = now.difference(timestamp);
    String label;
    if (diff.inMinutes < 1) {
      label = context.l10n.justNow;
    } else if (diff.inHours < 1) {
      label = context.l10n.minutesAgo(diff.inMinutes);
    } else if (diff.inDays < 1) {
      label = context.l10n.hoursAgo(diff.inHours);
    } else if (diff.inDays < 7) {
      label = context.l10n.daysAgo(diff.inDays);
    } else {
      label = '${timestamp.month}/${timestamp.day}';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 1,
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.6,
                ),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Container(
              height: 1,
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final displayItems = _displayItems;
    if (displayItems.isEmpty && !_showWorkingIndicator) {
      return _buildEmptyState(context);
    }

    return ScrollConfiguration(
      behavior: ScrollConfiguration.of(context).copyWith(overscroll: false),
      child: ListView.builder(
        controller: widget.scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        clipBehavior: Clip.hardEdge,
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
        itemCount: displayItems.length + (_showWorkingIndicator ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == displayItems.length) {
            return const Padding(
              padding: EdgeInsets.only(top: 10, bottom: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: _WorkingIndicatorBubble(),
              ),
            );
          }
          final showTimestamp = _shouldShowTimestamp(displayItems, index);
          return Column(
            children: [
              if (showTimestamp)
                _buildTimestampDivider(context, displayItems[index].timestamp),
              Padding(
                padding: EdgeInsets.only(
                  bottom: _itemSpacing(displayItems, index),
                ),
                child: _buildItem(context, displayItems[index]),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const _AnimatedEmptyIcon(),
            const SizedBox(height: 20),
            Text(
              context.l10n.startConversation,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.l10n.enterYourQuestion,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.7,
                ),
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItem(BuildContext context, StreamItem item) {
    return switch (item) {
      UserMessageItem() => _buildUserMessage(context, item),
      AssistantMessageItem() => _AssistantMessageWidget(
        text: item.text,
        onQuote: widget.onQuote,
      ),
      ThoughtItem() => _buildThought(context, item),
      ToolCallItem() => ToolCallCard(item: item),
      TodoListItem() => TodoListCard(item: item),
      ActivityLogItem() => _buildActivityLog(context, item),
      _ => const SizedBox.shrink(),
    };
  }

  void _showUserMessageContextMenu(
    BuildContext context,
    Offset position,
    UserMessageItem item,
  ) {
    final overlay = Overlay.of(context);
    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (_) => _ContextMenuOverlay(
        position: position,
        onDismiss: () => entry.remove(),
        children: [
          _ContextMenuItem(
            icon: Icons.copy_rounded,
            label: context.l10n.copy,
            onTap: () {
              entry.remove();
              Clipboard.setData(ClipboardData(text: item.text));
            },
          ),
          if (widget.onQuote != null)
            _ContextMenuItem(
              icon: Icons.format_quote_rounded,
              label: context.l10n.quote,
              onTap: () {
                entry.remove();
                widget.onQuote!(item.text);
              },
            ),
        ],
      ),
    );
    overlay.insert(entry);
  }

  Widget _buildUserMessage(BuildContext context, UserMessageItem item) {
    final theme = Theme.of(context);
    final images = item.images;
    final hasImages = images != null && images.isNotEmpty;

    Widget content = Text(
      item.text,
      style: theme.textTheme.bodyMedium?.copyWith(
        color: theme.colorScheme.onPrimary,
        height: 1.6,
        fontSize: 15,
      ),
    );

    if (hasImages) {
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (item.text.isNotEmpty) content,
          if (item.text.isNotEmpty) const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: images.map((img) {
              final uri = _imageUriFromMap(img);
              return ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: _buildUserMessageImage(context, uri, theme),
              );
            }).toList(),
          ),
        ],
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.75,
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        theme.colorScheme.primary,
                        theme.colorScheme.primary.withValues(alpha: 0.85),
                      ],
                    ),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(22),
                      topRight: Radius.circular(22),
                      bottomLeft: Radius.circular(22),
                      bottomRight: Radius.circular(6),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: theme.colorScheme.primary.withValues(alpha: 0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: DefaultTextStyle(
                    style: theme.textTheme.bodyMedium!.copyWith(
                      color: theme.colorScheme.onPrimary,
                      height: 1.6,
                    ),
                    child: content,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: item.text));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(context.l10n.copied),
                        duration: Duration(seconds: 1),
                      ),
                    );
                  },
                  child: Icon(
                    Icons.copy_rounded,
                    size: 18,
                    color: theme.colorScheme.onSurfaceVariant.withValues(
                      alpha: 0.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildUserMessageImage(
    BuildContext context,
    String uri,
    ThemeData theme,
  ) {
    final trimmedUri = uri.trim();
    Widget image;
    if (trimmedUri.isEmpty) {
      image = _imagePlaceholder(theme);
    } else if (trimmedUri.startsWith('file://') || trimmedUri.startsWith('/')) {
      image = Image.file(
        File(trimmedUri.replaceFirst('file://', '')),
        width: 120,
        height: 120,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _imagePlaceholder(theme),
      );
    } else if (trimmedUri.startsWith('data:')) {
      image = _buildDataImage(trimmedUri, theme, BoxFit.cover);
    } else {
      image = Image.network(
        trimmedUri,
        width: 120,
        height: 120,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _imagePlaceholder(theme),
      );
    }

    return GestureDetector(
      onTap: () => _openLightbox(context, trimmedUri),
      child: image,
    );
  }

  String _imageUriFromMap(Map<String, dynamic> image) {
    final explicitUri =
        _stringValue(image, 'uri') ??
        _stringValue(image, 'storageKey') ??
        _stringValue(image, 'url');
    if (explicitUri != null && explicitUri.trim().isNotEmpty) {
      return explicitUri;
    }

    final data = _stringValue(image, 'data');
    if (data == null || data.trim().isEmpty) return '';
    if (data.trim().startsWith('data:')) return data.trim();
    final mimeType = _stringValue(image, 'mimeType') ?? 'image/jpeg';
    return 'data:$mimeType;base64,${data.trim()}';
  }

  String? _stringValue(Map<String, dynamic> map, String key) {
    final value = map[key];
    return value is String ? value : null;
  }

  Widget _buildDataImage(String uri, ThemeData theme, BoxFit fit) {
    final parsed = tryParseImageDataUrl(uri);
    if (parsed == null) return _imagePlaceholder(theme);
    try {
      return Image.memory(
        base64Decode(parsed.base64),
        width: 120,
        height: 120,
        fit: fit,
        gaplessPlayback: true,
        errorBuilder: (context, error, stackTrace) => _imagePlaceholder(theme),
      );
    } catch (_) {
      return _imagePlaceholder(theme);
    }
  }

  void _openLightbox(BuildContext context, String uri) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => AttachmentLightbox(
        imageUri: uri,
        onClose: () => Navigator.of(context).pop(),
      ),
    );
  }

  Widget _imagePlaceholder(ThemeData theme) {
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Icon(Icons.broken_image, size: 24),
    );
  }

  Widget _buildThought(BuildContext context, ThoughtItem item) {
    if (item.status == ThoughtStatus.ready) {
      return ToolCallCard(
        item: ToolCallItem(
          id: '${item.id}:thinking',
          timestamp: item.timestamp,
          payload: ToolCallPayload(
            source: 'agent',
            data: {
              'provider': 'assistant',
              'callId': '${item.id}:thinking',
              'name': 'thinking',
              'status': 'completed',
              'error': null,
              'detail': {'type': 'unknown', 'input': item.text, 'output': null},
              'metadata': null,
            },
          ),
        ),
      );
    }

    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 2),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            theme.colorScheme.tertiaryContainer.withValues(alpha: 0.3),
            theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.2),
          ],
        ),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      theme.colorScheme.tertiary.withValues(alpha: 0.15),
                      theme.colorScheme.primary.withValues(alpha: 0.1),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.psychology_outlined,
                  size: 16,
                  color: theme.colorScheme.tertiary,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                context.l10n.thinking,
                style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.tertiary,
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: theme.colorScheme.tertiary,
                ),
              ),
            ],
          ),
          if (item.text.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              item.text,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.8,
                ),
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActivityLog(BuildContext context, ActivityLogItem item) {
    final theme = Theme.of(context);
    final (icon, color, bgColor) = switch (item.activityType) {
      ActivityLogType.error => (
        Icons.error_outline_rounded,
        theme.colorScheme.error,
        theme.colorScheme.errorContainer.withValues(alpha: 0.3),
      ),
      ActivityLogType.success => (
        Icons.check_circle_outline_rounded,
        Colors.green.shade700,
        Colors.green.withValues(alpha: 0.06),
      ),
      ActivityLogType.info => (
        Icons.info_outline_rounded,
        Colors.blue.shade700,
        Colors.blue.withValues(alpha: 0.06),
      ),
      ActivityLogType.system => (
        Icons.settings_outlined,
        theme.colorScheme.onSurfaceVariant,
        theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
      ),
    };

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 2),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              item.message,
              style: theme.textTheme.bodySmall?.copyWith(
                color: color,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(ThemeData theme, {required bool isUser}) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        gradient: isUser
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  theme.colorScheme.primary,
                  theme.colorScheme.primary.withValues(alpha: 0.8),
                ],
              )
            : null,
        color: isUser
            ? null
            : theme.colorScheme.secondaryContainer.withValues(alpha: 0.7),
        shape: BoxShape.circle,
        boxShadow: isUser
            ? [
                BoxShadow(
                  color: theme.colorScheme.primary.withValues(alpha: 0.25),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Center(
        child: Icon(
          isUser ? Icons.person_outline : Icons.auto_awesome,
          size: 16,
          color: isUser
              ? theme.colorScheme.onPrimary
              : theme.colorScheme.onSecondaryContainer,
        ),
      ),
    );
  }
}

class _WorkingIndicatorBubble extends StatefulWidget {
  const _WorkingIndicatorBubble();

  @override
  State<_WorkingIndicatorBubble> createState() =>
      _WorkingIndicatorBubbleState();
}

class _WorkingIndicatorBubbleState extends State<_WorkingIndicatorBubble>
    with SingleTickerProviderStateMixin {
  static const int _cycleMs = 1200;
  static const List<double> _offsets = [0, 160 / _cycleMs, 320 / _cycleMs];
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: _cycleMs),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  double _normalizePhase(double value) {
    final wrapped = value % 1;
    return wrapped < 0 ? wrapped + 1 : wrapped;
  }

  double _dotStrength(double progress, double offset) {
    final phase = _normalizePhase(progress + offset);
    if (phase <= 0.5) {
      return phase * 2;
    }
    return (1 - phase) * 2;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return DecoratedBox(
          decoration: const BoxDecoration(color: Colors.transparent),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final offset in _offsets) ...[
                  _WorkingIndicatorDot(
                    color: theme.colorScheme.onSurfaceVariant.withValues(
                      alpha: 0.72,
                    ),
                    strength: _dotStrength(_controller.value, offset),
                  ),
                  if (offset != _offsets.last) const SizedBox(width: 4),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _WorkingIndicatorDot extends StatelessWidget {
  final Color color;
  final double strength;

  const _WorkingIndicatorDot({required this.color, required this.strength});

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: 0.3 + strength * 0.7,
      child: Transform.translate(
        offset: Offset(0, -2 * strength),
        child: Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(999),
          ),
        ),
      ),
    );
  }
}

class _AssistantMessageWidget extends StatefulWidget {
  final String text;
  final ValueChanged<String>? onQuote;

  const _AssistantMessageWidget({required this.text, this.onQuote});

  @override
  State<_AssistantMessageWidget> createState() =>
      _AssistantMessageWidgetState();
}

class _AssistantMessageWidgetState extends State<_AssistantMessageWidget> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLong = widget.text.length > 600;
    final displayText = (isLong && !_expanded)
        ? '${widget.text.substring(0, 600)}...'
        : widget.text;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MarkdownBody(
            data: displayText,
            styleSheet: MarkdownStyles.build(context),
          ),
          if (isLong) ...[
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer.withValues(
                    alpha: 0.4,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _expanded ? Icons.expand_less : Icons.expand_more,
                      size: 16,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _expanded
                          ? context.l10n.collapse
                          : context.l10n.expandFullText,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ContextMenuOverlay extends StatelessWidget {
  final Offset position;
  final VoidCallback onDismiss;
  final List<Widget> children;

  const _ContextMenuOverlay({
    required this.position,
    required this.onDismiss,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Stack(
      children: [
        Positioned.fill(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: onDismiss,
            child: const SizedBox.expand(),
          ),
        ),
        Positioned(
          left: position.dx,
          top: position.dy - 4,
          child:
              FractionalOffset.fromOffsetAndSize(
                    position,
                    MediaQuery.of(context).size,
                  ).x >
                  0.6
              ? Transform.translate(
                  offset: const Offset(-160, 0),
                  child: _menuCard(theme),
                )
              : _menuCard(theme),
        ),
      ],
    );
  }

  Widget _menuCard(ThemeData theme) {
    return Material(
      elevation: 8,
      borderRadius: BorderRadius.circular(12),
      color: theme.colorScheme.surfaceContainerHigh,
      child: Container(
        constraints: const BoxConstraints(minWidth: 120),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
          ),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: children),
      ),
    );
  }
}

class _ContextMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ContextMenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(width: 10),
            Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AnimatedEmptyIcon extends StatefulWidget {
  const _AnimatedEmptyIcon();

  @override
  State<_AnimatedEmptyIcon> createState() => _AnimatedEmptyIconState();
}

class _AnimatedEmptyIconState extends State<_AnimatedEmptyIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  double _smoothSin(double value) {
    return (1 - cos(value * 2 * pi)) / 2;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final progress = _smoothSin(_controller.value);
        final scale = 0.96 + (1.04 - 0.96) * progress;
        final glowAlpha = (0.25 + (0.55 - 0.25) * progress) * 0.35;

        return Transform.scale(
          scale: scale,
          child: Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
                  theme.colorScheme.tertiaryContainer.withValues(alpha: 0.3),
                ],
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.primary.withValues(alpha: glowAlpha),
                  blurRadius: 24,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Center(
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer.withValues(
                    alpha: 0.6,
                  ),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.auto_awesome,
                  size: 28,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
