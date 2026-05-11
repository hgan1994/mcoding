import 'dart:convert';
import 'package:http/http.dart' as http;

import 'logging_http_client.dart';
import '../models/subscription_plan.dart';
import '../models/notification.dart';

class AuthApiException implements Exception {
  final String message;
  final int? statusCode;
  AuthApiException(this.message, {this.statusCode});
  @override
  String toString() => message;
}

class AuthService {
  String baseUrl;
  final LoggingHttpClient _http;

  AuthService({required this.baseUrl, LoggingHttpClient? httpClient})
    : _http = httpClient ?? const LoggingHttpClient();

  Uri _requireUri(String path) {
    final normalizedBaseUrl = baseUrl.trim();
    if (normalizedBaseUrl.isEmpty) {
      throw AuthApiException('Relay API base URL is not configured.');
    }
    return Uri.parse('$normalizedBaseUrl$path');
  }

  // ─── Phone login ──────────────────────────────────────────

  Future<PhoneLoginResult> phoneLogin(String phone, String code) async {
    final uri = _requireUri('/auth/phone/login');
    final res = await _http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'code': code, 'type': 'login'}),
    );
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw AuthApiException(
        _extractMessage(res) ?? '登录失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return PhoneLoginResult(
      accessToken: json['accessToken'] as String,
      user: json['user'] != null
          ? AuthUser.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }

  // ─── SMS code ─────────────────────────────────────────────

  Future<void> sendSmsCode(String phone) async {
    final uri = _requireUri('/auth/sms/send');
    final res = await _http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'type': 'login'}),
    );
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw AuthApiException(
        _extractMessage(res) ?? '验证码发送失败',
        statusCode: res.statusCode,
      );
    }
  }

  // ─── Token refresh ────────────────────────────────────────

  Future<String> refreshToken(String token) async {
    final uri = _requireUri('/auth/refresh');
    final res = await _http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'accessToken': token}),
    );
    if (res.statusCode == 401 || res.statusCode == 403) {
      throw AuthApiException('Token 已失效', statusCode: res.statusCode);
    }
    if (res.statusCode != 200) {
      throw AuthApiException('刷新 Token 失败', statusCode: res.statusCode);
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return json['accessToken'] as String;
  }

  Future<AuthUser> fetchMe(String token) async {
    final uri = _requireUri('/auth/me');
    final res = await _http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '获取用户信息失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return AuthUser.fromJson(json['user'] as Map<String, dynamic>);
  }

  Future<void> deleteAccount(String token) async {
    final uri = _requireUri('/auth/me');
    final res = await _http.delete(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '账号注销失败',
        statusCode: res.statusCode,
      );
    }
  }

  Future<AuthUser> verifyAppleSubscription({
    required String token,
    required String productId,
    required String receiptData,
    String? transactionId,
    String? originalTransactionId,
  }) async {
    final uri = _requireUri('/auth/subscriptions/apple/verify');
    final res = await _http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'productId': productId,
        'receiptData': receiptData,
        ...(transactionId == null
            ? const <String, String>{}
            : {'transactionId': transactionId}),
        ...(originalTransactionId == null
            ? const <String, String>{}
            : {'originalTransactionId': originalTransactionId}),
      }),
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '苹果订阅校验失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return AuthUser.fromJson(json['user'] as Map<String, dynamic>);
  }

  Future<VoiceUsageResult> getVoiceUsage(String token) async {
    final uri = _requireUri('/auth/voice-usage');
    final res = await _http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '获取语音使用信息失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return VoiceUsageResult.fromJson(json);
  }

  Future<VoiceUsageResult> incrementVoiceUsage(String token) async {
    final uri = _requireUri('/auth/voice-usage/increment');
    final res = await _http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '语音使用次数记录失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return VoiceUsageResult.fromJson(json);
  }

  Future<List<SubscriptionPlan>> fetchSubscriptionPlans() async {
    final uri = _requireUri('/subscription-plans');
    final res = await _http.get(
      uri,
      headers: {'Content-Type': 'application/json'},
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '获取订阅套餐失败',
        statusCode: res.statusCode,
      );
    }
    final body = jsonDecode(res.body);
    if (body is List) {
      return body
          .cast<Map<String, dynamic>>()
          .map(SubscriptionPlan.fromJson)
          .toList();
    }
    return [];
  }

  Future<void> submitFeedback({
    required String token,
    required String content,
    String? contact,
    String? page,
    String? appVersion,
    String? platform,
    List<FeedbackScreenshotPayload>? screenshots,
  }) async {
    final uri = _requireUri('/feedback');
    final res = await _http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'content': content,
        if (contact != null && contact.isNotEmpty) 'contact': contact,
        if (page != null && page.isNotEmpty) 'page': page,
        if (appVersion != null && appVersion.isNotEmpty)
          'appVersion': appVersion,
        if (platform != null && platform.isNotEmpty) 'platform': platform,
        if (screenshots != null && screenshots.isNotEmpty)
          'screenshots': screenshots.map((item) => item.toJson()).toList(),
      }),
    );
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw AuthApiException(
        _extractMessage(res) ?? '提交反馈失败',
        statusCode: res.statusCode,
      );
    }
  }

  Future<NotificationListResult> getNotifications(
    String token, {
    bool? isRead,
    String? cursor,
    int? limit,
  }) async {
    final queryParams = <String, String>{};
    if (isRead != null) queryParams['isRead'] = isRead.toString();
    if (cursor != null) queryParams['cursor'] = cursor;
    if (limit != null) queryParams['limit'] = limit.toString();
    final uri = Uri.parse(
      '$baseUrl/notifications',
    ).replace(queryParameters: queryParams);
    final res = await _http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '获取通知列表失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return NotificationListResult.fromJson(json);
  }

  Future<AppNotification> getNotification(String token, String id) async {
    final uri = Uri.parse('$baseUrl/notifications/$id');
    final res = await _http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '获取通知详情失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return AppNotification.fromJson(json);
  }

  Future<AppNotification> markNotificationRead(String token, String id) async {
    final uri = Uri.parse('$baseUrl/notifications/$id/read');
    final res = await _http.patch(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '标记通知已读失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return AppNotification.fromJson(json);
  }

  Future<int> markAllNotificationsRead(String token) async {
    final uri = Uri.parse('$baseUrl/notifications/read-all');
    final res = await _http.patch(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '标记全部已读失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return json['updated'] as int? ?? 0;
  }

  Future<int> getUnreadNotificationCount(String token) async {
    final uri = Uri.parse('$baseUrl/notifications/unread-count');
    final res = await _http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    if (res.statusCode != 200) {
      throw AuthApiException(
        _extractMessage(res) ?? '获取未读通知数量失败',
        statusCode: res.statusCode,
      );
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return json['unreadCount'] as int? ?? 0;
  }

  // ─── Helpers ──────────────────────────────────────────────

  String? _extractMessage(http.Response res) {
    try {
      final json = jsonDecode(res.body) as Map<String, dynamic>;
      return json['message'] as String?;
    } catch (_) {
      return null;
    }
  }
}

class AuthUser {
  final String id;
  final String? phone;
  final String? nickname;
  final String? avatarUrl;
  final String membershipLevel;
  final String subscriptionStatus;
  final String subscriptionChannel;
  final String? subscriptionProvider;
  final String? subscriptionProductId;
  final String? subscriptionExpiresAt;
  final String? createdAt;

  const AuthUser({
    required this.id,
    this.phone,
    this.nickname,
    this.avatarUrl,
    this.membershipLevel = 'free',
    this.subscriptionStatus = 'inactive',
    this.subscriptionChannel = 'none',
    this.subscriptionProvider,
    this.subscriptionProductId,
    this.subscriptionExpiresAt,
    this.createdAt,
  });

  bool get isMember => membershipLevel == 'member';

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
    id: json['id'] as String,
    phone: json['phone'] as String?,
    nickname: json['nickname'] as String?,
    avatarUrl: json['avatarUrl'] as String?,
    membershipLevel: (json['membershipLevel'] as String?) ?? 'free',
    subscriptionStatus: (json['subscriptionStatus'] as String?) ?? 'inactive',
    subscriptionChannel: (json['subscriptionChannel'] as String?) ?? 'none',
    subscriptionProvider: json['subscriptionProvider'] as String?,
    subscriptionProductId: json['subscriptionProductId'] as String?,
    subscriptionExpiresAt: json['subscriptionExpiresAt'] as String?,
    createdAt: json['createdAt'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'phone': phone,
    'nickname': nickname,
    'avatarUrl': avatarUrl,
    'membershipLevel': membershipLevel,
    'subscriptionStatus': subscriptionStatus,
    'subscriptionChannel': subscriptionChannel,
    'subscriptionProvider': subscriptionProvider,
    'subscriptionProductId': subscriptionProductId,
    'subscriptionExpiresAt': subscriptionExpiresAt,
    'createdAt': createdAt,
  };
}

class PhoneLoginResult {
  final String accessToken;
  final AuthUser? user;
  const PhoneLoginResult({required this.accessToken, this.user});
}

class VoiceUsageResult {
  final bool allowed;
  final int used;
  final int remaining;
  final int? limit;

  const VoiceUsageResult({
    required this.allowed,
    this.used = 0,
    this.remaining = 0,
    this.limit,
  });

  bool get isUnlimited => limit == null;

  factory VoiceUsageResult.fromJson(Map<String, dynamic> json) =>
      VoiceUsageResult(
        allowed: json['allowed'] as bool? ?? true,
        used: json['used'] as int? ?? 0,
        remaining: json['remaining'] as int? ?? 0,
        limit: json['limit'] as int?,
      );
}

class FeedbackScreenshotPayload {
  final String data;
  final String? mimeType;
  final String? fileName;

  const FeedbackScreenshotPayload({
    required this.data,
    this.mimeType,
    this.fileName,
  });

  Map<String, dynamic> toJson() => {
    'data': data,
    if (mimeType != null && mimeType!.isNotEmpty) 'mimeType': mimeType,
    if (fileName != null && fileName!.isNotEmpty) 'fileName': fileName,
  };
}

class NotificationListResult {
  final List<AppNotification> items;
  final bool hasMore;
  final int unreadCount;

  const NotificationListResult({
    required this.items,
    required this.hasMore,
    required this.unreadCount,
  });

  factory NotificationListResult.fromJson(Map<String, dynamic> json) =>
      NotificationListResult(
        items:
            (json['items'] as List<dynamic>?)
                ?.map(
                  (e) => AppNotification.fromJson(e as Map<String, dynamic>),
                )
                .toList() ??
            [],
        hasMore: json['hasMore'] as bool? ?? false,
        unreadCount: json['unreadCount'] as int? ?? 0,
      );
}
