import 'dart:convert';

import 'package:package_info_plus/package_info_plus.dart';

import 'logging_http_client.dart';

class AppVersionInfo {
  final bool hasUpdate;
  final String? versionName;
  final int? versionCode;
  final String? downloadUrl;
  final int? fileSize;
  final String? md5;
  final String? releaseNotes;
  final bool forceUpdate;

  const AppVersionInfo({
    this.hasUpdate = false,
    this.versionName,
    this.versionCode,
    this.downloadUrl,
    this.fileSize,
    this.md5,
    this.releaseNotes,
    this.forceUpdate = false,
  });

  factory AppVersionInfo.fromJson(Map<String, dynamic> json) => AppVersionInfo(
        hasUpdate: json['hasUpdate'] as bool? ?? false,
        versionName: json['versionName'] as String?,
        versionCode: json['versionCode'] as int?,
        downloadUrl: json['downloadUrl'] as String?,
        fileSize: json['fileSize'] as int?,
        md5: json['md5'] as String?,
        releaseNotes: json['releaseNotes'] as String?,
        forceUpdate: json['forceUpdate'] as bool? ?? false,
      );
}

class AppVersionService {
  final String baseUrl;
  final LoggingHttpClient _http;

  AppVersionService({required this.baseUrl, LoggingHttpClient? httpClient})
      : _http = httpClient ?? const LoggingHttpClient();

  Future<AppVersionInfo> checkUpdate() async {
    final normalizedBaseUrl = baseUrl.trim();
    if (normalizedBaseUrl.isEmpty) {
      return const AppVersionInfo();
    }
    final packageInfo = await PackageInfo.fromPlatform();
    final versionCode = int.tryParse(packageInfo.buildNumber) ?? 0;

    final uri = Uri.parse(
      '$normalizedBaseUrl/app-version/check?platform=android&versionCode=$versionCode',
    );
    final res = await _http.get(uri, headers: {'Content-Type': 'application/json'});

    if (res.statusCode != 200) {
      throw Exception('版本检查失败: ${res.statusCode}');
    }

    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return AppVersionInfo.fromJson(json);
  }
}
