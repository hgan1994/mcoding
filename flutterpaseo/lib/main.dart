import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/app.dart';

export 'src/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final container = ProviderContainer();

  runApp(
    UncontrolledProviderScope(container: container, child: const MCodingApp()),
  );

  unawaited(_bootstrapApp(container));
}

Future<void> _bootstrapApp(ProviderContainer container) async {
  final _ = container;
}
