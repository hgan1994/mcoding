import 'timeline_cursor.dart';

typedef TimelineDirection = String;
typedef InitRequestDirection = String;

class BootstrapTailCursor {
  final int? seq;
  const BootstrapTailCursor({this.seq});
}

class InitialTimelineCursor {
  final String epoch;
  final int seq;
  const InitialTimelineCursor({required this.epoch, required this.seq});
}

class InitialTimelineRequest {
  final String direction;
  final InitialTimelineCursor? cursor;
  final int limit;
  final String projection;

  const InitialTimelineRequest({
    required this.direction,
    this.cursor,
    required this.limit,
    this.projection = 'canonical',
  });

  Map<String, dynamic> toJson() => {
        'direction': direction,
        if (cursor != null) 'cursor': {'epoch': cursor!.epoch, 'seq': cursor!.seq},
        'limit': limit,
        'projection': projection,
      };
}

/// Determines the initial timeline request parameters.
InitialTimelineRequest deriveInitialTimelineRequest({
  required InitialTimelineCursor? cursor,
  required bool hasAuthoritativeHistory,
  required int initialTimelineLimit,
}) {
  if (!hasAuthoritativeHistory || cursor == null) {
    return InitialTimelineRequest(
      direction: 'tail',
      limit: initialTimelineLimit,
    );
  }

  return InitialTimelineRequest(
    direction: 'after',
    cursor: InitialTimelineCursor(epoch: cursor.epoch, seq: cursor.seq),
    limit: 0,
  );
}

class BootstrapPolicyResult {
  final bool replace;
  final TimelineCursor? catchUpCursor;

  const BootstrapPolicyResult({required this.replace, this.catchUpCursor});
}

/// Decides when to fully replace the stream vs incremental update.
BootstrapPolicyResult deriveBootstrapTailTimelinePolicy({
  required TimelineDirection direction,
  required bool reset,
  required String epoch,
  required BootstrapTailCursor endCursor,
  required bool isInitializing,
  required bool hasActiveInitDeferred,
}) {
  if (reset) {
    return const BootstrapPolicyResult(replace: true);
  }

  final isBootstrapTailInit =
      direction == 'tail' && isInitializing && hasActiveInitDeferred;
  if (!isBootstrapTailInit) {
    return const BootstrapPolicyResult(replace: false);
  }

  return BootstrapPolicyResult(
    replace: true,
    catchUpCursor: endCursor.seq != null
        ? TimelineCursor(epoch: epoch, startSeq: endCursor.seq!, endSeq: endCursor.seq!)
        : null,
  );
}

/// Determines when to resolve deferred initialization.
bool shouldResolveTimelineInit({
  required bool hasActiveInitDeferred,
  required bool isInitializing,
  required InitRequestDirection initRequestDirection,
  required TimelineDirection responseDirection,
  required bool reset,
}) {
  if (!hasActiveInitDeferred || !isInitializing) {
    return false;
  }
  if (reset) {
    return true;
  }
  return responseDirection == initRequestDirection;
}
