import 'package:flutter/material.dart';

class SyncedLoader extends StatefulWidget {
  final double dotRadius;

  const SyncedLoader({super.key, this.dotRadius = 4});

  const SyncedLoader.small({super.key, this.dotRadius = 2.5});

  @override
  State<SyncedLoader> createState() => _SyncedLoaderState();
}

class _SyncedLoaderState extends State<SyncedLoader> with TickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.primary;

    return SizedBox(
      width: 40,
      height: 20,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(3, (index) {
          final stagger = index / 6;
          final anim = CurvedAnimation(
            parent: _controller,
            curve: Interval(
              stagger,
              stagger + 0.6,
              curve: Curves.easeInOut,
            ),
          );

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: AnimatedBuilder(
              animation: anim,
              builder: (context, child) {
                return Opacity(
                  opacity: 0.3 + 0.7 * anim.value,
                  child: Transform.scale(
                    scale: 0.7 + 0.3 * anim.value,
                    child: child,
                  ),
                );
              },
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color,
                ),
                child: SizedBox(
                  width: widget.dotRadius * 2,
                  height: widget.dotRadius * 2,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
