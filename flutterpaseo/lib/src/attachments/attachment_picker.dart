import 'package:image_picker/image_picker.dart';
import 'attachment_models.dart';
import 'attachment_service.dart';

class PickedImageInput {
  final String path;
  final String? mimeType;
  final String? fileName;

  const PickedImageInput({
    required this.path,
    this.mimeType,
    this.fileName,
  });
}

class AttachmentPicker {
  final ImagePicker _picker = ImagePicker();
  final AttachmentService _service = AttachmentService();

  bool _isPicking = false;

  Future<List<AttachmentMetadata>?> pickImages() async {
    if (_isPicking) return null;
    _isPicking = true;
    try {
      final pickedFiles = await _picker.pickMultiImage();
      if (pickedFiles.isEmpty) return null;

      final results = <AttachmentMetadata>[];
      for (final picked in pickedFiles) {
        final path = picked.path;
        final mimeType = _inferMimeType(path);
        try {
          final attachment = await _service.persistAttachmentFromFileUri(
            uri: path,
            mimeType: mimeType,
            fileName: picked.name,
          );
          results.add(attachment);
        } catch (error) {
          // ignore: avoid_print
          print('[AttachmentPicker] Failed to persist image: $path, $error');
        }
      }
      return results.isEmpty ? null : results;
    } catch (error) {
      // ignore: avoid_print
      print('[AttachmentPicker] Failed to pick images: $error');
      return null;
    } finally {
      _isPicking = false;
    }
  }

  static String? _inferMimeType(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic')) return 'image/heic';
    if (lower.endsWith('.bmp')) return 'image/bmp';
    return null;
  }
}
