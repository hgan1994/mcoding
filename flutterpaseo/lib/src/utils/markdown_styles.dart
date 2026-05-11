import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

class MarkdownStyles {
  static MarkdownStyleSheet build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return MarkdownStyleSheet.fromTheme(theme).copyWith(
      p: textTheme.bodyMedium?.copyWith(
        height: 1.7,
        fontSize: 15,
      ),
      h1: textTheme.headlineMedium?.copyWith(
        fontWeight: FontWeight.bold,
        height: 1.3,
        letterSpacing: -0.5,
      ),
      h2: textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.bold,
        height: 1.35,
        letterSpacing: -0.3,
      ),
      h3: textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w700,
        height: 1.4,
      ),
      code: textTheme.bodyMedium?.copyWith(
        fontFamily: 'monospace',
        fontSize: 13,
        backgroundColor: colorScheme.surfaceContainerHighest.withValues(alpha: 0.7),
        color: colorScheme.onSurfaceVariant,
      ),
      codeblockDecoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      codeblockPadding: const EdgeInsets.all(16),
      blockquote: TextStyle(
        color: colorScheme.onSurfaceVariant,
        height: 1.7,
        fontStyle: FontStyle.italic,
      ),
      blockquoteDecoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
        border: Border(
          left: BorderSide(
            color: colorScheme.primary.withValues(alpha: 0.6),
            width: 3.5,
          ),
        ),
      ),
      blockquotePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      listBullet: TextStyle(
        color: colorScheme.primary,
        fontWeight: FontWeight.w600,
      ),
      listIndent: 24.0,
      tableBody: TextStyle(
        color: colorScheme.onSurface,
        fontSize: 14,
      ),
      tableHead: TextStyle(
        color: colorScheme.onSurface,
        fontWeight: FontWeight.w600,
        fontSize: 14,
      ),
      tableBorder: TableBorder.all(
        color: colorScheme.outlineVariant.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(10),
      ),
      tableCellsPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      a: TextStyle(
        color: colorScheme.primary,
        fontWeight: FontWeight.w500,
        decoration: TextDecoration.underline,
        decorationColor: colorScheme.primary.withValues(alpha: 0.4),
        decorationThickness: 1.2,
      ),
      horizontalRuleDecoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.4),
            width: 1,
          ),
        ),
      ),
    );
  }
}
