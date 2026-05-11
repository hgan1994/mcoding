import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/host_runtime_provider.dart';
import '../providers/host_registry_provider.dart';
import '../l10n_ext.dart';
import '../providers/session_provider.dart';
import '../theme.dart';
import '../widgets/app_snack_bar.dart';

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  TextEditingController? _editLabelController;
  String? _editingServerId;
  String? _deletingServerId;
  String? _deletingLabel;
  bool _deviceActionBusy = false;

  @override
  void dispose() {
    _editLabelController?.dispose();
    _editLabelController = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final runtimes = ref.watch(hostRuntimeProvider);
    final profiles = ref.watch(hostRegistryProvider);

    return Stack(
      children: [
        Scaffold(
          body: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          const Spacer(),
                          IconButton(
                            onPressed: () => context.push('/settings'),
                            style: IconButton.styleFrom(
                              backgroundColor: cs.surfaceContainerHighest
                                  .withValues(alpha: 0.5),
                            ),
                            icon: const Icon(
                              Icons.settings_outlined,
                              size: 20,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(AppRadius.xl),
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              cs.primary,
                              cs.primary.withValues(alpha: 0.8),
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: cs.primary.withValues(alpha: 0.25),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.terminal,
                          size: 36,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        context.l10n.welcomeTitle,
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        context.l10n.welcomeSubtitle,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: cs.onSurfaceVariant,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton.icon(
                          onPressed: () => context.push('/pair-scan'),
                          icon: const Icon(Icons.qr_code_scanner, size: 20),
                          label: Text(context.l10n.scanQRCode),
                        ),
                      ),
                      const SizedBox(height: 32),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Row(
                          children: [
                            Text(
                              context.l10n.onlineHosts,
                              style: theme.textTheme.titleSmall?.copyWith(
                                color: cs.onSurfaceVariant,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              width: 4,
                              height: 4,
                              decoration: BoxDecoration(
                                color: cs.onSurfaceVariant.withValues(
                                  alpha: 0.4,
                                ),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${profiles.length}',
                              style: theme.textTheme.titleSmall?.copyWith(
                                color: cs.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    children: [
                      if (profiles.isNotEmpty)
                        ...profiles.map((profile) {
                          final runtime = runtimes[profile.serverId];
                          final label = profile.label;
                          final isOnline =
                              runtime?.connectionState ==
                              HostConnectionState.online;
                          final statusColor = isOnline
                              ? AppColors.light.success
                              : cs.error;
                          final statusText = isOnline
                              ? context.l10n.online
                              : context.l10n.offline;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: BoxDecoration(
                              color: cs.surface,
                              borderRadius: BorderRadius.circular(AppRadius.md),
                              border: Border.all(
                                color: cs.outline.withValues(alpha: 0.12),
                              ),
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: isOnline
                                    ? () {
                                        if (runtime?.client != null) {
                                          ref
                                              .read(
                                                sessionProvider(
                                                  profile.serverId,
                                                ).notifier,
                                              )
                                              .attachClient(runtime!.client!);
                                        }
                                        context.push(
                                          '/h/${profile.serverId}/open-project',
                                        );
                                      }
                                    : null,
                                borderRadius: BorderRadius.circular(
                                  AppRadius.md,
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.fromLTRB(
                                    16,
                                    14,
                                    8,
                                    14,
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: cs.primary.withValues(
                                            alpha: 0.08,
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            AppRadius.md,
                                          ),
                                        ),
                                        child: Icon(
                                          Icons.computer,
                                          color: cs.primary,
                                          size: 22,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              label,
                                              style: theme.textTheme.titleMedium
                                                  ?.copyWith(
                                                    fontWeight: FontWeight.w600,
                                                    letterSpacing: -0.1,
                                                  ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                Container(
                                                  width: 7,
                                                  height: 7,
                                                  decoration: BoxDecoration(
                                                    color: statusColor,
                                                    shape: BoxShape.circle,
                                                    boxShadow: isOnline
                                                        ? [
                                                            BoxShadow(
                                                              color: statusColor
                                                                  .withValues(
                                                                    alpha: 0.4,
                                                                  ),
                                                              blurRadius: 4,
                                                            ),
                                                          ]
                                                        : null,
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                Text(
                                                  statusText,
                                                  style: theme
                                                      .textTheme
                                                      .bodySmall
                                                      ?.copyWith(
                                                        color:
                                                            cs.onSurfaceVariant,
                                                      ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          _CircleIconButton(
                                            icon: Icons.edit_outlined,
                                            size: 16,
                                            color: cs.onSurfaceVariant,
                                            onPressed: () => _openEditLabel(
                                              profile.serverId,
                                              label,
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          _CircleIconButton(
                                            icon: Icons.delete_outline,
                                            size: 16,
                                            color: cs.error,
                                            onPressed: () => _openDeleteConfirm(
                                              profile.serverId,
                                              label,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        })
                      else
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 56),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 88,
                                  height: 88,
                                  decoration: BoxDecoration(
                                    color: cs.primary.withValues(alpha: 0.04),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: cs.primary.withValues(alpha: 0.08),
                                      width: 1.5,
                                    ),
                                  ),
                                  child: Icon(
                                    Icons.computer_outlined,
                                    size: 36,
                                    color: cs.primary.withValues(alpha: 0.25),
                                  ),
                                ),
                                const SizedBox(height: 20),
                                Text(
                                  context.l10n.noHostsConfigured,
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    color: cs.onSurfaceVariant,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  context.l10n.scanQRCode,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: cs.onSurfaceVariant.withValues(
                                      alpha: 0.7,
                                    ),
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (_editingServerId != null) _buildEditLabelLayer(theme),
        if (_deletingServerId != null) _buildDeleteConfirmLayer(theme),
      ],
    );
  }

  Widget _buildEditLabelLayer(ThemeData theme) {
    return _DeviceActionLayer(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            context.l10n.editLabel,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _editLabelController,
            enabled: !_deviceActionBusy,
            decoration: InputDecoration(hintText: context.l10n.enterDeviceName),
            autofocus: true,
            onSubmitted: (_) => _saveEditedLabel(),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: _deviceActionBusy ? null : _closeDeviceActionLayer,
                child: Text(context.l10n.cancel),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _deviceActionBusy ? null : _saveEditedLabel,
                child: _deviceActionBusy
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(context.l10n.save),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDeleteConfirmLayer(ThemeData theme) {
    final label = _deletingLabel ?? '';
    return _DeviceActionLayer(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            context.l10n.deleteDevice,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            context.l10n.confirmDeleteDevice(label),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: _deviceActionBusy ? null : _closeDeviceActionLayer,
                child: Text(context.l10n.cancel),
              ),
              const SizedBox(width: 8),
              FilledButton.tonalIcon(
                onPressed: _deviceActionBusy ? null : _deleteDevice,
                icon: _deviceActionBusy
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.delete_sweep_rounded, size: 18),
                label: Text(context.l10n.delete),
                style: FilledButton.styleFrom(
                  backgroundColor: theme.colorScheme.errorContainer,
                  foregroundColor: theme.colorScheme.onErrorContainer,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _openEditLabel(String serverId, String currentLabel) {
    final oldController = _editLabelController;
    _editLabelController = null;
    oldController?.dispose();
    setState(() {
      _editingServerId = serverId;
      _deletingServerId = null;
      _deletingLabel = null;
      _deviceActionBusy = false;
      _editLabelController = TextEditingController(text: currentLabel);
    });
  }

  void _openDeleteConfirm(String serverId, String label) {
    setState(() {
      _editingServerId = null;
      _editLabelController = null;
      _deletingServerId = serverId;
      _deletingLabel = label;
      _deviceActionBusy = false;
    });
  }

  void _closeDeviceActionLayer() {
    setState(() {
      _editingServerId = null;
      _editLabelController = null;
      _deletingServerId = null;
      _deletingLabel = null;
      _deviceActionBusy = false;
    });
  }

  Future<void> _saveEditedLabel() async {
    final serverId = _editingServerId;
    final newLabel = _editLabelController?.text.trim();
    if (serverId == null || newLabel == null || newLabel.isEmpty) return;

    setState(() => _deviceActionBusy = true);
    try {
      await ref
          .read(hostRegistryProvider.notifier)
          .updateLabel(serverId, newLabel);
      if (!mounted) return;
      _closeDeviceActionLayer();
      AppSnackBar.showSuccess(context, context.l10n.labelUpdated);
    } catch (e) {
      if (!mounted) return;
      setState(() => _deviceActionBusy = false);
      AppSnackBar.showError(context, context.l10n.updateFailed(e.toString()));
    }
  }

  Future<void> _deleteDevice() async {
    final serverId = _deletingServerId;
    if (serverId == null) return;

    setState(() => _deviceActionBusy = true);
    try {
      await ref.read(hostRegistryProvider.notifier).removeProfile(serverId);
      if (!mounted) return;
      _closeDeviceActionLayer();
      AppSnackBar.showSuccess(context, context.l10n.deviceDeleted);
    } catch (e) {
      if (!mounted) return;
      setState(() => _deviceActionBusy = false);
      AppSnackBar.showError(context, context.l10n.deleteFailed(e.toString()));
    }
  }
}

class _CircleIconButton extends StatelessWidget {
  final IconData icon;
  final double size;
  final Color color;
  final VoidCallback onPressed;

  const _CircleIconButton({
    required this.icon,
    required this.size,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
      padding: EdgeInsets.zero,
      icon: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color.withValues(alpha: 0.08),
        ),
        child: Center(
          child: Icon(icon, size: size, color: color),
        ),
      ),
      onPressed: onPressed,
    );
  }
}

class _DeviceActionLayer extends StatelessWidget {
  final Widget child;

  const _DeviceActionLayer({required this.child});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Positioned.fill(
      child: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Material(
          color: Colors.black.withValues(alpha: 0.42),
          child: SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 360),
                child: Material(
                  color: theme.colorScheme.surface,
                  elevation: 8,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: child,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
