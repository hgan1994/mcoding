class DiffSegment {
  final String text;
  final bool changed;
  const DiffSegment({required this.text, required this.changed});
}

enum DiffLineType { add, remove, context, header }

class DiffLine {
  final DiffLineType type;
  final String content;
  final List<DiffSegment>? segments;
  const DiffLine({required this.type, required this.content, this.segments});
}

List<String> _splitIntoLines(String text) {
  if (text.isEmpty) return [];
  return text.replaceAll('\r\n', '\n').split('\n');
}

List<String> _splitIntoWords(String text) {
  final result = <String>[];
  final buf = StringBuffer();
  var inWord = false;
  for (var i = 0; i < text.length; i++) {
    final char = text[i];
    final codeUnit = text.codeUnitAt(i);
    final isWordChar =
        (codeUnit >= 0x61 && codeUnit <= 0x7a) ||
        (codeUnit >= 0x41 && codeUnit <= 0x5a) ||
        (codeUnit >= 0x30 && codeUnit <= 0x39) ||
        char == '_';
    if (isWordChar) {
      if (!inWord && buf.isNotEmpty) {
        result.add(buf.toString());
        buf.clear();
      }
      inWord = true;
      buf.write(char);
    } else {
      if (inWord && buf.isNotEmpty) {
        result.add(buf.toString());
        buf.clear();
      }
      inWord = false;
      buf.write(char);
    }
  }
  if (buf.isNotEmpty) result.add(buf.toString());
  return result;
}

({List<DiffSegment> oldSegments, List<DiffSegment> newSegments})
_computeWordLevelDiff(String oldLine, String newLine) {
  final oldWords = _splitIntoWords(oldLine);
  final newWords = _splitIntoWords(newLine);
  final m = oldWords.length;
  final n = newWords.length;
  final dp = List.generate(m + 1, (_) => List<int>.filled(n + 1, 0));

  for (var i = m - 1; i >= 0; i--) {
    for (var j = n - 1; j >= 0; j--) {
      if (oldWords[i] == newWords[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = dp[i + 1][j] > dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
      }
    }
  }

  final oldInLCS = <int>{};
  final newInLCS = <int>{};
  var i = 0;
  var j = 0;
  while (i < m && j < n) {
    if (oldWords[i] == newWords[j]) {
      oldInLCS.add(i);
      newInLCS.add(j);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  List<DiffSegment> buildSegments(List<String> words, Set<int> inLCS) {
    if (words.isEmpty) return [];
    final segments = <DiffSegment>[];
    var currentText = '';
    bool? currentChanged;
    for (var idx = 0; idx < words.length; idx++) {
      final word = words[idx];
      final changed = !inLCS.contains(idx);
      if (currentChanged == null) {
        currentText = word;
        currentChanged = changed;
      } else if (changed == currentChanged) {
        currentText += word;
      } else {
        segments.add(DiffSegment(text: currentText, changed: currentChanged));
        currentText = word;
        currentChanged = changed;
      }
    }
    if (currentText.isNotEmpty) {
      segments.add(
        DiffSegment(text: currentText, changed: currentChanged ?? false),
      );
    }
    return segments;
  }

  return (
    oldSegments: buildSegments(oldWords, oldInLCS),
    newSegments: buildSegments(newWords, newInLCS),
  );
}

List<DiffLine> buildLineDiff(String originalText, String updatedText) {
  final originalLines = _splitIntoLines(originalText);
  final updatedLines = _splitIntoLines(updatedText);
  if (originalLines.isEmpty && updatedLines.isEmpty) return [];

  final m = originalLines.length;
  final n = updatedLines.length;
  final dp = List.generate(m + 1, (_) => List<int>.filled(n + 1, 0));

  for (var i = m - 1; i >= 0; i--) {
    for (var j = n - 1; j >= 0; j--) {
      if (originalLines[i] == updatedLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = dp[i + 1][j] > dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
      }
    }
  }

  final diff = <DiffLine>[];
  var i = 0;
  var j = 0;
  while (i < m && j < n) {
    if (originalLines[i] == updatedLines[j]) {
      diff.add(
        DiffLine(type: DiffLineType.context, content: ' ${originalLines[i]}'),
      );
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      diff.add(
        DiffLine(type: DiffLineType.remove, content: '-${originalLines[i]}'),
      );
      i++;
    } else {
      diff.add(
        DiffLine(type: DiffLineType.add, content: '+${updatedLines[j]}'),
      );
      j++;
    }
  }
  while (i < m) {
    diff.add(
      DiffLine(type: DiffLineType.remove, content: '-${originalLines[i]}'),
    );
    i++;
  }
  while (j < n) {
    diff.add(DiffLine(type: DiffLineType.add, content: '+${updatedLines[j]}'));
    j++;
  }

  for (var idx = 0; idx < diff.length - 1; idx++) {
    final curr = diff[idx];
    final next = diff[idx + 1];
    if (curr.type == DiffLineType.remove && next.type == DiffLineType.add) {
      final oldLineText = curr.content.substring(1);
      final newLineText = next.content.substring(1);
      final (:oldSegments, :newSegments) = _computeWordLevelDiff(
        oldLineText,
        newLineText,
      );
      diff[idx] = DiffLine(
        type: curr.type,
        content: curr.content,
        segments: oldSegments,
      );
      diff[idx + 1] = DiffLine(
        type: next.type,
        content: next.content,
        segments: newSegments,
      );
    }
  }

  return diff;
}

List<DiffLine> parseUnifiedDiff(String? diffText) {
  if (diffText == null || diffText.isEmpty) return [];
  final lines = _splitIntoLines(diffText);
  final diff = <DiffLine>[];

  for (final line in lines) {
    if (line.isEmpty) {
      diff.add(const DiffLine(type: DiffLineType.context, content: ''));
      continue;
    }
    if (line.startsWith('@@')) {
      diff.add(DiffLine(type: DiffLineType.header, content: line));
      continue;
    }
    if (line.startsWith('+')) {
      if (!line.startsWith('+++')) {
        diff.add(DiffLine(type: DiffLineType.add, content: line));
      }
      continue;
    }
    if (line.startsWith('-')) {
      if (!line.startsWith('---')) {
        diff.add(DiffLine(type: DiffLineType.remove, content: line));
      }
      continue;
    }
    if (line.startsWith('diff --git') ||
        line.startsWith('index ') ||
        line.startsWith('---') ||
        line.startsWith('+++')) {
      continue;
    }
    if (line.startsWith(r'\ No newline')) {
      diff.add(DiffLine(type: DiffLineType.header, content: line));
      continue;
    }
    diff.add(DiffLine(type: DiffLineType.context, content: line));
  }

  return diff;
}
