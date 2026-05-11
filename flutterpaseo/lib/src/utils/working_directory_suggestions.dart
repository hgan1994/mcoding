List<String> buildWorkingDirectorySuggestions({
  required List<String> recommendedPaths,
  required List<String> serverPaths,
  required String query,
}) {
  final rawQuery = query.trim();
  final recommended = _uniquePaths(recommendedPaths);
  if (rawQuery.isEmpty) {
    return recommended;
  }

  final normalizedQuery = _normalizeQuery(rawQuery);
  final shouldFilterByQuery = normalizedQuery.isNotEmpty;

  final recommendedMatches = shouldFilterByQuery
      ? recommended
            .where((entry) => _pathMatchesQuery(entry, normalizedQuery))
            .toList()
      : recommended;
  final seen = <String>{...recommendedMatches};
  final ordered = <String>[...recommendedMatches];

  for (final entry in _uniquePaths(serverPaths)) {
    if (shouldFilterByQuery && !_pathMatchesQuery(entry, normalizedQuery)) {
      continue;
    }
    if (seen.contains(entry)) {
      continue;
    }
    ordered.add(entry);
    seen.add(entry);
  }

  return ordered;
}

List<String> _uniquePaths(List<String> paths) {
  final seen = <String>{};
  final ordered = <String>[];
  for (final pathEntry in paths) {
    final trimmed = pathEntry.trim();
    if (trimmed.isEmpty || seen.contains(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    ordered.add(trimmed);
  }
  return ordered;
}

String _normalizeQuery(String query) {
  var normalized = query.trim();
  if (normalized.isEmpty) {
    return '';
  }
  if (normalized.startsWith('~')) {
    normalized = normalized.substring(1);
  }
  normalized = normalized.replaceFirst(RegExp(r'^/+'), '').toLowerCase();
  return normalized;
}

bool _pathMatchesQuery(String candidatePath, String query) {
  final lowerPath = candidatePath.toLowerCase();
  if (lowerPath.contains(query)) {
    return true;
  }
  final segments = lowerPath.split('/');
  return (segments.isEmpty ? '' : segments.last).contains(query);
}
