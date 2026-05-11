import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:xterm/xterm.dart' hide TerminalState;
import '../providers/session_provider.dart';
import '../services/terminal_stream_controller.dart';
import '../services/workspace_terminal_session.dart';
// import '../services/websocket_service.dart';
import '../models/terminal_state.dart';
import '../utils/terminal_snapshot.dart';
import '../l10n_ext.dart';

class TerminalScreen extends ConsumerStatefulWidget {
  final String serverId;
  final String? workspaceId;
  const TerminalScreen({super.key, required this.serverId, this.workspaceId});

  @override
  ConsumerState<TerminalScreen> createState() => _TerminalScreenState();
}

class _TerminalScreenState extends ConsumerState<TerminalScreen> {
  final Map<String, Terminal> _terminals = {};
  TerminalStreamController? _streamController;
  String? _selectedTerminalId;
  String get _cwd => widget.workspaceId != null ? '.' : '.';
  String get _scopeKey => '${widget.serverId}:$_cwd';
  late final WorkspaceTerminalSession _workspaceSession;
  bool _isAttaching = false;
  String? _streamError;

  @override
  void initState() {
    super.initState();
    _workspaceSession = getWorkspaceTerminalSession(scopeKey: _scopeKey);
    retainWorkspaceTerminalSession(scopeKey: _scopeKey);
    Future.microtask(() {
      ref.read(sessionProvider(widget.serverId).notifier).subscribeTerminals(_cwd);
    });
  }

  Terminal _createTerminal(String terminalId) {
    return Terminal(
      maxLines: 10000,
      onOutput: (data) {
        final tid = _selectedTerminalId;
        if (tid != null) {
          ref.read(sessionProvider(widget.serverId).notifier).sendTerminalInput(tid, {
            'type': 'input',
            'data': data,
          });
        }
      },
      onResize: (width, height, pixelWidth, pixelHeight) {
        final tid = _selectedTerminalId;
        if (tid != null) {
          ref.read(sessionProvider(widget.serverId).notifier).sendTerminalInput(tid, {
            'type': 'resize',
            'rows': height,
            'cols': width,
          });
        }
      },
      platform: TerminalTargetPlatform.unknown,
    );
  }

  Terminal? _getOrCreateTerminal(String terminalId) {
    return _terminals.putIfAbsent(terminalId, () => _createTerminal(terminalId));
  }

  void _selectTerminal(String terminalId) {
    if (_selectedTerminalId == terminalId) return;
    setState(() {
      _selectedTerminalId = terminalId;
    });
    _ensureStreamController();
    _streamController?.setTerminal(terminalId: terminalId);
  }

  void _ensureStreamController() {
    final client = ref.read(sessionProvider(widget.serverId)).client;
    if (client == null) return;
    if (_streamController != null) return;

    _streamController = TerminalStreamController(
      client: client,
      getPreferredSize: () {
        final terminal = _selectedTerminalId != null ? _terminals[_selectedTerminalId] : null;
        if (terminal == null) return null;
        return TerminalStreamControllerSize(rows: terminal.viewHeight, cols: terminal.viewWidth);
      },
      onOutput: ({required String terminalId, required String text}) {
        if (_selectedTerminalId != terminalId) return;
        final terminal = _terminals[terminalId];
        if (terminal != null) {
          terminal.write(text);
        }
      },
      onSnapshot: ({required String terminalId, required TerminalState state}) {
        _workspaceSession.snapshots.set(terminalId: terminalId, state: state);
        if (_selectedTerminalId != terminalId) return;
        final terminal = _terminals[terminalId];
        if (terminal != null) {
          terminal.write('\u001bc');
          terminal.write(renderTerminalSnapshotToAnsi(state));
        }
      },
      onStatusChange: (status) {
        setState(() {
          _isAttaching = status.isAttaching;
          _streamError = status.error;
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final terminals = ref.watch(terminalListProvider(widget.serverId));

    // Listen for terminal_stream_exit
    ref.listen(sessionProvider(widget.serverId), (previous, next) {
      // No direct way to get terminal_stream_exit from session state,
      // but the DaemonClient emits it via messages stream.
      // The TerminalStreamController handles most cases.
    });

    final currentTerminal = _selectedTerminalId != null ? _getOrCreateTerminal(_selectedTerminalId!) : null;

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.terminal),
        actions: [
          TextButton(
            onPressed: () => ref.read(sessionProvider(widget.serverId).notifier).createTerminal(_cwd),
            child: Text(context.l10n.newTerminal),
          ),
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () => ref.read(sessionProvider(widget.serverId).notifier).listTerminals(cwd: _cwd),
          ),
        ],
      ),
      body: Column(
        children: [
          if (terminals.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              color: theme.colorScheme.surfaceContainerHighest,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: terminals.map((t) {
                    final id = t['id'] as String? ?? 'term';
                    final isSelected = _selectedTerminalId == id;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(id, style: const TextStyle(fontSize: 12)),
                        selected: isSelected,
                        onSelected: (_) => _selectTerminal(id),
                        padding: EdgeInsets.zero,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          Expanded(
            child: currentTerminal != null
                ? TerminalView(
                    currentTerminal,
                    theme: theme.brightness == Brightness.dark
                        ? TerminalThemes.whiteOnBlack
                        : TerminalThemes.defaultTheme,
                    textStyle: const TerminalStyle(fontSize: 13),
                    autoResize: true,
                    keyboardType: TextInputType.text,
                    keyboardAppearance: theme.brightness,
                    cursorType: TerminalCursorType.block,
                    deleteDetection: true,
                  )
                : Center(child: Text(context.l10n.selectTerminal)),
          ),
          if (_isAttaching)
            Padding(
              padding: EdgeInsets.all(8),
              child: LinearProgressIndicator(),
            ),
          if (_streamError != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(
                _streamError!,
                style: TextStyle(color: theme.colorScheme.error),
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _streamController?.dispose();
    _streamController = null;
    releaseWorkspaceTerminalSession(scopeKey: _scopeKey);
    super.dispose();
  }
}
