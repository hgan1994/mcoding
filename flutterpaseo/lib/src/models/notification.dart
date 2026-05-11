class AppNotification {
  final String id;
  final String type;
  final String title;
  final String content;
  final String? summary;
  final bool isRead;
  final String createdAt;
  final String updatedAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.content,
    this.summary,
    required this.isRead,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
    id: json['id'] as String,
    type: (json['type'] as String?) ?? 'system',
    title: (json['title'] as String?) ?? '',
    content: (json['content'] as String?) ?? '',
    summary: json['summary'] as String?,
    isRead: json['isRead'] as bool? ?? false,
    createdAt: (json['createdAt'] as String?) ?? '',
    updatedAt: (json['updatedAt'] as String?) ?? '',
  );
}
