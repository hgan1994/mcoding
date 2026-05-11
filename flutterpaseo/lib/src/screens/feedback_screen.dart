import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../attachments/attachment_models.dart';
import '../attachments/attachment_picker.dart';
import '../attachments/attachment_service.dart';
import '../l10n_ext.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import '../theme.dart';
import '../widgets/app_snack_bar.dart';

class FeedbackScreen extends ConsumerStatefulWidget {
  const FeedbackScreen({super.key});

  @override
  ConsumerState<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends ConsumerState<FeedbackScreen> {
  static const int _maxImages = 4;

  final TextEditingController _contentController = TextEditingController();
  final AttachmentPicker _picker = AttachmentPicker();
  final AttachmentService _attachmentService = AttachmentService();

  List<AttachmentMetadata> _attachments = const [];
  bool _submitting = false;
  String? _appVersion;

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
  }

  Future<void> _loadPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    if (!mounted) return;
    setState(() => _appVersion = info.version);
  }

  @override
  void dispose() {
    _contentController.dispose();
    _attachmentService.deleteAttachments(_attachments);
    super.dispose();
  }

  Future<void> _pickImages() async {
    final remaining = _maxImages - _attachments.length;
    if (remaining <= 0) {
      AppSnackBar.showWarning(
        context,
        context.l10n.feedbackImageLimit(_maxImages),
      );
      return;
    }

    final picked = await _picker.pickImages();
    if (picked == null || picked.isEmpty || !mounted) return;

    final accepted = picked.take(remaining).toList();
    final dropped = picked.skip(remaining).toList();
    if (dropped.isNotEmpty) {
      await _attachmentService.deleteAttachments(dropped);
    }

    setState(() => _attachments = [..._attachments, ...accepted]);

    if (picked.length > remaining && mounted) {
      AppSnackBar.showWarning(
        context,
        context.l10n.feedbackImageLimit(_maxImages),
      );
    }
  }

  Future<void> _removeAttachment(int index) async {
    if (index < 0 || index >= _attachments.length) return;
    final removed = _attachments[index];
    setState(() {
      _attachments = [
        ..._attachments.take(index),
        ..._attachments.skip(index + 1),
      ];
    });
    await _attachmentService.deleteAttachments([removed]);
  }

  Future<void> _submit() async {
    final token = ref.read(authProvider).token;
    if (token == null) return;

    final content = _contentController.text.trim();
    if (content.isEmpty) {
      AppSnackBar.showWarning(context, context.l10n.feedbackEmptyContent);
      return;
    }

    setState(() => _submitting = true);
    try {
      final screenshots =
          await _attachmentService.encodeAttachmentsForSend(_attachments);
      await ref.read(authServiceProvider).submitFeedback(
        token: token,
        content: content,
        page: '/settings/feedback',
        appVersion: _appVersion,
        platform: defaultTargetPlatform.name,
        screenshots: screenshots
            ?.map(
              (item) => FeedbackScreenshotPayload(
                data: item['data'] ?? '',
                mimeType: item['mimeType'],
                fileName: item['fileName'],
              ),
            )
            .toList(),
      );

      final attachments = _attachments;
      _attachments = const [];
      _contentController.clear();
      await _attachmentService.deleteAttachments(attachments);

      if (!mounted) return;
      setState(() {});
      AppSnackBar.showSuccess(context, context.l10n.feedbackSubmitSuccess);
      context.pop();
    } on AuthApiException catch (error) {
      if (!mounted) return;
      AppSnackBar.showError(
        context,
        context.l10n.feedbackSubmitFailed(error.message),
      );
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.showError(
        context,
        context.l10n.feedbackSubmitFailed(error.toString()),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
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
          title: Text(context.l10n.feedback),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: theme.colorScheme.outline.withValues(alpha: 0.12)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.l10n.feedback,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      context.l10n.feedbackEntryHint,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(
                context.l10n.feedbackContentLabel,
                style: theme.textTheme.titleSmall,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _contentController,
                minLines: 6,
                maxLines: 10,
                maxLength: 2000,
                decoration: InputDecoration(
                  hintText: context.l10n.feedbackContentHint,
                  border: const OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    context.l10n.feedbackScreenshots,
                    style: theme.textTheme.titleSmall,
                  ),
                  Text(
                    '${_attachments.length}/$_maxImages',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _submitting ? null : _pickImages,
                icon: const Icon(Icons.add_photo_alternate_outlined),
                label: Text(context.l10n.feedbackAddScreenshots),
              ),
              const SizedBox(height: 8),
              Text(
                context.l10n.feedbackImageLimit(_maxImages),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              if (_attachments.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    for (var index = 0; index < _attachments.length; index++)
                      _FeedbackAttachmentTile(
                        attachment: _attachments[index],
                        onRemove: () => _removeAttachment(index),
                      ),
                  ],
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            const SizedBox(width: 12),
                            Text(context.l10n.feedbackSubmitting),
                          ],
                        )
                      : Text(context.l10n.submitFeedback),
                ),
              ),
            ],
          ),
         ),
       ),
      ),
    );
  }
}

class _FeedbackAttachmentTile extends StatelessWidget {
  final AttachmentMetadata attachment;
  final VoidCallback onRemove;

  const _FeedbackAttachmentTile({
    required this.attachment,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final path = attachment.storageKey.replaceFirst('file://', '');
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.file(
            File(path),
            width: 96,
            height: 96,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          top: -8,
          right: -8,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onRemove,
              borderRadius: BorderRadius.circular(999),
              child: Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  color: Colors.black87,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 16, color: Colors.white),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
