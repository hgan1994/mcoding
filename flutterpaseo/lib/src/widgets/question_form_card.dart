import 'package:flutter/material.dart';
import '../models/permission.dart';

class _Question {
  final String question;
  final String header;
  final List<_QuestionOption> options;
  final bool multiSelect;

  const _Question({
    required this.question,
    required this.header,
    required this.options,
    required this.multiSelect,
  });
}

class _QuestionOption {
  final String label;
  final String? description;

  const _QuestionOption({required this.label, this.description});
}

List<_Question>? _parseQuestions(dynamic input) {
  if (input is! Map<String, dynamic>) return null;
  final rawQuestions = input['questions'];
  if (rawQuestions is! List<dynamic>) return null;

  final questions = <_Question>[];
  for (final item in rawQuestions) {
    if (item is! Map<String, dynamic>) return null;
    if (item['question'] is! String || item['header'] is! String) return null;
    final rawOptions = item['options'];
    if (rawOptions is! List<dynamic>) return null;

    final options = <_QuestionOption>[];
    for (final opt in rawOptions) {
      if (opt is! Map<String, dynamic>) return null;
      if (opt['label'] is! String) return null;
      options.add(_QuestionOption(
        label: opt['label'] as String,
        description: opt['description'] as String?,
      ));
    }

    questions.add(_Question(
      question: item['question'] as String,
      header: item['header'] as String,
      options: options,
      multiSelect: item['multiSelect'] == true,
    ));
  }
  return questions.isNotEmpty ? questions : null;
}

class QuestionFormCard extends StatefulWidget {
  final AgentPermissionRequest permission;
  final void Function(Map<String, dynamic> response) onRespond;
  final bool isResponding;

  const QuestionFormCard({
    super.key,
    required this.permission,
    required this.onRespond,
    this.isResponding = false,
  });

  @override
  State<QuestionFormCard> createState() => _QuestionFormCardState();
}

class _QuestionFormCardState extends State<QuestionFormCard> {
  final Map<int, Set<int>> _selections = {};
  final Map<int, String> _otherTexts = {};

  void _toggleOption(int qIndex, int optIndex, bool multiSelect) {
    setState(() {
      final current = Set<int>.from(_selections[qIndex] ?? {});
      if (multiSelect) {
        if (current.contains(optIndex)) {
          current.remove(optIndex);
        } else {
          current.add(optIndex);
        }
      } else {
        if (current.contains(optIndex)) {
          current.clear();
        } else {
          current.clear();
          current.add(optIndex);
        }
      }
      _selections[qIndex] = current;
      _otherTexts.remove(qIndex);
    });
  }

  void _setOtherText(int qIndex, String text) {
    setState(() {
      _otherTexts[qIndex] = text;
      if (text.isNotEmpty) {
        final current = _selections[qIndex];
        if (current != null && current.isNotEmpty) {
          _selections[qIndex] = {};
        }
      }
    });
  }

  bool get _allAnswered {
    final questions = _parseQuestions(widget.permission.input);
    if (questions == null) return false;
    for (int i = 0; i < questions.length; i++) {
      final selected = _selections[i];
      final otherText = _otherTexts[i]?.trim();
      if ((selected == null || selected.isEmpty) && (otherText == null || otherText.isEmpty)) {
        return false;
      }
    }
    return true;
  }

  void _handleSubmit() {
    if (!_allAnswered || widget.isResponding) return;
    final questions = _parseQuestions(widget.permission.input);
    if (questions == null) return;

    final answers = <String, String>{};
    for (int i = 0; i < questions.length; i++) {
      final q = questions[i];
      final selected = _selections[i];
      final otherText = _otherTexts[i]?.trim();

      if (otherText != null && otherText.isNotEmpty) {
        answers[q.header] = otherText;
      } else if (selected != null && selected.isNotEmpty) {
        final labels = selected.map((idx) => q.options[idx].label).toList();
        answers[q.header] = labels.join(', ');
      }
    }

    widget.onRespond({
      'behavior': 'allow',
      'updatedInput': {
        ...?widget.permission.input,
        'answers': answers,
      },
    });
  }

  void _handleDeny() {
    widget.onRespond({
      'behavior': 'deny',
      'message': 'Dismissed by user',
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final questions = _parseQuestions(widget.permission.input);
    if (questions == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          for (int qIndex = 0; qIndex < questions.length; qIndex++) ...[
            if (qIndex > 0) const SizedBox(height: 16),
            _buildQuestion(theme, questions[qIndex], qIndex),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: widget.isResponding ? null : _handleDeny,
                  child: const Text('Dismiss'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: (_allAnswered && !widget.isResponding) ? _handleSubmit : null,
                  child: widget.isResponding
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuestion(ThemeData theme, _Question q, int qIndex) {
    final selected = _selections[qIndex] ?? {};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                q.question,
                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
            ),
            Icon(Icons.help_outline, size: 16, color: theme.colorScheme.onSurfaceVariant),
          ],
        ),
        const SizedBox(height: 8),
        for (int optIndex = 0; optIndex < q.options.length; optIndex++) ...[
          _buildOption(theme, q.options[optIndex], qIndex, optIndex, selected.contains(optIndex), q.multiSelect),
        ],
        const SizedBox(height: 8),
        TextField(
          decoration: InputDecoration(
            hintText: 'Other...',
            filled: true,
            fillColor: theme.colorScheme.surfaceContainerHighest,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: theme.colorScheme.outlineVariant),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: theme.colorScheme.outlineVariant),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: theme.colorScheme.primary),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
          style: theme.textTheme.bodySmall,
          onChanged: (text) => _setOtherText(qIndex, text),
          enabled: !widget.isResponding,
          textInputAction: TextInputAction.done,
        ),
      ],
    );
  }

  Widget _buildOption(ThemeData theme, _QuestionOption opt, int qIndex, int optIndex, bool isSelected, bool multiSelect) {
    return InkWell(
      onTap: widget.isResponding ? null : () => _toggleOption(qIndex, optIndex, multiSelect),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        margin: const EdgeInsets.only(bottom: 4),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.surfaceContainerHighest : null,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    opt.label,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: isSelected ? FontWeight.w600 : null,
                    ),
                  ),
                  if (opt.description != null)
                    Text(
                      opt.description!,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check, size: 16, color: theme.colorScheme.primary),
          ],
        ),
      ),
    );
  }
}
