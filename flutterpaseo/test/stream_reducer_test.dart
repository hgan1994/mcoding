import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/stream.dart';
import 'package:paseo/src/utils/stream_reducer.dart';

void main() {
  group('applyStreamEvent', () {
    test('merges adjacent thought blocks when flushing head to tail', () {
      final firstTimestamp = DateTime.utc(2026, 1, 1, 12);
      final secondTimestamp = DateTime.utc(2026, 1, 1, 12, 0, 1);

      final result = applyStreamEvent(
        tail: [
          ThoughtItem(
            id: 'thought-1',
            timestamp: firstTimestamp,
            text: 'First thought. ',
            status: ThoughtStatus.ready,
          ),
        ],
        head: [
          ThoughtItem(
            id: 'thought-2',
            timestamp: secondTimestamp,
            text: 'Second thought.',
            status: ThoughtStatus.loading,
          ),
        ],
        event: {
          'type': 'timeline',
          'provider': 'codex',
          'item': {'type': 'assistant_message', 'text': 'Final answer.'},
        },
        timestamp: secondTimestamp,
      );

      expect(result.tail, hasLength(1));
      expect(result.tail.single, isA<ThoughtItem>());

      final thought = result.tail.single as ThoughtItem;
      expect(thought.id, 'thought-1');
      expect(thought.text, 'First thought. Second thought.');
      expect(thought.status, ThoughtStatus.ready);
      expect(thought.timestamp, secondTimestamp);

      expect(result.head, hasLength(1));
      expect(result.head.single, isA<AssistantMessageItem>());
      expect(
        (result.head.single as AssistantMessageItem).text,
        'Final answer.',
      );
    });
  });
}
