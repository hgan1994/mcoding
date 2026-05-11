import 'package:flutter/material.dart';
import 'package:diff_match_patch/diff_match_patch.dart';

import '../utils/diff_highlighter.dart';
import '../utils/diff_layout.dart';
import '../theme.dart';

// ---------------------------------------------------------------------------
// Theme colors for syntax highlighting (matches RN dark/light themes)
// ---------------------------------------------------------------------------

const _darkHighlightColors = <String, Color>{
  'keyword': Color(0xffff7b72),
  'comment': Color(0xff8b949e),
  'string': Color(0xffa5d6ff),
  'number': Color(0xff79c0ff),
  'literal': Color(0xff79c0ff),
  'function': Color(0xffd2a8ff),
  'definition': Color(0xffd2a8ff),
  'class': Color(0xffffa657),
  'type': Color(0xffff7b72),
  'tag': Color(0xff7ee787),
  'attribute': Color(0xff79c0ff),
  'property': Color(0xff79c0ff),
  'variable': Color(0xffc9d1d9),
  'operator': Color(0xff79c0ff),
  'punctuation': Color(0xffc9d1d9),
  'regexp': Color(0xffa5d6ff),
  'escape': Color(0xff79c0ff),
  'meta': Color(0xff8b949e),
  'heading': Color(0xff79c0ff),
  'link': Color(0xffa5d6ff),
};

const _lightHighlightColors = <String, Color>{
  'keyword': Color(0xffcf222e),
  'comment': Color(0xff6e7781),
  'string': Color(0xff0a3069),
  'number': Color(0xff0550ae),
  'literal': Color(0xff0550ae),
  'function': Color(0xff8250df),
  'definition': Color(0xff8250df),
  'class': Color(0xff953800),
  'type': Color(0xffcf222e),
  'tag': Color(0xff116329),
  'attribute': Color(0xff0550ae),
  'property': Color(0xff0550ae),
  'variable': Color(0xff24292f),
  'operator': Color(0xff0550ae),
  'punctuation': Color(0xff24292f),
  'regexp': Color(0xff0a3069),
  'escape': Color(0xff0550ae),
  'meta': Color(0xff6e7781),
  'heading': Color(0xff0550ae),
  'link': Color(0xff0a3069),
};

Color _tokenColor(String? style, Brightness brightness) {
  final colors = brightness == Brightness.dark ? _darkHighlightColors : _lightHighlightColors;
  return colors[style] ??
      (brightness == Brightness.dark ? const Color(0xffc9d1d9) : const Color(0xff24292f));
}

// ---------------------------------------------------------------------------
// Word-level diff helpers
// ---------------------------------------------------------------------------

/// Build a per-character background-color list for [text] based on a diff
/// against [pairedText]. [isAddLine] determines which side of the diff we
/// are highlighting (inserts for add, deletes for remove).
List<Color?> _buildWordDiffBackgrounds({
  required String text,
  required String pairedText,
  required bool isAddLine,
  required Brightness brightness,
}) {
  final dmp = DiffMatchPatch();
  final diffs = dmp.diff(
    isAddLine ? pairedText : text,
    isAddLine ? text : pairedText,
  );
  dmp.diffCleanupSemantic(diffs);

  final insertBg = brightness == Brightness.dark
      ? AppColors.wordDiffAddedDark
      : AppColors.wordDiffAddedLight;
  final deleteBg = brightness == Brightness.dark
      ? AppColors.wordDiffRemovedDark
      : AppColors.wordDiffRemovedLight;

  // Walk through the diff and collect only the segments that belong to [text].
  // For an add line, [text] is the *new* side, so we keep EQUAL and INSERT.
  // For a remove line, [text] is the *old* side, so we keep EQUAL and DELETE.
  final relevantOps = <({String text, bool isChange})>[];
  for (final diff in diffs) {
    if (diff.operation == DIFF_EQUAL) {
      relevantOps.add((text: diff.text, isChange: false));
    } else if (isAddLine && diff.operation == DIFF_INSERT) {
      relevantOps.add((text: diff.text, isChange: true));
    } else if (!isAddLine && diff.operation == DIFF_DELETE) {
      relevantOps.add((text: diff.text, isChange: true));
    }
  }

  final result = <Color?>[];
  for (final op in relevantOps) {
    final bg = op.isChange ? (isAddLine ? insertBg : deleteBg) : null;
    for (var i = 0; i < op.text.length; i++) {
      result.add(bg);
    }
  }

  // Safety: truncate / pad to match text length
  if (result.length > text.length) {
    return result.sublist(0, text.length);
  }
  while (result.length < text.length) {
    result.add(null);
  }
  return result;
}

/// Cross syntax-highlight tokens with word-diff backgrounds to produce
/// styled spans that show both syntax coloring and intra-line diff.
List<InlineSpan> _buildHighlightedWordDiffSpans({
  required String text,
  required List<HighlightToken>? tokens,
  required Brightness brightness,
  required DiffLineType lineType,
  required bool enableWordDiff,
  String? pairedText,
}) {
  final baseColor = switch (lineType) {
    DiffLineType.add => brightness == Brightness.dark ? const Color(0xff7ee787) : const Color(0xff116329),
    DiffLineType.remove => brightness == Brightness.dark ? const Color(0xffff7b72) : const Color(0xffcf222e),
    _ => brightness == Brightness.dark ? const Color(0xffc9d1d9) : const Color(0xff24292f),
  };

  final backgrounds = enableWordDiff && pairedText != null && (lineType == DiffLineType.add || lineType == DiffLineType.remove)
      ? _buildWordDiffBackgrounds(
          text: text,
          pairedText: pairedText,
          isAddLine: lineType == DiffLineType.add,
          brightness: brightness,
        )
      : null;

  // If no tokens, render plain text with optional word-diff backgrounds
  if (tokens == null || tokens.isEmpty) {
    if (backgrounds == null) {
      return [TextSpan(text: _formatContentText(text), style: TextStyle(color: baseColor))];
    }
    final spans = <InlineSpan>[];
    var pos = 0;
    while (pos < text.length) {
      final bg = backgrounds[pos];
      var end = pos + 1;
      while (end < text.length && backgrounds[end] == bg) {
        end++;
      }
      spans.add(TextSpan(
        text: text.substring(pos, end),
        style: TextStyle(color: baseColor, backgroundColor: bg),
      ));
      pos = end;
    }
    return spans;
  }

  // Flatten tokens into characters with style info, then apply backgrounds
  final charStyles = <String?>[];
  for (final token in tokens) {
    for (var i = 0; i < token.text.length; i++) {
      charStyles.add(token.style);
    }
  }

  final result = <InlineSpan>[];
  var pos = 0;
  while (pos < text.length) {
    final style = pos < charStyles.length ? charStyles[pos] : null;
    final bg = backgrounds != null && pos < backgrounds.length ? backgrounds[pos] : null;
    var end = pos + 1;
    while (end < text.length) {
      final nextStyle = end < charStyles.length ? charStyles[end] : null;
      final nextBg = backgrounds != null && end < backgrounds.length ? backgrounds[end] : null;
      if (nextStyle != style || nextBg != bg) break;
      end++;
    }

    final chunk = text.substring(pos, end);
    final fgColor = style != null ? _tokenColor(style, brightness) : baseColor;
    result.add(TextSpan(
      text: chunk,
      style: TextStyle(color: fgColor, backgroundColor: bg),
    ));
    pos = end;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Gutter helpers
// ---------------------------------------------------------------------------

String _formatGutterText(int? lineNumber) {
  return lineNumber == null ? ' ' : '$lineNumber';
}

String _formatContentText(String? content) {
  return content != null && content.isNotEmpty ? content : ' ';
}

bool _hasVisibleTokens(List<HighlightToken>? tokens) {
  return tokens?.any((t) => t.text.isNotEmpty) ?? false;
}

// ---------------------------------------------------------------------------
// DiffViewer
// ---------------------------------------------------------------------------

enum DiffLayoutMode { unified, split }

class DiffViewer extends StatelessWidget {
  final List<ParsedDiffFile> files;
  final DiffLayoutMode layout;
  final bool wrapLines;

  const DiffViewer({
    super.key,
    required this.files,
    this.layout = DiffLayoutMode.unified,
    this.wrapLines = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: files.map((file) => _DiffFileSection(
        file: file,
        layout: layout,
        wrapLines: wrapLines,
      )).toList(),
    );
  }
}

// ---------------------------------------------------------------------------
// DiffFileSection (collapsible header + body)
// ---------------------------------------------------------------------------

class _DiffFileSection extends StatefulWidget {
  final ParsedDiffFile file;
  final DiffLayoutMode layout;
  final bool wrapLines;

  const _DiffFileSection({
    required this.file,
    required this.layout,
    required this.wrapLines,
  });

  @override
  State<_DiffFileSection> createState() => _DiffFileSectionState();
}

class _DiffFileSectionState extends State<_DiffFileSection> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fileName = widget.file.path.split('/').last;
    final fileDir = widget.file.path.contains('/')
        ? widget.file.path.substring(0, widget.file.path.lastIndexOf('/'))
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: [
                    Icon(
                      _expanded ? Icons.expand_less : Icons.expand_more,
                      size: 18,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Row(
                        children: [
                          Text(
                            fileName,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          if (fileDir.isNotEmpty)
                            Flexible(
                              child: Text(
                                ' $fileDir',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          if (widget.file.isNew)
                            _Badge(
                              text: 'New',
                              bgColor: brightnessColor(context, dark: const Color(0xff1b4d1b), light: const Color(0xffdafbe1)),
                              fgColor: brightnessColor(context, dark: const Color(0xff7ee787), light: const Color(0xff116329)),
                            ),
                          if (widget.file.isDeleted)
                            _Badge(
                              text: 'Deleted',
                              bgColor: brightnessColor(context, dark: const Color(0xff5a1e1e), light: const Color(0xffffebeb)),
                              fgColor: brightnessColor(context, dark: const Color(0xffff7b72), light: const Color(0xffcf222e)),
                            ),
                        ],
                      ),
                    ),
                    _DiffStat(additions: widget.file.additions, deletions: widget.file.deletions),
                  ],
                ),
              ),
            ),
            if (_expanded)
              Container(
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: theme.colorScheme.outlineVariant),
                  ),
                ),
                child: widget.layout == DiffLayoutMode.split
                    ? _SplitDiffBody(file: widget.file, wrapLines: widget.wrapLines)
                    : _UnifiedDiffBody(file: widget.file, wrapLines: widget.wrapLines),
              ),
          ],
        ),
      ),
    );
  }
}

Color brightnessColor(BuildContext context, {required Color dark, required Color light}) {
  return Theme.of(context).brightness == Brightness.dark ? dark : light;
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

class _Badge extends StatelessWidget {
  final String text;
  final Color bgColor;
  final Color fgColor;

  const _Badge({
    required this.text,
    required this.bgColor,
    required this.fgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(left: 8),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: fgColor,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// DiffStat
// ---------------------------------------------------------------------------

class _DiffStat extends StatelessWidget {
  final int additions;
  final int deletions;

  const _DiffStat({required this.additions, required this.deletions});

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final addColor = brightness == Brightness.dark
        ? const Color(0xff3fb950)
        : const Color(0xff116329);
    final delColor = brightness == Brightness.dark
        ? const Color(0xfff85149)
        : const Color(0xffcf222e);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (additions > 0)
          Text(
            '+$additions',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: addColor,
            ),
          ),
        if (deletions > 0)
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: Text(
              '-$deletions',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: delColor,
              ),
            ),
          ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// UnifiedDiffBody
// ---------------------------------------------------------------------------

class _UnifiedDiffBody extends StatelessWidget {
  final ParsedDiffFile file;
  final bool wrapLines;

  const _UnifiedDiffBody({required this.file, required this.wrapLines});

  @override
  Widget build(BuildContext context) {
    final lines = buildUnifiedDiffLines(file);
    var maxLineNo = 0;
    for (final hunk in file.hunks) {
      maxLineNo = [
        maxLineNo,
        hunk.oldStart + hunk.oldCount,
        hunk.newStart + hunk.newCount,
      ].reduce((a, b) => a > b ? a : b);
    }
    final gutterWidth = _gutterWidth(maxLineNo);

    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: constraints.maxWidth),
            child: IntrinsicWidth(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: lines.map((item) => _UnifiedLine(
                  item: item,
                  gutterWidth: gutterWidth,
                  wrapLines: wrapLines,
                )).toList(),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _UnifiedLine extends StatelessWidget {
  final UnifiedDiffDisplayLine item;
  final double gutterWidth;
  final bool wrapLines;

  const _UnifiedLine({
    required this.item,
    required this.gutterWidth,
    required this.wrapLines,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brightness = theme.brightness;

    final (bgColor, fgColor) = switch (item.line.type) {
      DiffLineType.add => (
          brightness == Brightness.dark ? const Color(0xff1b4d1b) : const Color(0xffe6ffec),
          brightness == Brightness.dark ? const Color(0xff7ee787) : const Color(0xff116329),
        ),
      DiffLineType.remove => (
          brightness == Brightness.dark ? const Color(0xff5a1e1e) : const Color(0xffffe7e9),
          brightness == Brightness.dark ? const Color(0xffff7b72) : const Color(0xffcf222e),
        ),
      DiffLineType.header => (
          theme.colorScheme.surfaceContainerHighest,
          theme.colorScheme.primary,
        ),
      DiffLineType.context => (
          Colors.transparent,
          brightness == Brightness.dark ? const Color(0xffc9d1d9) : const Color(0xff24292f),
        ),
    };

    return Container(
      color: bgColor,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: gutterWidth,
            child: Padding(
              padding: const EdgeInsets.only(left: 8, right: 4),
              child: Text(
                _formatGutterText(item.lineNumber),
                style: TextStyle(
                  fontSize: 11,
                  color: theme.colorScheme.onSurfaceVariant,
                  fontFamily: 'monospace',
                  height: 1.5,
                ),
                textAlign: TextAlign.right,
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
              child: _buildContent(
                line: item.line,
                brightness: brightness,
                wrapLines: wrapLines,
                headerColor: theme.colorScheme.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent({
    required DiffLine line,
    required Brightness brightness,
    required bool wrapLines,
    required Color headerColor,
  }) {
    final baseColor = switch (line.type) {
      DiffLineType.add => brightness == Brightness.dark ? const Color(0xff7ee787) : const Color(0xff116329),
      DiffLineType.remove => brightness == Brightness.dark ? const Color(0xffff7b72) : const Color(0xffcf222e),
      DiffLineType.header => headerColor,
      _ => brightness == Brightness.dark ? const Color(0xffc9d1d9) : const Color(0xff24292f),
    };

    final visibleTokens = _hasVisibleTokens(line.tokens) ? line.tokens : null;

    if (line.type == DiffLineType.header || visibleTokens == null) {
      return Text(
        _formatContentText(line.content),
        style: TextStyle(
          color: baseColor,
          fontFamily: 'monospace',
          fontSize: 12,
          height: 1.5,
        ),
        softWrap: wrapLines,
      );
    }

    final spans = _buildHighlightedWordDiffSpans(
      text: line.content,
      tokens: visibleTokens,
      brightness: brightness,
      lineType: line.type,
      enableWordDiff: false,
    );

    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontFamily: 'monospace',
          fontSize: 12,
          height: 1.5,
        ),
        children: spans,
      ),
      softWrap: wrapLines,
    );
  }
}

// ---------------------------------------------------------------------------
// SplitDiffBody
// ---------------------------------------------------------------------------

class _SplitDiffBody extends StatelessWidget {
  final ParsedDiffFile file;
  final bool wrapLines;

  const _SplitDiffBody({required this.file, required this.wrapLines});

  @override
  Widget build(BuildContext context) {
    final rows = buildSplitDiffRows(file);
    var maxLineNo = 0;
    for (final hunk in file.hunks) {
      maxLineNo = [
        maxLineNo,
        hunk.oldStart + hunk.oldCount,
        hunk.newStart + hunk.newCount,
      ].reduce((a, b) => a > b ? a : b);
    }
    final gutterWidth = _gutterWidth(maxLineNo);

    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: constraints.maxWidth),
            child: IntrinsicWidth(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SplitDiffColumn(
                    rows: rows,
                    side: 'left',
                    gutterWidth: gutterWidth,
                    wrapLines: wrapLines,
                  ),
                  Container(
                    width: 1,
                    color: Theme.of(context).colorScheme.outlineVariant,
                  ),
                  _SplitDiffColumn(
                    rows: rows,
                    side: 'right',
                    gutterWidth: gutterWidth,
                    wrapLines: wrapLines,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _SplitDiffColumn extends StatelessWidget {
  final List<SplitDiffRow> rows;
  final String side;
  final double gutterWidth;
  final bool wrapLines;

  const _SplitDiffColumn({
    required this.rows,
    required this.side,
    required this.gutterWidth,
    required this.wrapLines,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brightness = theme.brightness;

    return IntrinsicWidth(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: rows.map((row) {
          if (row is SplitDiffHeaderRow) {
            return Container(
              color: theme.colorScheme.surfaceContainerHighest,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              child: Text(
                row.content,
                style: TextStyle(
                  color: theme.colorScheme.primary,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  height: 1.5,
                ),
              ),
            );
          }

          final pair = row as SplitDiffPairRow;
          final line = side == 'left' ? pair.left : pair.right;

          final (bgColor, fgColor) = switch (line?.type) {
            DiffLineType.add => (
                brightness == Brightness.dark ? const Color(0xff1b4d1b) : const Color(0xffe6ffec),
                brightness == Brightness.dark ? const Color(0xff7ee787) : const Color(0xff116329),
              ),
            DiffLineType.remove => (
                brightness == Brightness.dark ? const Color(0xff5a1e1e) : const Color(0xffffe7e9),
                brightness == Brightness.dark ? const Color(0xffff7b72) : const Color(0xffcf222e),
              ),
            DiffLineType.header => (
                theme.colorScheme.surfaceContainerHighest,
                theme.colorScheme.primary,
              ),
            _ => (
                Colors.transparent,
                brightness == Brightness.dark ? const Color(0xffc9d1d9) : const Color(0xff24292f),
              ),
          };

          return Container(
            color: bgColor,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: gutterWidth,
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8, right: 4),
                    child: Text(
                      _formatGutterText(line?.lineNumber),
                      style: TextStyle(
                        fontSize: 11,
                        color: theme.colorScheme.onSurfaceVariant,
                        fontFamily: 'monospace',
                        height: 1.5,
                      ),
                      textAlign: TextAlign.right,
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
                    child: line == null
                        ? Text(
                            ' ',
                            style: TextStyle(
                              color: fgColor,
                              fontFamily: 'monospace',
                              fontSize: 12,
                              height: 1.5,
                            ),
                          )
                        : _buildSplitLineContent(
                            line: line,
                            brightness: brightness,
                            wrapLines: wrapLines,
                            pairedLine: side == 'left' ? pair.right : pair.left,
                          ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSplitLineContent({
    required SplitDiffDisplayLine line,
    required Brightness brightness,
    required bool wrapLines,
    required SplitDiffDisplayLine? pairedLine,
  }) {
    final baseColor = switch (line.type) {
      DiffLineType.add => brightness == Brightness.dark ? const Color(0xff7ee787) : const Color(0xff116329),
      DiffLineType.remove => brightness == Brightness.dark ? const Color(0xffff7b72) : const Color(0xffcf222e),
      _ => brightness == Brightness.dark ? const Color(0xffc9d1d9) : const Color(0xff24292f),
    };

    final visibleTokens = _hasVisibleTokens(line.tokens) ? line.tokens : null;

    if (visibleTokens == null) {
      return Text(
        _formatContentText(line.content),
        style: TextStyle(
          color: baseColor,
          fontFamily: 'monospace',
          fontSize: 12,
          height: 1.5,
        ),
        softWrap: wrapLines,
      );
    }

    final spans = _buildHighlightedWordDiffSpans(
      text: line.content,
      tokens: visibleTokens,
      brightness: brightness,
      lineType: line.type,
      enableWordDiff: true,
      pairedText: pairedLine?.content,
    );

    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontFamily: 'monospace',
          fontSize: 12,
          height: 1.5,
        ),
        children: spans,
      ),
      softWrap: wrapLines,
    );
  }
}

// ---------------------------------------------------------------------------
// Gutter width helper
// ---------------------------------------------------------------------------

double _gutterWidth(int maxLineNumber) {
  final digits = maxLineNumber.toString().length;
  // Approx 8px per digit + padding
  return (digits * 8 + 24).toDouble();
}
