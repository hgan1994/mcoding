import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../l10n_ext.dart';
import '../providers/host_registry_provider.dart';
import '../providers/host_runtime_provider.dart';
import '../providers/session_provider.dart';
import '../services/device_sync_service.dart';
import '../utils/connection_offer.dart';
import '../widgets/app_snack_bar.dart';

class AddHostScreen extends ConsumerStatefulWidget {
  const AddHostScreen({super.key});

  @override
  ConsumerState<AddHostScreen> createState() => _AddHostScreenState();
}

class _AddHostScreenState extends ConsumerState<AddHostScreen> {
  bool _isPairing = false;

  Future<void> _pairFromUrl(String offerUrl) async {
    setState(() => _isPairing = true);
    try {
      final offer = parseOfferFromUrl(offerUrl);

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
        context.go('/');
      }
    } catch (e) {
      if (mounted) {
        if (e is DeviceSyncException && e.statusCode == 403) {
          await showDialog<void>(
            context: context,
            barrierDismissible: false,
            builder: (dialogContext) => AlertDialog(
              title: Text(context.l10n.deviceLimitTitle),
              content: Text(context.l10n.freeUserDeviceLimit),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: Text(context.l10n.gotIt),
                ),
              ],
            ),
          );
        } else {
          AppSnackBar.showError(context, 'Unable to pair host: $e');
        }
      }
    } finally {
      if (mounted) setState(() => _isPairing = false);
    }
  }

  void _showPasteLinkDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.pastePairingLink),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'https://mcoding.sh/#offer=...',
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(context.l10n.cancel),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              final url = controller.text.trim();
              if (url.isNotEmpty) _pairFromUrl(url);
            },
            child: Text(context.l10n.pair),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.pairHost)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(height: 24),
            Text(
              'Connect to a host by scanning its QR code or pasting a pairing link.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _isPairing ? null : () => context.push('/pair-scan'),
              icon: Icon(Icons.qr_code_scanner),
              label: Text(context.l10n.scanQRCode),
            ),
            SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _isPairing ? null : _showPasteLinkDialog,
              icon: Icon(Icons.paste),
              label: Text(context.l10n.pastePairingLink),
            ),
            if (_isPairing) ...[
              SizedBox(height: 32),
              Center(child: CircularProgressIndicator()),
            ],
          ],
        ),
      ),
    );
  }
}
