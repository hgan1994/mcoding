import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:equatable/equatable.dart';
import '../services/storage_service.dart';
import '../attachments/attachment_models.dart';

const _draftsKey = 'agent_drafts';
const _draftAttachmentsKey = 'agent_draft_attachments';

class DraftState extends Equatable {
  final Map<String, String> drafts;
  final Map<String, List<AttachmentMetadata>> draftAttachments;

  const DraftState({
    this.drafts = const {},
    this.draftAttachments = const {},
  });

  DraftState copyWith({
    Map<String, String>? drafts,
    Map<String, List<AttachmentMetadata>>? draftAttachments,
  }) {
    return DraftState(
      drafts: drafts ?? this.drafts,
      draftAttachments: draftAttachments ?? this.draftAttachments,
    );
  }

  @override
  List<Object?> get props => [drafts, draftAttachments];
}

class DraftNotifier extends StateNotifier<DraftState> {
  final StorageService _storage = StorageService();

  DraftNotifier() : super(const DraftState()) {
    _loadDrafts();
    _loadDraftAttachments();
  }

  Future<void> _loadDrafts() async {
    try {
      final raw = await _storage.getString(_draftsKey);
      if (raw == null || raw.isEmpty) return;
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final drafts = map.map((k, v) => MapEntry(k, v.toString()));
      state = state.copyWith(drafts: drafts);
    } catch (e, st) {
      debugPrint('DraftNotifier: failed to load drafts: $e\n$st');
    }
  }

  Future<void> _loadDraftAttachments() async {
    try {
      final raw = await _storage.getString(_draftAttachmentsKey);
      if (raw == null || raw.isEmpty) return;
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final attachments = map.map((k, v) {
        final list = (v as List<dynamic>)
            .map((e) => AttachmentMetadata.fromJson(e as Map<String, dynamic>))
            .toList();
        return MapEntry(k, list);
      });
      state = state.copyWith(draftAttachments: attachments);
    } catch (e, st) {
      debugPrint('DraftNotifier: failed to load draft attachments: $e\n$st');
    }
  }

  void saveDraft(String agentId, String text) {
    final updated = Map<String, String>.from(state.drafts);
    updated[agentId] = text;
    state = state.copyWith(drafts: updated);
    _persistDrafts();
  }

  void clearDraft(String agentId) {
    final updated = Map<String, String>.from(state.drafts);
    updated.remove(agentId);
    final attachments = Map<String, List<AttachmentMetadata>>.from(state.draftAttachments);
    attachments.remove(agentId);
    state = state.copyWith(drafts: updated, draftAttachments: attachments);
    _persistDrafts();
    _persistAttachments();
  }

  void saveDraftAttachments(String agentId, List<AttachmentMetadata> attachments) {
    final updated = Map<String, List<AttachmentMetadata>>.from(state.draftAttachments);
    updated[agentId] = attachments;
    state = state.copyWith(draftAttachments: updated);
    _persistAttachments();
  }

  void clearDraftAttachments(String agentId) {
    final updated = Map<String, List<AttachmentMetadata>>.from(state.draftAttachments);
    updated.remove(agentId);
    state = state.copyWith(draftAttachments: updated);
    _persistAttachments();
  }

  Future<void> _persistDrafts() async {
    try {
      final raw = jsonEncode(state.drafts);
      await _storage.setString(_draftsKey, raw);
    } catch (e, st) {
      debugPrint('DraftNotifier: failed to persist drafts: $e\n$st');
    }
  }

  Future<void> _persistAttachments() async {
    try {
      final raw = jsonEncode(
        state.draftAttachments.map((k, v) => MapEntry(k, v.map((a) => a.toJson()).toList())),
      );
      await _storage.setString(_draftAttachmentsKey, raw);
    } catch (e, st) {
      debugPrint('DraftNotifier: failed to persist draft attachments: $e\n$st');
    }
  }
}

final draftProvider =
    StateNotifierProvider<DraftNotifier, DraftState>((ref) => DraftNotifier());
