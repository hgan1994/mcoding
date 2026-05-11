import 'diff_highlighter.dart';

// ---------------------------------------------------------------------------
// Unified diff layout
// ---------------------------------------------------------------------------

class UnifiedDiffDisplayLine {
  final String key;
  final DiffLine line;
  final int? lineNumber;

  const UnifiedDiffDisplayLine({
    required this.key,
    required this.line,
    required this.lineNumber,
  });
}

List<UnifiedDiffDisplayLine> buildUnifiedDiffLines(ParsedDiffFile file) {
  final lines = <UnifiedDiffDisplayLine>[];

  for (var hunkIndex = 0; hunkIndex < file.hunks.length; hunkIndex++) {
    final hunk = file.hunks[hunkIndex];
    var oldLineNo = hunk.oldStart;
    var newLineNo = hunk.newStart;

    for (var lineIndex = 0; lineIndex < hunk.lines.length; lineIndex++) {
      final line = hunk.lines[lineIndex];
      int? lineNumber;

      if (line.type == DiffLineType.remove) {
        lineNumber = oldLineNo;
        oldLineNo += 1;
      } else if (line.type == DiffLineType.add) {
        lineNumber = newLineNo;
        newLineNo += 1;
      } else if (line.type == DiffLineType.context) {
        lineNumber = newLineNo;
        oldLineNo += 1;
        newLineNo += 1;
      }

      lines.add(UnifiedDiffDisplayLine(
        key: '$hunkIndex-$lineIndex',
        line: line,
        lineNumber: lineNumber,
      ));
    }
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Split diff layout
// ---------------------------------------------------------------------------

class SplitDiffDisplayLine {
  final DiffLineType type;
  final String content;
  final List<HighlightToken>? tokens;
  final int? lineNumber;

  const SplitDiffDisplayLine({
    required this.type,
    required this.content,
    this.tokens,
    required this.lineNumber,
  });
}

sealed class SplitDiffRow {
  const SplitDiffRow();
}

class SplitDiffHeaderRow extends SplitDiffRow {
  final String content;
  const SplitDiffHeaderRow(this.content);
}

class SplitDiffPairRow extends SplitDiffRow {
  final SplitDiffDisplayLine? left;
  final SplitDiffDisplayLine? right;
  const SplitDiffPairRow({this.left, this.right});
}

SplitDiffDisplayLine? _toDisplayLine({
  required DiffLine line,
  required int? oldLineNumber,
  required int? newLineNumber,
  required String side,
}) {
  if (line.type == DiffLineType.header) return null;

  if (line.type == DiffLineType.remove) {
    if (side != 'left') return null;
    return SplitDiffDisplayLine(
      type: DiffLineType.remove,
      content: line.content,
      tokens: line.tokens,
      lineNumber: oldLineNumber,
    );
  }

  if (line.type == DiffLineType.add) {
    if (side != 'right') return null;
    return SplitDiffDisplayLine(
      type: DiffLineType.add,
      content: line.content,
      tokens: line.tokens,
      lineNumber: newLineNumber,
    );
  }

  return SplitDiffDisplayLine(
    type: DiffLineType.context,
    content: line.content,
    tokens: line.tokens,
    lineNumber: side == 'left' ? oldLineNumber : newLineNumber,
  );
}

List<SplitDiffRow> buildSplitDiffRows(ParsedDiffFile file) {
  final rows = <SplitDiffRow>[];

  for (final hunk in file.hunks) {
    var oldLineNo = hunk.oldStart;
    var newLineNo = hunk.newStart;

    rows.add(SplitDiffHeaderRow(
      hunk.lines.isNotEmpty && hunk.lines.first.type == DiffLineType.header
          ? hunk.lines.first.content
          : '@@',
    ));

    final pendingRemovals = <({DiffLine line, int oldLineNumber})>[];
    final pendingAdditions = <({DiffLine line, int newLineNumber})>[];

    void flushPendingRows() {
      final pairCount = pendingRemovals.length > pendingAdditions.length
          ? pendingRemovals.length
          : pendingAdditions.length;
      for (var index = 0; index < pairCount; index++) {
        final removal = index < pendingRemovals.length ? pendingRemovals[index] : null;
        final addition = index < pendingAdditions.length ? pendingAdditions[index] : null;
        rows.add(SplitDiffPairRow(
          left: removal != null
              ? _toDisplayLine(
                  line: removal.line,
                  oldLineNumber: removal.oldLineNumber,
                  newLineNumber: null,
                  side: 'left',
                )
              : null,
          right: addition != null
              ? _toDisplayLine(
                  line: addition.line,
                  oldLineNumber: null,
                  newLineNumber: addition.newLineNumber,
                  side: 'right',
                )
              : null,
        ));
      }
      pendingRemovals.clear();
      pendingAdditions.clear();
    }

    for (var i = 1; i < hunk.lines.length; i++) {
      final line = hunk.lines[i];

      if (line.type == DiffLineType.remove) {
        pendingRemovals.add((line: line, oldLineNumber: oldLineNo));
        oldLineNo += 1;
        continue;
      }

      if (line.type == DiffLineType.add) {
        pendingAdditions.add((line: line, newLineNumber: newLineNo));
        newLineNo += 1;
        continue;
      }

      flushPendingRows();

      if (line.type == DiffLineType.context) {
        rows.add(SplitDiffPairRow(
          left: _toDisplayLine(
            line: line,
            oldLineNumber: oldLineNo,
            newLineNumber: newLineNo,
            side: 'left',
          ),
          right: _toDisplayLine(
            line: line,
            oldLineNumber: oldLineNo,
            newLineNumber: newLineNo,
            side: 'right',
          ),
        ));
        oldLineNo += 1;
        newLineNo += 1;
      }
    }

    flushPendingRows();
  }

  return rows;
}
