import 'dart:math';
import 'dart:typed_data';
import 'dart:convert';

import 'attachment_models.dart';

String generateAttachmentId() {
  final timestamp = DateTime.now().millisecondsSinceEpoch;
  final random = Random.secure().nextInt(1 << 30).toRadixString(36);
  return 'att_${timestamp}_$random';
}

String generateMessageId() {
  final timestamp = DateTime.now().millisecondsSinceEpoch;
  final random = Random.secure().nextInt(1 << 30).toRadixString(36);
  return 'msg_${timestamp}_$random';
}

String normalizeMimeType(String? input) {
  final trimmed = input?.trim() ?? '';
  return trimmed.isNotEmpty ? trimmed : 'image/jpeg';
}

class ParsedDataUrl {
  final String mimeType;
  final String base64;
  const ParsedDataUrl({required this.mimeType, required this.base64});
}

ParsedDataUrl parseDataUrl(String dataUrl) {
  final trimmed = dataUrl.trim();
  final match = RegExp(r'^data:([^,]*),([\s\S]+)$', caseSensitive: false).firstMatch(trimmed);
  if (match == null) {
    throw Exception('Malformed data URL for attachment.');
  }
  final metadata = match.group(1) ?? '';
  var base64 = match.group(2)?.replaceAll(RegExp(r'\s'), '') ?? '';
  final parts = metadata.split(';').map((p) => p.trim()).toList();
  final mimeTypeRaw = parts.first;
  final isBase64 = parts.skip(1).any((p) => p.toLowerCase() == 'base64');
  if (!isBase64) {
    throw Exception('Attachment data URL is not base64 encoded.');
  }
  if (base64.isEmpty) {
    throw Exception('Attachment data URL is missing base64 payload.');
  }
  return ParsedDataUrl(
    mimeType: normalizeMimeType(mimeTypeRaw),
    base64: base64,
  );
}

int _hashString(String value) {
  var hash = 2166136261;
  for (var i = 0; i < value.length; i++) {
    hash ^= value.codeUnitAt(i);
    hash = (hash * 16777619) & 0xFFFFFFFF;
  }
  return hash;
}

class ParsedImageDataUrl {
  final String mimeType;
  final String base64;
  final String cacheKey;
  const ParsedImageDataUrl({required this.mimeType, required this.base64, required this.cacheKey});
}

ParsedImageDataUrl? tryParseImageDataUrl(String uri) {
  if (!uri.trim().toLowerCase().startsWith('data:image/')) return null;
  try {
    final parsed = parseDataUrl(uri);
    if (!parsed.mimeType.toLowerCase().startsWith('image/')) return null;
    final fingerprint =
        '${parsed.mimeType}\x00${parsed.base64.length}\x00${parsed.base64.substring(0, min(64, parsed.base64.length))}\x00${parsed.base64.substring(max(0, parsed.base64.length - 64))}';
    final cacheKey =
        'data-image:${parsed.mimeType}:${parsed.base64.length}:${_hashString(fingerprint).toRadixString(36)}';
    return ParsedImageDataUrl(mimeType: parsed.mimeType, base64: parsed.base64, cacheKey: cacheKey);
  } catch (_) {
    return null;
  }
}

String createImageSourceCacheKey(String source) {
  return tryParseImageDataUrl(source)?.cacheKey ?? source;
}

String? getFileNameFromPath(String? path) {
  final trimmed = path?.trim();
  if (trimmed == null || trimmed.isEmpty) return null;
  final normalized = trimmed.replaceAll('\\', '/').replaceAll(RegExp(r'/+$'), '');
  final fileName = normalized.split('/').last.trim();
  return fileName.isEmpty ? null : fileName;
}

String getFileExtensionFromName(String? fileName) {
  if (fileName == null || fileName.isEmpty) return '';
  final idx = fileName.lastIndexOf('.');
  if (idx <= 0 || idx == fileName.length - 1) return '';
  return fileName.substring(idx);
}

String pathToFileUri(String path) {
  if (path.startsWith('file://')) return path;
  // On Windows absolute paths start with a drive letter or \\; on Unix with /
  if (!isAbsolutePath(path)) return path;
  if (path.startsWith('/')) return 'file://$path';
  if (path.startsWith('\\\\')) {
    return 'file:${path.replaceAll('\\', '/')}';
  }
  return 'file:///${path.replaceAll('\\', '/')}';
}

String fileUriToPath(String uri) {
  if (!uri.startsWith('file://')) return uri;
  return Uri.decodeComponent(uri.replaceFirst(RegExp(r'^file:///?'), ''));
}

bool isAbsolutePath(String path) {
  if (path.startsWith('/')) return true;
  if (path.startsWith('\\')) return true;
  // Windows drive letter
  if (path.length >= 2 && path[1] == ':' && RegExp(r'^[A-Za-z]$').hasMatch(path[0])) return true;
  return false;
}

final Map<String, String> _imageExtensionByMimeType = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/tiff': '.tiff',
  'image/bmp': '.bmp',
  'image/svg+xml': '.svg',
};

String extensionForAttachment({String? fileName, required String mimeType}) {
  final fromName = getFileExtensionFromName(fileName);
  if (fromName.isNotEmpty) return fromName;
  return _imageExtensionByMimeType[mimeType] ?? '.img';
}

Future<Uint8List> sourceToBytes(SaveAttachmentInput input) async {
  final source = input.source;
  switch (source.kind) {
    case AttachmentDataSourceKind.bytes:
      final bytesSource = source as BytesDataSource;
      return Uint8List.fromList(bytesSource.bytes);
    case AttachmentDataSourceKind.base64:
      final base64Source = source as Base64DataSource;
      return base64Decode(base64Source.base64);
    case AttachmentDataSourceKind.dataUrl:
      final dataUrlSource = source as DataUrlDataSource;
      final parsed = parseDataUrl(dataUrlSource.dataUrl);
      return base64Decode(parsed.base64);
    case AttachmentDataSourceKind.fileUri:
      final fileUriSource = source as FileUriDataSource;
      final path = fileUriToPath(fileUriSource.uri);
      // Will be handled by store implementation using dart:io File.
      throw UnimplementedError('fileUri should be handled by store implementation: $path');
  }
}

String bytesToBase64(List<int> bytes) {
  return base64Encode(bytes);
}
