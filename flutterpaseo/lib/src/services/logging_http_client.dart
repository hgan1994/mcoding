import 'dart:convert';
import 'dart:async';

import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';

class LoggingHttpClient {
  static final Logger _logger = Logger();
  static const Duration _defaultTimeout = Duration(seconds: 12);

  const LoggingHttpClient();

  Future<http.Response> get(Uri uri, {Map<String, String>? headers}) {
    return _send('GET', uri, headers: headers);
  }

  Future<http.Response> post(
    Uri uri, {
    Map<String, String>? headers,
    Object? body,
  }) {
    return _send('POST', uri, headers: headers, body: body);
  }

  Future<http.Response> patch(
    Uri uri, {
    Map<String, String>? headers,
    Object? body,
  }) {
    return _send('PATCH', uri, headers: headers, body: body);
  }

  Future<http.Response> delete(Uri uri, {Map<String, String>? headers}) {
    return _send('DELETE', uri, headers: headers);
  }

  Future<http.Response> _send(
    String method,
    Uri uri, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final startedAt = DateTime.now();
    _logRequest(method, uri, headers, body);

    try {
      final response = switch (method) {
        'GET' => await http.get(uri, headers: headers).timeout(_defaultTimeout),
        'POST' => await http
            .post(uri, headers: headers, body: body)
            .timeout(_defaultTimeout),
        'PATCH' => await http
            .patch(uri, headers: headers, body: body)
            .timeout(_defaultTimeout),
        'DELETE' => await http
            .delete(uri, headers: headers)
            .timeout(_defaultTimeout),
        _ => throw ArgumentError.value(method, 'method', 'Unsupported method'),
      };
      _logResponse(method, uri, response, startedAt);
      return response;
    } catch (error, stackTrace) {
      _logError(method, uri, error, stackTrace, startedAt);
      rethrow;
    }
  }

  void _logRequest(
    String method,
    Uri uri,
    Map<String, String>? headers,
    Object? body,
  ) {
    _logger.i('[HTTP] --> $method $uri');
    _logger.d('[HTTP] request headers: ${_formatHeaders(headers)}');
    if (body != null) {
      _logger.d('[HTTP] request body: ${_formatBody(body)}');
    }
  }

  void _logResponse(
    String method,
    Uri uri,
    http.Response response,
    DateTime startedAt,
  ) {
    final elapsedMs = DateTime.now().difference(startedAt).inMilliseconds;
    _logger.i(
      '[HTTP] <-- $method $uri ${response.statusCode} (${elapsedMs}ms)',
    );
    _logger.d('[HTTP] response headers: ${_formatHeaders(response.headers)}');
    _logger.d('[HTTP] response body: ${_formatBody(response.body)}');
  }

  void _logError(
    String method,
    Uri uri,
    Object error,
    StackTrace stackTrace,
    DateTime startedAt,
  ) {
    final elapsedMs = DateTime.now().difference(startedAt).inMilliseconds;
    _logger.e(
      '[HTTP] xx $method $uri failed (${elapsedMs}ms)',
      error: error,
      stackTrace: stackTrace,
    );
  }

  String _formatHeaders(Map<String, String>? headers) {
    if (headers == null || headers.isEmpty) {
      return '{}';
    }

    final safeHeaders = headers.map((key, value) {
      if (key.toLowerCase() == 'authorization') {
        return MapEntry(key, _maskAuthorization(value));
      }
      return MapEntry(key, value);
    });
    return const JsonEncoder.withIndent('  ').convert(safeHeaders);
  }

  String _maskAuthorization(String value) {
    if (!value.startsWith('Bearer ')) {
      return '<redacted>';
    }
    final token = value.substring(7);
    if (token.length <= 12) {
      return 'Bearer <redacted>';
    }
    return 'Bearer ${token.substring(0, 6)}...${token.substring(token.length - 4)}';
  }

  String _formatBody(Object body) {
    if (body is String) {
      return _formatJsonString(body);
    }
    return body.toString();
  }

  String _formatJsonString(String body) {
    if (body.isEmpty) {
      return '<empty>';
    }
    try {
      final decoded = jsonDecode(body);
      return const JsonEncoder.withIndent('  ').convert(decoded);
    } catch (_) {
      return body;
    }
  }
}
