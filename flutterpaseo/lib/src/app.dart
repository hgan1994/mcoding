import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../l10n_gen/app_localizations.dart';
import 'attachments/attachment_gc_scheduler.dart';
import 'providers/draft_provider.dart';
import 'providers/host_runtime_provider.dart';
import 'providers/session_provider.dart';
import 'attachments/composer_attachment_provider.dart';
import 'router.dart';
import 'theme.dart';
import 'screens/settings_screen.dart';
import 'widgets/toast_host.dart';

class MCodingApp extends ConsumerStatefulWidget {
  const MCodingApp({super.key});

  @override
  ConsumerState<MCodingApp> createState() => _MCodingAppState();
}

class _MCodingAppState extends ConsumerState<MCodingApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);

    // Initial GC after first frame (mirrors RN onRehydrateStorage).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _runGcNow();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    ref.read(hostRuntimeProvider.notifier).refreshConnections();
  }

  /// Runs GC immediately using the current provider states.
  void _runGcNow() {
    final draft = ref.read(draftProvider);
    final composer = ref.read(composerAttachmentProvider);
    final sessionStates = _collectSessionStates(ref);

    AttachmentGcScheduler().runNowWithStates(
      draftState: draft,
      composerState: composer,
      sessionStates: sessionStates,
    );
  }

  /// Best-effort collection of all active session states.
  List<SessionState> _collectSessionStates(WidgetRef ref) {
    final container = ProviderScope.containerOf(context, listen: false);
    final states = <SessionState>[];

    // Riverpod does not expose the keys of a provider family directly.
    // We scan a reasonable range of serverIds that might have been created
    // during this session.  In practice the agents screen creates one
    // sessionProvider per connected host; we keep a lightweight registry
    // in the notifier itself.
    for (final serverId in SessionNotifier.activeServerIds) {
      try {
        final state = container.read(sessionProvider(serverId));
        states.add(state);
      } catch (_) {
        // Provider may not exist for this serverId; ignore.
      }
    }
    return states;
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);

    // Listen to draft changes → schedule GC.
    ref.listen(draftProvider, (previous, next) {
      if (previous?.draftAttachments != next.draftAttachments) {
        _runGcNow();
      }
    });

    // Listen to composer attachment changes → schedule GC.
    ref.listen(composerAttachmentProvider, (previous, next) {
      if (previous?.attachmentsByAgent != next.attachmentsByAgent) {
        _runGcNow();
      }
    });

    return MaterialApp.router(
      title: 'mcoding',
      debugShowCheckedModeBanner: false,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('zh'), Locale('en')],
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
      builder: (context, child) {
        return ToastHost(child: child ?? const SizedBox.shrink());
      },
    );
  }
}
