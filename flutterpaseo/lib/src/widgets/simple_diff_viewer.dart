import 'package:flutter/material.dart';
import '../utils/tool_call_parsers.dart';
import '../theme.dart';

class SimpleDiffViewer extends StatelessWidget {
  final List<DiffLine> diffLines;
  final double? maxHeight;

  const SimpleDiffViewer({
    super.key,
    required this.diffLines,
    this.maxHeight,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;

    if (diffLines.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          'No changes to display',
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }

    Widget content = SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: IntrinsicWidth(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: diffLines.map((line) => _DiffLineWidget(line: line, brightness: brightness)).toList(),
        ),
      ),
    );

    if (maxHeight != null) {
      content = ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxHeight!),
        child: SingleChildScrollView(
          child: content,
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(8),
      ),
      clipBehavior: Clip.antiAlias,
      child: content,
    );
  }
}

class _DiffLineWidget extends StatelessWidget {
  final DiffLine line;
  final Brightness brightness;

  const _DiffLineWidget({required this.line, required this.brightness});

  @override
  Widget build(BuildContext context) {
    final (bgColor, fgColor) = switch (line.type) {
      DiffLineType.add => (
          brightness == Brightness.dark ? AppColors.diffLineAddedBgDark : AppColors.diffLineAddedBgLight,
          brightness == Brightness.dark ? AppColors.diffLineAddedFgDark : AppColors.diffLineAddedFgLight,
        ),
      DiffLineType.remove => (
          brightness == Brightness.dark ? AppColors.diffLineRemovedBgDark : AppColors.diffLineRemovedBgLight,
          brightness == Brightness.dark ? AppColors.diffLineRemovedFgDark : AppColors.diffLineRemovedFgLight,
        ),
      DiffLineType.header => (
          Theme.of(context).colorScheme.surfaceContainerHighest,
          Theme.of(context).colorScheme.primary,
        ),
      DiffLineType.context => (
          Colors.transparent,
          brightness == Brightness.dark ? AppColors.diffTextDark : AppColors.diffTextLight,
        ),
    };

    final highlightBg = switch (line.type) {
      DiffLineType.add => brightness == Brightness.dark ? AppColors.wordDiffAddedDark : AppColors.wordDiffAddedLight,
      DiffLineType.remove => brightness == Brightness.dark ? AppColors.wordDiffRemovedDark : AppColors.wordDiffRemovedLight,
      _ => null,
    };

    Widget textWidget;
    if (line.segments != null && line.segments!.isNotEmpty) {
      textWidget = RichText(
        text: TextSpan(
          style: TextStyle(
            color: fgColor,
            fontFamily: 'monospace',
            fontSize: 12,
            height: 1.5,
          ),
          children: [
            TextSpan(
              text: line.content[0],
              style: TextStyle(color: fgColor),
            ),
            ...line.segments!.map((seg) {
              return TextSpan(
                text: seg.text,
                style: TextStyle(
                  color: fgColor,
                  backgroundColor: seg.changed ? highlightBg : null,
                ),
              );
            }),
          ],
        ),
      );
    } else {
      textWidget = Text(
        line.content,
        style: TextStyle(
          color: fgColor,
          fontFamily: 'monospace',
          fontSize: 12,
          height: 1.5,
        ),
      );
    }

    return Container(
      color: bgColor,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 1),
      child: textWidget,
    );
  }
}
