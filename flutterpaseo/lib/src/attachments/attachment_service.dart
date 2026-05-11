import 'attachment_models.dart';
import 'native_attachment_store.dart';

class AttachmentService {
  static final AttachmentService _instance = AttachmentService._internal();
  factory AttachmentService() => _instance;
  AttachmentService._internal();

  AttachmentStore? _store;

  Future<AttachmentStore> _getStore() async {
    return _store ??= NativeAttachmentStore();
  }

  Future<AttachmentMetadata> persistAttachmentFromBytes({
    required List<int> bytes,
    String? mimeType,
    String? fileName,
    String? id,
  }) async {
    final store = await _getStore();
    return store.save(
      SaveAttachmentInput(
        id: id,
        mimeType: mimeType,
        fileName: fileName,
        source: BytesDataSource(bytes),
      ),
    );
  }

  Future<AttachmentMetadata> persistAttachmentFromBase64({
    required String base64,
    String? mimeType,
    String? fileName,
    String? id,
  }) async {
    final store = await _getStore();
    return store.save(
      SaveAttachmentInput(
        id: id,
        mimeType: mimeType,
        fileName: fileName,
        source: Base64DataSource(base64),
      ),
    );
  }

  Future<AttachmentMetadata> persistAttachmentFromDataUrl({
    required String dataUrl,
    String? mimeType,
    String? fileName,
    String? id,
  }) async {
    final store = await _getStore();
    return store.save(
      SaveAttachmentInput(
        id: id,
        mimeType: mimeType,
        fileName: fileName,
        source: DataUrlDataSource(dataUrl),
      ),
    );
  }

  Future<AttachmentMetadata> persistAttachmentFromFileUri({
    required String uri,
    String? mimeType,
    String? fileName,
    String? id,
  }) async {
    final store = await _getStore();
    return store.save(
      SaveAttachmentInput(
        id: id,
        mimeType: mimeType,
        fileName: fileName,
        source: FileUriDataSource(uri),
      ),
    );
  }

  Future<List<Map<String, String>>?> encodeAttachmentsForSend(
    List<AttachmentMetadata>? attachments,
  ) async {
    if (attachments == null || attachments.isEmpty) return null;
    final store = await _getStore();
    final results = <Map<String, String>>[];
    for (final attachment in attachments) {
      try {
        final data = await store.encodeBase64(attachment);
        final encoded = <String, String>{
          'data': data,
          'mimeType': attachment.mimeType,
          'id': attachment.id,
          'storageKey': attachment.storageKey,
        };
        final fileName = attachment.fileName;
        if (fileName != null && fileName.isNotEmpty) {
          encoded['fileName'] = fileName;
        }
        results.add(encoded);
      } catch (error) {
        // Log and skip failed attachments.
        // ignore: avoid_print
        print(
          '[attachments] Failed to encode attachment for send: ${attachment.id}, $error',
        );
      }
    }
    return results.isEmpty ? null : results;
  }

  Future<String> resolveAttachmentPreviewUrl(
    AttachmentMetadata attachment,
  ) async {
    final store = await _getStore();
    return store.resolvePreviewUrl(attachment);
  }

  Future<void> releaseAttachmentPreviewUrl(
    AttachmentMetadata attachment,
    String url,
  ) async {
    final store = await _getStore();
    await store.releasePreviewUrl(attachment, url);
  }

  Future<void> deleteAttachments(List<AttachmentMetadata>? attachments) async {
    if (attachments == null || attachments.isEmpty) return;
    final store = await _getStore();
    for (final attachment in attachments) {
      try {
        await store.delete(attachment);
      } catch (error) {
        // ignore: avoid_print
        print(
          '[attachments] Failed to delete attachment: ${attachment.id}, $error',
        );
      }
    }
  }

  Future<void> garbageCollectAttachments(Set<String> referencedIds) async {
    final store = await _getStore();
    await store.garbageCollect(referencedIds);
  }
}
