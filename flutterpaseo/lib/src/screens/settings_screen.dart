import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../models/host_connection.dart';
import '../providers/host_registry_provider.dart';
import '../providers/host_runtime_provider.dart';
import '../services/completion_sound_service.dart';
import '../services/legal_service.dart';
import '../l10n_ext.dart';
import '../theme.dart';
import '../widgets/app_snack_bar.dart';

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);

class HostSettingsScreen extends ConsumerStatefulWidget {
  final String serverId;
  final bool showHostInfo;
  const HostSettingsScreen({
    super.key,
    required this.serverId,
    this.showHostInfo = true,
  });

  @override
  ConsumerState<HostSettingsScreen> createState() => _HostSettingsScreenState();
}

class _HostSettingsScreenState extends ConsumerState<HostSettingsScreen> {
  PackageInfo? _packageInfo;
  bool _completionSoundEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
    _loadCompletionSoundSetting();
  }

  Future<void> _loadPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) {
      setState(() => _packageInfo = info);
    }
  }

  Future<void> _loadCompletionSoundSetting() async {
    final soundService = CompletionSoundService();
    await soundService.loadEnabled();
    if (mounted) {
      setState(() => _completionSoundEnabled = soundService.isEnabled);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final themeMode = ref.watch(themeModeProvider);

    final registry = ref.watch(hostRegistryProvider);
    final hostMatches = registry.where((p) => p.serverId == widget.serverId);
    if (hostMatches.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.pop();
      });
      return Scaffold(
        appBar: AppBar(title: Text(context.l10n.settings)),
        body: const SizedBox.shrink(),
      );
    }

    final host = hostMatches.first;
    final runtime = widget.showHostInfo
        ? ref.watch(hostRuntimeProvider)[widget.serverId]
        : null;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text(context.l10n.settings),
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          if (widget.showHostInfo) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: cs.outline.withValues(alpha: 0.12)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            cs.primary.withValues(alpha: 0.12),
                            cs.primary.withValues(alpha: 0.05),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Icon(
                        Icons.computer_outlined,
                        size: 26,
                        color: cs.primary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            host.label,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            host.serverId,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                          if (runtime != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              runtime.connectionState.name,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: runtime.connectionState ==
                                        HostConnectionState.online
                                    ? AppColors.light.success
                                    : cs.error,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: cs.outline.withValues(alpha: 0.12)),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: Icon(Icons.edit_note_rounded, size: 22, color: cs.primary),
                      title: Text(context.l10n.deviceName),
                      subtitle: Text(host.label),
                      trailing: Icon(Icons.chevron_right, size: 20, color: cs.onSurfaceVariant),
                      onTap: () => _showEditLabelDialog(host.label),
                    ),
                    ...host.connections
                        .where((conn) => conn is! RelayHostConnection)
                        .map((conn) {
                          final typeLabel = switch (conn) {
                            DirectTcpHostConnection() => 'TCP',
                            DirectSocketHostConnection() => 'Socket',
                            DirectPipeHostConnection() => 'Pipe',
                            _ => '',
                          };
                          return Column(
                            children: [
                              Divider(height: 1, indent: 56, endIndent: 16, color: cs.outline.withValues(alpha: 0.08)),
                              ListTile(
                                leading: const Icon(Icons.link, size: 22),
                                title: Text(typeLabel),
                                subtitle: Text(
                                  conn.id,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: cs.onSurfaceVariant,
                                  ),
                                ),
                                trailing: host.preferredConnectionId == conn.id
                                    ? Icon(Icons.check, color: AppColors.light.success, size: 20)
                                    : TextButton(
                                        onPressed: () => ref
                                            .read(hostRegistryProvider.notifier)
                                            .setPreferredConnection(
                                              widget.serverId,
                                              conn.id,
                                            ),
                                        child: Text(context.l10n.use),
                                      ),
                              ),
                            ],
                          );
                        }),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          _sectionHeader(theme, cs, context.l10n.appearance),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: cs.outline.withValues(alpha: 0.12)),
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    title: Text(context.l10n.completionSound),
                    subtitle: Text(
                      context.l10n.completionSoundDesc,
                      style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                    ),
                    value: _completionSoundEnabled,
                    onChanged: (v) async {
                      await CompletionSoundService().setEnabled(v);
                      setState(() => _completionSoundEnabled = v);
                    },
                  ),
                  _ThemeModeTile(
                    title: context.l10n.systemDefault,
                    icon: Icons.brightness_auto,
                    value: ThemeMode.system,
                    groupValue: themeMode,
                    onSelected: (value) =>
                        ref.read(themeModeProvider.notifier).state = value,
                  ),
                  _ThemeModeTile(
                    title: context.l10n.light,
                    icon: Icons.light_mode,
                    value: ThemeMode.light,
                    groupValue: themeMode,
                    onSelected: (value) =>
                        ref.read(themeModeProvider.notifier).state = value,
                  ),
                  _ThemeModeTile(
                    title: context.l10n.dark,
                    icon: Icons.dark_mode,
                    value: ThemeMode.dark,
                    groupValue: themeMode,
                    onSelected: (value) =>
                        ref.read(themeModeProvider.notifier).state = value,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: cs.outline.withValues(alpha: 0.12)),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.privacy_tip_outlined, size: 22, color: cs.onSurfaceVariant),
                    title: Text(context.l10n.privacyPolicy),
                    trailing: Icon(Icons.open_in_new, size: 18, color: cs.onSurfaceVariant),
                    onTap: LegalService.openPrivacyPolicy,
                  ),
                  Divider(height: 1, indent: 56, endIndent: 16, color: cs.outline.withValues(alpha: 0.08)),
                  ListTile(
                    leading: Icon(Icons.description_outlined, size: 22, color: cs.onSurfaceVariant),
                    title: Text(context.l10n.termsOfUse),
                    trailing: Icon(Icons.open_in_new, size: 18, color: cs.onSurfaceVariant),
                    onTap: LegalService.openTermsOfUse,
                  ),
                ],
              ),
            ),
          ),
          _sectionHeader(theme, cs, context.l10n.diagnostics),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: cs.outline.withValues(alpha: 0.12)),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.info_outline, size: 22, color: cs.onSurfaceVariant),
                    title: Text(context.l10n.version),
                    trailing: Text(
                      _packageInfo?.version ?? '...',
                      style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                    ),
                  ),
                  if (widget.showHostInfo) ...[
                    Divider(height: 1, indent: 56, endIndent: 16, color: cs.outline.withValues(alpha: 0.08)),
                    ListTile(
                      leading: Icon(Icons.wifi, size: 22, color: cs.onSurfaceVariant),
                      title: Text(context.l10n.connectionState),
                      trailing: Text(
                        runtime?.connectionState.name ?? 'unknown',
                        style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(ThemeData theme, ColorScheme cs, String text) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Text(
        text,
        style: theme.textTheme.titleSmall?.copyWith(
          color: cs.onSurfaceVariant,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  Future<void> _showEditLabelDialog(String currentLabel) async {
    final newLabel = await showDialog<String>(
      context: context,
      builder: (dialogContext) {
        final l10n = context.l10n;
        final controller = TextEditingController(text: currentLabel)
          ..selection = TextSelection(
            baseOffset: 0,
            extentOffset: currentLabel.length,
          );
        return AlertDialog(
          title: Text(l10n.deviceName),
          content: TextField(
            controller: controller,
            autofocus: true,
            decoration: InputDecoration(hintText: l10n.enterDeviceNameHint),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(l10n.cancel),
            ),
            FilledButton(
              onPressed: () =>
                  Navigator.pop(dialogContext, controller.text.trim()),
              child: Text(l10n.save),
            ),
          ],
        );
      },
    );

    if (newLabel == null || newLabel.isEmpty || !mounted) return;

    try {
      await ref
          .read(hostRegistryProvider.notifier)
          .updateLabel(widget.serverId, newLabel);
      if (mounted) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            AppSnackBar.showSuccess(context, context.l10n.labelUpdated);
          }
        });
      }
    } catch (e) {
      if (mounted) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            AppSnackBar.showError(
              context,
              context.l10n.updateFailed(e.toString()),
            );
          }
        });
      }
    }
  }
}

class _ThemeModeTile extends StatelessWidget {
  final String title;
  final IconData icon;
  final ThemeMode value;
  final ThemeMode groupValue;
  final ValueChanged<ThemeMode> onSelected;

  const _ThemeModeTile({
    required this.title,
    required this.icon,
    required this.value,
    required this.groupValue,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final selected = value == groupValue;
    final color = Theme.of(context).colorScheme.onSurfaceVariant;
    return ListTile(
      leading: Icon(icon, size: 20, color: color),
      title: Text(title),
      trailing: selected ? const Icon(Icons.check_rounded) : null,
      onTap: () => onSelected(value),
    );
  }
}
