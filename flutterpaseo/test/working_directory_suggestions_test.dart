import 'package:flutter_test/flutter_test.dart';
import 'package:paseo/src/utils/working_directory_suggestions.dart';

void main() {
  group('buildWorkingDirectorySuggestions', () {
    test('returns de-duplicated recommendations when query is empty', () {
      final results = buildWorkingDirectorySuggestions(
        recommendedPaths: [
          '/Users/me/projects/paseo',
          '/Users/me/projects/paseo',
        ],
        serverPaths: ['/Users/me/projects/playground'],
        query: '',
      );

      expect(results, ['/Users/me/projects/paseo']);
    });

    test(
      'prioritizes matching recommended directories before server matches',
      () {
        final results = buildWorkingDirectorySuggestions(
          recommendedPaths: [
            '/Users/me/projects/playground',
            '/Users/me/paseo',
          ],
          serverPaths: [
            '/Users/me/projects/planbook',
            '/Users/me/projects/playground',
          ],
          query: 'pla',
        );

        expect(results, [
          '/Users/me/projects/playground',
          '/Users/me/projects/planbook',
        ]);
      },
    );

    test('treats tilde as an active query and includes server suggestions', () {
      final results = buildWorkingDirectorySuggestions(
        recommendedPaths: ['/Users/me/projects/paseo'],
        serverPaths: ['/Users/me/documents', '/Users/me/projects'],
        query: '~',
      );

      expect(results, [
        '/Users/me/projects/paseo',
        '/Users/me/documents',
        '/Users/me/projects',
      ]);
    });
  });
}
