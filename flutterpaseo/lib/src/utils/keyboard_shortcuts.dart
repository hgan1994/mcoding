import 'package:flutter/widgets.dart';
import 'package:flutter/services.dart';

class AppShortcuts {
  static const newAgent = SingleActivator(LogicalKeyboardKey.keyN, control: true);
  static const commandPalette = SingleActivator(LogicalKeyboardKey.keyK, control: true);
  static const escape = SingleActivator(LogicalKeyboardKey.escape);
  static const refresh = SingleActivator(LogicalKeyboardKey.keyR, control: true);
}

class ShortcutAction {
  final String id;
  final String label;
  final SingleActivator activator;

  const ShortcutAction({required this.id, required this.label, required this.activator});
}

final appShortcutActions = <ShortcutAction>[
  const ShortcutAction(id: 'new_agent', label: 'New Agent', activator: AppShortcuts.newAgent),
  const ShortcutAction(id: 'command_palette', label: 'Command Palette', activator: AppShortcuts.commandPalette),
  const ShortcutAction(id: 'refresh', label: 'Refresh', activator: AppShortcuts.refresh),
  const ShortcutAction(id: 'escape', label: 'Close / Dismiss', activator: AppShortcuts.escape),
];

class AppShortcutRegistrar {
  static Widget wrap(Widget child, {
    VoidCallback? onNewAgent,
    VoidCallback? onCommandPalette,
    VoidCallback? onRefresh,
    VoidCallback? onEscape,
  }) {
    return CallbackShortcuts(
      bindings: {
        AppShortcuts.newAgent: () => onNewAgent?.call(),
        AppShortcuts.commandPalette: () => onCommandPalette?.call(),
        AppShortcuts.refresh: () => onRefresh?.call(),
        AppShortcuts.escape: () => onEscape?.call(),
      },
      child: child,
    );
  }
}
