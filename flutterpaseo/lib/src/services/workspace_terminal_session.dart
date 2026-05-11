import '../models/terminal_state.dart';

class WorkspaceTerminalSnapshots {
  final Map<String, TerminalState> _snapshotByTerminalId;

  WorkspaceTerminalSnapshots._(this._snapshotByTerminalId);

  TerminalState? get({required String terminalId}) {
    return _snapshotByTerminalId[terminalId];
  }

  void set({required String terminalId, required TerminalState state}) {
    _snapshotByTerminalId[terminalId] = state;
  }

  void clear({required String terminalId}) {
    _snapshotByTerminalId.remove(terminalId);
  }

  void prune({required List<String> terminalIds}) {
    final terminalIdSet = <String>{...terminalIds};
    final keysToRemove = _snapshotByTerminalId.keys.where((id) => !terminalIdSet.contains(id)).toList();
    for (final key in keysToRemove) {
      _snapshotByTerminalId.remove(key);
    }
  }
}

class WorkspaceTerminalSession {
  final String scopeKey;
  final WorkspaceTerminalSnapshots snapshots;

  WorkspaceTerminalSession._({required this.scopeKey, required this.snapshots});
}

final _sessionsByScopeKey = <String, WorkspaceTerminalSession>{};
final _refCountByScopeKey = <String, int>{};

WorkspaceTerminalSession getWorkspaceTerminalSession({required String scopeKey}) {
  final existing = _sessionsByScopeKey[scopeKey];
  if (existing != null) {
    return existing;
  }

  final snapshotByTerminalId = <String, TerminalState>{};
  final session = WorkspaceTerminalSession._(
    scopeKey: scopeKey,
    snapshots: WorkspaceTerminalSnapshots._(snapshotByTerminalId),
  );

  _sessionsByScopeKey[scopeKey] = session;
  return session;
}

void retainWorkspaceTerminalSession({required String scopeKey}) {
  final current = _refCountByScopeKey[scopeKey] ?? 0;
  _refCountByScopeKey[scopeKey] = current + 1;
}

void releaseWorkspaceTerminalSession({required String scopeKey}) {
  final current = _refCountByScopeKey[scopeKey] ?? 0;
  if (current > 1) {
    _refCountByScopeKey[scopeKey] = current - 1;
    return;
  }
  _refCountByScopeKey.remove(scopeKey);
  _sessionsByScopeKey.remove(scopeKey);
}
