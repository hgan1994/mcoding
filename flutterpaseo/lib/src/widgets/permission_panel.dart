import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n_ext.dart';
import '../models/permission.dart';
import '../providers/session_provider.dart';
import 'plan_card.dart';
import 'question_form_card.dart';

class PermissionPanel extends StatefulWidget {
  final String serverId;
  final String agentId;
  final AgentPermissionRequest permission;

  const PermissionPanel({
    super.key,
    required this.serverId,
    required this.agentId,
    required this.permission,
  });

  @override
  State<PermissionPanel> createState() => _PermissionPanelState();
}

class _PermissionPanelState extends State<PermissionPanel> {
  bool _isResponding = false;

  void _respond(Map<String, dynamic> response) {
    setState(() => _isResponding = true);
    final container = ProviderScope.containerOf(context);
    container
        .read(sessionProvider(widget.serverId).notifier)
        .respondToPermission(widget.agentId, widget.permission.id, response);
  }

  @override
  Widget build(BuildContext context) {
    final permission = widget.permission;

    if (permission.kind == PermissionKind.question) {
      return QuestionFormCard(
        permission: permission,
        onRespond: _respond,
        isResponding: _isResponding,
      );
    }

    final isPlanRequest = permission.kind == PermissionKind.plan;
    final planMarkdown = _resolvePlanMarkdown(permission);
    final title = isPlanRequest
        ? context.l10n.plan
        : (permission.title ?? permission.name);
    final description = permission.description ?? '';

    if (isPlanRequest && planMarkdown != null) {
      return PlanCard(
        title: title,
        description: description.isNotEmpty ? description : null,
        text: planMarkdown,
        footer: _buildActionFooter(context, isPlanRequest),
      );
    }

    return _GenericPermissionCard(
      title: title,
      description: description,
      name: permission.name,
      onDeny: () => _respond({'behavior': 'deny'}),
      onAllow: () => _respond({'behavior': 'allow'}),
      isResponding: _isResponding,
      allowLabel: isPlanRequest ? context.l10n.implement : context.l10n.allow,
    );
  }

  String? _resolvePlanMarkdown(AgentPermissionRequest permission) {
    final fromMetadata = permission.metadata?['planText'] as String?;
    if (fromMetadata != null && fromMetadata.isNotEmpty) return fromMetadata;
    final fromInput = permission.input?['plan'] as String?;
    if (fromInput != null && fromInput.isNotEmpty) return fromInput;
    return null;
  }

  Widget _buildActionFooter(BuildContext context, bool isPlanRequest) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: _isResponding
                ? null
                : () => _respond({'behavior': 'deny'}),
            child: Text(context.l10n.deny),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: _isResponding
                ? null
                : () => _respond({'behavior': 'allow'}),
            child: _isResponding
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(
                    isPlanRequest ? context.l10n.implement : context.l10n.allow,
                  ),
          ),
        ),
      ],
    );
  }
}

class _GenericPermissionCard extends StatelessWidget {
  final String title;
  final String description;
  final String name;
  final VoidCallback onDeny;
  final VoidCallback onAllow;
  final bool isResponding;
  final String allowLabel;

  const _GenericPermissionCard({
    required this.title,
    required this.description,
    required this.name,
    required this.onDeny,
    required this.onAllow,
    this.isResponding = false,
    this.allowLabel = 'Allow',
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.errorContainer),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(Icons.security, size: 18, color: theme.colorScheme.error),
              const SizedBox(width: 8),
              Text(
                context.l10n.permissionRequest,
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          if (description.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(description, style: theme.textTheme.bodySmall),
          ],
          const SizedBox(height: 4),
          Text(
            name,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: isResponding ? null : onDeny,
                  child: Text(context.l10n.deny),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: isResponding ? null : onAllow,
                  child: isResponding
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(allowLabel),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
