import 'package:flutter/material.dart';

class AppColors {
  static const Color tintLight = Color(0xFF2563EB);
  static const Color tintDark = Color(0xFF60A5FA);

  static const light = _LightColors();
  static const dark = _DarkColors();
  static const darkZinc = _DarkZincColors();
  static const darkMidnight = _DarkMidnightColors();

  static const diffLineAddedBgDark = Color(0xff1b4d1b);
  static const diffLineAddedBgLight = Color(0xffe6ffec);
  static const diffLineAddedFgDark = Color(0xff7ee787);
  static const diffLineAddedFgLight = Color(0xff116329);
  static const diffLineRemovedBgDark = Color(0xff5a1e1e);
  static const diffLineRemovedBgLight = Color(0xffffe7e9);
  static const diffLineRemovedFgDark = Color(0xffff7b72);
  static const diffLineRemovedFgLight = Color(0xffcf222e);

  static const wordDiffAddedDark = Color(0xff1b4d1b);
  static const wordDiffAddedLight = Color(0xffacf2bd);
  static const wordDiffRemovedDark = Color(0xff5a1e1e);
  static const wordDiffRemovedLight = Color(0xfffdb8c0);

  static const diffTextDark = Color(0xffc9d1d9);
  static const diffTextLight = Color(0xff24292f);
}

class _LightColors {
  const _LightColors();
  final Color text = const Color(0xFF111827);
  final Color textSecondary = const Color(0xFF6B7280);
  final Color background = const Color(0xFFF8FAFC);
  final Color tint = AppColors.tintLight;
  final Color icon = const Color(0xFF6B7280);
  final Color tabIconDefault = const Color(0xFF9CA3AF);
  final Color tabIconSelected = AppColors.tintLight;
  final Color surface = const Color(0xFFFFFFFF);
  final Color surfaceVariant = const Color(0xFFF1F5F9);
  final Color border = const Color(0xFFE2E8F0);
  final Color error = const Color(0xFFEF4444);
  final Color success = const Color(0xFF22C55E);
  final Color warning = const Color(0xFFF59E0B);
  final Color diffAddedBg = const Color(0xFFDCFBE6);
  final Color diffRemovedBg = const Color(0xFFFEE2E2);
  final Color diffAddedText = const Color(0xFF166534);
  final Color diffRemovedText = const Color(0xFF991B1B);
}

class _DarkColors {
  const _DarkColors();
  final Color text = const Color(0xFFF1F5F9);
  final Color textSecondary = const Color(0xFF94A3B8);
  final Color background = const Color(0xFF0F172A);
  final Color tint = AppColors.tintDark;
  final Color icon = const Color(0xFF94A3B8);
  final Color tabIconDefault = const Color(0xFF64748B);
  final Color tabIconSelected = AppColors.tintDark;
  final Color surface = const Color(0xFF1E293B);
  final Color surfaceVariant = const Color(0xFF1E293B);
  final Color border = const Color(0xFF334155);
  final Color error = const Color(0xFFEF4444);
  final Color success = const Color(0xFF22C55E);
  final Color warning = const Color(0xFFF59E0B);
  final Color diffAddedBg = const Color(0xFF052E16);
  final Color diffRemovedBg = const Color(0xFF450A0A);
  final Color diffAddedText = const Color(0xFF4ADE80);
  final Color diffRemovedText = const Color(0xFFFCA5A5);
}

class _DarkZincColors {
  const _DarkZincColors();
  final Color text = const Color(0xFFE4E4E7);
  final Color textSecondary = const Color(0xFFA1A1AA);
  final Color background = const Color(0xFF18181B);
  final Color tint = const Color(0xFFA1A1AA);
  final Color icon = const Color(0xFFA1A1AA);
  final Color tabIconDefault = const Color(0xFF71717A);
  final Color tabIconSelected = const Color(0xFFE4E4E7);
  final Color surface = const Color(0xFF27272A);
  final Color surfaceVariant = const Color(0xFF27272A);
  final Color border = const Color(0xFF3F3F46);
  final Color error = const Color(0xFFEF4444);
  final Color success = const Color(0xFF22C55E);
  final Color warning = const Color(0xFFF59E0B);
  final Color diffAddedBg = const Color(0xFF052E16);
  final Color diffRemovedBg = const Color(0xFF450A0A);
  final Color diffAddedText = const Color(0xFF4ADE80);
  final Color diffRemovedText = const Color(0xFFFCA5A5);
}

class _DarkMidnightColors {
  const _DarkMidnightColors();
  final Color text = const Color(0xFFE2E8F0);
  final Color textSecondary = const Color(0xFF94A3B8);
  final Color background = const Color(0xFF0F172A);
  final Color tint = const Color(0xFF94A3B8);
  final Color icon = const Color(0xFF94A3B8);
  final Color tabIconDefault = const Color(0xFF64748B);
  final Color tabIconSelected = const Color(0xFFE2E8F0);
  final Color surface = const Color(0xFF1E293B);
  final Color surfaceVariant = const Color(0xFF1E293B);
  final Color border = const Color(0xFF334155);
  final Color error = const Color(0xFFEF4444);
  final Color success = const Color(0xFF22C55E);
  final Color warning = const Color(0xFFF59E0B);
  final Color diffAddedBg = const Color(0xFF052E16);
  final Color diffRemovedBg = const Color(0xFF450A0A);
  final Color diffAddedText = const Color(0xFF4ADE80);
  final Color diffRemovedText = const Color(0xFFFCA5A5);
}

class TerminalAnsiPalette {
  static const black = Color(0xFF000000);
  static const red = Color(0xFFCD0000);
  static const green = Color(0xFF00CD00);
  static const yellow = Color(0xFFCDCD00);
  static const blue = Color(0xFF0000EE);
  static const magenta = Color(0xFFCD00CD);
  static const cyan = Color(0xFF00CDCD);
  static const white = Color(0xFFE5E5E5);
  static const brightBlack = Color(0xFF7F7F7F);
  static const brightRed = Color(0xFFFF0000);
  static const brightGreen = Color(0xFF00FF00);
  static const brightYellow = Color(0xFFFFFF00);
  static const brightBlue = Color(0xFF5C5CFF);
  static const brightMagenta = Color(0xFFFF00FF);
  static const brightCyan = Color(0xFF00FFFF);
  static const brightWhite = Color(0xFFFFFFFF);
}

class AppSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;
}

class AppRadius {
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double full = 999.0;
}

class AppTheme {
  static ThemeData light() {
    const c = AppColors.light;
    return ThemeData(
      brightness: Brightness.light,
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: c.tint,
        brightness: Brightness.light,
        surface: c.surface,
        error: c.error,
        surfaceContainerHighest: c.surfaceVariant,
      ),
      scaffoldBackgroundColor: c.background,
      appBarTheme: AppBarTheme(
        backgroundColor: c.surface,
        foregroundColor: c.text,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          color: c.text,
          fontSize: 17,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
        ),
        scrolledUnderElevation: 0.5,
      ),
      dividerTheme: DividerThemeData(color: c.border, space: 1),
      cardTheme: CardThemeData(
        color: c.surface,
        elevation: 0,
        shadowColor: Colors.black.withValues(alpha: 0.04),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          side: BorderSide(color: c.border.withValues(alpha: 0.7)),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: c.tint, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: c.error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: c.error, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: TextStyle(color: c.textSecondary, fontWeight: FontWeight.w400),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.tint,
          foregroundColor: Colors.white,
          disabledBackgroundColor: c.tint.withValues(alpha: 0.5),
          disabledForegroundColor: Colors.white.withValues(alpha: 0.7),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          elevation: 0,
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: -0.1),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: -0.1),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          side: BorderSide(color: c.border),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.tint,
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),
      ),
      iconTheme: IconThemeData(color: c.icon, size: 22),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: c.surface,
        selectedItemColor: c.tint,
        unselectedItemColor: c.tabIconDefault,
        type: BottomNavigationBarType.fixed,
      ),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.sm)),
        side: BorderSide.none,
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
      ),
    );
  }

  static ThemeData dark() {
    const c = AppColors.dark;
    return _buildDark(c, Brightness.dark);
  }

  static ThemeData darkZinc() {
    const c = AppColors.darkZinc;
    return _buildDark(c, Brightness.dark);
  }

  static ThemeData darkMidnight() {
    const c = AppColors.darkMidnight;
    return _buildDark(c, Brightness.dark);
  }

  static ThemeData _buildDark(dynamic c, Brightness brightness) {
    final tint = (c as dynamic).tint as Color;
    final background = c.background as Color;
    final text = c.text as Color;
    final surface = c.surface as Color;
    final surfaceVariant = c.surfaceVariant as Color;
    final border = c.border as Color;
    final error = c.error as Color;
    final icon = c.icon as Color;
    final tabIconDefault = c.tabIconDefault as Color;

    return ThemeData(
      brightness: brightness,
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: tint,
        brightness: brightness,
        surface: surface,
        error: error,
        surfaceContainerHighest: surfaceVariant,
      ),
      scaffoldBackgroundColor: background,
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: text,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          color: text,
          fontSize: 17,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
        ),
        scrolledUnderElevation: 0.5,
      ),
      dividerTheme: DividerThemeData(color: border, space: 1),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shadowColor: Colors.black.withValues(alpha: 0.15),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          side: BorderSide(color: border.withValues(alpha: 0.7)),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: tint, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: error, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: TextStyle(
          color: (c.textSecondary as Color?) ?? icon,
          fontWeight: FontWeight.w400,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: tint,
          foregroundColor: background,
          disabledBackgroundColor: tint.withValues(alpha: 0.4),
          disabledForegroundColor: text.withValues(alpha: 0.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          elevation: 0,
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: -0.1),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: -0.1),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          side: BorderSide(color: border),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: tint,
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),
      ),
      iconTheme: IconThemeData(color: icon, size: 22),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: background,
        selectedItemColor: tint,
        unselectedItemColor: tabIconDefault,
        type: BottomNavigationBarType.fixed,
      ),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.sm)),
        side: BorderSide.none,
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
      ),
    );
  }
}
