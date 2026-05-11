/// Attachment storage types mirroring React Native types.
enum AttachmentStorageType {
  webIndexedDb,
  desktopFile,
  nativeFile,
}

/// Metadata for a persisted attachment.
class AttachmentMetadata {
  final String id;
  final String mimeType;
  final AttachmentStorageType storageType;

  /// Platform-specific location key.
  /// - For mobile (native-file): absolute file path.
  final String storageKey;
  final String? fileName;
  final int? byteSize;
  final int createdAt;

  const AttachmentMetadata({
    required this.id,
    required this.mimeType,
    required this.storageType,
    required this.storageKey,
    this.fileName,
    this.byteSize,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'mimeType': mimeType,
        'storageType': storageType.name,
        'storageKey': storageKey,
        if (fileName != null) 'fileName': fileName,
        if (byteSize != null) 'byteSize': byteSize,
        'createdAt': createdAt,
      };

  factory AttachmentMetadata.fromJson(Map<String, dynamic> json) {
    return AttachmentMetadata(
      id: json['id'] as String,
      mimeType: json['mimeType'] as String,
      storageType: AttachmentStorageType.values.byName(json['storageType'] as String),
      storageKey: json['storageKey'] as String,
      fileName: json['fileName'] as String?,
      byteSize: json['byteSize'] as int?,
      createdAt: json['createdAt'] as int,
    );
  }

  AttachmentMetadata copyWith({
    String? id,
    String? mimeType,
    AttachmentStorageType? storageType,
    String? storageKey,
    String? fileName,
    int? byteSize,
    int? createdAt,
  }) {
    return AttachmentMetadata(
      id: id ?? this.id,
      mimeType: mimeType ?? this.mimeType,
      storageType: storageType ?? this.storageType,
      storageKey: storageKey ?? this.storageKey,
      fileName: fileName ?? this.fileName,
      byteSize: byteSize ?? this.byteSize,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

/// Data source kinds for saving an attachment.
enum AttachmentDataSourceKind {
  base64,
  bytes,
  dataUrl,
  fileUri,
}

/// Union-like data source for saving attachments.
sealed class AttachmentDataSource {
  final AttachmentDataSourceKind kind;
  const AttachmentDataSource({required this.kind});
}

class Base64DataSource extends AttachmentDataSource {
  final String base64;
  const Base64DataSource(this.base64) : super(kind: AttachmentDataSourceKind.base64);
}

class BytesDataSource extends AttachmentDataSource {
  final List<int> bytes;
  const BytesDataSource(this.bytes) : super(kind: AttachmentDataSourceKind.bytes);
}

class DataUrlDataSource extends AttachmentDataSource {
  final String dataUrl;
  const DataUrlDataSource(this.dataUrl) : super(kind: AttachmentDataSourceKind.dataUrl);
}

class FileUriDataSource extends AttachmentDataSource {
  final String uri;
  const FileUriDataSource(this.uri) : super(kind: AttachmentDataSourceKind.fileUri);
}

/// Input for saving an attachment.
class SaveAttachmentInput {
  final String? id;
  final String? mimeType;
  final String? fileName;
  final AttachmentDataSource source;

  const SaveAttachmentInput({
    this.id,
    this.mimeType,
    this.fileName,
    required this.source,
  });
}

/// Async storage contract for attachment bytes.
abstract class AttachmentStore {
  AttachmentStorageType get storageType;

  Future<AttachmentMetadata> save(SaveAttachmentInput input);
  Future<String> encodeBase64(AttachmentMetadata attachment);
  Future<String> resolvePreviewUrl(AttachmentMetadata attachment);
  Future<void> releasePreviewUrl(AttachmentMetadata attachment, String url);
  Future<void> delete(AttachmentMetadata attachment);
  Future<void> garbageCollect(Set<String> referencedIds);
}
