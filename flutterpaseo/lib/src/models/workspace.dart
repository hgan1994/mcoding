import 'package:equatable/equatable.dart';

class WorkspaceDescriptor extends Equatable {
  final String id;
  final String projectId;
  final String projectDisplayName;
  final String projectRootPath;
  final String workspaceDirectory;
  final String projectKind;
  final String workspaceKind;
  final String name;
  final String status;
  final DateTime? activityAt;
  final Map<String, int>? diffStat;

  const WorkspaceDescriptor({
    required this.id,
    required this.projectId,
    required this.projectDisplayName,
    required this.projectRootPath,
    required this.workspaceDirectory,
    required this.projectKind,
    required this.workspaceKind,
    required this.name,
    required this.status,
    this.activityAt,
    this.diffStat,
  });

  @override
  List<Object?> get props => [
    id,
    projectId,
    projectDisplayName,
    projectRootPath,
    workspaceDirectory,
    projectKind,
    workspaceKind,
    name,
    status,
    activityAt,
    diffStat,
  ];

  WorkspaceDescriptor copyWith({
    String? id,
    String? projectId,
    String? projectDisplayName,
    String? projectRootPath,
    String? workspaceDirectory,
    String? projectKind,
    String? workspaceKind,
    String? name,
    String? status,
    DateTime? activityAt,
    Map<String, int>? diffStat,
  }) => WorkspaceDescriptor(
    id: id ?? this.id,
    projectId: projectId ?? this.projectId,
    projectDisplayName: projectDisplayName ?? this.projectDisplayName,
    projectRootPath: projectRootPath ?? this.projectRootPath,
    workspaceDirectory: workspaceDirectory ?? this.workspaceDirectory,
    projectKind: projectKind ?? this.projectKind,
    workspaceKind: workspaceKind ?? this.workspaceKind,
    name: name ?? this.name,
    status: status ?? this.status,
    activityAt: activityAt ?? this.activityAt,
    diffStat: diffStat ?? this.diffStat,
  );

  factory WorkspaceDescriptor.fromJson(Map<String, dynamic> json) =>
      WorkspaceDescriptor(
        id: json['id'] as String,
        projectId: json['projectId'] as String,
        projectDisplayName: json['projectDisplayName'] as String,
        projectRootPath: json['projectRootPath'] as String,
        workspaceDirectory:
            (json['workspaceDirectory'] ?? json['projectRootPath']) as String,
        projectKind: json['projectKind'] as String,
        workspaceKind: json['workspaceKind'] as String,
        name: json['name'] as String,
        status: json['status'] as String,
        activityAt: json['activityAt'] != null
            ? DateTime.parse(json['activityAt'] as String)
            : null,
        diffStat: json['diffStat'] != null
            ? Map<String, int>.from(json['diffStat'] as Map)
            : null,
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'projectId': projectId,
    'projectDisplayName': projectDisplayName,
    'projectRootPath': projectRootPath,
    'workspaceDirectory': workspaceDirectory,
    'projectKind': projectKind,
    'workspaceKind': workspaceKind,
    'name': name,
    'status': status,
    'activityAt': activityAt?.toIso8601String(),
    'diffStat': diffStat,
  };
}
