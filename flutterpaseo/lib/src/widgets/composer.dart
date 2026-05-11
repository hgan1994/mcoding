import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../l10n_ext.dart';
import '../providers/draft_provider.dart';
import '../providers/session_provider.dart';
import '../providers/voice_usage_provider.dart';
import '../models/agent.dart';
import '../attachments/attachment_models.dart';
import '../attachments/attachment_service.dart';
import '../attachments/attachment_picker.dart';
import '../attachments/composer_attachment_provider.dart';
import '../utils/keyboard_dismiss.dart';
import 'app_snack_bar.dart';
import 'agent_status_bar.dart';
import 'animated_pause_icon.dart';
import 'hold_to_talk_button.dart';

class Composer extends ConsumerStatefulWidget {
  final String serverId;
  final String agentId;
  final VoidCallback? onSend;
  final ValueNotifier<String>? quoteNotifier;

  const Composer({
    super.key,
    required this.serverId,
    required this.agentId,
    this.onSend,
    this.quoteNotifier,
  });

  @override
  ConsumerState<Composer> createState() => _ComposerState();
}

class _ComposerState extends ConsumerState<Composer> {
  static const double _topOuterRadius = 14;
  static const double _bottomOuterRadius = 24;
  static const double _controlRadius = 10;

  late final TextEditingController _inputCtrl;
  late final FocusNode _focusNode;
  bool _isComposing = false;
  bool _isSending = false;
  final AttachmentPicker _picker = AttachmentPicker();
  final AttachmentService _attachmentService = AttachmentService();

  @override
  void initState() {
    super.initState();
    _inputCtrl = TextEditingController();
    _focusNode = FocusNode();

    final draft = ref.read(draftProvider).drafts[widget.agentId];
    if (draft != null && draft.isNotEmpty) {
      _inputCtrl.text = draft;
    }

    _inputCtrl.addListener(_onTextChanged);
    _focusNode.addListener(_onFocusChanged);

    final draftAttachments = ref
        .read(draftProvider)
        .draftAttachments[widget.agentId];
    if (draftAttachments != null && draftAttachments.isNotEmpty) {
      Future.microtask(() {
        ref
            .read(composerAttachmentProvider.notifier)
            .addAttachments(widget.agentId, draftAttachments);
      });
    }

    widget.quoteNotifier?.addListener(_onQuoteChanged);
  }

  @override
  void didUpdateWidget(covariant Composer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.quoteNotifier, widget.quoteNotifier)) {
      oldWidget.quoteNotifier?.removeListener(_onQuoteChanged);
      widget.quoteNotifier?.addListener(_onQuoteChanged);
    }
  }

  @override
  void dispose() {
    widget.quoteNotifier?.removeListener(_onQuoteChanged);
    final text = _inputCtrl.text.trim();
    if (text.isNotEmpty) {
      ref
          .read(draftProvider.notifier)
          .saveDraft(widget.agentId, _inputCtrl.text);
    }
    _inputCtrl.removeListener(_onTextChanged);
    _focusNode.removeListener(_onFocusChanged);
    _inputCtrl.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onQuoteChanged() {
    final quote = widget.quoteNotifier?.value;
    if (quote == null || quote.isEmpty) return;
    final existing = _inputCtrl.text;
    _inputCtrl.text = existing.isEmpty ? quote : '$existing\n$quote';
    _focusNode.requestFocus();
    _inputCtrl.selection = TextSelection.collapsed(
      offset: _inputCtrl.text.length,
    );
  }

  void _onTextChanged() {
    final composing = _inputCtrl.text.isNotEmpty;
    if (composing != _isComposing) {
      setState(() => _isComposing = composing);
    }
    ref.read(draftProvider.notifier).saveDraft(widget.agentId, _inputCtrl.text);
  }

  void _onFocusChanged() {
    setState(() {});
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    final attachments = ref
        .read(composerAttachmentProvider)
        .forAgent(widget.agentId);
    final hasContent = text.isNotEmpty || attachments.isNotEmpty;
    if (!hasContent) return;
    dismissSoftKeyboard(context);

    setState(() => _isSending = true);

    try {
      final imagesData = await _attachmentService.encodeAttachmentsForSend(
        attachments,
      );

      await ref
          .read(sessionProvider(widget.serverId).notifier)
          .sendMessage(widget.agentId, text, images: imagesData);

      _inputCtrl.clear();
      ref.read(draftProvider.notifier).clearDraft(widget.agentId);
      ref
          .read(composerAttachmentProvider.notifier)
          .clearAttachments(widget.agentId);
      widget.onSend?.call();
    } catch (error) {
      if (mounted) {
        AppSnackBar.showError(context, 'Failed to send message: $error');
      }
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  void _cancelAgent() {
    ref
        .read(sessionProvider(widget.serverId).notifier)
        .cancelAgent(widget.agentId);
  }

  Future<void> _pickImages() async {
    final picked = await _picker.pickImages();
    if (picked != null && picked.isNotEmpty) {
      ref
          .read(composerAttachmentProvider.notifier)
          .addAttachments(widget.agentId, picked);
      ref
          .read(draftProvider.notifier)
          .saveDraftAttachments(
            widget.agentId,
            ref.read(composerAttachmentProvider).forAgent(widget.agentId),
          );
    }
  }

  void _removeAttachment(int index) {
    final attachments = ref
        .read(composerAttachmentProvider)
        .forAgent(widget.agentId);
    if (index < 0 || index >= attachments.length) return;
    final removed = attachments[index];
    ref
        .read(composerAttachmentProvider.notifier)
        .removeAttachment(widget.agentId, index);
    _attachmentService.deleteAttachments([removed]);
    final remaining = ref
        .read(composerAttachmentProvider)
        .forAgent(widget.agentId);
    if (remaining.isEmpty) {
      ref.read(draftProvider.notifier).clearDraftAttachments(widget.agentId);
    } else {
      ref
          .read(draftProvider.notifier)
          .saveDraftAttachments(widget.agentId, remaining);
    }
  }

  bool get _canSend {
    final text = _inputCtrl.text.trim();
    final attachments = ref
        .watch(composerAttachmentProvider)
        .forAgent(widget.agentId);
    return (text.isNotEmpty || attachments.isNotEmpty) && !_isSending;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final session = ref.watch(sessionProvider(widget.serverId));
    final agent = session.agents[widget.agentId];
    final isAgentRunning = agent?.status == AgentLifecycleStatus.running;
    final attachments = ref
        .watch(composerAttachmentProvider)
        .forAgent(widget.agentId);
    final isFocused = _focusNode.hasFocus;
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withValues(
              alpha: isFocused ? 0.08 : 0.03,
            ),
            blurRadius: isFocused ? 16 : 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(10, 10, 10, 14),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AgentStatusBar(serverId: widget.serverId, agentId: widget.agentId),
            if (attachments.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 6, 4, 8),
                child: SizedBox(
                  height: 68,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: attachments.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(width: 10),
                    itemBuilder: (context, index) {
                      return _AttachmentThumbnail(
                        attachment: attachments[index],
                        onRemove: () => _removeAttachment(index),
                      );
                    },
                  ),
                ),
              ),
            const SizedBox(height: 6),
            Container(
              constraints: const BoxConstraints(minHeight: 56),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerLow,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(_topOuterRadius),
                  topRight: Radius.circular(_topOuterRadius),
                  bottomLeft: Radius.circular(_bottomOuterRadius),
                  bottomRight: Radius.circular(_bottomOuterRadius),
                ),
                border: Border.all(
                  color: isFocused
                      ? theme.colorScheme.primary.withValues(alpha: 0.4)
                      : theme.colorScheme.outlineVariant.withValues(alpha: 0.2),
                  width: isFocused ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: theme.colorScheme.primary.withValues(
                      alpha: isFocused ? 0.06 : 0,
                    ),
                    blurRadius: isFocused ? 12 : 0,
                    spreadRadius: isFocused ? 1 : 0,
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Material(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(_controlRadius),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(_controlRadius),
                        onTap: _isSending ? null : _pickImages,
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surfaceContainerHighest
                                .withValues(alpha: 0.4),
                            borderRadius: BorderRadius.circular(_controlRadius),
                          ),
                          child: Icon(
                            Icons.add_photo_alternate_outlined,
                            size: 20,
                            color: theme.colorScheme.onSurfaceVariant
                                .withValues(alpha: 0.7),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: TextField(
                        controller: _inputCtrl,
                        focusNode: _focusNode,
                        decoration: InputDecoration(
                          hintText: context.l10n.inputMessage,
                          hintStyle: TextStyle(
                            color: theme.colorScheme.onSurfaceVariant
                                .withValues(alpha: 0.4),
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 9,
                          ),
                        ),
                        maxLines: 4,
                        minLines: 1,
                        textInputAction: TextInputAction.newline,
                        onChanged: (_) => _onTextChanged(),
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(right: 4, bottom: 4),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      curve: Curves.easeInOut,
                      child: Material(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(_controlRadius),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(_controlRadius),
                          onTap: isAgentRunning
                              ? _cancelAgent
                              : _canSend
                              ? _send
                              : null,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            curve: Curves.easeInOut,
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              gradient: !isAgentRunning && _canSend
                                  ? LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [
                                        theme.colorScheme.primary,
                                        theme.colorScheme.primary.withValues(
                                          alpha: 0.8,
                                        ),
                                      ],
                                    )
                                  : null,
                              color: isAgentRunning
                                  ? theme.colorScheme.error
                                  : _canSend
                                  ? null
                                  : theme.colorScheme.surfaceContainerHighest
                                        .withValues(alpha: 0.4),
                              borderRadius: BorderRadius.circular(
                                _controlRadius,
                              ),
                              boxShadow: isAgentRunning || _canSend
                                  ? [
                                      BoxShadow(
                                        color:
                                            (isAgentRunning
                                                    ? theme.colorScheme.error
                                                    : theme.colorScheme.primary)
                                                .withValues(alpha: 0.3),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: _isSending
                                ? Padding(
                                    padding: const EdgeInsets.all(10),
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: isAgentRunning
                                          ? theme.colorScheme.onError
                                          : theme.colorScheme.onPrimary,
                                    ),
                                  )
                                : isAgentRunning
                                    ? AnimatedPauseIcon(
                                        size: 20,
                                        color: theme.colorScheme.onError,
                                      )
                                    : Icon(
                                        Icons.arrow_upward_rounded,
                                        size: 20,
                                        color: _canSend
                                            ? theme.colorScheme.onPrimary
                                            : theme.colorScheme.onSurfaceVariant
                                                  .withValues(alpha: 0.3),
                                      ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            HoldToTalkButton(
              enabled: !isAgentRunning,
              maxDurationSeconds: ref.watch(voiceUsageProvider).maxDurationSeconds,
              onCheckLimit: () async {
                  final allowed = await ref
                      .read(voiceUsageProvider.notifier)
                      .checkAndIncrement();
                  if (!allowed && context.mounted) {
                    AppSnackBar.showWarning(
                      context,
                      context.l10n.voiceLimitReached,
                    );
                  }
                  return allowed;
                },
              remainingUses: ref.watch(voiceUsageProvider).isUnlimited
                  ? null
                  : ref.watch(voiceUsageProvider).remaining,
              onTranscript: (text) {
                _inputCtrl.text = text;
                _send();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _AttachmentThumbnail extends StatelessWidget {
  final AttachmentMetadata attachment;
  final VoidCallback onRemove;

  const _AttachmentThumbnail({
    required this.attachment,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final uri = attachment.storageKey;

    Widget image;
    if (uri.startsWith('file://') || uri.startsWith('/')) {
      image = Image.file(
        File(uri.replaceFirst('file://', '')),
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _placeholder(theme),
      );
    } else {
      image = Image.network(
        uri,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _placeholder(theme),
      );
    }

    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(width: 68, height: 68, child: image),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(3),
              child: const Icon(Icons.close, size: 14, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }

  Widget _placeholder(ThemeData theme) {
    return Container(
      color: theme.colorScheme.surfaceContainerHighest,
      child: const Center(child: Icon(Icons.broken_image, size: 24)),
    );
  }
}
