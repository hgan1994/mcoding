import 'dart:async';

import '../models/stream.dart';
import '../providers/draft_provider.dart';
import '../providers/session_provider.dart';
import 'attachment_service.dart';
import 'composer_attachment_provider.dart';

/// Collects all attachment IDs that are still referenced across the app.
///
/// Sources (mirrors React Native draft-store GC):
/// 1. Draft attachments (persisted in [DraftState.draftAttachments]).
/// 2. Composer attachments (in [ComposerAttachmentState.attachmentsByAgent]).
/// 3. Stream history (tail + head) [UserMessageItem.images].
Set<String> collectReferencedAttachmentIds({
  required DraftState draftState,
  required ComposerAttachmentState composerState,
  required List<SessionState> sessionStates,
}) {
  final ids = <String>{};

  // 1. Draft attachments
  for (final list in draftState.draftAttachments.values) {
    for (final att in list) {
      ids.add(att.id);
    }
  }

  // 2. Composer attachments
  for (final list in composerState.attachmentsByAgent.values) {
    for (final att in list) {
      ids.add(att.id);
    }
  }

  // 3. Stream history (tail + head)
  for (final session in sessionStates) {
    for (final stream in session.agentStreamTail.values) {
      _collectIdsFromStream(stream, ids);
    }
    for (final stream in session.agentStreamHead.values) {
      _collectIdsFromStream(stream, ids);
    }
  }

  return ids;
}

void _collectIdsFromStream(List<StreamItem> stream, Set<String> ids) {
  for (final item in stream) {
    if (item is UserMessageItem) {
      final images = item.images;
      if (images != null) {
        for (final img in images) {
          final id = img['id'] as String?;
          if (id != null && id.isNotEmpty) {
            ids.add(id);
          }
        }
      }
    }
  }
}

/// Schedules and runs attachment garbage collection.
class AttachmentGcScheduler {
  static final AttachmentGcScheduler _instance = AttachmentGcScheduler._internal();
  factory AttachmentGcScheduler() => _instance;
  AttachmentGcScheduler._internal();

  final AttachmentService _service = AttachmentService();
  bool _scheduled = false;

  DraftState? _pendingDraftState;
  ComposerAttachmentState? _pendingComposerState;
  List<SessionState>? _pendingSessionStates;

  /// Request a deferred GC run.  Multiple rapid calls are coalesced.
  void schedule({
    DraftState? draftState,
    ComposerAttachmentState? composerState,
    List<SessionState>? sessionStates,
  }) {
    _pendingDraftState = draftState ?? _pendingDraftState;
    _pendingComposerState = composerState ?? _pendingComposerState;
    _pendingSessionStates = sessionStates ?? _pendingSessionStates;

    if (_scheduled) return;
    _scheduled = true;
    scheduleMicrotask(() async {
      _scheduled = false;
      await _runPending();
    });
  }

  Future<void> _runPending() async {
    final draft = _pendingDraftState;
    final composer = _pendingComposerState;
    final sessions = _pendingSessionStates;
    _pendingDraftState = null;
    _pendingComposerState = null;
    _pendingSessionStates = null;

    if (draft == null || composer == null || sessions == null) {
      // Not enough context yet; silently skip.
      return;
    }

    try {
      final referencedIds = collectReferencedAttachmentIds(
        draftState: draft,
        composerState: composer,
        sessionStates: sessions,
      );
      await _service.garbageCollectAttachments(referencedIds);
    } catch (error) {
      // ignore: avoid_print
      print('[AttachmentGcScheduler] GC failed: $error');
    }
  }

  /// Immediate GC run when the caller already has all states in hand.
  Future<void> runNowWithStates({
    required DraftState draftState,
    required ComposerAttachmentState composerState,
    required List<SessionState> sessionStates,
  }) async {
    _scheduled = false;
    _pendingDraftState = null;
    _pendingComposerState = null;
    _pendingSessionStates = null;

    try {
      final referencedIds = collectReferencedAttachmentIds(
        draftState: draftState,
        composerState: composerState,
        sessionStates: sessionStates,
      );
      await _service.garbageCollectAttachments(referencedIds);
    } catch (error) {
      // ignore: avoid_print
      print('[AttachmentGcScheduler] GC failed: $error');
    }
  }
}

/// Convenience top-level function.
void scheduleAttachmentGc() => AttachmentGcScheduler().schedule();
