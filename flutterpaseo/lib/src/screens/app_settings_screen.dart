import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../l10n_ext.dart';
import '../services/legal_service.dart';
import '../services/storage_service.dart';
import '../widgets/app_snack_bar.dart';
import 'settings_screen.dart';

class AppSettingsScreen extends ConsumerStatefulWidget {
  const AppSettingsScreen({super.key});

  @override
  ConsumerState<AppSettingsScreen> createState() => _AppSettingsScreenState();
}

class _AppSettingsScreenState extends ConsumerState<AppSettingsScreen> {
  final StorageService _storageService = StorageService();
  PackageInfo? _packageInfo;

  @override
  void initState() {
    super.initState();
    _loadPackageInfo();
    _clearLegacyVoiceSecrets();
  }

  Future<void> _loadPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) {
      setState(() => _packageInfo = info);
    }
  }

  Future<void> _clearLegacyVoiceSecrets() async {
    await _storageService.clearLegacyVoiceSecrets();
  }

  Future<void> _openOptionalLink(Future<bool> Function() openLink) async {
    final opened = await openLink();
    if (!mounted || opened) {
      return;
    }
    AppSnackBar.showWarning(context, context.l10n.linkNotConfigured);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
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
        children: [
          Card(
            margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: theme.colorScheme.primaryContainer,
                    child: Icon(
                      Icons.terminal,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'mcoding Open Source',
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'v${_packageInfo?.version ?? "..."}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          _sectionHeader(theme, context.l10n.appearance),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Column(
              children: [
                _ThemeModeTile(
                  title: context.l10n.systemDefault,
                  value: ThemeMode.system,
                  groupValue: themeMode,
                  onSelected: (value) =>
                      ref.read(themeModeProvider.notifier).state = value,
                ),
                _ThemeModeTile(
                  title: context.l10n.light,
                  value: ThemeMode.light,
                  groupValue: themeMode,
                  onSelected: (value) =>
                      ref.read(themeModeProvider.notifier).state = value,
                ),
                _ThemeModeTile(
                  title: context.l10n.dark,
                  value: ThemeMode.dark,
                  groupValue: themeMode,
                  onSelected: (value) =>
                      ref.read(themeModeProvider.notifier).state = value,
                ),
              ],
            ),
          ),
          Card(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.privacy_tip_outlined),
                  title: Text(context.l10n.privacyPolicy),
                  trailing: const Icon(Icons.open_in_new),
                  onTap: () =>
                      _openOptionalLink(LegalService.openPrivacyPolicy),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.description_outlined),
                  title: Text(context.l10n.termsOfUse),
                  trailing: const Icon(Icons.open_in_new),
                  onTap: () => _openOptionalLink(LegalService.openTermsOfUse),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _sectionHeader(ThemeData theme, String text) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        text,
        style: theme.textTheme.titleSmall?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _ThemeModeTile extends StatelessWidget {
  final String title;
  final ThemeMode value;
  final ThemeMode groupValue;
  final ValueChanged<ThemeMode> onSelected;

  const _ThemeModeTile({
    required this.title,
    required this.value,
    required this.groupValue,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final selected = value == groupValue;
    return ListTile(
      title: Text(title),
      trailing: selected ? const Icon(Icons.check_rounded) : null,
      onTap: () => onSelected(value),
    );
  }
}
