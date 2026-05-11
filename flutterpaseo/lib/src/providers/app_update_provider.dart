import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../providers/auth_provider.dart';
import '../services/app_version_service.dart';

class DownloadProgress {
  final double progress;
  final String? filePath;
  final bool isComplete;
  final String? error;

  const DownloadProgress({
    this.progress = 0,
    this.filePath,
    this.isComplete = false,
    this.error,
  });
}

class AppUpdateState {
  final AppVersionInfo? versionInfo;
  final bool isChecking;
  final DownloadProgress download;
  final String? checkError;

  const AppUpdateState({
    this.versionInfo,
    this.isChecking = false,
    this.download = const DownloadProgress(),
    this.checkError,
  });

  AppUpdateState copyWith({
    AppVersionInfo? versionInfo,
    bool? isChecking,
    DownloadProgress? download,
    String? checkError,
  }) =>
      AppUpdateState(
        versionInfo: versionInfo ?? this.versionInfo,
        isChecking: isChecking ?? this.isChecking,
        download: download ?? this.download,
        checkError: checkError,
      );
}

class AppUpdateNotifier extends StateNotifier<AppUpdateState> {
  final AppVersionService _service;
  HttpClient? _httpClient;
  bool _cancelled = false;

  AppUpdateNotifier(this._service) : super(const AppUpdateState());

  Future<void> checkForUpdate({bool silent = false}) async {
    if (state.isChecking) return;
    state = state.copyWith(isChecking: true, checkError: null);

    try {
      final info = await _service.checkUpdate();
      state = state.copyWith(
        versionInfo: info,
        isChecking: false,
      );
    } catch (e) {
      state = state.copyWith(
        isChecking: false,
        checkError: e.toString(),
      );
    }
  }

  Future<void> downloadApk() async {
    final info = state.versionInfo;
    if (info?.downloadUrl == null) return;

    _cancelled = false;
    _httpClient?.close();
    _httpClient = HttpClient();

    try {
      final request = await _httpClient!.getUrl(Uri.parse(info!.downloadUrl!));
      final response = await request.close();

      final totalBytes = response.contentLength > 0
          ? response.contentLength
          : (info.fileSize ?? 0);

      final dir = await getTemporaryDirectory();
      final filePath = '${dir.path}/paseo_update_${info.versionCode}.apk';
      final file = File(filePath);
      final sink = file.openWrite();

      int receivedBytes = 0;

      await for (final chunk in response) {
        if (_cancelled) {
          sink.close();
          _httpClient?.close();
          state = state.copyWith(
            download: const DownloadProgress(progress: 0),
          );
          return;
        }

        sink.add(chunk);
        receivedBytes += chunk.length;

        final progress =
            totalBytes > 0 ? receivedBytes / totalBytes : 0.0;

        state = state.copyWith(
          download: DownloadProgress(
            progress: progress.clamp(0.0, 1.0),
            filePath: filePath,
          ),
        );
      }

      await sink.close();

      state = state.copyWith(
        download: DownloadProgress(
          progress: 1.0,
          filePath: filePath,
          isComplete: true,
        ),
      );
    } catch (e) {
      state = state.copyWith(
        download: DownloadProgress(error: e.toString()),
      );
    }
  }

  void cancelDownload() {
    _cancelled = true;
    _httpClient?.close();
    _httpClient = null;
    state = state.copyWith(download: const DownloadProgress());
  }

  void dismissUpdate() {
    state = const AppUpdateState();
  }

  @override
  void dispose() {
    _httpClient?.close();
    super.dispose();
  }
}

final appVersionServiceProvider = Provider<AppVersionService>((ref) {
  final baseUrl = ref.watch(relayBaseUrlProvider);
  return AppVersionService(baseUrl: baseUrl);
});

final appUpdateProvider =
    StateNotifierProvider<AppUpdateNotifier, AppUpdateState>((ref) {
  return AppUpdateNotifier(ref.watch(appVersionServiceProvider));
});
