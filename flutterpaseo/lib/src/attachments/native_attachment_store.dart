import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';

import 'attachment_models.dart';
import 'attachment_utils.dart';

class NativeAttachmentStore implements AttachmentStore {
  @override
  AttachmentStorageType get storageType => AttachmentStorageType.nativeFile;

  static const _baseDirectoryName = 'paseo-native-attachments';

  Future<Directory> _getBaseDirectory() async {
    final cacheDir = await getTemporaryDirectory();
    final baseDir = Directory('${cacheDir.path}/$_baseDirectoryName');
    if (!await baseDir.exists()) {
      await baseDir.create(recursive: true);
    }
    return baseDir;
  }

  String _attachmentPath(AttachmentMetadata attachment) {
    return attachment.storageKey;
  }

  @override
  Future<AttachmentMetadata> save(SaveAttachmentInput input) async {
    final baseDir = await _getBaseDirectory();
    final id = input.id ?? generateAttachmentId();

    String mimeType;
    switch (input.source.kind) {
      case AttachmentDataSourceKind.dataUrl:
        mimeType = normalizeMimeType(
          input.mimeType ?? parseDataUrl((input.source as DataUrlDataSource).dataUrl).mimeType,
        );
      case AttachmentDataSourceKind.bytes:
        mimeType = normalizeMimeType(input.mimeType);
      case AttachmentDataSourceKind.base64:
        mimeType = normalizeMimeType(input.mimeType);
      case AttachmentDataSourceKind.fileUri:
        mimeType = normalizeMimeType(input.mimeType);
    }

    final fileName = input.fileName;
    final extension = extensionForAttachment(fileName: fileName, mimeType: mimeType);
    final createdAt = DateTime.now().millisecondsSinceEpoch;
    final targetPath = '${baseDir.path}/$id$extension';

    final source = input.source;
    if (source.kind == AttachmentDataSourceKind.fileUri) {
      final uri = (source as FileUriDataSource).uri;
      final fromPath = fileUriToPath(uri);
      final fromFile = File(fromPath);
      if (fromPath != targetPath) {
        await fromFile.copy(targetPath);
      }
    } else {
      late final Uint8List bytes;
      if (source.kind == AttachmentDataSourceKind.bytes) {
        bytes = Uint8List.fromList((source as BytesDataSource).bytes);
      } else if (source.kind == AttachmentDataSourceKind.base64) {
        bytes = base64Decode((source as Base64DataSource).base64);
      } else if (source.kind == AttachmentDataSourceKind.dataUrl) {
        bytes = base64Decode(parseDataUrl((source as DataUrlDataSource).dataUrl).base64);
      } else {
        throw Exception('Unsupported source kind: ${source.kind}');
      }
      await File(targetPath).writeAsBytes(bytes);
    }

    final file = File(targetPath);
    final stat = await file.stat();
    final byteSize = stat.size;

    return AttachmentMetadata(
      id: id,
      mimeType: mimeType,
      storageType: storageType,
      storageKey: targetPath,
      fileName: fileName,
      byteSize: byteSize,
      createdAt: createdAt,
    );
  }

  @override
  Future<String> encodeBase64(AttachmentMetadata attachment) async {
    final path = _attachmentPath(attachment);
    final bytes = await File(path).readAsBytes();
    return base64Encode(bytes);
  }

  @override
  Future<String> resolvePreviewUrl(AttachmentMetadata attachment) async {
    final path = _attachmentPath(attachment);
    return pathToFileUri(path);
  }

  @override
  Future<void> releasePreviewUrl(AttachmentMetadata attachment, String url) async {
    // No-op for file URIs.
  }

  @override
  Future<void> delete(AttachmentMetadata attachment) async {
    final path = _attachmentPath(attachment);
    try {
      final file = File(path);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (_) {
      // Idempotent deletion.
    }
  }

  @override
  Future<void> garbageCollect(Set<String> referencedIds) async {
    final baseDir = await _getBaseDirectory();
    final entries = await baseDir.list().toList();
    for (final entry in entries) {
      if (entry is! File) continue;
      final name = entry.path.split('/').last.split('\\').last;
      final id = name.split('.').first;
      if (id.isEmpty || referencedIds.contains(id)) continue;
      try {
        await entry.delete();
      } catch (_) {}
    }
  }
}
