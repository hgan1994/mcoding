import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'attachment_models.dart';
import 'attachment_service.dart';

class AttachmentPreviewNotifier extends StateNotifier<AsyncValue<String?>> {
  final AttachmentService _service = AttachmentService();
  String? _currentUrl;
  AttachmentMetadata? _currentAttachment;

  AttachmentPreviewNotifier() : super(const AsyncValue.data(null));

  Future<void> resolve(AttachmentMetadata attachment) async {
    if (_currentAttachment?.id == attachment.id &&
        _currentAttachment?.storageKey == attachment.storageKey) {
      return;
    }
    // Release previous URL if attachment changed.
    await _releaseCurrent();
    _currentAttachment = attachment;
    state = const AsyncValue.loading();
    try {
      final url = await _service.resolveAttachmentPreviewUrl(attachment);
      _currentUrl = url;
      state = AsyncValue.data(url);
    } catch (err, st) {
      state = AsyncValue.error(err, st);
    }
  }

  Future<void> clear() async {
    await _releaseCurrent();
    _currentAttachment = null;
    state = const AsyncValue.data(null);
  }

  Future<void> _releaseCurrent() async {
    final url = _currentUrl;
    final attachment = _currentAttachment;
    if (url != null && attachment != null) {
      try {
        await _service.releaseAttachmentPreviewUrl(attachment, url);
      } catch (_) {}
    }
    _currentUrl = null;
  }

  @override
  void dispose() {
    _releaseCurrent();
    super.dispose();
  }
}

final attachmentPreviewProvider =
    StateNotifierProvider.family<AttachmentPreviewNotifier, AsyncValue<String?>, String>(
  (ref, attachmentId) {
    final notifier = AttachmentPreviewNotifier();
    ref.onDispose(() => notifier.dispose());
    return notifier;
  },
);
