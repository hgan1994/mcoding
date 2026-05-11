
final _separatorOrPath = RegExp(r'[:./]');
final _multiSep = RegExp(r'[._-]+');

String _humanizeToolName(String name) {
  final trimmed = name.trim();
  if (trimmed.isEmpty) return name;
  if (_separatorOrPath.hasMatch(trimmed) || trimmed.contains('__')) {
    return trimmed;
  }
  return trimmed
      .replaceAll(_multiSep, ' ')
      .split(' ')
      .where((s) => s.isNotEmpty)
      .map((s) => s[0].toUpperCase() + s.substring(1))
      .join(' ');
}

String? _readString(dynamic value) {
  if (value is String && value.isNotEmpty) return value;
  return null;
}

String? _formatErrorText(dynamic error) {
  if (error == null) return null;
  if (error is String) return error;
  if (error is Map<String, dynamic> && error['content'] is String) {
    return error['content'] as String;
  }
  try {
    // avoid jsonEncode dependency by using toString for now
    return error.toString();
  } catch (_) {
    return error.toString();
  }
}

({String displayName, String? summary, String? errorText}) buildToolCallDisplayModel(
  Map<String, dynamic> data,
) {
  final name = data['name'] as String? ?? '';
  final detail = data['detail'] as Map<String, dynamic>?;
  final status = data['status'] as String? ?? 'running';
  final error = data['error'];

  String displayName = _humanizeToolName(name);
  String? summary;

  final detailType = detail?['type'] as String?;
  switch (detailType) {
    case 'shell':
      displayName = 'Shell';
      summary = _readString(detail?['command']);
    case 'read':
      displayName = 'Read';
      summary = _readString(detail?['filePath']);
    case 'edit':
      displayName = 'Edit';
      summary = _readString(detail?['filePath']);
    case 'write':
      displayName = 'Write';
      summary = _readString(detail?['filePath']);
    case 'search':
      displayName = 'Search';
      summary = _readString(detail?['query']);
    case 'fetch':
      displayName = 'Fetch';
      summary = _readString(detail?['url']);
    case 'worktree_setup':
      displayName = 'Worktree Setup';
      summary = _readString(detail?['branchName']);
    case 'sub_agent':
      displayName = _readString(detail?['subAgentType']) ?? 'Task';
      summary = _readString(detail?['description']);
    case 'plain_text':
      summary = _readString(detail?['label']);
    case 'plan':
      displayName = 'Plan';
    case 'unknown':
    default:
      final lowerName = name.trim().toLowerCase();
      if (detailType == 'unknown' && lowerName == 'task') {
        displayName = 'Task';
        final metadata = data['metadata'] as Map<String, dynamic>?;
        summary = _readString(metadata?['subAgentActivity']);
      } else if (detailType == 'unknown' && lowerName == 'thinking') {
        displayName = 'Thinking';
      } else if (lowerName == 'terminal') {
        displayName = 'Terminal';
        if (detailType == 'plain_text') {
          summary = _readString(detail?['label']);
        }
      }
  }

  final errorText = status == 'failed' ? _formatErrorText(error) : null;

  return (
    displayName: displayName,
    summary: summary,
    errorText: errorText,
  );
}
