import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'attachment_models.dart';

/// Simple state holder for composer attachments keyed by agentId.
class ComposerAttachmentState {
  final Map<String, List<AttachmentMetadata>> attachmentsByAgent;

  const ComposerAttachmentState({this.attachmentsByAgent = const {}});

  ComposerAttachmentState copyWith({
    Map<String, List<AttachmentMetadata>>? attachmentsByAgent,
  }) {
    return ComposerAttachmentState(
      attachmentsByAgent: attachmentsByAgent ?? this.attachmentsByAgent,
    );
  }

  List<AttachmentMetadata> forAgent(String agentId) {
    return attachmentsByAgent[agentId] ?? const [];
  }
}

class ComposerAttachmentNotifier extends StateNotifier<ComposerAttachmentState> {
  ComposerAttachmentNotifier() : super(const ComposerAttachmentState());

  void addAttachments(String agentId, List<AttachmentMetadata> attachments) {
    final current = Map<String, List<AttachmentMetadata>>.from(state.attachmentsByAgent);
    final list = List<AttachmentMetadata>.from(current[agentId] ?? []);
    list.addAll(attachments);
    current[agentId] = list;
    state = state.copyWith(attachmentsByAgent: current);
  }

  void removeAttachment(String agentId, int index) {
    final current = Map<String, List<AttachmentMetadata>>.from(state.attachmentsByAgent);
    final list = List<AttachmentMetadata>.from(current[agentId] ?? []);
    if (index < 0 || index >= list.length) return;
    list.removeAt(index);
    if (list.isEmpty) {
      current.remove(agentId);
    } else {
      current[agentId] = list;
    }
    state = state.copyWith(attachmentsByAgent: current);
  }

  void clearAttachments(String agentId) {
    final current = Map<String, List<AttachmentMetadata>>.from(state.attachmentsByAgent);
    current.remove(agentId);
    state = state.copyWith(attachmentsByAgent: current);
  }
}

final composerAttachmentProvider =
    StateNotifierProvider<ComposerAttachmentNotifier, ComposerAttachmentState>(
  (ref) => ComposerAttachmentNotifier(),
);
