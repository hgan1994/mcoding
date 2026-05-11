import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/agent.dart';
import '../providers/session_provider.dart';
import '../providers/toast_provider.dart';
import '../l10n_ext.dart';
import '../theme.dart';

class AgentsScreen extends ConsumerWidget {
  final String serverId;
  final String? selectedCwd;
  final String? selectedWorkspaceName;

  const AgentsScreen({
    super.key,
    required this.serverId,
    this.selectedCwd,
    this.selectedWorkspaceName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allAgents = ref.watch(sessionAgentListProvider(serverId));
    final agents = allAgents.where(_matchesSelectedWorkspace).toList();
    final isHydrated = ref.watch(sessionHydratedProvider(serverId));
    final isOnline = ref.watch(sessionOnlineProvider(serverId));
    final title = selectedWorkspaceName?.trim().isNotEmpty == true
        ? selectedWorkspaceName!.trim()
        : context.l10n.sessions;

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            icon: const Icon(Icons.archive_outlined, size: 20),
            onPressed: () {
              final archived =
                  ref
                      .read(sessionProvider(serverId))
                      .agents
                      .values
                      .where(
                        (a) =>
                            a.archivedAt != null &&
                            _matchesSelectedWorkspace(a),
                      )
                      .toList()
                    ..sort(
                      (a, b) => b.lastActivityAt.compareTo(a.lastActivityAt),
                    );
              showModalBottomSheet(
                context: context,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
                ),
                builder: (_) => Scaffold(
                  appBar: AppBar(title: Text(context.l10n.archived)),
                  body: archived.isEmpty
                      ? Center(child: Text(context.l10n.noArchivedSessions))
                      : ListView.builder(
                          itemCount: archived.length,
                          itemBuilder: (context, index) => ListTile(
                            title: Text(
                              archived[index].title ?? archived[index].id,
                            ),
                            subtitle: Text(archived[index].cwd),
                            onTap: () => Navigator.pop(context),
                          ),
                        ),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: () {
              ref.read(sessionProvider(serverId).notifier)
                ..fetchAgents()
                ..fetchWorkspaces();
              ref.read(toastProvider.notifier).info('Refreshing sessions...');
            },
          ),
        ],
      ),
      body: isHydrated
          ? agents.isEmpty
                ? _buildEmpty(context)
                : RefreshIndicator(
                    onRefresh: () async {
                      ref
                          .read(sessionProvider(serverId).notifier)
                          .fetchAgents();
                      ref
                          .read(sessionProvider(serverId).notifier)
                          .fetchWorkspaces();
                    },
                    child: ListView.builder(
                      cacheExtent: 250,
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      itemCount: agents.length,
                      itemBuilder: (context, index) => Padding(
                        padding: EdgeInsets.only(
                          bottom: index < agents.length - 1 ? 10 : 0,
                        ),
                        child: _AgentCard(
                          agent: agents[index],
                          serverId: serverId,
                        ),
                      ),
                    ),
                  )
          : isOnline
          ? Center(child: CircularProgressIndicator(strokeWidth: 2.5))
          : Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.cloud_off, size: 48, color: Colors.grey.shade400),
                  const SizedBox(height: 12),
                  Text(
                    context.l10n.hostOffline,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () {
                      ref.read(sessionProvider(serverId).notifier)
                        ..fetchAgents()
                        ..fetchWorkspaces();
                    },
                    icon: const Icon(Icons.refresh, size: 18),
                    label: Text(context.l10n.retry),
                  ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateAgent(context, ref),
        child: const Icon(Icons.add, size: 24),
      ),
    );
  }

  bool _matchesSelectedWorkspace(Agent agent) {
    final cwd = selectedCwd?.trim();
    if (cwd == null || cwd.isEmpty) return true;
    return agent.cwd == cwd;
  }

  Widget _buildEmpty(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: cs.primary.withValues(alpha: 0.04),
                shape: BoxShape.circle,
                border: Border.all(
                  color: cs.primary.withValues(alpha: 0.08),
                  width: 1.5,
                ),
              ),
              child: Icon(
                Icons.smart_toy_outlined,
                size: 36,
                color: cs.primary.withValues(alpha: 0.25),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              context.l10n.noSessions,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.l10n.createFirstAgent,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: cs.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.add,
                size: 24,
                color: cs.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateAgent(BuildContext context, WidgetRef ref) {
    final promptCtrl = TextEditingController();
    final defaultCwd = selectedCwd?.trim().isNotEmpty == true
        ? selectedCwd!.trim()
        : '.';
    final cwdCtrl = TextEditingController(text: defaultCwd);
    final modelCtrl = TextEditingController();
    String provider = 'claude';
    bool thinkingMode = false;
    String mode = 'code';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.l10n.newAgent,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: promptCtrl,
                  decoration: InputDecoration(
                    labelText: context.l10n.initialPrompt,
                  ),
                  autofocus: true,
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                Text(
                  context.l10n.provider,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: ['claude', 'codex', 'opencode'].map((p) {
                    final icon = switch (p) {
                      'claude' => Icons.smart_toy,
                      'codex' => Icons.code,
                      'opencode' => Icons.open_in_new,
                      _ => Icons.psychology,
                    };
                    return ChoiceChip(
                      avatar: Icon(icon, size: 16),
                      label: Text(p),
                      selected: provider == p,
                      onSelected: (selected) {
                        if (selected) setModalState(() => provider = p);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: cwdCtrl,
                        decoration: InputDecoration(
                          labelText: context.l10n.workingDirectory,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: DropdownButtonFormField<String>(
                        initialValue: mode,
                        decoration: InputDecoration(
                          labelText: context.l10n.mode,
                        ),
                        items: [
                          DropdownMenuItem(
                            value: 'code',
                            child: Text(context.l10n.modeCode),
                          ),
                          DropdownMenuItem(
                            value: 'plan',
                            child: Text(context.l10n.modePlan),
                          ),
                          DropdownMenuItem(
                            value: 'ask',
                            child: Text(context.l10n.modeAsk),
                          ),
                        ],
                        onChanged: (v) {
                          if (v != null) setModalState(() => mode = v);
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 1,
                      child: TextField(
                        controller: modelCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Model (optional)',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    context.l10n.thinkingMode,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  secondary: const Icon(Icons.psychology_outlined, size: 20),
                  value: thinkingMode,
                  onChanged: (v) => setModalState(() => thinkingMode = v),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {
                      final text = promptCtrl.text.trim();
                      final cwd = cwdCtrl.text.trim().isNotEmpty
                          ? cwdCtrl.text.trim()
                          : '.';
                      final model = modelCtrl.text.trim().isNotEmpty
                          ? modelCtrl.text.trim()
                          : null;
                      final config = <String, dynamic>{
                        'provider': provider,
                        'cwd': cwd,
                        'mode': mode,
                      };
                      if (model != null) config['model'] = model;
                      if (thinkingMode) config['thinkingMode'] = true;
                      ref
                          .read(sessionProvider(serverId).notifier)
                          .createAgent(
                            config,
                            initialPrompt: text.isNotEmpty ? text : null,
                          );
                      ref
                          .read(toastProvider.notifier)
                          .show('Creating agent...');
                      Navigator.pop(context);
                    },
                    child: Text(context.l10n.create),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AgentCard extends ConsumerWidget {
  final Agent agent;
  final String serverId;
  const _AgentCard({required this.agent, required this.serverId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final statusColor = _statusColor(agent.status, theme);
    final providerIcon = switch (agent.provider) {
      'claude' => Icons.smart_toy,
      'codex' => Icons.code,
      'opencode' => Icons.open_in_new,
      _ => Icons.psychology,
    };
    final modelName = agent.model ?? agent.runtimeInfo?.model;
    final modeLabel = agent.currentModeId;

    return Dismissible(
      key: Key(agent.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: cs.errorContainer,
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Icon(Icons.archive, color: cs.onErrorContainer),
      ),
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Archive session?'),
            content: Text('Archive "${agent.title ?? agent.id}"?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text(context.l10n.cancel),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(context.l10n.archive),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) {
        ref.read(sessionProvider(serverId).notifier).archiveAgent(agent.id);
        ref.read(toastProvider.notifier).info(context.l10n.sessionArchived);
      },
      child: Container(
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: cs.outline.withValues(alpha: 0.12)),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => context.push('/h/$serverId/agent/${agent.id}'),
            borderRadius: BorderRadius.circular(AppRadius.md),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: cs.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(AppRadius.sm),
                        ),
                        child: Icon(
                          providerIcon,
                          size: 18,
                          color: cs.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          agent.title ?? agent.id,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.1,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (agent.requiresAttention)
                        const Badge(
                          child: Icon(
                            Icons.notifications_active_outlined,
                            size: 18,
                          ),
                        ),
                      const SizedBox(width: 8),
                      _StatusDot(
                        color: statusColor,
                        isRunning: agent.status == AgentLifecycleStatus.running,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    agent.cwd,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        agent.provider,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                      if (modeLabel != null) ...[
                        Text(
                          ' · ',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: cs.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: Text(
                            modeLabel,
                            style: theme.textTheme.labelSmall,
                          ),
                        ),
                      ],
                      if (modelName != null) ...[
                        Text(
                          ' · ',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                        Flexible(
                          child: Text(
                            modelName,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                      const Spacer(),
                      Text(
                        _timeAgo(agent.lastActivityAt),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _statusColor(AgentLifecycleStatus status, ThemeData theme) {
    switch (status) {
      case AgentLifecycleStatus.running:
        return theme.colorScheme.primary;
      case AgentLifecycleStatus.error:
        return theme.colorScheme.error;
      case AgentLifecycleStatus.idle:
        return AppColors.light.success;
      case AgentLifecycleStatus.initializing:
        return Colors.orange;
      case AgentLifecycleStatus.closed:
        return theme.colorScheme.onSurfaceVariant;
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}

class _StatusDot extends StatefulWidget {
  final Color color;
  final bool isRunning;
  const _StatusDot({required this.color, required this.isRunning});

  @override
  State<_StatusDot> createState() => _StatusDotState();
}

class _StatusDotState extends State<_StatusDot> {
  bool _expanded = false;

  @override
  void initState() {
    super.initState();
    if (widget.isRunning) {
      Future.delayed(const Duration(milliseconds: 600), _toggle);
    }
  }

  void _toggle() {
    if (!mounted || !widget.isRunning) return;
    setState(() => _expanded = !_expanded);
    Future.delayed(const Duration(milliseconds: 600), _toggle);
  }

  @override
  void didUpdateWidget(covariant _StatusDot oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isRunning && !oldWidget.isRunning) {
      Future.delayed(const Duration(milliseconds: 600), _toggle);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
      width: _expanded && widget.isRunning ? 14 : 10,
      height: _expanded && widget.isRunning ? 14 : 10,
      decoration: BoxDecoration(
        color: widget.color,
        shape: BoxShape.circle,
        boxShadow: widget.isRunning
            ? [
                BoxShadow(
                  color: widget.color.withValues(alpha: 0.4),
                  blurRadius: 6,
                  spreadRadius: 1,
                ),
              ]
            : null,
      ),
    );
  }
}
