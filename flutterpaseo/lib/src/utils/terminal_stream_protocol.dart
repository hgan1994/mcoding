import 'dart:convert';
import 'dart:typed_data';

enum TerminalStreamOpcode {
  output(0x01),
  input(0x02),
  resize(0x03),
  snapshot(0x04);

  final int value;
  const TerminalStreamOpcode(this.value);

  static TerminalStreamOpcode? fromValue(int value) {
    switch (value) {
      case 0x01:
        return TerminalStreamOpcode.output;
      case 0x02:
        return TerminalStreamOpcode.input;
      case 0x03:
        return TerminalStreamOpcode.resize;
      case 0x04:
        return TerminalStreamOpcode.snapshot;
      default:
        return null;
    }
  }
}

class TerminalStreamFrame {
  final int opcode;
  final int slot;
  final Uint8List payload;

  TerminalStreamFrame({
    required this.opcode,
    required this.slot,
    required this.payload,
  });
}

Uint8List? asUint8Array(dynamic data) {
  if (data is String) {
    return Uint8List.fromList(utf8.encode(data));
  }
  if (data is Uint8List) return data;
  if (data is List<int>) return Uint8List.fromList(data);
  if (data is ByteBuffer) return Uint8List.view(data);
  return null;
}

Uint8List encodeTerminalStreamFrame({
  required int opcode,
  required int slot,
  dynamic payload,
}) {
  final bytes = asUint8Array(payload ?? Uint8List(0)) ?? Uint8List(0);
  final out = Uint8List(2 + bytes.length);
  out[0] = opcode & 0xff;
  out[1] = slot & 0xff;
  out.setRange(2, out.length, bytes);
  return out;
}

TerminalStreamFrame? decodeTerminalStreamFrame(Uint8List bytes) {
  if (bytes.length < 2) return null;
  final opcode = TerminalStreamOpcode.fromValue(bytes[0]);
  if (opcode == null) return null;
  return TerminalStreamFrame(
    opcode: opcode.value,
    slot: bytes[1],
    payload: bytes.length > 2 ? Uint8List.sublistView(bytes, 2) : Uint8List(0),
  );
}

bool isTerminalStreamFrame(Uint8List bytes) {
  if (bytes.length < 2) return false;
  return TerminalStreamOpcode.fromValue(bytes[0]) != null;
}

Uint8List encodeTerminalResizePayload({required int rows, required int cols}) {
  return asUint8Array(jsonEncode({'rows': rows, 'cols': cols})) ?? Uint8List(0);
}

Map<String, dynamic>? decodeTerminalSnapshotPayload(Uint8List bytes) {
  try {
    final text = utf8.decode(bytes);
    return jsonDecode(text) as Map<String, dynamic>;
  } catch (_) {
    return null;
  }
}
