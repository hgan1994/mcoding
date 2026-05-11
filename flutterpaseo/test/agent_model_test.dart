import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/agent.dart';

void main() {
  group('AgentUsage', () {
    test('accepts integer usage cost from snapshots', () {
      final usage = AgentUsage.fromJson({
        'inputTokens': 12,
        'cachedInputTokens': 3,
        'outputTokens': 4,
        'totalCostUsd': 0,
      });

      expect(usage.inputTokens, 12);
      expect(usage.cachedInputTokens, 3);
      expect(usage.outputTokens, 4);
      expect(usage.totalCostUsd, 0.0);
    });

    test('accepts double usage cost from snapshots', () {
      final usage = AgentUsage.fromJson({'totalCostUsd': 0.025});

      expect(usage.totalCostUsd, 0.025);
    });
  });
}
