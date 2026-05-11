
bool _hasMeaningfulUnknownValue(dynamic value) {
  if (value == null) return false;
  if (value is String) return value.trim().isNotEmpty;
  if (value is num || value is bool) return true;
  if (value is List) return value.any(_hasMeaningfulUnknownValue);
  if (value is Map<String, dynamic>) return value.values.any(_hasMeaningfulUnknownValue);
  return true;
}

bool _isNonEmptyString(dynamic value) {
  return value is String && value.isNotEmpty;
}

bool hasMeaningfulToolCallDetail(Map<String, dynamic>? detail) {
  if (detail == null) return false;

  final type = detail['type'] as String?;
  switch (type) {
    case 'shell':
      return true;
    case 'read':
      return _isNonEmptyString(detail['filePath']) || _isNonEmptyString(detail['content']);
    case 'edit':
      return _isNonEmptyString(detail['filePath']) ||
          _isNonEmptyString(detail['unifiedDiff']) ||
          _isNonEmptyString(detail['oldString']) ||
          _isNonEmptyString(detail['newString']);
    case 'write':
      return _isNonEmptyString(detail['filePath']) || _isNonEmptyString(detail['content']);
    case 'search':
      final query = detail['query'];
      return (query is String && query.trim().isNotEmpty) ||
          _isNonEmptyString(detail['content']) ||
          (detail['filePaths'] is List && (detail['filePaths'] as List).isNotEmpty) ||
          (detail['webResults'] is List && (detail['webResults'] as List).isNotEmpty) ||
          (detail['annotations'] is List && (detail['annotations'] as List).isNotEmpty);
    case 'fetch':
      return _isNonEmptyString(detail['url']) ||
          _isNonEmptyString(detail['result']) ||
          _isNonEmptyString(detail['codeText']);
    case 'worktree_setup':
      return _isNonEmptyString(detail['branchName']) ||
          _isNonEmptyString(detail['worktreePath']) ||
          _isNonEmptyString(detail['log']);
    case 'sub_agent':
      return _isNonEmptyString(detail['subAgentType']) ||
          _isNonEmptyString(detail['description']) ||
          _isNonEmptyString(detail['log']) ||
          (detail['actions'] is List && (detail['actions'] as List).isNotEmpty);
    case 'plain_text':
      return _isNonEmptyString(detail['label']) || _isNonEmptyString(detail['text']);
    case 'plan':
      final text = detail['text'];
      return text is String && text.trim().isNotEmpty;
    case 'unknown':
      return _hasMeaningfulUnknownValue(detail['input']) ||
          _hasMeaningfulUnknownValue(detail['output']);
    default:
      return false;
  }
}

bool isPendingToolCallDetail({
  required Map<String, dynamic>? detail,
  required String status,
  required dynamic error,
}) {
  final isRunning = status == 'running' || status == 'executing';
  return isRunning && error == null && !hasMeaningfulToolCallDetail(detail);
}
