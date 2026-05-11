import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/stream.dart';
import 'package:paseo/src/timeline/session_stream_reducers.dart';
import 'package:paseo/src/timeline/timeline_cursor.dart';
import 'package:paseo/src/utils/stream_reducer.dart';

void main() {
  group('hydrateStreamState', () {
    test('merges adjacent thought blocks when restoring canonical history', () {
      final firstTimestamp = DateTime.utc(2026, 1, 1, 12);
      final secondTimestamp = DateTime.utc(2026, 1, 1, 12, 0, 1);

      final items = hydrateStreamState([
        {
          'type': 'timeline',
          'provider': 'codex',
          'timestamp': firstTimestamp.toIso8601String(),
          'item': {'type': 'reasoning', 'text': 'First thought. '},
        },
        {
          'type': 'timeline',
          'provider': 'codex',
          'timestamp': secondTimestamp.toIso8601String(),
          'item': {'type': 'reasoning', 'text': 'Second thought.'},
        },
      ]);

      expect(items, hasLength(1));
      expect(items.single, isA<ThoughtItem>());

      final thought = items.single as ThoughtItem;
      expect(thought.text, 'First thought. Second thought.');
      expect(thought.status, ThoughtStatus.ready);
      expect(thought.timestamp, secondTimestamp);
    });
  });

  group('processTimelineResponse', () {
    test('prepends older timeline pages and merges thought boundary', () {
      final currentTimestamp = DateTime.utc(2026, 1, 1, 12, 0, 2);
      final olderFirstTimestamp = DateTime.utc(2026, 1, 1, 12);
      final olderSecondTimestamp = DateTime.utc(2026, 1, 1, 12, 0, 1);

      final result = processTimelineResponse(
        ProcessTimelineResponseInput(
          payload: {
            'agentId': 'agent-1',
            'direction': 'before',
            'epoch': 'epoch-1',
            'reset': false,
            'startCursor': {'epoch': 'epoch-1', 'seq': 1},
            'endCursor': {'epoch': 'epoch-1', 'seq': 2},
            'entries': [
              {
                'seqStart': 1,
                'seqEnd': 1,
                'provider': 'codex',
                'timestamp': olderFirstTimestamp.toIso8601String(),
                'item': {'type': 'reasoning', 'text': 'Older thought. '},
              },
              {
                'seqStart': 2,
                'seqEnd': 2,
                'provider': 'codex',
                'timestamp': olderSecondTimestamp.toIso8601String(),
                'item': {'type': 'reasoning', 'text': 'Still older. '},
              },
            ],
          },
          currentTail: [
            ThoughtItem(
              id: 'current-thought',
              timestamp: currentTimestamp,
              text: 'Current thought.',
              status: ThoughtStatus.ready,
            ),
          ],
          currentHead: const [],
          currentCursor: const TimelineCursor(
            epoch: 'epoch-1',
            startSeq: 3,
            endSeq: 4,
          ),
        ),
      );

      expect(result.tail, hasLength(1));
      expect(result.tail.single, isA<ThoughtItem>());

      final thought = result.tail.single as ThoughtItem;
      expect(thought.text, 'Older thought. Still older. Current thought.');
      expect(thought.status, ThoughtStatus.ready);
      expect(thought.timestamp, currentTimestamp);
      expect(
        result.cursor,
        const TimelineCursor(epoch: 'epoch-1', startSeq: 1, endSeq: 4),
      );
    });
  });
}
