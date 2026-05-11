import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:open_filex/open_filex.dart';

import '../l10n_ext.dart';
import '../providers/app_update_provider.dart';
import '../services/app_version_service.dart';

class AppUpdateDialog extends ConsumerStatefulWidget {
  const AppUpdateDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const AppUpdateDialog(),
    );
  }

  @override
  ConsumerState<AppUpdateDialog> createState() => _AppUpdateDialogState();
}

class _AppUpdateDialogState extends ConsumerState<AppUpdateDialog> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(appUpdateProvider);
    final info = state.versionInfo;
    final download = state.download;

    return PopScope(
      canPop: !(info?.forceUpdate == true),
      child: AlertDialog(
        title: Row(
          children: [
            Icon(Icons.system_update, color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            Text(context.l10n.updateFound(info?.versionName ?? '')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (info?.releaseNotes != null && info!.releaseNotes!.isNotEmpty) ...[
              Text(
                context.l10n.updateContent,
                style: theme.textTheme.titleSmall,
              ),
              const SizedBox(height: 8),
              Container(
                constraints: const BoxConstraints(maxHeight: 200),
                child: SingleChildScrollView(
                  child: Text(
                    info.releaseNotes!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
            if (download.progress > 0 || download.error != null)
              _buildDownloadProgress(theme, download)
            else if (download.isComplete)
              _buildInstallReady(theme)
            else
              Text(
                context.l10n.packageSize(_formatFileSize(info?.fileSize ?? 0)),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
          ],
        ),
        actions: _buildActions(download, info),
      ),
    );
  }

  Widget _buildDownloadProgress(ThemeData theme, DownloadProgress download) {
    if (download.error != null) {
      return Row(
        children: [
          Icon(Icons.error_outline, color: theme.colorScheme.error, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              context.l10n.downloadFailed(download.error!),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.error,
              ),
            ),
          ),
        ],
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: download.progress,
            minHeight: 8,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          context.l10n.downloadingProgress('${(download.progress * 100).toStringAsFixed(1)}%'),
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildInstallReady(ThemeData theme) {
    return Row(
      children: [
        Icon(Icons.check_circle, color: Colors.green, size: 20),
        const SizedBox(width: 8),
        Text(
          context.l10n.downloadComplete,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.green,
          ),
        ),
      ],
    );
  }

  List<Widget> _buildActions(DownloadProgress download, AppVersionInfo? info) {
    final isForceUpdate = info?.forceUpdate == true;

    if (download.isComplete) {
      return [
        if (!isForceUpdate)
          TextButton(
            onPressed: () {
              ref.read(appUpdateProvider.notifier).dismissUpdate();
              Navigator.of(context).pop();
            },
            child: Text(context.l10n.installLater),
          ),
        FilledButton.icon(
          onPressed: () => _installApk(download.filePath!),
          icon: const Icon(Icons.install_mobile),
          label: Text(context.l10n.installNow),
        ),
      ];
    }

    if (download.progress > 0 && !download.isComplete) {
      return [
        if (!isForceUpdate)
          TextButton(
            onPressed: () {
              ref.read(appUpdateProvider.notifier).cancelDownload();
              ref.read(appUpdateProvider.notifier).dismissUpdate();
              Navigator.of(context).pop();
            },
            child: Text(context.l10n.cancel),
          ),
      ];
    }

    if (download.error != null) {
      return [
        if (!isForceUpdate)
          TextButton(
            onPressed: () {
              ref.read(appUpdateProvider.notifier).dismissUpdate();
              Navigator.of(context).pop();
            },
            child: Text(context.l10n.cancel),
          ),
        FilledButton(
          onPressed: () => ref.read(appUpdateProvider.notifier).downloadApk(),
          child: Text(context.l10n.retryDownload),
        ),
      ];
    }

    return [
      if (!isForceUpdate)
        TextButton(
          onPressed: () {
            ref.read(appUpdateProvider.notifier).dismissUpdate();
            Navigator.of(context).pop();
          },
          child: Text(context.l10n.later),
        ),
      FilledButton.icon(
        onPressed: () => ref.read(appUpdateProvider.notifier).downloadApk(),
        icon: const Icon(Icons.download),
        label: Text(context.l10n.updateNow),
      ),
    ];
  }

  Future<void> _installApk(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.fileNotFound)),
        );
      }
      return;
    }

    final result = await OpenFilex.open(filePath);
    if (result.type != ResultType.done && mounted) {
      final msg = result.message.isNotEmpty
          ? result.message
          : context.l10n.installFailed(result.type.toString());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg)),
      );
    }
  }

  String _formatFileSize(int bytes) {
    if (bytes <= 0) return context.l10n.unknown;
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
