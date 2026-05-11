import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../attachments/attachment_models.dart';
import '../attachments/attachment_picker.dart';
import '../attachments/attachment_service.dart';
import '../models/agent.dart';
import '../models/provider_snapshot.dart';
import '../models/stream.dart';
import '../l10n_ext.dart';
import '../providers/host_runtime_provider.dart';
import '../providers/session_provider.dart';
import '../providers/voice_usage_provider.dart';
import '../utils/default_agent_mode.dart';
import '../utils/keyboard_dismiss.dart';
import '../widgets/agent_session_drawer.dart';
import '../widgets/agent_stream_view.dart';
import '../services/completion_sound_service.dart';
import '../services/storage_service.dart';
import '../widgets/app_snack_bar.dart';
import '../widgets/animated_pause_icon.dart';
import '../widgets/hold_to_talk_button.dart';
import '../widgets/permission_panel.dart';
import '../widgets/workspace_drawer.dart';

class NewWorkspaceChatScreen extends ConsumerStatefulWidget {
  final String serverId;
  final String cwd;
  final String? workspaceId;
  final String? workspaceName;
  final String? sessionNonce;
  final bool fromProjects;

  const NewWorkspaceChatScreen({
    super.key,
    required this.serverId,
    required this.cwd,
    this.workspaceId,
    this.workspaceName,
    this.sessionNonce,
    this.fromProjects = false,
  });

  @override
  ConsumerState<NewWorkspaceChatScreen> createState() =>
      _NewWorkspaceChatScreenState();
}

class _NewWorkspaceChatScreenState
    extends ConsumerState<NewWorkspaceChatScreen> {
  late String _draftAgentId;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _inputController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final AttachmentPicker _picker = AttachmentPicker();
  final AttachmentService _attachmentService = AttachmentService();
  final CompletionSoundService _soundService = CompletionSoundService();
  final StorageService _storageService = StorageService();

  List<StreamItem> _items = const [];
  List<AttachmentMetadata> _attachments = const [];
  String? _selectedProvider;
  String? _selectedModel;
  String? _selectedThinkingOptionId;
  String? _selectedMode;
  String? _activeAgentId;
  String? _errorText;
  bool _isSending = false;
  AgentLifecycleStatus? _lastAgentStatus;

  @override
  void initState() {
    super.initState();
    _draftAgentId = _buildDraftAgentId();
    Future.microtask(() async {
      await _loadLastSelectedModel();
      if (!mounted) return;
      _attachRuntimeClient();
      _requestProviderSnapshot();
    });
  }

  Future<void> _loadLastSelectedModel() async {
    final lastProvider = await _storageService.getLastSelectedProvider();
    String? lastModel;
    String? lastThinking;
    String? lastMode;
    if (lastProvider != null) {
      lastModel = await _storageService.getLastSelectedModel(lastProvider);
      lastThinking = await _storageService.getLastSelectedThinking(
        lastProvider,
      );
      lastMode = await _storageService.getLastSelectedMode(lastProvider);
    }
    if (lastProvider != null ||
        lastModel != null ||
        lastThinking != null ||
        lastMode != null) {
      if (mounted) {
        setState(() {
          if (lastProvider != null) _selectedProvider = lastProvider;
          if (lastModel != null) _selectedModel = lastModel;
          if (lastThinking != null) _selectedThinkingOptionId = lastThinking;
          if (lastMode != null) _selectedMode = lastMode;
        });
      }
    }
  }

  @override
  void didUpdateWidget(covariant NewWorkspaceChatScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    final changedWorkspace =
        oldWidget.serverId != widget.serverId ||
        oldWidget.cwd != widget.cwd ||
        oldWidget.workspaceId != widget.workspaceId ||
        oldWidget.sessionNonce != widget.sessionNonce;
    if (!changedWorkspace) return;

    _draftAgentId = _buildDraftAgentId();
    _inputController.clear();
    _focusNode.unfocus();
    _items = const [];
    _attachments = const [];
    _selectedThinkingOptionId = null;
    _selectedMode = null;
    _activeAgentId = null;
    _errorText = null;
    _isSending = false;
    _lastAgentStatus = null;

    Future.microtask(() async {
      if (!mounted) return;
      await _loadLastSelectedModel();
      _attachRuntimeClient();
      _requestProviderSnapshot();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _inputController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  String _buildDraftAgentId() {
    final nonce = widget.sessionNonce;
    final suffix = nonce == null || nonce.isEmpty ? '' : ':$nonce';
    return 'new-workspace:${widget.serverId}:${widget.cwd}$suffix';
  }

  void _attachRuntimeClient() {
    final client = ref.read(hostRuntimeProvider)[widget.serverId]?.client;
    if (client == null) return;
    final session = ref.read(sessionProvider(widget.serverId));
    if (identical(session.client, client)) return;
    ref.read(sessionProvider(widget.serverId).notifier).attachClient(client);
  }

  void _requestProviderSnapshot() {
    final notifier = ref.read(sessionProvider(widget.serverId).notifier);
    notifier.fetchProvidersSnapshot(cwd: widget.cwd);
    notifier.refreshProvidersSnapshot(cwd: widget.cwd);
  }

  _ResolvedDraftConfig _resolveConfig(
    List<ProviderSnapshotEntry> entries, {
    Agent? activeAgent,
  }) {
    final resolvable = entries.where((entry) => entry.isResolvable).toList();
    final selectable = entries.where((entry) => entry.isSelectable).toList();
    final isLiveSession = activeAgent != null;
    final providerIds = isLiveSession
        ? <String>[activeAgent.provider]
        : selectable.isNotEmpty
        ? selectable.map((entry) => entry.provider).toList()
        : entries.isEmpty
        ? const ['claude', 'codex', 'opencode']
        : const <String>[];
    final provider = isLiveSession
        ? activeAgent.provider
        : resolvable.any((entry) => entry.provider == _selectedProvider)
        ? _selectedProvider!
        : selectable.isNotEmpty
        ? selectable.first.provider
        : entries.isEmpty
        ? (_selectedProvider != null &&
                providerIds.contains(_selectedProvider)
            ? _selectedProvider!
            : providerIds.first)
        : null;
    final entry = resolvable
        .where((item) => item.provider == provider)
        .firstOrNull;
    final models = entry?.models ?? const <AgentModelDefinition>[];
    final liveModel = activeAgent?.model ?? activeAgent?.runtimeInfo?.model;
    final defaultModel = models.where((model) => model.isDefault).firstOrNull;
    final modelIds = models.map((model) => model.id).toSet();
    final model = isLiveSession
        ? modelIds.contains(liveModel)
              ? liveModel
              : defaultModel?.id ?? (models.isNotEmpty ? models.first.id : null)
        : modelIds.contains(_selectedModel)
        ? _selectedModel
        : models.isNotEmpty
        ? (defaultModel?.id ?? models.first.id)
        : _selectedModel;
    final selectedModelDefinition = models
        .where((item) => item.id == model)
        .firstOrNull;
    final thinkingOptions =
        selectedModelDefinition?.thinkingOptions ?? const <AgentSelectOption>[];
    final liveThinkingOptionId =
        activeAgent?.thinkingOptionId ??
        activeAgent?.runtimeInfo?.thinkingOptionId;
    final thinkingOptionIds = thinkingOptions
        .map((option) => option.id)
        .toSet();
    final defaultThinkingOptionId =
        selectedModelDefinition?.defaultThinkingOptionId ??
        thinkingOptions.where((option) => option.isDefault).firstOrNull?.id ??
        thinkingOptions.where((option) => option.id == 'max').firstOrNull?.id ??
        thinkingOptions.firstOrNull?.id;
    final thinkingOptionId = isLiveSession
        ? thinkingOptionIds.contains(liveThinkingOptionId)
              ? liveThinkingOptionId
              : defaultThinkingOptionId
        : thinkingOptionIds.contains(_selectedThinkingOptionId)
        ? _selectedThinkingOptionId
        : defaultThinkingOptionId;

    final modes = entry?.modes ?? activeAgent?.availableModes ?? const [];
    final liveModeId =
        activeAgent?.currentModeId ?? activeAgent?.runtimeInfo?.modeId;
    final modeIds = modes.map((mode) => mode.id).toSet();
    final mode = isLiveSession
        ? modeIds.contains(liveModeId)
              ? liveModeId
              : resolveDefaultConversationMode(
                  modes: modes,
                  providerDefaultModeId: entry?.defaultModeId,
                )
        : modeIds.contains(_selectedMode)
        ? _selectedMode
        : resolveDefaultConversationMode(
            modes: modes,
            providerDefaultModeId: entry?.defaultModeId,
          );

    return _ResolvedDraftConfig(
      providerIds: providerIds,
      selectedProvider: provider,
      entry: entry,
      models: models,
      selectedModel: model,
      thinkingOptions: thinkingOptions,
      selectedThinkingOptionId: thinkingOptionId,
      modes: modes,
      selectedMode: mode,
    );
  }

  void _syncResolvedConfig(_ResolvedDraftConfig config) {
    if (_selectedProvider == config.selectedProvider &&
        _selectedModel == config.selectedModel &&
        _selectedThinkingOptionId == config.selectedThinkingOptionId &&
        _selectedMode == config.selectedMode) {
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      setState(() {
        _selectedProvider = config.selectedProvider;
        _selectedModel = config.selectedModel;
        _selectedThinkingOptionId = config.selectedThinkingOptionId;
        _selectedMode = config.selectedMode;
      });
    });
  }

  Future<void> _pickImages() async {
    final picked = await _picker.pickImages();
    if (picked == null || picked.isEmpty || !mounted) return;
    setState(() => _attachments = [..._attachments, ...picked]);
  }

  void _removeAttachment(int index) {
    if (index < 0 || index >= _attachments.length) return;
    final removed = _attachments[index];
    setState(() {
      _attachments = [
        ..._attachments.take(index),
        ..._attachments.skip(index + 1),
      ];
    });
    _attachmentService.deleteAttachments([removed]);
  }

  Future<void> _send(_ResolvedDraftConfig config) async {
    final text = _inputController.text.trim();
    if ((text.isEmpty && _attachments.isEmpty) || _isSending) return;
    if (_activeAgentId == null && config.selectedProvider == null) {
      AppSnackBar.showWarning(
        context,
        context.l10n.noProviderAvailable,
      );
      return;
    }
    dismissSoftKeyboard(context);

    final activeAgentId = _activeAgentId;
    final messageId = 'msg-${DateTime.now().millisecondsSinceEpoch}';
    final streamImages = _attachments
        .map(
          (attachment) => {
            'id': attachment.id,
            'storageKey': attachment.storageKey,
            'mimeType': attachment.mimeType,
          },
        )
        .toList();
    setState(() {
      _isSending = true;
      _errorText = null;
      if (activeAgentId == null) {
        _items = [
          ..._items,
          UserMessageItem(
            id: messageId,
            timestamp: DateTime.now(),
            text: text,
            images: streamImages.isEmpty ? null : streamImages,
          ),
        ];
      }
    });
    _scrollToBottom();

    try {
      final imagesData = await _attachmentService.encodeAttachmentsForSend(
        _attachments,
      );
      if (activeAgentId != null) {
        await ref
            .read(sessionProvider(widget.serverId).notifier)
            .sendMessage(activeAgentId, text, images: imagesData);
        if (!mounted) return;
        _inputController.clear();
        setState(() {
          _attachments = const [];
          _isSending = false;
        });
        _scrollToBottom();
        return;
      }

      final createConfig = <String, dynamic>{
        'provider': config.selectedProvider!,
        'cwd': widget.cwd,
      };
      if (config.selectedModel != null && config.selectedModel!.isNotEmpty) {
        createConfig['model'] = config.selectedModel;
      }
      if (config.selectedMode != null && config.selectedMode!.isNotEmpty) {
        createConfig['modeId'] = config.selectedMode;
      }
      if (config.selectedThinkingOptionId != null &&
          config.selectedThinkingOptionId!.isNotEmpty) {
        createConfig['thinkingOptionId'] = config.selectedThinkingOptionId;
      }

      final agent = await ref
          .read(sessionProvider(widget.serverId).notifier)
          .createAgentAndWait(
            config: createConfig,
            workspaceId: widget.workspaceId,
            initialPrompt: text,
            clientMessageId: messageId,
            images: imagesData,
          );

      if (!mounted) return;
      _inputController.clear();
      setState(() {
        _activeAgentId = agent.id;
        _attachments = const [];
        _isSending = false;
      });
      ref.read(sessionProvider(widget.serverId).notifier)
        ..setFocusedAgent(agent.id)
        ..fetchAgentTimeline(agent.id);
      _scrollToBottom();
    } catch (error) {
      if (!mounted) return;
      final message = error.toString();
      setState(() {
        _isSending = false;
        _errorText = message;
      });
      final action = activeAgentId == null
          ? context.l10n.createFailed(message)
          : context.l10n.sendFailed(message);
      AppSnackBar.showError(context, action);
    }
  }

  void _quoteMessage(String text) {
    final existing = _inputController.text;
    _inputController.text = existing.isEmpty ? text : '$existing\n$text';
    _focusNode.requestFocus();
    _inputController.selection = TextSelection.collapsed(
      offset: _inputController.text.length,
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollController.hasClients) return;
      try {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOut,
        );
      } catch (_) {
        // Ignore scroll errors during keyboard transitions
      }
    });
  }

  void _openAgentDrawer() {
    dismissSoftKeyboard(context);
    ref.read(sessionProvider(widget.serverId).notifier).fetchAgents();
    _scaffoldKey.currentState?.openEndDrawer();
  }

  void _openWorkspaceDrawer() {
    dismissSoftKeyboard(context);
    ref.read(sessionProvider(widget.serverId).notifier).fetchWorkspaces();
    _scaffoldKey.currentState?.openDrawer();
  }

  void _selectAgentFromDrawer(Agent agent) {
    if (_activeAgentId == agent.id) {
      return;
    }
    setState(() {
      _activeAgentId = agent.id;
      _items = const [];
      _attachments = const [];
      _errorText = null;
    });
    ref.read(sessionProvider(widget.serverId).notifier)
      ..setFocusedAgent(agent.id)
      ..fetchAgentTimeline(agent.id);
    _scrollToBottom();
  }

  Future<void> _setActiveAgentMode(String agentId, String modeId) async {
    try {
      await ref
          .read(sessionProvider(widget.serverId).notifier)
          .setAgentMode(agentId, modeId);
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.showError(context, context.l10n.changeModeFailed(error.toString()));
    }
  }

  Future<void> _setActiveAgentModel(String agentId, String? modelId) async {
    try {
      await ref
          .read(sessionProvider(widget.serverId).notifier)
          .setAgentModel(agentId, modelId);
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.showError(context, context.l10n.changeModelFailed(error.toString()));
    }
  }

  Future<void> _setActiveAgentThinking(
    String agentId,
    String? thinkingOptionId,
  ) async {
    try {
      await ref
          .read(sessionProvider(widget.serverId).notifier)
          .setAgentThinkingOption(agentId, thinkingOptionId);
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.showError(context, context.l10n.changeThinkingFailed(error.toString()));
    }
  }

  void _showProviderLockedWarning() {
    AppSnackBar.showWarning(context, context.l10n.providerLockedWarning);
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(hostRuntimeProvider, (previous, next) {
      final previousClient = previous?[widget.serverId]?.client;
      final nextClient = next[widget.serverId]?.client;
      if (nextClient != null && !identical(previousClient, nextClient)) {
        ref
            .read(sessionProvider(widget.serverId).notifier)
            .attachClient(nextClient);
        _requestProviderSnapshot();
      }
    });

    ref.listen(sessionOnlineProvider(widget.serverId), (previous, next) {
      if (previous == false && next == true) {
        final agentId = _activeAgentId;
        if (agentId != null) {
          ref
              .read(sessionProvider(widget.serverId).notifier)
              .fetchAgentTimeline(agentId);
        }
      }
    });

    final theme = Theme.of(context);
    final session = ref.watch(sessionProvider(widget.serverId));
    final activeAgentId = _activeAgentId;
    final activeAgent = activeAgentId == null
        ? null
        : session.agents[activeAgentId];

    // Check for agent status transition to idle and play completion sound
    final currentStatus = activeAgent?.status;
    if (currentStatus != null &&
        _lastAgentStatus != null &&
        _lastAgentStatus != currentStatus) {
      final wasRunning =
          _lastAgentStatus == AgentLifecycleStatus.running ||
          _lastAgentStatus == AgentLifecycleStatus.initializing;
      if (wasRunning && currentStatus == AgentLifecycleStatus.idle) {
        _soundService.playCompletionSound();
      }
    }
    _lastAgentStatus = currentStatus;

    final permissions = activeAgentId == null
        ? null
        : ref.watch(agentPermissionsProvider((widget.serverId, activeAgentId)));
    final entries = ref.watch(
      providerSnapshotEntriesProvider((widget.serverId, widget.cwd)),
    );
    final config = _resolveConfig(entries, activeAgent: activeAgent);
    if (activeAgentId == null) {
      _syncResolvedConfig(config);
    }
    if (activeAgentId != null) {
      ref.listen(agentStreamProvider((widget.serverId, activeAgentId)), (
        previous,
        next,
      ) {
        if (!mounted || next.isEmpty) return;
        if (previous?.length == next.length) return;
        _scrollToBottom();
      });
    }
    final isTimelineLoading = activeAgentId != null &&
        ref.watch(agentTimelineInitializingProvider(
          (widget.serverId, activeAgentId),
        ));
    final liveItems = activeAgentId == null
        ? const <StreamItem>[]
        : ref.watch(agentStreamProvider((widget.serverId, activeAgentId)));
    final displayItems = activeAgentId != null && liveItems.isNotEmpty
        ? liveItems
        : _items;
    final isAgentWorking =
        activeAgent?.status == AgentLifecycleStatus.running ||
        activeAgent?.status == AgentLifecycleStatus.initializing ||
        (activeAgentId == null && _isSending && displayItems.isNotEmpty);
    final displayAgentId = activeAgentId ?? _draftAgentId;
    final l10n = context.l10n;
    final title = widget.workspaceName?.trim().isNotEmpty == true
        ? widget.workspaceName!.trim()
        : widget.cwd.split('/').where((part) => part.isNotEmpty).lastOrNull ??
              l10n.newConversation;
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onTap: () => dismissSoftKeyboard(context),
      child: Scaffold(
        key: _scaffoldKey,
        resizeToAvoidBottomInset: true,
        drawer: WorkspaceDrawer(
          serverId: widget.serverId,
          currentWorkspaceId: widget.workspaceId,
          currentCwd: activeAgent?.cwd ?? widget.cwd,
        ),
        endDrawer: AgentSessionDrawer(
          serverId: widget.serverId,
          currentAgentId: activeAgentId,
          currentCwd: activeAgent?.cwd ?? widget.cwd,
          onSelectAgent: _selectAgentFromDrawer,
        ),
        appBar: AppBar(
          leading: IconButton(
            tooltip: context.l10n.workspace,
            onPressed: _openWorkspaceDrawer,
            icon: const Icon(Icons.folder_copy_outlined),
          ),
          title: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
              _ConnectionDot(serverId: widget.serverId),
            ],
          ),
          actions: [
            if (widget.fromProjects)
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: IconButton(
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints.tightFor(
                    width: 44,
                    height: 44,
                  ),
                  icon: const Icon(Icons.home_outlined),
                  onPressed: () => context.go('/'),
                ),
              ),
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: IconButton(
                tooltip: 'Menu',
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints.tightFor(
                  width: 44,
                  height: 44,
                ),
                icon: const Icon(Icons.menu),
                onPressed: _openAgentDrawer,
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            Expanded(
              child: isTimelineLoading && displayItems.isEmpty
                  ? Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                      ),
                    )
                  : AgentStreamView(
                      serverId: widget.serverId,
                      agentId: displayAgentId,
                      items: displayItems,
                      scrollController: _scrollController,
                      isAgentWorking: isAgentWorking,
                      onQuote: _quoteMessage,
                    ),
            ),
            ColoredBox(
              color: Theme.of(context).scaffoldBackgroundColor,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_errorText != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    child: Text(
                      _errorText!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ),
                if (activeAgentId != null &&
                    permissions != null &&
                    permissions.isNotEmpty)
                  PermissionPanel(
                    serverId: widget.serverId,
                    agentId: activeAgentId,
                    permission: permissions.first,
                  ),
                _DraftComposer(
                  config: config,
                  activeAgentId: activeAgentId,
                  activeAgent: activeAgent,
                  textController: _inputController,
                  focusNode: _focusNode,
                  attachments: _attachments,
                  isSending: _isSending,
                  onPickImages: _pickImages,
                  onRemoveAttachment: _removeAttachment,
                  onProviderChanged: (provider) async {
                    if (provider == null) return;
                    final lastModel = await _storageService
                        .getLastSelectedModel(provider);
                    final lastThinking = await _storageService
                        .getLastSelectedThinking(provider);
                    final lastMode = await _storageService.getLastSelectedMode(
                      provider,
                    );
                    if (mounted) {
                      setState(() {
                        _selectedProvider = provider;
                        _selectedModel = lastModel;
                        _selectedThinkingOptionId = lastThinking;
                        _selectedMode = lastMode;
                      });
                      _storageService.setLastSelectedProvider(provider);
                      _requestProviderSnapshot();
                    }
                  },
                  onProviderLockedTap: _showProviderLockedWarning,
                  onModelChanged: (model) {
                    setState(() {
                      _selectedModel = model;
                      _selectedThinkingOptionId = null;
                    });
                    if (model != null && _selectedProvider != null) {
                      _storageService.setLastSelectedModel(
                        _selectedProvider!,
                        model,
                      );
                    }
                  },
                  onActiveModelChanged: (model) {
                    if (activeAgentId == null) return;
                    _setActiveAgentModel(activeAgentId, model);
                  },
                  onThinkingOptionChanged: (thinkingOption) {
                    setState(() => _selectedThinkingOptionId = thinkingOption);
                    if (thinkingOption != null && _selectedProvider != null) {
                      _storageService.setLastSelectedThinking(
                        _selectedProvider!,
                        thinkingOption,
                      );
                    }
                  },
                  onActiveThinkingOptionChanged: (thinkingOption) {
                    if (activeAgentId == null) return;
                    _setActiveAgentThinking(activeAgentId, thinkingOption);
                  },
                  onModeChanged: (mode) {
                    setState(() => _selectedMode = mode);
                    if (mode != null && _selectedProvider != null) {
                      _storageService.setLastSelectedMode(
                        _selectedProvider!,
                        mode,
                      );
                    }
                  },
                  onActiveModeChanged: (mode) {
                    if (activeAgentId == null || mode == null) return;
                    _setActiveAgentMode(activeAgentId, mode);
                  },
                  onSend: () => _send(config),
                  onCancelAgent: activeAgentId == null
                      ? null
                      : () {
                          ref
                              .read(sessionProvider(widget.serverId).notifier)
                              .cancelAgent(activeAgentId);
                        },
                  onVoiceRecordStart: null,
                  onVoiceRecordEnd: null,
                  onVoiceTranscript: (text) {
                    _inputController.text = text;
                    _send(config);
                  },
                  maxDurationSeconds: ref.watch(voiceUsageProvider).maxDurationSeconds,
                  onCheckVoiceLimit: () async {
                              final allowed = await ref
                                  .read(voiceUsageProvider.notifier)
                                  .checkAndIncrement();
                              if (!allowed && mounted) {
                                AppSnackBar.showWarning(
                                  context,
                                  context.l10n.voiceLimitReached,
                                );
                              }
                              return allowed;
                            },
                  remainingVoiceUses:
                      ref.watch(voiceUsageProvider).isUnlimited
                          ? null
                          : ref.watch(voiceUsageProvider).remaining,
                ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResolvedDraftConfig {
  final List<String> providerIds;
  final String? selectedProvider;
  final ProviderSnapshotEntry? entry;
  final List<AgentModelDefinition> models;
  final String? selectedModel;
  final List<AgentSelectOption> thinkingOptions;
  final String? selectedThinkingOptionId;
  final List<AgentMode> modes;
  final String? selectedMode;

  const _ResolvedDraftConfig({
    required this.providerIds,
    required this.selectedProvider,
    required this.entry,
    required this.models,
    required this.selectedModel,
    required this.thinkingOptions,
    required this.selectedThinkingOptionId,
    required this.modes,
    required this.selectedMode,
  });
}

class _DraftComposer extends StatefulWidget {
  final _ResolvedDraftConfig config;
  final String? activeAgentId;
  final Agent? activeAgent;
  final TextEditingController textController;
  final FocusNode focusNode;
  final List<AttachmentMetadata> attachments;
  final bool isSending;
  final VoidCallback onPickImages;
  final ValueChanged<int> onRemoveAttachment;
  final ValueChanged<String?> onProviderChanged;
  final VoidCallback onProviderLockedTap;
  final ValueChanged<String?> onModelChanged;
  final ValueChanged<String?> onActiveModelChanged;
  final ValueChanged<String?> onThinkingOptionChanged;
  final ValueChanged<String?> onActiveThinkingOptionChanged;
  final ValueChanged<String?> onModeChanged;
  final ValueChanged<String?> onActiveModeChanged;
  final VoidCallback onSend;
  final VoidCallback? onCancelAgent;
  final VoidCallback? onVoiceRecordStart;
  final VoidCallback? onVoiceRecordEnd;
  final ValueChanged<String> onVoiceTranscript;
  final int maxDurationSeconds;
  final Future<bool> Function()? onCheckVoiceLimit;
  final int? remainingVoiceUses;

  const _DraftComposer({
    required this.config,
    required this.activeAgentId,
    required this.activeAgent,
    required this.textController,
    required this.focusNode,
    required this.attachments,
    required this.isSending,
    required this.onPickImages,
    required this.onRemoveAttachment,
    required this.onProviderChanged,
    required this.onProviderLockedTap,
    required this.onModelChanged,
    required this.onActiveModelChanged,
    required this.onThinkingOptionChanged,
    required this.onActiveThinkingOptionChanged,
    required this.onModeChanged,
    required this.onActiveModeChanged,
    required this.onSend,
    required this.onCancelAgent,
    required this.onVoiceRecordStart,
    required this.onVoiceRecordEnd,
    required this.onVoiceTranscript,
    this.maxDurationSeconds = 0,
    this.onCheckVoiceLimit,
    this.remainingVoiceUses,
  });

  @override
  State<_DraftComposer> createState() => _DraftComposerState();
}

class _DraftComposerState extends State<_DraftComposer> {
  static const double _topOuterRadius = 14;
  static const double _bottomOuterRadius = 24;
  static const double _innerRadius = 12;

  @override
  void initState() {
    super.initState();
    widget.textController.addListener(_handleTextChanged);
  }

  @override
  void didUpdateWidget(covariant _DraftComposer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.textController, widget.textController)) {
      oldWidget.textController.removeListener(_handleTextChanged);
      widget.textController.addListener(_handleTextChanged);
    }
  }

  @override
  void dispose() {
    widget.textController.removeListener(_handleTextChanged);
    super.dispose();
  }

  void _handleTextChanged() {
    setState(() {});
  }

  bool get _canSend =>
      !widget.isSending &&
      (widget.textController.text.trim().isNotEmpty ||
          widget.attachments.isNotEmpty);

  bool get _isAgentRunning =>
      widget.activeAgent?.status == AgentLifecycleStatus.running;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLiveSession = widget.activeAgentId != null;
    final activeAgent = widget.activeAgent;
    final selectedProvider = isLiveSession
        ? activeAgent?.provider ?? widget.config.selectedProvider
        : widget.config.selectedProvider;
    final selectedModel = isLiveSession
        ? activeAgent?.model ?? activeAgent?.runtimeInfo?.model
        : widget.config.selectedModel;
    final modelIds = widget.config.models.map((model) => model.id).toSet();
    final modelValue = modelIds.contains(selectedModel) ? selectedModel : null;
    final selectedThinkingOptionId = isLiveSession
        ? activeAgent?.thinkingOptionId ??
              activeAgent?.runtimeInfo?.thinkingOptionId
        : widget.config.selectedThinkingOptionId;
    final thinkingOptionIds = widget.config.thinkingOptions
        .map((option) => option.id)
        .toSet();
    final thinkingOptionValue =
        thinkingOptionIds.contains(selectedThinkingOptionId)
        ? selectedThinkingOptionId
        : null;
    final selectedMode = isLiveSession
        ? activeAgent?.currentModeId ?? activeAgent?.runtimeInfo?.modeId
        : widget.config.selectedMode;
    final modeIds = widget.config.modes.map((mode) => mode.id).toSet();
    final modeValue = modeIds.contains(selectedMode) ? selectedMode : null;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final bottomPadding = bottomInset > 0 ? 4.0 : 14.0;
    return Padding(
      padding: EdgeInsets.fromLTRB(10, 10, 10, bottomPadding),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerLow,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(_topOuterRadius),
            topRight: Radius.circular(_topOuterRadius),
            bottomLeft: Radius.circular(_bottomOuterRadius),
            bottomRight: Radius.circular(_bottomOuterRadius),
          ),
          border: Border.all(
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.2),
          ),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.shadow.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.attachments.isNotEmpty) ...[
                SizedBox(
                  height: 64,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: widget.attachments.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(width: 8),
                    itemBuilder: (context, index) => _AttachmentThumbnail(
                      attachment: widget.attachments[index],
                      onRemove: () => widget.onRemoveAttachment(index),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
              Container(
                constraints: const BoxConstraints(minHeight: 102),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(_innerRadius),
                  border: Border.all(
                    color: theme.colorScheme.outlineVariant.withValues(
                      alpha: 0.15,
                    ),
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: TextField(
                            controller: widget.textController,
                            focusNode: widget.focusNode,
                            enabled: !widget.isSending,
                            autofocus: false,
                            style: TextStyle(fontSize: 14),
                            decoration: InputDecoration(
                              hintText: context.l10n.inputMessage,
                              hintStyle: TextStyle(
                                color: theme.colorScheme.onSurfaceVariant
                                    .withValues(alpha: 0.4),
                              ),
                              filled: false,
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: const EdgeInsets.fromLTRB(
                                12,
                                8,
                                4,
                                4,
                              ),
                            ),
                            minLines: 3,
                            maxLines: 18,
                            textInputAction: TextInputAction.newline,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(right: 4, bottom: 4),
                          child: IconButton(
                            tooltip: context.l10n.addImage,
                            onPressed: widget.isSending
                                ? null
                                : widget.onPickImages,
                            icon: Icon(
                              Icons.add_photo_alternate_outlined,
                              size: 22,
                              color: theme.colorScheme.onSurfaceVariant
                                  .withValues(alpha: 0.7),
                            ),
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        SizedBox(width: 12),
                        if (widget.config.thinkingOptions.isNotEmpty)
                          Expanded(
                            child: _DraftChipSelect<String>(
                              value: thinkingOptionValue,
                              hint: 'Thinking',
                              height: 30,
                              fontSize: 11,
                              items: widget.config.thinkingOptions
                                  .map((o) => o.id)
                                  .toList(),
                              labelBuilder: (v) {
                                final o = widget.config.thinkingOptions
                                    .firstWhere(
                                      (o) => o.id == v,
                                      orElse: () =>
                                          widget.config.thinkingOptions.first,
                                    );
                                return o.label;
                              },
                              onChanged: widget.isSending
                                  ? null
                                  : isLiveSession
                                  ? widget.onActiveThinkingOptionChanged
                                  : widget.onThinkingOptionChanged,
                            ),
                          ),
                        SizedBox(width: 8),
                        if (widget.config.modes.isNotEmpty)
                          Expanded(
                            child: _DraftChipSelect<String>(
                              value: modeValue,
                              hint: 'Mode',
                              height: 30,
                              fontSize: 11,
                              items: widget.config.modes
                                  .map((m) => m.id)
                                  .toList(),
                              labelBuilder: (v) {
                                final m = widget.config.modes.firstWhere(
                                  (m) => m.id == v,
                                  orElse: () => widget.config.modes.first,
                                );
                                return m.label;
                              },
                              onChanged: widget.isSending
                                  ? null
                                  : isLiveSession
                                  ? widget.onActiveModeChanged
                                  : widget.onModeChanged,
                            ),
                          ),
                        const Spacer(),
                        Padding(
                          padding: const EdgeInsets.only(right: 4, bottom: 2),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            child: IconButton.filled(
                              tooltip: _isAgentRunning ? context.l10n.stopReply : context.l10n.send,
                              onPressed: _isAgentRunning
                                  ? widget.onCancelAgent
                                  : widget.onSend,
                              style: IconButton.styleFrom(
                                backgroundColor: _isAgentRunning
                                    ? theme.colorScheme.error
                                    : theme.colorScheme.primary,
                                foregroundColor: _isAgentRunning
                                    ? theme.colorScheme.onError
                                    : theme.colorScheme.onPrimary,
                              ),
                              icon: widget.isSending
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : _isAgentRunning
                                      ? AnimatedPauseIcon(
                                          size: 24,
                                          color: theme.colorScheme.onError,
                                        )
                                      : const Icon(
                                          Icons.arrow_upward_rounded,
                                        ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              HoldToTalkButton(
                enabled: !_isAgentRunning,
                maxDurationSeconds: widget.maxDurationSeconds,
                onCheckLimit: widget.onCheckVoiceLimit,
                remainingUses: widget.remainingVoiceUses,
                onRecordStart: widget.onVoiceRecordStart,
                onRecordEnd: widget.onVoiceRecordEnd,
                onTranscript: widget.onVoiceTranscript,
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: _DraftChipSelect<String>(
                      value: selectedProvider,
                      hint: 'Provider',
                      items: widget.config.providerIds,
                      labelBuilder: (v) => v,
                      prefixBuilder: (_) => 'Provider: ',
                      onChanged: widget.isSending || isLiveSession
                          ? null
                          : widget.onProviderChanged,
                      onDisabledTap: isLiveSession
                          ? widget.onProviderLockedTap
                          : null,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _DraftChipSelect<String>(
                      value: modelValue,
                      hint: 'Model',
                      items: widget.config.models.map((m) => m.id).toList(),
                      labelBuilder: (v) {
                        final m = widget.config.models.firstWhere(
                          (m) => m.id == v,
                          orElse: () => widget.config.models.first,
                        );
                        return m.label;
                      },
                      prefixBuilder: (_) => 'Model: ',
                      onChanged:
                          widget.isSending || widget.config.models.isEmpty
                          ? null
                          : isLiveSession
                          ? widget.onActiveModelChanged
                          : widget.onModelChanged,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DraftChipSelect<T> extends StatelessWidget {
  static const double _controlRadius = 10;

  final T? value;
  final String hint;
  final List<T> items;
  final String Function(T) labelBuilder;
  final String Function(T)? prefixBuilder;
  final double fontSize;
  final double height;
  final ValueChanged<T?>? onChanged;
  final VoidCallback? onDisabledTap;

  const _DraftChipSelect({
    required this.value,
    required this.hint,
    required this.items,
    required this.labelBuilder,
    this.prefixBuilder,
    this.fontSize = 13,
    this.height = 36,
    required this.onChanged,
    this.onDisabledTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final displayText = value != null ? labelBuilder(value as T) : hint;
    final prefix = value != null && prefixBuilder != null
        ? prefixBuilder!(value as T)
        : null;
    final isSelected = value != null;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(_controlRadius),
        onTap: onChanged == null
            ? () {
                dismissSoftKeyboard(context);
                onDisabledTap?.call();
              }
            : () {
                dismissSoftKeyboard(context);
                showModalBottomSheet<void>(
                  context: context,
                  backgroundColor: theme.colorScheme.surface,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                  ),
                  builder: (ctx) => SafeArea(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxHeight: MediaQuery.of(ctx).size.height * 0.7,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                            child: Row(
                              children: [
                                Text(
                                  hint,
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const Spacer(),
                                IconButton(
                                  onPressed: () => Navigator.pop(ctx),
                                  icon: const Icon(Icons.close, size: 20),
                                ),
                              ],
                            ),
                          ),
                          const Divider(height: 1),
                          Expanded(
                            child: ListView.builder(
                              shrinkWrap: true,
                              itemCount: items.length,
                              itemBuilder: (context, index) {
                                final item = items[index];
                                return ListTile(
                                  title: Text(
                                    labelBuilder(item),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  trailing: item == value
                                      ? Icon(
                                          Icons.check,
                                          size: 20,
                                          color: theme.colorScheme.primary,
                                        )
                                      : null,
                                  onTap: () {
                                    onChanged!(item);
                                    Navigator.pop(ctx);
                                  },
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  ),
                );
              },
        child: Container(
          width: double.infinity,
          height: height,
          padding: const EdgeInsets.only(left: 10, right: 4),
          decoration: BoxDecoration(
            border: Border.all(color: theme.colorScheme.outlineVariant),
            borderRadius: BorderRadius.circular(_controlRadius),
          ),
          child: Row(
            children: [
              if (prefix != null) ...[
                Text(
                  prefix,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: fontSize,
                    color: theme.colorScheme.onSurfaceVariant.withValues(
                      alpha: 0.5,
                    ),
                  ),
                ),
              ],
              Expanded(
                child: Text(
                  displayText,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: fontSize,
                    fontWeight: isSelected
                        ? FontWeight.w500
                        : FontWeight.normal,
                    color: isSelected
                        ? theme.colorScheme.onSurface
                        : theme.colorScheme.onSurfaceVariant.withValues(
                            alpha: 0.7,
                          ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Icon(
                  Icons.unfold_more,
                  size: 16,
                  color: theme.colorScheme.onSurfaceVariant.withValues(
                    alpha: 0.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AttachmentThumbnail extends StatelessWidget {
  final AttachmentMetadata attachment;
  final VoidCallback onRemove;

  const _AttachmentThumbnail({
    required this.attachment,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final path = attachment.storageKey.replaceFirst('file://', '');
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.file(
            File(path),
            width: 64,
            height: 64,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Container(
              width: 64,
              height: 64,
              color: theme.colorScheme.surfaceContainerHighest,
              child: const Icon(Icons.broken_image, size: 24),
            ),
          ),
        ),
        Positioned(
          top: 2,
          right: 2,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.6),
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(2),
              child: const Icon(Icons.close, size: 14, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}

class _ConnectionDot extends ConsumerWidget {
  final String serverId;

  const _ConnectionDot({required this.serverId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final runtimes = ref.watch(hostRuntimeProvider);
    final runtime = runtimes[serverId];
    final state = runtime?.connectionState ?? HostConnectionState.offline;
    final isOnline = state == HostConnectionState.online;
    final label = isOnline ? context.l10n.connecting : context.l10n.disconnected;
    final color = isOnline ? Colors.green.shade600 : Colors.red.shade600;
    final theme = Theme.of(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 6.5,
          height: 6.5,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 4),
            ],
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: color,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
