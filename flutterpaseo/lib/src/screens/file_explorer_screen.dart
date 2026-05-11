import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/host_runtime_provider.dart';
import '../providers/session_provider.dart';
import '../services/websocket_service.dart';
import '../l10n_ext.dart';
import '../utils/working_directory_suggestions.dart';
import '../widgets/app_snack_bar.dart';

class FileExplorerScreen extends ConsumerStatefulWidget {
  final String serverId;
  final String? agentId;
  final bool directoryPicker;

  const FileExplorerScreen({
    super.key,
    required this.serverId,
    this.agentId,
    this.directoryPicker = false,
  });

  @override
  ConsumerState<FileExplorerScreen> createState() => _FileExplorerScreenState();
}

enum _SortBy { name, size, modified }

class _PathCrumb {
  final String label;
  final String path;
  const _PathCrumb(this.label, this.path);
}

class _FileExplorerScreenState extends ConsumerState<FileExplorerScreen> {
  final List<String> _pathHistory = ['.'];
  final TextEditingController _folderSearchController = TextEditingController();
  Timer? _folderSearchDebounce;
  StreamSubscription<Map<String, dynamic>>? _metadataSubscription;
  DaemonClient? _metadataClient;
  _SortBy _sortBy = _SortBy.name;
  bool _isAddingProject = false;
  bool _didApplyDaemonPickerRoot = false;
  String _folderSearchQuery = '';

  String get _currentPath => _pathHistory.last;
  String get _pickerRoot {
    final platform = ref
        .read(hostRuntimeProvider)[widget.serverId]
        ?.client
        ?.platform
        ?.toLowerCase();
    return platform == 'darwin' ? '/Users' : '/';
  }

  String _joinPickerPath(String relativePath) {
    if (relativePath.startsWith('/')) return relativePath;
    if (relativePath == '.' || relativePath.isEmpty) return _pickerRoot;
    if (_pickerRoot == '/') return '/$relativePath';
    return '$_pickerRoot/$relativePath';
  }

  String _pathBasename(String path) {
    final parts = path.split('/').where((part) => part.isNotEmpty).toList();
    if (parts.isEmpty) return path;
    return parts.last;
  }

  String _toPickerRelativePath(String absolutePath) {
    if (absolutePath == _pickerRoot) return '.';
    final prefix = _pickerRoot == '/' ? '/' : '$_pickerRoot/';
    if (absolutePath.startsWith(prefix)) {
      return _pickerRoot == '/'
          ? absolutePath.substring(1)
          : absolutePath.substring(prefix.length);
    }
    return absolutePath;
  }

  Map<String, dynamic> _directorySuggestionEntry(String absolutePath) {
    final relativePath = _toPickerRelativePath(absolutePath);
    return {
      'kind': 'directory',
      'name': _pathBasename(absolutePath),
      'path': relativePath,
      'absolutePath': absolutePath,
    };
  }

  List<String> _directorySuggestionPaths(
    SessionState session,
    String searchQuery,
  ) {
    return buildWorkingDirectorySuggestions(
      recommendedPaths: session.workspaces.values
          .map((workspace) => workspace.projectRootPath)
          .where((path) => path.isNotEmpty)
          .toList(),
      serverPaths:
          session.directorySuggestions[searchQuery.toLowerCase()] ?? [],
      query: searchQuery,
    );
  }

  String get _selectedDirectoryPath {
    if (!widget.directoryPicker) return _currentPath;
    return _joinPickerPath(_currentPath);
  }

  String get _entryCacheKey =>
      widget.directoryPicker && _folderSearchQuery.isNotEmpty
      ? '$_pickerRoot::.::search=${_folderSearchQuery.toLowerCase()}'
      : widget.directoryPicker
      ? '$_pickerRoot::$_currentPath'
      : _currentPath;

  @override
  void initState() {
    super.initState();
    _folderSearchController.addListener(_handleFolderSearchChanged);
    Future.microtask(() {
      _attachRuntimeClient();
      _fetchCurrentDirectory();
    });
  }

  @override
  void dispose() {
    _folderSearchDebounce?.cancel();
    _metadataSubscription?.cancel();
    _folderSearchController
      ..removeListener(_handleFolderSearchChanged)
      ..dispose();
    super.dispose();
  }

  void _handleFolderSearchChanged() {
    if (!widget.directoryPicker) return;
    _folderSearchDebounce?.cancel();
    setState(() => _folderSearchQuery = _folderSearchController.text.trim());
    _folderSearchDebounce = Timer(
      const Duration(milliseconds: 350),
      _fetchCurrentDirectory,
    );
  }

  List<_PathCrumb> get _crumbs {
    if (_currentPath == '.' || _currentPath.isEmpty) {
      return [
        widget.directoryPicker
            ? _PathCrumb(_pickerRoot, '.')
            : const _PathCrumb('~', '.'),
      ];
    }
    final parts = _currentPath.split('/').where((p) => p.isNotEmpty).toList();
    final crumbs = <_PathCrumb>[
      widget.directoryPicker
          ? _PathCrumb(_pickerRoot, '.')
          : const _PathCrumb('~', '.'),
    ];
    var built = '';
    for (final part in parts) {
      built = built.isEmpty ? part : '$built/$part';
      crumbs.add(_PathCrumb(part, built));
    }
    return crumbs;
  }

  void _fetchCurrentDirectory() {
    _attachRuntimeClient();
    final notifier = ref.read(sessionProvider(widget.serverId).notifier);
    if (widget.directoryPicker) {
      final searchQuery = _folderSearchQuery.trim();
      if (searchQuery.isNotEmpty) {
        notifier.fetchDirectorySuggestions(searchQuery, limit: 30);
        return;
      }
      notifier.fetchFileExplorer(
        _pickerRoot,
        path: _currentPath,
        directoriesOnly: true,
      );
      return;
    }
    notifier.fetchFileExplorer(_currentPath);
  }

  void _attachRuntimeClient() {
    final runtime = ref.read(hostRuntimeProvider)[widget.serverId];
    final client = runtime?.client;
    if (client == null) return;
    _subscribeToDaemonMetadata(client);
    final session = ref.read(sessionProvider(widget.serverId));
    if (identical(session.client, client)) return;
    ref.read(sessionProvider(widget.serverId).notifier).attachClient(client);
  }

  void _subscribeToDaemonMetadata(DaemonClient client) {
    if (identical(_metadataClient, client)) return;
    _metadataSubscription?.cancel();
    _metadataClient = client;
    _didApplyDaemonPickerRoot = false;
    _metadataSubscription = client.messages.listen((message) {
      if (!widget.directoryPicker || !mounted) return;
      if (_didApplyDaemonPickerRoot) return;
      if (message['status'] != 'server_info' || client.platform != 'darwin') {
        return;
      }
      final isAtInitialDirectory =
          _pathHistory.length == 1 && _currentPath == '.';
      if (!isAtInitialDirectory || _folderSearchController.text.isNotEmpty) {
        return;
      }
      _didApplyDaemonPickerRoot = true;
      setState(() {});
      _fetchCurrentDirectory();
    });
  }

  void _navigateTo(String path) {
    setState(() => _pathHistory.add(path));
    if (widget.directoryPicker && _folderSearchController.text.isNotEmpty) {
      _folderSearchDebounce?.cancel();
      _folderSearchController.clear();
    }
    _fetchCurrentDirectory();
  }

  void _goBack() {
    if (_pathHistory.length > 1) {
      setState(() => _pathHistory.removeLast());
      _fetchCurrentDirectory();
    }
  }

  bool get _canGoToParentDirectory =>
      widget.directoryPicker && _currentPath != '.' && _currentPath.isNotEmpty;

  bool get _canGoToRootDirectory =>
      widget.directoryPicker &&
      (_currentPath != '.' || _folderSearchController.text.isNotEmpty);

  String get _parentDirectoryPath {
    final parts = _currentPath.split('/').where((p) => p.isNotEmpty).toList();
    if (parts.length <= 1) return '.';
    return parts.take(parts.length - 1).join('/');
  }

  void _goToParentDirectory() {
    if (!_canGoToParentDirectory) return;
    _navigateTo(_parentDirectoryPath);
  }

  void _goToRootDirectory() {
    if (!_canGoToRootDirectory) return;
    _navigateTo('.');
  }

  int _sortEntries(List<Map<String, dynamic>> entries) {
    final dirs = entries
        .where((e) => (e['kind'] as String? ?? '') == 'directory')
        .toList();
    final files = entries
        .where((e) => (e['kind'] as String? ?? '') != 'directory')
        .toList();
    int cmp(Map<String, dynamic> a, Map<String, dynamic> b) {
      return switch (_sortBy) {
        _SortBy.name => ((a['name'] as String?) ?? '').compareTo(
          (b['name'] as String?) ?? '',
        ),
        _SortBy.size => ((a['size'] as int?) ?? 0).compareTo(
          (b['size'] as int?) ?? 0,
        ),
        _SortBy.modified =>
          (((a['modifiedAt'] ?? a['modified']) as String?) ?? '').compareTo(
            ((b['modifiedAt'] ?? b['modified']) as String?) ?? '',
          ),
      };
    }

    dirs.sort(cmp);
    files.sort(cmp);
    entries
      ..clear()
      ..addAll([...dirs, ...files]);
    return entries.length;
  }

  IconData _fileIcon(String name, bool isDir) {
    if (isDir) return Icons.folder;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : '';
    return switch (ext) {
      'dart' || 'py' || 'rs' => Icons.code,
      'js' || 'ts' || 'jsx' || 'tsx' => Icons.javascript,
      'md' || 'txt' => Icons.description,
      'json' || 'yaml' || 'yml' || 'toml' => Icons.settings,
      'png' || 'jpg' || 'jpeg' || 'svg' || 'gif' || 'webp' => Icons.image,
      'css' || 'scss' || 'html' => Icons.web,
      _ => Icons.insert_drive_file,
    };
  }

  Color _fileIconColor(String name, bool isDir, ThemeData theme) {
    if (isDir) return Colors.amber.shade700;
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : '';
    return switch (ext) {
      'dart' => Colors.blue,
      'py' => Colors.green,
      'js' || 'ts' => Colors.amber,
      'md' => Colors.grey,
      'json' || 'yaml' || 'yml' => Colors.orange,
      'png' || 'jpg' || 'svg' => Colors.purple,
      _ => theme.colorScheme.onSurfaceVariant,
    };
  }

  String _formatSize(dynamic size) {
    final bytes = (size as int?) ?? 0;
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  Future<void> _addDirectoryAsProject(String directoryPath) async {
    if (_isAddingProject) return;
    setState(() => _isAddingProject = true);
    try {
      final workspace = await ref
          .read(sessionProvider(widget.serverId).notifier)
          .openProject(directoryPath);
      if (!mounted) return;
      AppSnackBar.showSuccess(
        context,
        context.l10n.projectAdded(workspace.projectDisplayName),
      );
      final location = Uri(
        path: '/h/${widget.serverId}/new-chat',
        queryParameters: {
          'cwd': workspace.workspaceDirectory,
          'workspaceId': workspace.id,
          'name': workspace.projectDisplayName,
        },
      ).toString();
      context.go(location);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isAddingProject = false);
      AppSnackBar.showError(
        context,
        context.l10n.addProjectFailed(e.toString()),
      );
    }
  }

  Future<void> _submitDirectoryPickerSelection() async {
    final searchQuery = _folderSearchQuery.trim();
    if (searchQuery.isEmpty) {
      await _addDirectoryAsProject(_selectedDirectoryPath);
      return;
    }
    final session = ref.read(sessionProvider(widget.serverId));
    final suggestions = _directorySuggestionPaths(session, searchQuery);
    await _addDirectoryAsProject(
      suggestions.isNotEmpty ? suggestions.first : searchQuery,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    ref.listen(hostRuntimeProvider, (previous, next) {
      final previousClient = previous?[widget.serverId]?.client;
      final nextClient = next[widget.serverId]?.client;
      if (nextClient != null && !identical(previousClient, nextClient)) {
        ref
            .read(sessionProvider(widget.serverId).notifier)
            .attachClient(nextClient);
        _fetchCurrentDirectory();
      }
    });
    final session = ref.watch(sessionProvider(widget.serverId));
    final searchQuery = _folderSearchQuery.trim();
    final rawEntries = widget.directoryPicker && searchQuery.isNotEmpty
        ? _directorySuggestionPaths(
            session,
            searchQuery,
          ).map(_directorySuggestionEntry).toList()
        : List<Map<String, dynamic>>.from(
            session.fileExplorerEntries[_entryCacheKey] ?? [],
          );
    if (widget.directoryPicker && searchQuery.isEmpty) {
      rawEntries.removeWhere(
        (entry) => (entry['kind'] as String? ?? '') != 'directory',
      );
    }
    if (!(widget.directoryPicker && searchQuery.isNotEmpty)) {
      _sortEntries(rawEntries);
    }

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.translucent,
      child: Scaffold(
        appBar: AppBar(
          leading: BackButton(
            onPressed: widget.directoryPicker
                ? () => context.pop()
                : _pathHistory.length > 1
                ? _goBack
                : () => context.pop(),
          ),
          title: Text(
            widget.directoryPicker
                ? context.l10n.selectDirectory
                : _currentPath == '.'
                ? context.l10n.files
                : _currentPath.split('/').last,
          ),
          actions: [
            if (!widget.directoryPicker)
              PopupMenuButton<_SortBy>(
                icon: Icon(Icons.sort),
                onSelected: (s) => setState(() => _sortBy = s),
                itemBuilder: (_) => [
                  PopupMenuItem(
                    value: _SortBy.name,
                    child: Text(context.l10n.name),
                  ),
                  PopupMenuItem(
                    value: _SortBy.size,
                    child: Text(context.l10n.size),
                  ),
                  PopupMenuItem(
                    value: _SortBy.modified,
                    child: Text(context.l10n.modified),
                  ),
                ],
              ),
            if (widget.directoryPicker)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilledButton(
                  onPressed: _isAddingProject
                      ? null
                      : _submitDirectoryPickerSelection,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(0, 32),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                  ),
                  child: Text(_isAddingProject ? context.l10n.adding : context.l10n.confirm),
                ),
              ),
            if (!widget.directoryPicker)
              IconButton(
                icon: Icon(Icons.refresh),
                onPressed: () => ref
                    .read(sessionProvider(widget.serverId).notifier)
                    .fetchFileExplorer(_currentPath),
              ),
          ],
        ),
        body: Column(
          children: [
            if (!widget.directoryPicker) _buildBreadcrumbs(theme),
            if (!widget.directoryPicker) Divider(height: 1),
            if (widget.directoryPicker) _buildDirectoryPickerToolbar(),
            if (widget.directoryPicker)
              Padding(
                padding: const EdgeInsets.fromLTRB(13, 0, 16, 10),
                child: Row(
                  children: [
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _selectedDirectoryPath,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: rawEntries.isEmpty
                  ? Center(
                      child: Text(
                        widget.directoryPicker && _folderSearchQuery.isNotEmpty
                            ? context.l10n.noMatchingFolders
                            : widget.directoryPicker
                            ? context.l10n.noSelectableSubdirectories
                            : context.l10n.noFiles,
                      ),
                    )
                  : ListView.separated(
                      itemCount: rawEntries.length,
                      separatorBuilder: (context, index) =>
                          const Divider(height: 1, indent: 72),
                      itemBuilder: (context, index) {
                        final entry = rawEntries[index];
                        final kind = entry['kind'] as String? ?? 'file';
                        final name = entry['name'] as String? ?? 'unknown';
                        final entryPath = entry['path'] as String? ?? name;
                        final absolutePath =
                            entry['absolutePath'] as String? ??
                            _joinPickerPath(entryPath);
                        final size = entry['size'];
                        final modified =
                            entry['modifiedAt'] ?? entry['modified'];
                        final isDir = kind == 'directory';
                        return ListTile(
                          leading: Icon(
                            _fileIcon(name, isDir),
                            color: _fileIconColor(name, isDir, theme),
                            size: 36,
                          ),
                          title: Text(name),
                          subtitle: widget.directoryPicker
                              ? (_folderSearchQuery.isNotEmpty
                                    ? Text(absolutePath)
                                    : null)
                              : Text(
                                  isDir
                                      ? context.l10n.directory
                                      : _formatSize(size),
                                ),
                          trailing: !widget.directoryPicker && modified != null
                              ? Text(
                                  modified as String,
                                  style: theme.textTheme.labelSmall,
                                )
                              : null,
                          onTap: isDir
                              ? () {
                                  if (widget.directoryPicker &&
                                      _folderSearchQuery.isNotEmpty) {
                                    _addDirectoryAsProject(absolutePath);
                                    return;
                                  }
                                  _navigateTo(
                                    widget.directoryPicker
                                        ? entryPath
                                        : '$_currentPath/$name'.replaceAll(
                                            RegExp(r'/+'),
                                            '/',
                                          ),
                                  );
                                }
                              : () => AppSnackBar.showWarning(context, name),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBreadcrumbs(ThemeData theme) {
    final crumbs = _crumbs;
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: crumbs.length,
        separatorBuilder: (context, index) => Padding(
          padding: EdgeInsets.symmetric(horizontal: 2),
          child: Icon(Icons.chevron_right, size: 16),
        ),
        itemBuilder: (context, index) {
          final isLast = index == crumbs.length - 1;
          return TextButton(
            onPressed: isLast ? null : () => _navigateTo(crumbs[index].path),
            style: isLast
                ? TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.primary,
                    textStyle: const TextStyle(fontWeight: FontWeight.bold),
                  )
                : null,
            child: Text(
              crumbs[index].label,
              style: const TextStyle(fontSize: 13),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDirectoryPickerToolbar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 12, 16, 8),
      child: Builder(
        builder: (context) => Row(
          children: [
            IconButton(
              tooltip: context.l10n.backToRootDirectory,
              onPressed: _canGoToRootDirectory ? _goToRootDirectory : null,
              icon: const Icon(Icons.home_outlined),
            ),
            IconButton(
              tooltip: context.l10n.backToParentDirectory,
              onPressed: _canGoToParentDirectory ? _goToParentDirectory : null,
              icon: const Icon(CupertinoIcons.arrow_turn_up_left),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: SizedBox(
                height: 44,
                child: TextField(
                  controller: _folderSearchController,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: context.l10n.searchFolders,
                  prefixIcon: const Icon(CupertinoIcons.search),
                  suffixIcon: _folderSearchQuery.isEmpty
                      ? null
                      : IconButton(
                          tooltip: context.l10n.clearSearch,
                          icon: const Icon(Icons.close),
                          onPressed: _folderSearchController.clear,
                        ),
                  isDense: true,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      ),
    );
  }
}
