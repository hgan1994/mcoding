---
name: paseo-self-hosted
description: Project onboarding and development workflow for this self-hosted Paseo workspace. Use for any work in this repo, especially requests to 改动/修改/修复 Paseo 源码, upstream source, electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64, daemon/CLI/Electron compatibility, flutterpaseo, electronDesktop, relay-service, QR pairing, relay endpoint customization, remote AI coding sessions, auth/admin/payment business features, or cross-stack changes.
compatibility: opencode
---

# Paseo Self-Hosted

Use this skill to keep changes aligned with the self-hosted Paseo product boundary.

## OpenCode Triggering

OpenCode should load this skill for any task in this workspace, especially when the user says `改动 Paseo 源码`, `修改 paseo 源码`, `上游源码`, `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64`, `daemon`, `CLI`, `Electron`, `relay`, `QR 配对`, or asks to change Flutter, backend, admin, desktop, or cross-stack behavior.

If OpenCode does not show or load this skill, check that the session starts inside the git worktree, `.opencode/skills/paseo-self-hosted/SKILL.md` is visible, the `skill` tool is enabled, and `opencode.json` does not deny `paseo-self-hosted`.

## First Reads

1. Read the workspace root `AGENTS.md`.
2. For cross-stack or protocol-sensitive work, read `references/project-context.md`.
3. For upstream behavior, read only the relevant upstream docs/code under `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/`; do not load the whole upstream project.
4. For tasks that use the upstream Paseo daemon/CLI to coordinate agents, read `references/upstream-paseo-skills.md`, then open only the matching upstream skill file.

## Ownership Decision

- App UX, QR scanning, mobile auth state, session screens, conversation UI, and in-app feedback submission belong in `flutterpaseo/`.
- Electron-first bound daemon control, pairing QR display, daemon logs, local Claude Code/Codex CLI/OpenCode install/upgrade controls, and app-owned daemon startup/shutdown belong in `electronDesktop/`.
- Relay protocol, deployment, and any remaining backend business policy belong in `relay-service/`. On the current open-source branch, relay runtime code should stay database-free and limited to relay-owned paths.
- The vendored upstream checkout in `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/` is a daemon-focused subset that keeps `packages/server`, `packages/cli`, `packages/relay`, and `packages/highlight` plus supporting docs/scripts. Treat it as a reference and compatibility surface; change it only for explicit daemon/desktop pairing, endpoint customization, or compatibility experiments.

## Local Relay Default

- On the current open-source branch, `relay-service` defaults `HOST` to the current LAN IPv4 and `PORT` to `8787` unless env overrides are supplied. Do not assume a built-in production relay endpoint.
- Local upstream daemon and desktop pairing should use the relay-service address entered by the user in Electron Desktop or supplied by deployment environment.
- `electronDesktop` derives `PASEO_RELAY_ENDPOINT`, `PASEO_RELAY_PUBLIC_ENDPOINT`, and `PASEO_APP_BASE_URL` from the saved relay-service address entered in the desktop UI unless the deployment overrides them explicitly.

## Relay Address Changes

When changing the self-hosted relay address, separate the backend HTTP API base URL from the daemon/app WebSocket relay endpoint.

- `relay-service` listens on `HOST`/`PORT` from `relay-service/src/config/relay-service-config.ts`; the local default port is `8787`. Change deployment/runtime env first when only the listening port or bind address changes.
- User feedback is stored in `relay-service/src/feedback/*`; uploaded screenshots are written to the service static `public/feedback/` tree so admin pages can preview them directly.
- Upstream daemon pairing QR/link generation reads `PASEO_RELAY_ENDPOINT` and `PASEO_RELAY_PUBLIC_ENDPOINT` in `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/packages/server/src/server/config.ts`. These env vars override persisted config; persisted config lives under the daemon Paseo home `config.json` with `daemon.relay.endpoint` and `daemon.relay.publicEndpoint`.
- `relayEndpoint` is the address the daemon uses to connect to the relay. `relayPublicEndpoint` is the address embedded in the QR offer for Flutter clients. For most LAN setups they are the same `host:port`; behind a proxy or public domain, keep `relayEndpoint` internal if needed and set `relayPublicEndpoint` to the externally reachable host.
- The upstream default and default persisted config currently live in `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/packages/server/src/server/config.ts` and `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/packages/server/src/server/persisted-config.ts`. Change these only when the workspace-wide default should move for future daemon configs; prefer env/persisted config for local one-off changes.
- Flutter does not hardcode the relay WebSocket endpoint for scanned sessions. It parses `relay.endpoint` from the QR offer in `flutterpaseo/lib/src/utils/connection_offer.dart` and connects in `flutterpaseo/lib/src/providers/host_runtime_provider.dart`.
- `flutterpaseo` also accepts the self-hosted LAN v3 QR offer in `flutterpaseo/lib/src/utils/connection_offer.dart`, prefers the embedded `directTcp` connection, and still preserves any embedded relay connection for device sync or fallback.
- `flutterpaseo` app settings and host settings now link to a shared `/feedback` route that submits text plus up to 4 screenshots to the backend feedback API.
- `flutterpaseo` now treats long-idle daemon sockets as stale: `flutterpaseo/lib/src/services/websocket_service.dart` sends idle health probes, reconnects when probes time out, and `flutterpaseo/lib/src/app.dart` re-checks host connections on foreground resume so screens do not stay fake-online after the app sits in background.
- `electronDesktop/` is a standalone Electron project for the Electron-first bound daemon desktop. It resolves `PASEO_UPSTREAM_ROOT` or `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64`, starts the upstream daemon supervisor with `PASEO_DESKTOP_MANAGED=1`, injects self-hosted relay env vars plus `PASEO_LISTEN=0.0.0.0:6767`, uses upstream CLI commands for status, pairing, stop, restart, and logs, reads Claude Code/Codex CLI/OpenCode provider availability from `paseo provider ls --json` when the daemon API is reachable, derives the connected-device badge from the relay stats HTTP endpoint with a daemon log fallback when that endpoint is unavailable, manages Claude Code/Codex CLI/OpenCode via global npm installs after checking/installing Node.js/npm, and stops the local daemon when the Electron app quits.
- `electronDesktop/` macOS packaging reuses the local Electron runtime from `electronDesktop/node_modules/electron/dist` by passing `--config.electronDist=node_modules/electron/dist` to `electron-builder`, so DMG builds do not need to redownload the Electron zip from GitHub.
- `electronDesktop/` component actions hide Upgrade when an installed npm-managed CLI matches the current npm latest version; if automated install fails, the action should become an official provider install link.
- App version publishing is OS-specific for Electron desktop: publish records as `electron-mac`, `electron-win`, or `electron-linux`; the Electron update checker maps `process.platform` to the matching backend platform. Android remains `android`.
- In `electronDesktop`, Claude readiness follows upstream Paseo semantics: bundled `@anthropic-ai/claude-agent-sdk` counts as available even when a global `claude` command is absent. Installing `@anthropic-ai/claude-code` globally is still offered as an optional CLI install.
- Flutter's backend/auth/device API base URL is separate: `flutterpaseo/lib/src/providers/auth_provider.dart` reads `RELAY_BASE_URL` and local app settings, with no built-in production default on this branch. Use this only for deployment-specific HTTP APIs that still exist.
- On the current open-source branch, do not ship built-in commercial first-party identifiers. Use generic committed bundle ids, app names, and desktop product names by default; reserve environment variables for true deployment overrides or secrets only.
- Device records may store the relay endpoint received from QR pairing via `relay-service/src/auth/device.controller.ts` into `user_devices.relayEndpoint`; existing paired devices can retain old addresses until re-paired or migrated.
- Relay v2 connection rows store the daemon hostname in `relay_connections.hostname` from daemon server/control socket metadata. When Electron Desktop starts the daemon, the hostname shown in the Electron Daemon panel is the same daemon hostname that the relay receives and applies to matching connection rows.
- When a LAN v3 offer includes both direct and relay connections, `flutterpaseo/lib/src/providers/host_registry_provider.dart` keeps the direct connection in local state while syncing the relay connection through the backend-owned device list.

After changing relay addresses, validate the narrow surface: backend with `cd relay-service && npm run typecheck`, Flutter with `cd flutterpaseo && flutter analyze`, and upstream daemon pairing behavior with the specific daemon/config tests if source defaults changed.

## Development Rules

- Preserve Paseo relay wire compatibility by default.
- Keep message schema changes backward-compatible: optional new fields, old fields still accepted, no casual renames/removals.
- Keep business logic outside encrypted relay frame contents. Enforce auth, quota, payment, and admin policy at connection/session boundaries unless the user explicitly changes the security model.
- The current open-source branch uses a relay-only runtime by default: `relay-service` should boot just relay plus health and default to the current LAN IPv4 plus port `8787`, `flutterpaseo` should keep pairing/chat usable without auth APIs, and `electronDesktop` should require a user-provided relay-service address before starting the daemon.
- Prefer self-hosted code over upstream edits. If a fix can live in `relay-service`, do not patch upstream just to make the backend convenient.
- Treat `packages/`, `node_modules/`, `dist/`, IDE folders, and lock/build outputs as generated or external unless the task proves otherwise.
- Do not expose or commit secrets from env/deploy files.
- When an AI agent creates a new non-generated source, config, migration, test, or documentation file, run `git add <path>` for that file before finishing so it is tracked. Do not add compiled outputs, generated build artifacts, dependency folders, IDE files, secrets, or other ignored/generated files.

## Flutter Device List Contract

- The `flutterpaseo` device list is server-owned. Do not make it a local-storage source of truth and do not restore paired devices from `StorageService.loadHostRegistry()` for this screen.
- Query devices through the backend API, currently `GET /auth/devices`, and replace the app-side list with the API response.
- After QR scan or pasted pairing succeeds, bind the device through the backend API, currently `POST /auth/devices`, then refresh the list from `GET /auth/devices`.
- Rename and remove operations should call the backend API first, then refresh the list from the backend. Do not silently swallow device API failures and then show an in-memory-only success.
- It is okay to keep transient Riverpod/UI state for rendering and connection status, but persistence of the user's device list belongs to `relay-service` (`user_devices`), not Flutter local storage.
- Device `label` falls back to relay hostname metadata when the incoming label is still the raw `serverId`; users can still manually edit the label in the welcome screen or settings.

## Flutter Hold-To-Talk Dictation

- `flutterpaseo/lib/src/widgets/hold_to_talk_button.dart` records audio in the app, sends it to Qwen ASR, and submits the recognized text as a normal chat message.
- Do not call daemon `set_voice_mode` from this hold-to-talk dictation UI. Daemon voice mode reloads the agent session and starts daemon-managed voice turn detection/TTS, so toggling it around local ASR can race with just-finished agent turns and make the next chat send appear unresponsive.
- On the current open-source branch, the App Settings entry and local persistence for DashScope/Qwen ASR credentials are removed. Clear any legacy locally stored voice secrets instead of reusing them, and do not reintroduce a committed default key or move this requirement behind backend auth.
- Keep `set_voice_mode` for explicit daemon-managed voice/audio streaming surfaces such as `voice_panel.dart`.

## Flutter Project Directory Picker

- The project directory picker in `flutterpaseo/lib/src/screens/file_explorer_screen.dart` starts at `/Users` when the connected daemon reports macOS (`platform: "darwin"`), and falls back to disk root `/` for older daemons or other platforms.
- Its folder search matches the React Native project picker: Flutter sends `directory_suggestions_request` with `includeDirectories: true`, `includeFiles: false`, and `limit: 30`, then combines existing workspace `projectRootPath` recommendations with daemon-returned paths using the `buildWorkingDirectorySuggestions` ordering semantics.
- Empty-search directory browsing still uses `file_explorer_request` with `directoriesOnly: true` to list selectable child folders under the current picker path.
- Opening a newly selected directory must preserve the exact selected directory after git-root normalization. `open_project_request` should only reuse an exact existing workspace record; parent workspace prefix matching is reserved for mapping existing agent/subdirectory activity back to registered workspaces.
- After a directory is added, or an existing project is tapped from `open_project_screen.dart`, Flutter opens `new_workspace_chat_screen.dart` at `/h/:serverId/new-chat`. This chat surface lets the user select provider/model before the first prompt, sends `create_agent_request` only when that prompt is submitted, then stays on the same page as the live agent chat.
- New App conversations default to a bypass-like mode when the selected provider exposes one: Claude `bypassPermissions`, Codex/OpenCode/Cursor `full-access`, or ACP autopilot. If no bypass-like mode is available, fall back to the provider's `defaultModeId` or first exposed mode.

## Upstream Paseo Compatibility Patches

When replacing the upstream checkout, for example moving from `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/` to `paseo-0.1.65/`, inspect and reapply these local compatibility patches before testing:

### Agent Title Language Preservation

- File: `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/packages/server/src/server/agent/agent-metadata-generator.ts`
- The upstream `buildPrompt()` function generates an AI prompt that asks for a short descriptive title but does not specify the output language. When the user sends a Chinese prompt, the AI default behavior produces an English title, overwriting the provisional Chinese title derived from the first line of the user message.
- Patch: add `"Use the same language as the user prompt (e.g., Chinese prompt → Chinese title)."` to the title instruction in `buildPrompt()`.
- The flow is: `resolveCreateAgentTitles()` → `deriveInitialAgentTitle()` takes the first content line of the user prompt as provisional title → `scheduleAgentMetadataGeneration()` asynchronously calls AI to generate a better title → `agentManager.setTitle()` overwrites the provisional title → `agent_update` pushes the new title to Flutter.
- After porting this patch, run `cd electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64 && npm run typecheck --workspace=@getpaseo/server` to verify.

### Foreground Turn ID Fallback

- File: `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/packages/server/src/server/agent/agent-manager.ts`
- Some provider sessions emit foreground events, including terminal `turn_completed` events, without `turnId`. Without a manager-level fallback, the assistant reply can render but the foreground waiter never settles, leaving `activeForegroundTurnId` stuck and causing the next user message to hang or be routed through replacement-run recovery.
- Patch: in `dispatchSessionEvent()`, call `attachForegroundTurnIdIfMissing(...)` before matching waiters or handling the event. The helper should leave `thread_started` untouched, preserve explicit `turnId`, and attach the agent's current `activeForegroundTurnId` to other foreground events when missing.
- Patch coverage: keep or port the `AgentManager > foreground turns settle when provider events omit turnId` regression test in `packages/server/src/server/agent/agent-manager.test.ts`.
- After porting this patch, run `cd electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64 && npx vitest run packages/server/src/server/agent/agent-manager.test.ts --bail=1` and `cd electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64 && npm run typecheck --workspace=@getpaseo/server`.

### Directory Picker Patches

- Directory picker search protocol: ensure upstream `packages/server/src/shared/messages.ts` accepts `directory_suggestions_request` with `query`, optional `cwd`, `includeFiles`, `includeDirectories`, `limit`, and `requestId`, and returns `directory_suggestions_response` with `directories`, `entries`, `error`, and `requestId`.
- Directory suggestion handling: ensure upstream `packages/server/src/server/session.ts` routes `directory_suggestions_request` to `searchHomeDirectories(...)` when `cwd` is absent and `searchWorkspaceEntries(...)` when `cwd` is provided.
- Directory suggestion implementation: ensure upstream `packages/server/src/utils/directory-suggestions.ts` supports home-tree search, rooted path search (`~`, `~/`, `./`, absolute paths under home), ranking by exact/prefix/partial segment match, hidden-directory skipping, symlink resolution inside the root, and the `includeDirectories`/`includeFiles` filters.
- Directory-only listing semantics: when `directoriesOnly` is true without recursive search, regular directory listings should filter out files before returning entries.
- Patch coverage: keep or port focused tests in `packages/server/src/utils/directory-suggestions.test.ts` for home directory search and `packages/server/src/server/file-explorer/service.test.ts` for regular `directoriesOnly` listing.

After porting these patches into a new upstream version, rebuild the daemon package and restart the local daemon so Flutter uses the new `dist` output:

- `cd paseo-<version> && npx vitest run packages/server/src/utils/directory-suggestions.test.ts packages/server/src/server/file-explorer/service.test.ts --bail=1`
- `cd paseo-<version> && npm run typecheck --workspace=@getpaseo/server`
- `cd paseo-<version> && npm run build --workspace=@getpaseo/server`
- Restart the daemon process that listens on `6767`, then confirm `directory_suggestions_request` appears in the daemon log when searching from Flutter.

## Keep The Skill Current

Maintain this skill as living project context. During normal development, update `AGENTS.md`, this `SKILL.md`, and `references/project-context.md` when code changes or investigation reveals durable facts that future AI agents need.

Update the docs when ownership boundaries, module locations, relay protocol behavior, QR pairing flow, endpoint configuration, validation commands, deployment steps, or security/business constraints change. Keep edits concise and factual. Do not turn guesses, roadmap ideas, or one-off debugging notes into standing rules.

Because generic AI IDEs may discover `skills/paseo-self-hosted`, Claude Code uses `.claude/skills/paseo-self-hosted`, OpenCode uses `.opencode/skills/paseo-self-hosted`, and Trae has compatibility entries under `.trae/`, keep those entries consistent when the shared project boundary changes.

## Protocol Work

When touching relay behavior:

1. Inspect `relay-service/src/relay/*`.
2. Compare with `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/packages/relay/src/*`.
3. Check upstream daemon/client expectations before changing query params, roles, versions, encryption, buffering, sticky ownership, close semantics, or reconnect behavior.
4. Add or update narrow tests in `relay-service/src/relay/*.test.ts`.
5. Prefer compatibility adapters and optional behavior over protocol forks.

## Upstream Paseo Agent Skills

The upstream project includes skills under `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/skills/`. Treat them as optional references for using Paseo's own agent orchestration features, not as product architecture rules for this self-hosted app.

Use them when a task explicitly involves Paseo CLI agent management, chat rooms, handoff, looped verification, committees, or orchestrated implementation through the local Paseo daemon. Do not apply those workflows automatically to normal Flutter, NestJS, or admin UI edits.

## Cross-Stack Feature Order

For auth, admin, payment, quota, plans, or user features:

1. Define backend entity/service/controller behavior in `relay-service/`.
2. Keep API response shapes typed and stable.
3. Update optional operator-facing surfaces only when they still exist on the active branch.
4. Update `flutterpaseo/lib/**` when app users need the feature.
5. Validate each touched surface with the narrowest command available.

## Android 版本发布流程

发布 Android 新版本需要三步：更新版本号 → 构建 APK → 上传七牛云 → 创建后端版本记录。

### 1. 更新版本号

编辑 `flutterpaseo/pubspec.yaml` 中的 `version` 字段，格式为 `versionName+versionCode`。例如从 `0.4.0+5` 更新到 `0.4.1+6`。

### 2. 构建 APK

```bash
cd flutterpaseo && flutter build apk --release
```

产物位于 `flutterpaseo/build/app/outputs/flutter-apk/app-release.apk`。

### 3. 创建后端版本记录

当前开源分支不再自带发布上传脚本。构建产物上传到你自己的对象存储、CDN 或安装包分发渠道后，再调用 relay-service 的版本记录 API。Flutter 客户端通过 `GET /app-version/check?platform=android&versionCode=N` 检测更新并下载 APK。

```powershell
# 1. 获取 admin JWT
$login = Invoke-RestMethod -Uri 'https://your-relay.example.com/auth/admin/login' -Method Post -ContentType 'application/json' -Body '{"username":"<admin-user>","password":"<admin-password>"}'
$token = $login.accessToken

# 2. 创建版本记录
$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
$body = '{"platform":"android","versionCode":6,"versionName":"0.4.1","downloadUrl":"https://cdn.example.com/paseo-open-source/android-0.4.1.apk","fileSize":80248647,"md5":"<md5>","releaseNotes":"","forceUpdate":false,"published":true}'
Invoke-RestMethod -Uri 'https://your-relay.example.com/admin/app-versions' -Method Post -Headers $headers -Body $body
```

关键参数：
- `versionCode`: 必须大于当前线上版本，客户端以此为升级判断依据
- `forceUpdate`: 设为 `true` 时客户端无法跳过更新弹窗
- `published`: 设为 `true` 后客户端才能检测到此版本
- `downloadUrl`: 你自己的 CDN 下载链接，例如 `https://cdn.example.com/paseo-open-source/android-<versionName>.apk`

### 同步更新 AGENTS.md

发布新版本后，检查 `AGENTS.md` 中是否有需要同步更新的版本相关描述。

## Validation

Use targeted checks:

- `cd relay-service && npm run typecheck`
- `cd relay-service && npm run test`
- `cd relay-service && npm run build`
- `cd flutterpaseo && flutter analyze`
- `cd flutterpaseo && flutter test`
- `cd electronDesktop && npm run check`
- `cd electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64 && npx vitest run <specific-test-file> --bail=1`

Run broad upstream suites only when explicitly requested.
