class TerminalCell {
  final String char;
  final int? fg;
  final int? bg;
  final int? fgMode;
  final int? bgMode;
  final bool? bold;
  final bool? italic;
  final bool? underline;
  final bool? dim;
  final bool? inverse;
  final bool? strikethrough;

  TerminalCell({
    required this.char,
    this.fg,
    this.bg,
    this.fgMode,
    this.bgMode,
    this.bold,
    this.italic,
    this.underline,
    this.dim,
    this.inverse,
    this.strikethrough,
  });

  factory TerminalCell.fromJson(Map<String, dynamic> json) {
    return TerminalCell(
      char: json['char'] as String,
      fg: json['fg'] as int?,
      bg: json['bg'] as int?,
      fgMode: json['fgMode'] as int?,
      bgMode: json['bgMode'] as int?,
      bold: json['bold'] as bool?,
      italic: json['italic'] as bool?,
      underline: json['underline'] as bool?,
      dim: json['dim'] as bool?,
      inverse: json['inverse'] as bool?,
      strikethrough: json['strikethrough'] as bool?,
    );
  }
}

class TerminalCursor {
  final int row;
  final int col;
  final bool? hidden;
  final String? style;
  final bool? blink;

  TerminalCursor({
    required this.row,
    required this.col,
    this.hidden,
    this.style,
    this.blink,
  });

  factory TerminalCursor.fromJson(Map<String, dynamic> json) {
    return TerminalCursor(
      row: json['row'] as int,
      col: json['col'] as int,
      hidden: json['hidden'] as bool?,
      style: json['style'] as String?,
      blink: json['blink'] as bool?,
    );
  }
}

class TerminalState {
  final int rows;
  final int cols;
  final List<List<TerminalCell>> grid;
  final List<List<TerminalCell>> scrollback;
  final TerminalCursor cursor;
  final String? title;

  TerminalState({
    required this.rows,
    required this.cols,
    required this.grid,
    required this.scrollback,
    required this.cursor,
    this.title,
  });

  factory TerminalState.fromJson(Map<String, dynamic> json) {
    List<List<TerminalCell>> parseGrid(dynamic raw) {
      if (raw is! List) return [];
      return raw.map((row) {
        if (row is! List) return <TerminalCell>[];
        return row.map((cell) {
          if (cell is Map<String, dynamic>) {
            return TerminalCell.fromJson(cell);
          }
          return TerminalCell(char: '');
        }).toList();
      }).toList();
    }

    return TerminalState(
      rows: json['rows'] as int,
      cols: json['cols'] as int,
      grid: parseGrid(json['grid']),
      scrollback: parseGrid(json['scrollback']),
      cursor: TerminalCursor.fromJson(json['cursor'] as Map<String, dynamic>),
      title: json['title'] as String?,
    );
  }
}
