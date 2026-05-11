String? _getFenceDelimiter(String line) {
  final match = RegExp(r'^( {0,3})(`{3,}|~{3,})').firstMatch(line);
  return match?.group(2);
}

List<String> splitMarkdownBlocks(String text) {
  if (text.isEmpty) return [];

  final blocks = <String>[];
  final currentLines = <String>[];
  String? activeFenceCharacter;
  int activeFenceLength = 0;
  bool sawBlockSeparator = false;

  for (final line in text.split('\n')) {
    final isBlankLine = line.trim().isEmpty;

    if (activeFenceCharacter == null && isBlankLine) {
      if (currentLines.isNotEmpty) {
        sawBlockSeparator = true;
      }
      continue;
    }

    if (activeFenceCharacter == null && sawBlockSeparator) {
      blocks.add(currentLines.join('\n'));
      currentLines.clear();
      sawBlockSeparator = false;
    }

    currentLines.add(line);

    final fenceDelimiter = _getFenceDelimiter(line);
    if (fenceDelimiter == null) continue;

    if (activeFenceCharacter == null) {
      activeFenceCharacter = fenceDelimiter[0];
      activeFenceLength = fenceDelimiter.length;
      continue;
    }

    if (fenceDelimiter[0] == activeFenceCharacter && fenceDelimiter.length >= activeFenceLength) {
      activeFenceCharacter = null;
      activeFenceLength = 0;
    }
  }

  if (currentLines.isNotEmpty) {
    blocks.add(currentLines.join('\n'));
  }

  return blocks.where((b) => b.isNotEmpty).toList();
}
