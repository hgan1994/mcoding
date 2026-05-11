import 'package:flutter/material.dart';

enum AppSnackBarTone { success, warning, error }

class AppSnackBar {
  const AppSnackBar._();

  static const _enterDuration = Duration(milliseconds: 260);
  static const _exitDuration = Duration(milliseconds: 220);
  static const _duplicateWindow = Duration(milliseconds: 1200);

  static String? _lastMessage;
  static AppSnackBarTone? _lastTone;
  static DateTime? _lastShownAt;

  static void showSuccess(BuildContext context, String message) {
    _show(context, message, AppSnackBarTone.success);
  }

  static void showWarning(BuildContext context, String message) {
    _show(context, message, AppSnackBarTone.warning);
  }

  static void showError(BuildContext context, String message) {
    _show(context, message, AppSnackBarTone.error);
  }

  static void _show(
    BuildContext context,
    String message,
    AppSnackBarTone tone,
  ) {
    final now = DateTime.now();
    if (_lastMessage == message &&
        _lastTone == tone &&
        _lastShownAt != null &&
        now.difference(_lastShownAt!) <= _duplicateWindow) {
      return;
    }
    _lastMessage = message;
    _lastTone = tone;
    _lastShownAt = now;

    final theme = Theme.of(context);
    final spec = _specFor(theme, tone);
    final visibleDuration = tone == AppSnackBarTone.error
        ? const Duration(seconds: 4)
        : const Duration(seconds: 3);

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          elevation: 0,
          backgroundColor: Colors.transparent,
          padding: EdgeInsets.zero,
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 18),
          duration: visibleDuration + _exitDuration,
          content: _AnimatedSnackContent(
            message: message,
            spec: spec,
            textStyle: theme.textTheme.bodyMedium?.copyWith(
              color: spec.foreground,
              fontWeight: FontWeight.w600,
            ),
            visibleDuration: visibleDuration,
            enterDuration: _enterDuration,
            exitDuration: _exitDuration,
          ),
        ),
      );
  }

  static _SnackSpec _specFor(ThemeData theme, AppSnackBarTone tone) {
    final isDark = theme.brightness == Brightness.dark;
    final surface = theme.colorScheme.surface;
    final foreground = theme.colorScheme.onSurface;

    switch (tone) {
      case AppSnackBarTone.success:
        const accent = Color(0xFF22C55E);
        return _SnackSpec(
          icon: Icons.check_circle_rounded,
          accent: accent,
          foreground: foreground,
          background: isDark ? surface : const Color(0xFFF0FDF4),
          border: accent.withValues(alpha: isDark ? 0.35 : 0.22),
        );
      case AppSnackBarTone.warning:
        const accent = Color(0xFFF59E0B);
        return _SnackSpec(
          icon: Icons.info_rounded,
          accent: accent,
          foreground: foreground,
          background: isDark ? surface : const Color(0xFFFFFBEB),
          border: accent.withValues(alpha: isDark ? 0.36 : 0.24),
        );
      case AppSnackBarTone.error:
        final accent = theme.colorScheme.error;
        return _SnackSpec(
          icon: Icons.error_rounded,
          accent: accent,
          foreground: foreground,
          background: isDark ? surface : const Color(0xFFFEF2F2),
          border: accent.withValues(alpha: isDark ? 0.42 : 0.24),
        );
    }
  }
}

class _AnimatedSnackContent extends StatefulWidget {
  final String message;
  final _SnackSpec spec;
  final TextStyle? textStyle;
  final Duration visibleDuration;
  final Duration enterDuration;
  final Duration exitDuration;

  const _AnimatedSnackContent({
    required this.message,
    required this.spec,
    required this.textStyle,
    required this.visibleDuration,
    required this.enterDuration,
    required this.exitDuration,
  });

  @override
  State<_AnimatedSnackContent> createState() => _AnimatedSnackContentState();
}

class _AnimatedSnackContentState extends State<_AnimatedSnackContent>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;
  late final Animation<Offset> _offset;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.enterDuration,
      reverseDuration: widget.exitDuration,
    );
    _opacity = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    );
    _offset = Tween<Offset>(begin: const Offset(0, 0.45), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _controller,
            curve: Curves.easeOutCubic,
            reverseCurve: Curves.easeInCubic,
          ),
        );

    _controller.forward();
    Future.delayed(widget.visibleDuration, () {
      if (!mounted) return;
      _controller.reverse();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final spec = widget.spec;

    return SlideTransition(
      position: _offset,
      child: FadeTransition(
        opacity: _opacity,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: spec.background,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: spec.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.10),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: spec.accent.withValues(alpha: 0.14),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(spec.icon, size: 18, color: spec.accent),
                ),
                const SizedBox(width: 12),
                Expanded(child: Text(widget.message, style: widget.textStyle)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SnackSpec {
  final IconData icon;
  final Color accent;
  final Color foreground;
  final Color background;
  final Color border;

  const _SnackSpec({
    required this.icon,
    required this.accent,
    required this.foreground,
    required this.background,
    required this.border,
  });
}
