import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import '../l10n_ext.dart';
import '../services/storage_service.dart';
import '../services/qwen_asr_service.dart';
import '../utils/keyboard_dismiss.dart';
import 'app_snack_bar.dart';

class HoldToTalkButton extends StatefulWidget {
  final VoidCallback? onRecordStart;
  final VoidCallback? onRecordEnd;
  final ValueChanged<String>? onTranscript;
  final bool enabled;
  final int maxDurationSeconds;
  final Future<bool> Function()? onCheckLimit;
  final int? remainingUses;

  const HoldToTalkButton({
    super.key,
    this.onRecordStart,
    this.onRecordEnd,
    this.onTranscript,
    this.enabled = true,
    this.maxDurationSeconds = 0,
    this.onCheckLimit,
    this.remainingUses,
  });

  @override
  State<HoldToTalkButton> createState() => _HoldToTalkButtonState();
}

class _HoldToTalkButtonState extends State<HoldToTalkButton>
    with TickerProviderStateMixin {
  bool _isHolding = false;
  bool _isStopping = false;
  bool _pointerIsDown = false;
  bool _cancelOnRelease = false;
  Offset? _pressStartPosition;
  OverlayEntry? _recordingOverlay;

  final AudioRecorder _recorder = AudioRecorder();
  StreamSubscription? _audioSubscription;

  QwenAsrService? _asrService;
  StreamSubscription<QwenAsrResult>? _asrSubscription;
  final _transcriptNotifier = ValueNotifier<_TranscriptState>(
    _TranscriptState(),
  );
  final _cancelNotifier = ValueNotifier<bool>(false);
  final _durationNotifier = ValueNotifier<Duration>(Duration.zero);
  Timer? _maxDurationTimer;

  String _finalText = '';
  String _partialText = '';

  late final AnimationController _pulseController;
  late final AnimationController _scaleController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.35).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _maxDurationTimer?.cancel();
    _audioSubscription?.cancel();
    _asrSubscription?.cancel();
    _asrService?.dispose();
    _hideRecordingOverlay();
    _recorder.dispose();
    _transcriptNotifier.dispose();
    _cancelNotifier.dispose();
    _durationNotifier.dispose();
    _pulseController.dispose();
    _scaleController.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    if (!widget.enabled) return;
    if (_isHolding || _isStopping) return;

    final apiKey = await StorageService().getQwenAsrApiKey();
    if (apiKey == null) {
      if (mounted) {
        AppSnackBar.showWarning(
          context,
          context.l10n.voiceTranscriptionApiKeyMissing,
        );
      }
      return;
    }

    if (widget.onCheckLimit != null) {
      final allowed = await widget.onCheckLimit!();
      if (!allowed || !mounted) {
        return;
      }
    }

    if (!await _recorder.hasPermission()) return;
    if (!mounted) return;
    if (!_pointerIsDown) return;

    dismissSoftKeyboard(context);

    setState(() {
      _isHolding = true;
      _isStopping = false;
      _cancelOnRelease = false;
    });
    _finalText = '';
    _partialText = '';
    _transcriptNotifier.value = _TranscriptState();
    _cancelNotifier.value = false;
    _durationNotifier.value = Duration.zero;
    _scaleController.forward();
    _pulseController.repeat(reverse: true);
    widget.onRecordStart?.call();
    _showRecordingOverlay();

    if (widget.maxDurationSeconds > 0) {
      _maxDurationTimer = Timer(
        Duration(seconds: widget.maxDurationSeconds),
        () {
          if (_isHolding && !_isStopping) {
            _stopRecording(sendTranscript: true);
          }
        },
      );
    }

    _asrService = QwenAsrService(apiKey: apiKey);
    _asrSubscription = _asrService!.results.listen(_handleAsrResult);

    try {
      await _asrService!.connect();
    } catch (_) {}

    if (!mounted || !_isHolding || _isStopping) {
      _cleanupAsr();
      return;
    }

    try {
      final stream = await _recorder.startStream(
        const RecordConfig(
          encoder: AudioEncoder.pcm16bits,
          sampleRate: 16000,
          numChannels: 1,
        ),
      );
      _audioSubscription = stream.listen((data) {
        _asrService?.sendAudio(data);
      });
    } catch (_) {
      await _stopRecording(sendTranscript: false);
    }
  }

  void _handleAsrResult(QwenAsrResult result) {
    if (!mounted) return;
    if (result.isFinal) {
      _finalText += result.text;
      _partialText = '';
    } else {
      _partialText = result.fullText;
    }
    _transcriptNotifier.value = _TranscriptState(
      finalText: _finalText,
      partialText: _partialText,
    );
  }

  Future<void> _stopRecording({bool sendTranscript = true}) async {
    if (!_isHolding || _isStopping) return;
    _isStopping = true;
    _maxDurationTimer?.cancel();
    _maxDurationTimer = null;
    _audioSubscription?.cancel();
    _audioSubscription = null;

    try {
      await _recorder.stop();
    } catch (_) {}

    if (_asrService != null && _asrService!.isConnected) {
      _asrService!.commitAudio();
      await _asrService!.finishSession();
      await Future.delayed(const Duration(milliseconds: 300));
    }
    _cleanupAsr();

    _pulseController.stop();
    _pulseController.reset();
    _scaleController.reverse();

    final text = _transcriptNotifier.value.displayText.trim();
    if (mounted) {
      setState(() {
        _isHolding = false;
        _isStopping = false;
        _cancelOnRelease = false;
      });
    } else {
      _isHolding = false;
      _isStopping = false;
      _cancelOnRelease = false;
    }
    _cancelNotifier.value = false;
    widget.onRecordEnd?.call();
    if (sendTranscript && text.isNotEmpty) {
      widget.onTranscript?.call(text);
    }

    _hideRecordingOverlay();
  }

  void _cleanupAsr() {
    _asrSubscription?.cancel();
    _asrSubscription = null;
    _asrService?.dispose();
    _asrService = null;
  }

  void _showRecordingOverlay() {
    if (_recordingOverlay != null) return;
    final overlay = Overlay.of(context, rootOverlay: true);
    _recordingOverlay = OverlayEntry(
      builder: (context) => IgnorePointer(
        child: _RecordingOverlay(
          transcriptNotifier: _transcriptNotifier,
          cancelNotifier: _cancelNotifier,
          durationNotifier: _durationNotifier,
          maxDurationSeconds: widget.maxDurationSeconds,
        ),
      ),
    );
    overlay.insert(_recordingOverlay!);
  }

  void _hideRecordingOverlay() {
    _recordingOverlay?.remove();
    _recordingOverlay = null;
  }

  void _handlePointerDown(PointerDownEvent event) {
    if (!widget.enabled) return;
    _pointerIsDown = true;
    _pressStartPosition = event.position;
    _setCancelOnRelease(false);
  }

  void _handlePointerMove(PointerMoveEvent event) {
    if (!widget.enabled) return;
    if (!_isHolding) return;
    final start = _pressStartPosition;
    if (start == null) return;
    _setCancelOnRelease(start.dy - event.position.dy > 80);
  }

  void _handlePointerUp(PointerUpEvent event) {
    if (!widget.enabled) return;
    _pointerIsDown = false;
    if (_isHolding) {
      _stopRecording(sendTranscript: !_cancelOnRelease);
    }
    _pressStartPosition = null;
  }

  void _handlePointerCancel(PointerCancelEvent event) {
    if (!widget.enabled) return;
    _pointerIsDown = false;
    _pressStartPosition = null;
    if (_isHolding) {
      _stopRecording(sendTranscript: false);
    }
  }

  void _setCancelOnRelease(bool value) {
    if (_cancelOnRelease == value) return;
    _cancelOnRelease = value;
    _cancelNotifier.value = value;
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Listener(
      onPointerDown: _handlePointerDown,
      onPointerMove: _handlePointerMove,
      onPointerUp: _handlePointerUp,
      onPointerCancel: _handlePointerCancel,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onLongPressStart: widget.enabled ? (_) => _startRecording() : null,
        onLongPressEnd: (_) {
          _pointerIsDown = false;
          if (_isHolding) {
            _stopRecording(sendTranscript: !_cancelOnRelease);
          }
        },
        onLongPressCancel: () {
          _pointerIsDown = false;
          if (_isHolding) {
            _stopRecording(sendTranscript: false);
          }
        },
        child: _isHolding
            ? _buildRecordingUI(theme)
            : Container(
                height: 40,
                decoration: BoxDecoration(
                  color: widget.enabled
                      ? theme.colorScheme.surfaceContainerHighest
                      : theme.colorScheme.surfaceContainerHighest.withValues(
                          alpha: 0.3,
                        ),
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: widget.enabled
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.mic,
                      size: 18,
                      color: widget.enabled
                          ? theme.colorScheme.onSurface
                          : theme.colorScheme.onSurfaceVariant.withValues(
                              alpha: 0.35,
                            ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      widget.enabled
                          ? context.l10n.holdToTalk
                          : context.l10n.replyInProgress,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: widget.enabled
                            ? theme.colorScheme.onSurface
                            : theme.colorScheme.onSurfaceVariant.withValues(
                                alpha: 0.45,
                              ),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildRecordingUI(ThemeData theme) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color:
            (_cancelOnRelease
                    ? theme.colorScheme.surfaceContainerHighest
                    : theme.colorScheme.errorContainer)
                .withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color:
              (_cancelOnRelease
                      ? theme.colorScheme.outline
                      : theme.colorScheme.error)
                  .withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _pulseAnimation.value,
                child: child,
              );
            },
            child: Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: _cancelOnRelease
                    ? theme.colorScheme.onSurfaceVariant
                    : theme.colorScheme.error,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _cancelOnRelease
                ? context.l10n.releaseToCancel
                : context.l10n.releaseToSendSwipeCancel,
            style: theme.textTheme.labelSmall?.copyWith(
              color:
                  (_cancelOnRelease
                          ? theme.colorScheme.onSurfaceVariant
                          : theme.colorScheme.onErrorContainer)
                      .withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class _TranscriptState {
  final String finalText;
  final String partialText;

  const _TranscriptState({this.finalText = '', this.partialText = ''});

  String get displayText => finalText + partialText;

  bool get isEmpty => finalText.isEmpty && partialText.isEmpty;
}

class _RecordingOverlay extends StatefulWidget {
  final ValueNotifier<_TranscriptState> transcriptNotifier;
  final ValueNotifier<bool> cancelNotifier;
  final ValueNotifier<Duration> durationNotifier;
  final int maxDurationSeconds;

  const _RecordingOverlay({
    required this.transcriptNotifier,
    required this.cancelNotifier,
    required this.durationNotifier,
    this.maxDurationSeconds = 0,
  });

  @override
  State<_RecordingOverlay> createState() => _RecordingOverlayState();
}

class _RecordingOverlayState extends State<_RecordingOverlay>
    with TickerProviderStateMixin {
  late final AnimationController _waveController;
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;
  late final List<double> _waveAmplitudes;
  Duration _elapsed = Duration.zero;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _waveAmplitudes = List.generate(5, (_) => 0.0);
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.35).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _pulseController.repeat(reverse: true);
    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat();
    _waveController.addListener(_updateWaves);
    _timer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      if (!mounted) return;
      setState(() {
        _elapsed += const Duration(milliseconds: 100);
        widget.durationNotifier.value = _elapsed;
      });
    });
  }

  void _updateWaves() {
    if (!mounted) return;
    final t = _waveController.value;
    setState(() {
      for (var i = 0; i < _waveAmplitudes.length; i++) {
        final phase = t * 2 * pi + i * 0.8;
        _waveAmplitudes[i] = (0.3 + 0.7 * ((1 + sin(phase)) / 2)).clamp(
          0.15,
          1.0,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _waveController.removeListener(_updateWaves);
    _waveController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(1, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ColoredBox(
      color: Colors.black.withValues(alpha: 0.4),
      child: Center(
        child: ValueListenableBuilder<bool>(
          valueListenable: widget.cancelNotifier,
          builder: (context, isCanceling, _) {
            return Material(
              color: Colors.transparent,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                width: 280,
                padding: const EdgeInsets.symmetric(
                  vertical: 28,
                  horizontal: 20,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isCanceling
                        ? theme.colorScheme.outline.withValues(alpha: 0.35)
                        : Colors.transparent,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.25),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _pulseAnimation.value,
                          child: child,
                        );
                      },
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: isCanceling
                              ? theme.colorScheme.surfaceContainerHighest
                              : theme.colorScheme.errorContainer,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isCanceling ? Icons.close_rounded : Icons.mic,
                          size: 28,
                          color: isCanceling
                              ? theme.colorScheme.onSurfaceVariant
                              : theme.colorScheme.error,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildWaveBar(theme),
                    const SizedBox(height: 16),
                    Builder(
                      builder: (context) {
                        if (widget.maxDurationSeconds > 0) {
                          final remaining =
                              Duration(seconds: widget.maxDurationSeconds) -
                              _elapsed;
                          final isLow = remaining.inSeconds <= 5;
                          return Text(
                            '${_formatDuration(_elapsed)} / ${_formatDuration(Duration(seconds: widget.maxDurationSeconds))}',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              color: isLow
                                  ? theme.colorScheme.error
                                  : theme.colorScheme.error,
                              fontWeight: FontWeight.w600,
                              fontFeatures: [
                                const FontFeature.tabularFigures(),
                              ],
                            ),
                          );
                        }
                        return Text(
                          _formatDuration(_elapsed),
                          style: theme.textTheme.headlineSmall?.copyWith(
                            color: theme.colorScheme.error,
                            fontWeight: FontWeight.w600,
                            fontFeatures: [const FontFeature.tabularFigures()],
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    ValueListenableBuilder<_TranscriptState>(
                      valueListenable: widget.transcriptNotifier,
                      builder: (context, state, _) {
                        if (state.isEmpty) {
                          return Text(
                            context.l10n.listening,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant
                                  .withValues(alpha: 0.5),
                            ),
                          );
                        }
                        return Container(
                          constraints: const BoxConstraints(maxHeight: 80),
                          child: SingleChildScrollView(
                            child: Text(
                              state.displayText,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isCanceling
                          ? context.l10n.releaseFingerCancel
                          : context.l10n.releaseFingerSendSwipeCancel,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildWaveBar(ThemeData theme) {
    return SizedBox(
      height: 32,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(_waveAmplitudes.length, (i) {
          final amp = _waveAmplitudes[i];
          return Container(
            width: 6,
            height: 8 + 24 * amp,
            margin: const EdgeInsets.symmetric(horizontal: 3),
            decoration: BoxDecoration(
              color: theme.colorScheme.error.withValues(alpha: 0.4 + 0.6 * amp),
              borderRadius: BorderRadius.circular(3),
            ),
          );
        }),
      ),
    );
  }
}
