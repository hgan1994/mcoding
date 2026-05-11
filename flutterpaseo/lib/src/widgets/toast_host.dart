import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/toast_provider.dart';

class ToastHost extends ConsumerStatefulWidget {
  final Widget child;

  const ToastHost({super.key, required this.child});

  @override
  ConsumerState<ToastHost> createState() => _ToastHostState();
}

class _ToastHostState extends ConsumerState<ToastHost> {
  final Map<String, double> _opacities = {};

  @override
  Widget build(BuildContext context) {
    final toasts = ref.watch(toastProvider);
    final visible = toasts.take(3).toList();

    for (final toast in visible) {
      _opacities.putIfAbsent(toast.id, () => 0.0);
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      for (final toast in visible) {
        if (_opacities[toast.id] != 1.0) {
          setState(() => _opacities[toast.id] = 1.0);
        }
      }
    });

    return Stack(
      children: [
        widget.child,
        Positioned(
          left: 16,
          right: 16,
          bottom: MediaQuery.of(context).padding.bottom + 16,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: visible.reversed.map((toast) {
              return _ToastCard(
                toast: toast,
                opacity: _opacities[toast.id] ?? 0.0,
                onDismiss: () {
                  setState(() => _opacities[toast.id] = 0.0);
                  Future.delayed(const Duration(milliseconds: 300), () {
                    if (!mounted) return;
                    _opacities.remove(toast.id);
                    ref.read(toastProvider.notifier).dismiss(toast.id);
                  });
                },
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _ToastCard extends StatelessWidget {
  final ToastMessage toast;
  final double opacity;
  final VoidCallback onDismiss;

  const _ToastCard({
    required this.toast,
    required this.opacity,
    required this.onDismiss,
  });

  Color _borderColor(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    switch (toast.type) {
      case ToastType.success:
        return brightness == Brightness.dark
            ? const Color(0xFF22C55E)
            : const Color(0xFF30A46C);
      case ToastType.error:
        return Theme.of(context).colorScheme.error;
      case ToastType.info:
        return Theme.of(context).colorScheme.primary;
    }
  }

  IconData _icon() {
    switch (toast.type) {
      case ToastType.success:
        return Icons.check_circle_outline;
      case ToastType.error:
        return Icons.error_outline;
      case ToastType.info:
        return Icons.info_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _borderColor(context);
    final surfaceColor = Theme.of(context).colorScheme.surfaceContainerHighest;
    final textColor = Theme.of(context).colorScheme.onSurface;

    return AnimatedOpacity(
      opacity: opacity.clamp(0.0, 1.0),
      duration: const Duration(milliseconds: 300),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: GestureDetector(
          onTap: onDismiss,
          child: Material(
            elevation: 4,
            borderRadius: BorderRadius.circular(12),
            color: surfaceColor,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border(left: BorderSide(color: color, width: 4)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Icon(_icon(), color: color, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      toast.message,
                      style: TextStyle(color: textColor, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
