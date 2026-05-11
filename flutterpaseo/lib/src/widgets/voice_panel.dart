import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/session_provider.dart';

class VoicePanel extends ConsumerStatefulWidget {
  final String serverId;
  final String agentId;
  const VoicePanel({super.key, required this.serverId, required this.agentId});

  @override
  ConsumerState<VoicePanel> createState() => _VoicePanelState();
}

enum _VoiceState { idle, recording }

class _VoicePanelState extends ConsumerState<VoicePanel> {
  _VoiceState _state = _VoiceState.idle;
  bool _isMuted = false;
  final double _volume = 0.0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (_state == _VoiceState.idle) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant)),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: _state == _VoiceState.recording ? Colors.red : Colors.orange,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _state == _VoiceState.recording ? 'Recording...' : 'Processing...',
            style: theme.textTheme.labelMedium,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildVolumeBar(theme),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: Icon(_isMuted ? Icons.mic_off : Icons.mic, size: 20),
            onPressed: () => setState(() => _isMuted = !_isMuted),
            visualDensity: VisualDensity.compact,
          ),
          IconButton(
            icon: const Icon(Icons.stop_circle, size: 20),
            onPressed: () {
              ref.read(sessionProvider(widget.serverId).notifier).sendVoiceMode(false, agentId: widget.agentId);
              setState(() => _state = _VoiceState.idle);
            },
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }

  Widget _buildVolumeBar(ThemeData theme) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(2),
      child: LinearProgressIndicator(
        value: _volume,
        backgroundColor: theme.colorScheme.outlineVariant,
        valueColor: AlwaysStoppedAnimation<Color>(
          _state == _VoiceState.recording ? Colors.green : Colors.orange,
        ),
        minHeight: 4,
      ),
    );
  }
}
