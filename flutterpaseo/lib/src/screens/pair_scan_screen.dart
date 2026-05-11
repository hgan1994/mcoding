import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../l10n_ext.dart';
import '../providers/host_registry_provider.dart';
import '../providers/host_runtime_provider.dart';
import '../providers/session_provider.dart';
import '../services/device_sync_service.dart';
import '../utils/connection_offer.dart';
import '../widgets/app_snack_bar.dart';

class PairScanScreen extends ConsumerStatefulWidget {
  const PairScanScreen({super.key});

  @override
  ConsumerState<PairScanScreen> createState() => _PairScanScreenState();
}

class _PairScanScreenState extends ConsumerState<PairScanScreen> {
  bool _isPairing = false;
  String? _lastScanned;

  Future<void> _handleScan(String rawValue) async {
    if (_isPairing) return;
    final offerUrl = extractOfferUrl(rawValue);
    if (offerUrl == null) return;
    if (_lastScanned == offerUrl) return;
    _lastScanned = offerUrl;

    setState(() => _isPairing = true);
    String? serverId;

    try {
      final offer = parseOfferFromUrl(offerUrl);
      serverId = offer.serverId;

      final now = DateTime.now().toIso8601String();
      final profile = offer.toHostProfile(createdAt: now, updatedAt: now);

      final runtime = await ref
          .read(hostRuntimeProvider.notifier)
          .connectProfileAndWait(profile);
      await ref.read(hostRegistryProvider.notifier).addProfile(profile);
      if (runtime.client != null) {
        ref
            .read(sessionProvider(offer.serverId).notifier)
            .attachClient(runtime.client!);
      }

      if (mounted) {
        AppSnackBar.showSuccess(context, context.l10n.deviceAdded);
        context.go('/');
      }
    } catch (e) {
      _lastScanned = null;
      if (serverId != null) {
        ref.read(hostRuntimeProvider.notifier).disconnect(serverId);
      }
      if (mounted) {
        await _showPairingDialog(
          title: _isDeviceLimitError(e) ? context.l10n.deviceLimitTitle : context.l10n.connectionFailed,
          message: _formatPairingError(e),
          actionLabel: _isDeviceLimitError(e) ? context.l10n.gotIt : context.l10n.rescan,
        );
      }
    } finally {
      if (mounted) setState(() => _isPairing = false);
    }
  }

  bool _isDeviceLimitError(Object error) {
    if (error is DeviceSyncException && error.statusCode == 403) {
      return true;
    }
    return false;
  }

  Future<void> _showPairingDialog({
    required String title,
    required String message,
    required String actionLabel,
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(actionLabel),
          ),
        ],
      ),
    );
  }

  String _formatPairingError(Object error) {
    if (error is TimeoutException) {
      return context.l10n.connectionTimeout;
    }
    if (error is DeviceSyncException && error.statusCode == 403) {
      return context.l10n.freeUserDeviceLimit;
    }

    final text = error.toString();
    return text.startsWith('Exception: ')
        ? text.substring('Exception: '.length)
        : text;
  }

  Widget _buildScannerError(
    BuildContext context,
    MobileScannerException error,
    Widget? child,
  ) {
    final theme = Theme.of(context);
    final message = switch (error.errorCode) {
      MobileScannerErrorCode.permissionDenied =>
        context.l10n.cameraPermissionDenied,
      MobileScannerErrorCode.unsupported => context.l10n.cameraUnsupported,
      _ => error.errorDetails?.message ?? error.errorCode.name,
    };

    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.no_photography_outlined,
                color: Colors.white,
                size: 40,
              ),
              SizedBox(height: 16),
              Text(
                message,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.scanQRCode)),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            errorBuilder: _buildScannerError,
            onDetect: (capture) {
              for (final barcode in capture.barcodes) {
                final raw = barcode.rawValue;
                if (raw != null) {
                  _handleScan(raw);
                  return;
                }
              }
            },
          ),
          const _ScanOverlay(),
          if (_isPairing)
            Container(
              color: Colors.black54,
              child: Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}

class _ScanOverlay extends StatelessWidget {
  const _ScanOverlay();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: MediaQuery.of(context).size,
      painter: _ScanOverlayPainter(),
    );
  }
}

class _ScanOverlayPainter extends CustomPainter {
  static const double _cutoutSize = 280;
  static const double _cornerLength = 40;
  static const double _cornerStroke = 4;
  static const Color _cornerColor = Colors.white;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    final paint = Paint()
      ..color = _cornerColor
      ..strokeWidth = _cornerStroke
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.square;

    final left = center.dx - _cutoutSize / 2;
    final top = center.dy - _cutoutSize / 2;
    final right = center.dx + _cutoutSize / 2;
    final bottom = center.dy + _cutoutSize / 2;

    canvas.drawPath(
      Path()
        ..moveTo(left + _cornerLength, top)
        ..lineTo(left, top)
        ..lineTo(left, top + _cornerLength),
      paint,
    );

    canvas.drawPath(
      Path()
        ..moveTo(right - _cornerLength, top)
        ..lineTo(right, top)
        ..lineTo(right, top + _cornerLength),
      paint,
    );

    canvas.drawPath(
      Path()
        ..moveTo(left + _cornerLength, bottom)
        ..lineTo(left, bottom)
        ..lineTo(left, bottom - _cornerLength),
      paint,
    );

    canvas.drawPath(
      Path()
        ..moveTo(right - _cornerLength, bottom)
        ..lineTo(right, bottom)
        ..lineTo(right, bottom - _cornerLength),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
