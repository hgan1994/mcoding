/// Lightweight cursor used by the seq gate — just epoch + endSeq.
class SeqGateCursor {
  final String epoch;
  final int endSeq;
  const SeqGateCursor({required this.epoch, required this.endSeq});
}

enum SessionTimelineSeqDecision {
  accept,
  dropStale,
  dropEpoch,
  gap,
  init,
}

/// Classifies a timeline sequence number against the current cursor.
///
/// - init: first sequence in a new epoch (no cursor)
/// - accept: contiguous with cursor end
/// - dropStale: sequence already past cursor
/// - dropEpoch: different epoch than cursor
/// - gap: non-contiguous, missing sequences
SessionTimelineSeqDecision classifySessionTimelineSeq({
  required SeqGateCursor? cursor,
  required String epoch,
  required int seq,
}) {
  if (cursor == null) {
    return SessionTimelineSeqDecision.init;
  }
  if (cursor.epoch != epoch) {
    return SessionTimelineSeqDecision.dropEpoch;
  }
  if (seq <= cursor.endSeq) {
    return SessionTimelineSeqDecision.dropStale;
  }
  if (seq == cursor.endSeq + 1) {
    return SessionTimelineSeqDecision.accept;
  }
  return SessionTimelineSeqDecision.gap;
}
