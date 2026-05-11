import '../models/terminal_state.dart';

class _TerminalStyle {
  final int? fg;
  final int? bg;
  final int? fgMode;
  final int? bgMode;
  final bool bold;
  final bool italic;
  final bool underline;
  final bool dim;
  final bool inverse;
  final bool strikethrough;

  const _TerminalStyle({
    this.fg,
    this.bg,
    this.fgMode,
    this.bgMode,
    this.bold = false,
    this.italic = false,
    this.underline = false,
    this.dim = false,
    this.inverse = false,
    this.strikethrough = false,
  });

  static const _default = _TerminalStyle();
}

bool _stylesEqual(_TerminalStyle left, _TerminalStyle right) {
  return left.fg == right.fg &&
      left.bg == right.bg &&
      left.fgMode == right.fgMode &&
      left.bgMode == right.bgMode &&
      left.bold == right.bold &&
      left.italic == right.italic &&
      left.underline == right.underline &&
      left.dim == right.dim &&
      left.inverse == right.inverse &&
      left.strikethrough == right.strikethrough;
}

_TerminalStyle _getStyle(TerminalCell cell) {
  return _TerminalStyle(
    fg: cell.fg,
    bg: cell.bg,
    fgMode: cell.fgMode,
    bgMode: cell.bgMode,
    bold: cell.bold ?? false,
    italic: cell.italic ?? false,
    underline: cell.underline ?? false,
    dim: cell.dim ?? false,
    inverse: cell.inverse ?? false,
    strikethrough: cell.strikethrough ?? false,
  );
}

int _getRowLength(List<TerminalCell> row) {
  for (var index = row.length - 1; index >= 0; index--) {
    final cell = row[index];
    if (cell.char != ' ') return index + 1;
    if (cell.fg != null ||
        cell.bg != null ||
        cell.fgMode != null ||
        cell.bgMode != null ||
        (cell.bold ?? false) ||
        (cell.italic ?? false) ||
        (cell.underline ?? false) ||
        (cell.dim ?? false) ||
        (cell.inverse ?? false) ||
        (cell.strikethrough ?? false)) {
      return index + 1;
    }
  }
  return 0;
}

List<String> _colorToSgr(int mode, int value, bool background) {
  if (mode == 1) {
    if (value >= 8) {
      return ['${(background ? 100 : 90) + (value - 8)}'];
    }
    return ['${(background ? 40 : 30) + value}'];
  }
  if (mode == 2) {
    return [background ? '48' : '38', '5', '$value'];
  }
  if (mode == 3) {
    return [
      background ? '48' : '38',
      '2',
      '${(value >> 16) & 0xff}',
      '${(value >> 8) & 0xff}',
      '${value & 0xff}',
    ];
  }
  return [];
}

String _styleToAnsi(_TerminalStyle style) {
  final codes = ['0'];
  if (style.bold) codes.add('1');
  if (style.dim) codes.add('2');
  if (style.italic) codes.add('3');
  if (style.underline) codes.add('4');
  if (style.inverse) codes.add('7');
  if (style.strikethrough) codes.add('9');
  if (style.fg != null && style.fgMode != null) {
    codes.addAll(_colorToSgr(style.fgMode!, style.fg!, false));
  }
  if (style.bg != null && style.bgMode != null) {
    codes.addAll(_colorToSgr(style.bgMode!, style.bg!, true));
  }
  return '\u001b[${codes.join(';')}m';
}

String _renderRow(List<TerminalCell> row) {
  final output = <String>[];
  final length = _getRowLength(row);
  var previousStyle = _TerminalStyle._default;

  for (var index = 0; index < length; index++) {
    final cell = index < row.length ? row[index] : TerminalCell(char: ' ');
    final nextStyle = _getStyle(cell);
    if (!_stylesEqual(previousStyle, nextStyle)) {
      output.add(_styleToAnsi(nextStyle));
      previousStyle = nextStyle;
    }
    output.add(cell.char.isEmpty ? ' ' : cell.char);
  }

  if (!_stylesEqual(previousStyle, _TerminalStyle._default)) {
    output.add('\u001b[0m');
  }

  return output.join('');
}

String? _renderCursorPresentation(TerminalCursor cursor) {
  if (cursor.style == null) return null;
  final cursorStyleCode = () {
    if (cursor.style == 'block') {
      return cursor.blink == false ? 2 : 1;
    }
    if (cursor.style == 'underline') {
      return cursor.blink == false ? 4 : 3;
    }
    return cursor.blink == false ? 6 : 5;
  }();
  return '\u001b[$cursorStyleCode q';
}

String renderTerminalSnapshotToAnsi(TerminalState state) {
  final rows = [...state.scrollback, ...state.grid];
  final lines = <String>['\u001b[?7l'];

  for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    final row = rows[rowIndex];
    lines.add(_renderRow(row));
    if (rowIndex < rows.length - 1) {
      lines.add('\r\n');
    }
  }

  lines.add('\u001b[0m');
  final cursorPresentationAnsi = _renderCursorPresentation(state.cursor);
  if (cursorPresentationAnsi != null) {
    lines.add(cursorPresentationAnsi);
  }
  lines.add('\u001b[${state.cursor.row + 1};${state.cursor.col + 1}H');
  lines.add(state.cursor.hidden == true ? '\u001b[?25l' : '\u001b[?25h');
  lines.add('\u001b[?7h');
  return lines.join('');
}
