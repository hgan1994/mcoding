import 'dart:math';

import 'package:flutter/material.dart';

class AnimatedPauseIcon extends StatefulWidget {
  final double size;
  final Color? color;

  const AnimatedPauseIcon({super.key, this.size = 24, this.color});

  @override
  State<AnimatedPauseIcon> createState() => _AnimatedPauseIconState();
}

class _AnimatedPauseIconState extends State<AnimatedPauseIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final effectiveColor =
        widget.color ?? IconTheme.of(context).color ?? Colors.white;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = (1 - cos(_controller.value * 2 * pi)) / 2;
        return Opacity(
          opacity: 0.55 + 0.45 * t,
          child: Transform.scale(
            scale: 0.88 + 0.12 * t,
            child: child,
          ),
        );
      },
      child: Icon(Icons.pause_rounded, size: widget.size, color: effectiveColor),
    );
  }
}
