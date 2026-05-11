import 'package:flutter/material.dart';
import '../theme.dart';
import '../widgets/synced_loader.dart';
import '../l10n_ext.dart';

class StartupSplashScreen extends StatefulWidget {
  final String statusText;
  final bool hasError;
  final VoidCallback? onRetry;

  const StartupSplashScreen({
    super.key,
    this.statusText = 'Restoring session...',
    this.hasError = false,
    this.onRetry,
  });

  @override
  State<StartupSplashScreen> createState() => _StartupSplashScreenState();
}

class _StartupSplashScreenState extends State<StartupSplashScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Center(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: widget.hasError
                ? _buildError(theme, cs)
                : _buildLoading(theme, cs),
          ),
        ),
      ),
    );
  }

  Widget _buildLoading(ThemeData theme, ColorScheme cs) {
    return Column(
      key: const ValueKey('loading'),
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.xl),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [cs.primary, cs.primary.withValues(alpha: 0.8)],
            ),
            boxShadow: [
              BoxShadow(
                color: cs.primary.withValues(alpha: 0.25),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Icon(Icons.terminal, size: 40, color: Colors.white),
        ),
        const SizedBox(height: 24),
        Text(
          'mcoding',
          style: theme.textTheme.headlineLarge?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          widget.statusText,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: cs.onSurfaceVariant,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 32),
        const SyncedLoader(),
      ],
    );
  }

  Widget _buildError(ThemeData theme, ColorScheme cs) {
    return Column(
      key: const ValueKey('error'),
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: cs.errorContainer,
            borderRadius: BorderRadius.circular(AppRadius.xl),
          ),
          child: Icon(Icons.error_outline, size: 40, color: cs.error),
        ),
        const SizedBox(height: 24),
        Text(
          'mcoding',
          style: theme.textTheme.headlineLarge?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          context.l10n.connectionFailed,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: cs.error,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          widget.statusText,
          style: theme.textTheme.bodySmall?.copyWith(
            color: cs.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 24),
        if (widget.onRetry != null)
          ElevatedButton.icon(
            onPressed: widget.onRetry,
            icon: const Icon(Icons.refresh, size: 18),
            label: Text(context.l10n.retry),
          ),
      ],
    );
  }
}
