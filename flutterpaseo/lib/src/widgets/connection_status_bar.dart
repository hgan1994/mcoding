import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/host_runtime_provider.dart';

class ConnectionStatusBar extends ConsumerWidget {
  final String serverId;

  const ConnectionStatusBar({super.key, required this.serverId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final runtimes = ref.watch(hostRuntimeProvider);
    final runtime = runtimes[serverId];
    final state = runtime?.connectionState ?? HostConnectionState.offline;

    return switch (state) {
      HostConnectionState.online => _buildBar(
          context,
          color: Colors.green.shade700,
          child: Text(
            'Connected · ${runtime?.rttMs ?? 0}ms',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white),
          ),
        ),
      HostConnectionState.connecting => _buildBar(
          context,
          color: Colors.orange.shade700,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(
                  strokeWidth: 1.5,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Connecting...',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white),
              ),
            ],
          ),
        ),
      HostConnectionState.offline => _buildBar(
          context,
          color: Colors.red.shade700,
          child: Text(
            'Disconnected',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white),
          ),
        ),
      HostConnectionState.error => _buildBar(
          context,
          color: Colors.red.shade700,
          child: Text(
            'Connection Error',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.white),
          ),
        ),
      HostConnectionState.booting => const SizedBox.shrink(),
    };
  }

  Widget _buildBar(BuildContext context, {required Color color, required Widget child}) {
    return Container(
      height: 28,
      width: double.infinity,
      color: color,
      alignment: Alignment.center,
      child: child,
    );
  }
}
