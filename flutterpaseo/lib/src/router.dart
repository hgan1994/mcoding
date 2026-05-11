import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:logger/logger.dart';
import 'screens/welcome_screen.dart';
import 'screens/agents_screen.dart';
import 'screens/agent_detail_screen.dart';
import 'screens/add_host_screen.dart';
import 'screens/pair_scan_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/terminal_screen.dart';
import 'screens/file_explorer_screen.dart';
import 'screens/sessions_screen.dart';
import 'screens/open_project_screen.dart';
import 'screens/new_workspace_chat_screen.dart';
import 'screens/app_settings_screen.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();
final Logger _routeLogger = Logger();

Page<void> _buildCupertinoPage(GoRouterState state, Widget child) {
  _logRoutePage(state, child);
  return CupertinoPage<void>(
    key: state.pageKey,
    name: state.name,
    arguments: state.extra,
    child: child,
  );
}

void _logRoutePage(GoRouterState state, Widget child) {
  _routeLogger.i(
    '[Route] page=${child.runtimeType} '
    'matched=${state.matchedLocation} '
    'uri=${state.uri} '
    'pathParams=${state.pathParameters} '
    'query=${state.uri.queryParameters}',
  );
}

final router = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      pageBuilder: (context, state) =>
          _buildCupertinoPage(state, const WelcomeScreen()),
    ),
    GoRoute(
      path: '/add-host',
      pageBuilder: (context, state) =>
          _buildCupertinoPage(state, const AddHostScreen()),
    ),
    GoRoute(
      path: '/pair-scan',
      pageBuilder: (context, state) =>
          _buildCupertinoPage(state, const PairScanScreen()),
    ),
    GoRoute(
      path: '/settings',
      pageBuilder: (context, state) =>
          _buildCupertinoPage(state, const AppSettingsScreen()),
    ),
    GoRoute(
      path: '/h/:serverId/project-directory',
      pageBuilder: (context, state) => _buildCupertinoPage(
        state,
        FileExplorerScreen(
          serverId: state.pathParameters['serverId']!,
          directoryPicker: true,
        ),
      ),
    ),
    GoRoute(
      path: '/h/:serverId/open-project',
      pageBuilder: (context, state) => _buildCupertinoPage(
        state,
        OpenProjectScreen(serverId: state.pathParameters['serverId']!),
      ),
    ),
    GoRoute(
      path: '/h/:serverId/new-chat',
      pageBuilder: (context, state) => _buildCupertinoPage(
        state,
        NewWorkspaceChatScreen(
          serverId: state.pathParameters['serverId']!,
          cwd: state.uri.queryParameters['cwd'] ?? '.',
          workspaceId: state.uri.queryParameters['workspaceId'],
          workspaceName: state.uri.queryParameters['name'],
          sessionNonce: state.uri.queryParameters['newSession'],
          fromProjects: state.uri.queryParameters['fromProjects'] == '1',
        ),
      ),
    ),
    ShellRoute(
      builder: (context, state, child) {
        return Scaffold(body: child);
      },
      routes: [
        GoRoute(
          path: '/h/:serverId/agents',
          pageBuilder: (context, state) => _buildCupertinoPage(
            state,
            AgentsScreen(
              serverId: state.pathParameters['serverId']!,
              selectedCwd: state.uri.queryParameters['cwd'],
              selectedWorkspaceName: state.uri.queryParameters['name'],
            ),
          ),
        ),
        GoRoute(
          path: '/h/:serverId/terminal',
          pageBuilder: (context, state) => _buildCupertinoPage(
            state,
            TerminalScreen(serverId: state.pathParameters['serverId']!),
          ),
        ),
        GoRoute(
          path: '/h/:serverId/files',
          pageBuilder: (context, state) => _buildCupertinoPage(
            state,
            FileExplorerScreen(serverId: state.pathParameters['serverId']!),
          ),
        ),
        GoRoute(
          path: '/h/:serverId/settings',
          pageBuilder: (context, state) => _buildCupertinoPage(
            state,
            HostSettingsScreen(
              serverId: state.pathParameters['serverId']!,
              showHostInfo: state.uri.queryParameters['hostInfo'] != 'false',
            ),
          ),
        ),
        GoRoute(
          path: '/h/:serverId/sessions',
          pageBuilder: (context, state) => _buildCupertinoPage(
            state,
            SessionsScreen(serverId: state.pathParameters['serverId']!),
          ),
        ),
      ],
    ),
    GoRoute(
      path: '/h/:serverId/agent/:agentId',
      pageBuilder: (context, state) => _buildCupertinoPage(
        state,
        AgentDetailScreen(
          serverId: state.pathParameters['serverId']!,
          agentId: state.pathParameters['agentId']!,
        ),
      ),
    ),
  ],
);

void initRouterAuth([Object? _]) {}
