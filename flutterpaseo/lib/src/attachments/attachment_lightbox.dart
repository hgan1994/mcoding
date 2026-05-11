import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';

import 'attachment_utils.dart';

class AttachmentLightbox extends StatelessWidget {
  final String imageUri;
  final VoidCallback onClose;

  const AttachmentLightbox({
    super.key,
    required this.imageUri,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Widget image;
    final uri = imageUri.trim();
    if (uri.startsWith('file://') || uri.startsWith('/')) {
      image = Image.file(
        File(uri.replaceFirst('file://', '')),
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => _errorWidget(theme),
      );
    } else if (uri.startsWith('data:')) {
      image = _buildDataImage(uri, theme);
    } else {
      image = Image.network(
        uri,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => _errorWidget(theme),
      );
    }

    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: Colors.black.withValues(alpha: 0.9),
        child: SafeArea(
          child: Stack(
            children: [
              Center(child: image),
              Positioned(
                top: 16,
                right: 16,
                child: IconButton(
                  onPressed: onClose,
                  icon: const Icon(Icons.close, color: Colors.white),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white.withValues(alpha: 0.2),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _errorWidget(ThemeData theme) {
    return Center(
      child: Text(
        "Couldn't load image",
        style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white70),
      ),
    );
  }

  Widget _buildDataImage(String uri, ThemeData theme) {
    final parsed = tryParseImageDataUrl(uri);
    if (parsed == null) return _errorWidget(theme);
    try {
      return Image.memory(
        base64Decode(parsed.base64),
        fit: BoxFit.contain,
        gaplessPlayback: true,
        errorBuilder: (context, error, stackTrace) => _errorWidget(theme),
      );
    } catch (_) {
      return _errorWidget(theme);
    }
  }
}
