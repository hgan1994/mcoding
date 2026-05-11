import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/models/provider_snapshot.dart';

void main() {
  group('ProviderSnapshotEntry', () {
    test('matches upstream provider status semantics', () {
      const ready = ProviderSnapshotEntry(provider: 'codex', status: 'ready');
      const loading = ProviderSnapshotEntry(
        provider: 'opencode',
        status: 'loading',
      );
      const error = ProviderSnapshotEntry(
        provider: 'opencode',
        status: 'error',
      );
      const unavailable = ProviderSnapshotEntry(
        provider: 'opencode',
        status: 'unavailable',
      );

      expect(ready.isResolvable, isTrue);
      expect(ready.isSelectable, isTrue);
      expect(loading.isResolvable, isTrue);
      expect(loading.isSelectable, isFalse);
      expect(error.isResolvable, isFalse);
      expect(error.isSelectable, isFalse);
      expect(unavailable.isResolvable, isFalse);
      expect(unavailable.isSelectable, isFalse);
    });

    test('disabled providers are neither resolvable nor selectable', () {
      const entry = ProviderSnapshotEntry(
        provider: 'codex',
        status: 'ready',
        enabled: false,
      );

      expect(entry.isResolvable, isFalse);
      expect(entry.isSelectable, isFalse);
    });

    test('parses missing enabled as true for compatibility', () {
      final entry = ProviderSnapshotEntry.fromJson({
        'provider': 'claude',
        'status': 'ready',
      });

      expect(entry.enabled, isTrue);
      expect(entry.isSelectable, isTrue);
    });
  });
}
