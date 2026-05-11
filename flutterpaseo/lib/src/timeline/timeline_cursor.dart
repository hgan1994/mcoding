/// Cursor tracking position within a timeline epoch.
class TimelineCursor {
  final String epoch;
  final int startSeq;
  final int endSeq;

  const TimelineCursor({
    required this.epoch,
    required this.startSeq,
    required this.endSeq,
  });

  TimelineCursor copyWith({String? epoch, int? startSeq, int? endSeq}) =>
      TimelineCursor(
        epoch: epoch ?? this.epoch,
        startSeq: startSeq ?? this.startSeq,
        endSeq: endSeq ?? this.endSeq,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TimelineCursor &&
          epoch == other.epoch &&
          startSeq == other.startSeq &&
          endSeq == other.endSeq;

  @override
  int get hashCode => Object.hash(epoch, startSeq, endSeq);
}
