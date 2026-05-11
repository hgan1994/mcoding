import 'package:flutter/material.dart';

IconData resolveToolCallIcon(String toolName, Map<String, dynamic>? detail) {
  final lowerName = toolName.trim().toLowerCase();

  if (detail != null && detail['type'] == 'plain_text' && detail['icon'] is String) {
    return _iconByName(detail['icon'] as String);
  }

  if (lowerName == 'thinking') {
    return Icons.psychology;
  }
  if (lowerName == 'speak') {
    return Icons.mic;
  }
  if (lowerName == 'task') {
    return Icons.smart_toy;
  }

  final detailType = detail?['type'] as String?;
  switch (detailType) {
    case 'shell':
    case 'worktree_setup':
      return Icons.terminal;
    case 'read':
      return Icons.visibility;
    case 'edit':
    case 'write':
      return Icons.edit;
    case 'search':
    case 'fetch':
      return Icons.search;
    case 'sub_agent':
      return Icons.smart_toy;
    case 'plan':
      return Icons.psychology;
    case 'plain_text':
    case 'unknown':
    default:
      return Icons.build;
  }
}

IconData _iconByName(String name) {
  switch (name) {
    case 'square_terminal':
      return Icons.terminal;
    case 'eye':
      return Icons.visibility;
    case 'pencil':
      return Icons.edit;
    case 'search':
      return Icons.search;
    case 'bot':
      return Icons.smart_toy;
    case 'sparkles':
      return Icons.auto_awesome;
    case 'brain':
      return Icons.psychology;
    case 'mic_vocal':
      return Icons.mic;
    case 'wrench':
    default:
      return Icons.build;
  }
}
