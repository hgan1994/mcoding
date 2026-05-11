import 'package:highlight/highlight.dart' show highlight, Node;

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

enum DiffLineType { add, remove, context, header }

class HighlightToken {
  final String text;
  final String? style;

  const HighlightToken({required this.text, this.style});
}

class DiffLine {
  final DiffLineType type;
  final String content;
  final List<HighlightToken>? tokens;

  const DiffLine({
    required this.type,
    required this.content,
    this.tokens,
  });

  DiffLine copyWith({List<HighlightToken>? tokens}) {
    return DiffLine(
      type: type,
      content: content,
      tokens: tokens ?? this.tokens,
    );
  }
}

class DiffHunk {
  final int oldStart;
  final int oldCount;
  final int newStart;
  final int newCount;
  final List<DiffLine> lines;

  const DiffHunk({
    required this.oldStart,
    required this.oldCount,
    required this.newStart,
    required this.newCount,
    required this.lines,
  });

  DiffHunk copyWith({List<DiffLine>? lines}) {
    return DiffHunk(
      oldStart: oldStart,
      oldCount: oldCount,
      newStart: newStart,
      newCount: newCount,
      lines: lines ?? this.lines,
    );
  }
}

class ParsedDiffFile {
  final String path;
  final bool isNew;
  final bool isDeleted;
  final int additions;
  final int deletions;
  final List<DiffHunk> hunks;

  const ParsedDiffFile({
    required this.path,
    required this.isNew,
    required this.isDeleted,
    required this.additions,
    required this.deletions,
    required this.hunks,
  });

  ParsedDiffFile copyWith({List<DiffHunk>? hunks}) {
    return ParsedDiffFile(
      path: path,
      isNew: isNew,
      isDeleted: isDeleted,
      additions: additions,
      deletions: deletions,
      hunks: hunks ?? this.hunks,
    );
  }
}

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------

const _extensionToLanguage = <String, String>{
  'ts': 'typescript',
  'tsx': 'typescript',
  'js': 'javascript',
  'jsx': 'javascript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  'json': 'json',
  'dart': 'dart',
  'py': 'python',
  'rs': 'rust',
  'go': 'go',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'cc': 'cpp',
  'cxx': 'cpp',
  'h': 'cpp',
  'hpp': 'cpp',
  'cs': 'cs',
  'php': 'php',
  'rb': 'ruby',
  'swift': 'swift',
  'kt': 'kotlin',
  'kts': 'kotlin',
  'scala': 'scala',
  'sc': 'scala',
  'r': 'r',
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'yaml': 'yaml',
  'yml': 'yaml',
  'xml': 'xml',
  'html': 'xml',
  'htm': 'xml',
  'css': 'css',
  'scss': 'scss',
  'sass': 'scss',
  'less': 'less',
  'sql': 'sql',
  'md': 'markdown',
  'markdown': 'markdown',
  'dockerfile': 'dockerfile',
  'vim': 'vim',
  'lua': 'lua',
  'pl': 'perl',
  'pm': 'perl',
  'hs': 'haskell',
  'elm': 'elm',
  'erl': 'erlang',
  'ex': 'elixir',
  'exs': 'elixir',
  'clj': 'clojure',
  'cljs': 'clojure',
  'edn': 'clojure',
  'toml': 'ini',
  'ini': 'ini',
  'cfg': 'ini',
  'conf': 'nginx',
  'nginx': 'nginx',
  'makefile': 'makefile',
  'mk': 'makefile',
  'cmake': 'cmake',
  'diff': 'diff',
  'patch': 'diff',
  'graphql': 'graphql',
  'gql': 'graphql',
  'groovy': 'groovy',
  'gradle': 'groovy',
  'm': 'objectivec',
  'mm': 'objectivec',
  'jsonc': 'json',
  'vue': 'xml',
  'svelte': 'javascript',
  'astro': 'javascript',
  'tex': 'tex',
  'latex': 'tex',
  'proto': 'protobuf',
  'pb': 'protobuf',
  'tf': 'hcl',
  'hcl': 'hcl',
  'wasm': 'wasm',
  'julia': 'julia',
  'jl': 'julia',
  'matlab': 'matlab',
  'mll': 'ocaml',
  'ml': 'ocaml',
  'fs': 'fsharp',
  'fsx': 'fsharp',
  'fsi': 'fsharp',
  'coffee': 'coffeescript',
  'litcoffee': 'coffeescript',
  'cr': 'crystal',
  'nim': 'nimrod',
  'nix': 'nix',
  'pony': 'pony',
  'powershell': 'powershell',
  'ps1': 'powershell',
  'psm1': 'powershell',
  'purescript': 'haskell',
  'purs': 'haskell',
  'racket': 'lisp',
  'rkt': 'lisp',
  'scheme': 'scheme',
  'ss': 'scheme',
  'solidity': 'solidity',
  'sol': 'solidity',
  'stylus': 'stylus',
  'styl': 'stylus',
  'tcl': 'tcl',
  'reason': 'reasonml',
  're': 'reasonml',
  'rei': 'reasonml',
  'zig': 'zig',
};

String? _detectLanguage(String path) {
  final dotIndex = path.lastIndexOf('.');
  if (dotIndex == -1 || dotIndex == path.length - 1) return null;
  final ext = path.substring(dotIndex + 1).toLowerCase();
  return _extensionToLanguage[ext];
}

bool isLanguageSupported(String path) => _detectLanguage(path) != null;

// ---------------------------------------------------------------------------
// Diff parsing
// ---------------------------------------------------------------------------

List<ParsedDiffFile> parseDiff(String diffText) {
  if (diffText.trim().isEmpty) return [];

  final files = <ParsedDiffFile>[];
  final sections = diffText.split(RegExp(r'^diff --git ', multiLine: true))
      .where((s) => s.trim().isNotEmpty);

  for (final section in sections) {
    final lines = section.split('\n');
    final firstLine = lines.isNotEmpty ? lines.first : '';

    final isNew = section.contains('new file mode') || section.contains('--- /dev/null');
    final isDeleted = section.contains('deleted file mode') || section.contains('+++ /dev/null');

    String path = 'unknown';
    final pathMatch = RegExp(r'a\/(.*?) b\/').firstMatch(firstLine);
    if (pathMatch != null && pathMatch.group(1) != null) {
      path = pathMatch.group(1)!;
    } else {
      final newFileMatch = RegExp(r'b\/(.+)\$').firstMatch(firstLine);
      if (newFileMatch != null && newFileMatch.group(1) != null) {
        path = newFileMatch.group(1)!;
      }
    }

    final hunks = <DiffHunk>[];
    DiffHunk? currentHunk;
    var additions = 0;
    var deletions = 0;

    for (var i = 1; i < lines.length; i++) {
      final line = lines[i];

      if (line.startsWith('index ')) continue;
      if (line.startsWith('--- ')) continue;
      if (line.startsWith('+++ ')) continue;
      if (line.startsWith('new file mode')) continue;
      if (line.startsWith('deleted file mode')) continue;

      final hunkMatch = RegExp(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@').firstMatch(line);
      if (hunkMatch != null) {
        if (currentHunk != null) {
          hunks.add(currentHunk);
        }
        final headerMatch = RegExp(r'^(@@ .+? @@)').firstMatch(line);
        final headerContent = headerMatch?.group(1) ?? line;
        currentHunk = DiffHunk(
          oldStart: int.parse(hunkMatch.group(1)!),
          oldCount: int.parse(hunkMatch.group(2) ?? '1'),
          newStart: int.parse(hunkMatch.group(3)!),
          newCount: int.parse(hunkMatch.group(4) ?? '1'),
          lines: [DiffLine(type: DiffLineType.header, content: headerContent)],
        );
        continue;
      }

      if (currentHunk == null) continue;

      if (line.startsWith('+')) {
        currentHunk.lines.add(DiffLine(
          type: DiffLineType.add,
          content: line.substring(1),
        ));
        additions++;
      } else if (line.startsWith('-')) {
        currentHunk.lines.add(DiffLine(
          type: DiffLineType.remove,
          content: line.substring(1),
        ));
        deletions++;
      } else if (line.startsWith(' ')) {
        currentHunk.lines.add(DiffLine(
          type: DiffLineType.context,
          content: line.substring(1),
        ));
      } else if (line.isNotEmpty && !line.startsWith('\\')) {
        currentHunk.lines.add(DiffLine(
          type: DiffLineType.context,
          content: line,
        ));
      }
    }

    if (currentHunk != null) {
      hunks.add(currentHunk);
    }

    files.add(ParsedDiffFile(
      path: path,
      isNew: isNew,
      isDeleted: isDeleted,
      additions: additions,
      deletions: deletions,
      hunks: hunks,
    ));
  }

  return files;
}

// ---------------------------------------------------------------------------
// File reconstruction
// ---------------------------------------------------------------------------

Map<int, String> reconstructNewFile(List<DiffHunk> hunks) {
  final lines = <int, String>{};
  for (final hunk in hunks) {
    var newLineNum = hunk.newStart;
    for (final line in hunk.lines) {
      if (line.type == DiffLineType.header) continue;
      if (line.type == DiffLineType.add || line.type == DiffLineType.context) {
        lines[newLineNum] = line.content;
        newLineNum++;
      }
    }
  }
  return lines;
}

Map<int, String> reconstructOldFile(List<DiffHunk> hunks) {
  final lines = <int, String>{};
  for (final hunk in hunks) {
    var oldLineNum = hunk.oldStart;
    for (final line in hunk.lines) {
      if (line.type == DiffLineType.header) continue;
      if (line.type == DiffLineType.remove || line.type == DiffLineType.context) {
        lines[oldLineNum] = line.content;
        oldLineNum++;
      }
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Syntax highlighting
// ---------------------------------------------------------------------------

String _buildFileContent(Map<int, String> lineMap) {
  if (lineMap.isEmpty) return '';
  final lineNumbers = lineMap.keys.toList()..sort();
  final minLine = lineNumbers.first;
  final maxLine = lineNumbers.last;
  final lines = <String>[];
  for (var i = minLine; i <= maxLine; i++) {
    lines.add(lineMap[i] ?? '');
  }
  return lines.join('\n');
}

List<List<HighlightToken>> _highlightCode(String code, String language) {
  try {
    final result = highlight.parse(code, language: language);
    final nodes = result.nodes;
    if (nodes == null || nodes.isEmpty) {
      return _fallbackHighlight(code);
    }
    return _nodesToTokensByLine(nodes, code);
  } catch (_) {
    return _fallbackHighlight(code);
  }
}

List<List<HighlightToken>> _fallbackHighlight(String code) {
  return code.split('\n').map((line) {
    return [HighlightToken(text: line, style: null)];
  }).toList();
}

List<List<HighlightToken>> _nodesToTokensByLine(List<Node> nodes, String originalCode) {
  final lines = originalCode.split('\n');
  final result = List.generate(lines.length, (_) => <HighlightToken>[]);

  final segments = <_Segment>[];
  void traverse(Node node, String? currentStyle) {
    if (node.value != null) {
      segments.add(_Segment(text: node.value!, style: node.className ?? currentStyle));
    } else if (node.children != null) {
      for (final child in node.children!) {
        traverse(child, node.className ?? currentStyle);
      }
    }
  }
  for (final node in nodes) {
    traverse(node, null);
  }

  var lineIndex = 0;
  var lineOffset = 0;
  for (final segment in segments) {
    var remaining = segment.text;
    while (remaining.isNotEmpty && lineIndex < lines.length) {
      final currentLine = lines[lineIndex];
      final available = currentLine.length - lineOffset;
      if (available <= 0) {
        lineIndex++;
        lineOffset = 0;
        continue;
      }
      final take = remaining.length <= available ? remaining.length : available;
      final chunk = remaining.substring(0, take);
      result[lineIndex].add(HighlightToken(text: chunk, style: segment.style));
      remaining = remaining.substring(take);
      lineOffset += take;
      if (lineOffset >= currentLine.length) {
        lineIndex++;
        lineOffset = 0;
      }
    }
  }

  for (var i = 0; i < result.length; i++) {
    if (result[i].isEmpty) {
      result[i] = [HighlightToken(text: '', style: null)];
    }
  }

  return result;
}

class _Segment {
  final String text;
  final String? style;
  _Segment({required this.text, required this.style});
}

Map<int, List<HighlightToken>> _buildTokenLookup(
  Map<int, String> lineMap,
  List<List<HighlightToken>> highlighted,
) {
  final lookup = <int, List<HighlightToken>>{};
  if (lineMap.isEmpty) return lookup;

  final lineNumbers = lineMap.keys.toList()..sort();
  final minLine = lineNumbers.first;

  for (var i = 0; i < highlighted.length; i++) {
    final lineNum = minLine + i;
    if (lineMap.containsKey(lineNum)) {
      lookup[lineNum] = highlighted[i];
    }
  }
  return lookup;
}

ParsedDiffFile highlightDiffFile(ParsedDiffFile file) {
  final language = _detectLanguage(file.path);
  if (language == null) return file;

  final newFileLines = reconstructNewFile(file.hunks);
  final oldFileLines = reconstructOldFile(file.hunks);

  final newFileContent = _buildFileContent(newFileLines);
  final oldFileContent = _buildFileContent(oldFileLines);

  final newHighlighted = _highlightCode(newFileContent, language);
  final oldHighlighted = _highlightCode(oldFileContent, language);

  final newTokensByLine = _buildTokenLookup(newFileLines, newHighlighted);
  final oldTokensByLine = _buildTokenLookup(oldFileLines, oldHighlighted);

  final highlightedHunks = file.hunks.map((hunk) {
    var oldLineNum = hunk.oldStart;
    var newLineNum = hunk.newStart;

    final highlightedLines = hunk.lines.map((line) {
      if (line.type == DiffLineType.header) return line;

      List<HighlightToken>? tokens;
      if (line.type == DiffLineType.add) {
        tokens = newTokensByLine[newLineNum];
        newLineNum++;
      } else if (line.type == DiffLineType.remove) {
        tokens = oldTokensByLine[oldLineNum];
        oldLineNum++;
      } else if (line.type == DiffLineType.context) {
        tokens = newTokensByLine[newLineNum];
        oldLineNum++;
        newLineNum++;
      }

      return tokens != null ? line.copyWith(tokens: tokens) : line;
    }).toList();

    return hunk.copyWith(lines: highlightedLines);
  }).toList();

  return file.copyWith(hunks: highlightedHunks);
}

List<ParsedDiffFile> parseAndHighlightDiff(String diffText) {
  final files = parseDiff(diffText);
  return files.map(highlightDiffFile).toList();
}
