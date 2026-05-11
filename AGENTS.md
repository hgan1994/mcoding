# Self-Hosted Paseo Agent Guide

This workspace is for building a self-hosted remote AI programming service based on the open-source Paseo project.

The target product is not a plain fork of Paseo. On the current open-source branch it combines:

- A Flutter mobile app for scanning pairing QR codes and controlling remote AI coding sessions.
- A self-hosted NestJS relay/backend focused on relay transport and minimal compatibility surfaces.
- The upstream Paseo source as a protocol and daemon/desktop reference.

## Repository Map

- `flutterpaseo/`: Flutter client app. It should own mobile UX, QR scanning, app-side auth, and conversation/control flows.
- `electronDesktop/`: Self-hosted Electron desktop app. It owns the Electron-first bound daemon flow where the desktop app starts the upstream daemon with self-hosted relay env vars, shows daemon status/pairing/logs, manages local Claude Code/Codex CLI/OpenCode installation and upgrades, and stops the local daemon when the app quits.
- `relay-service/`: NestJS backend. It should own the self-hosted relay implementation, auth, user/business APIs, persistence, admin APIs, and deployment config.
- `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/`: Trimmed upstream Paseo 0.1.64 daemon reference. This checkout intentionally keeps only the upstream daemon-relevant workspaces (`packages/server`, `packages/cli`, `packages/relay`, and `packages/highlight`) plus supporting docs/scripts needed for compatibility work.
- `packages/`: Generated or copied build artifacts in this workspace unless proven otherwise. Do not treat it as the main editable source.

## Product Flow

The intended development and runtime flow is:

1. Run the upstream Paseo daemon, upstream Electron desktop, or `electronDesktop` locally.
2. Enter or inject the desired `relay-service` address for the current deployment.
3. Generate a pairing QR/link from the daemon or desktop.
4. Scan the QR/link with `flutterpaseo`.
5. Route remote programming traffic through the self-hosted relay while preserving Paseo protocol compatibility.
6. Layer custom business features, such as login, registration, payment, user status, admin operations, and service plans, around that relay core.

## Source Of Truth

- Relay protocol behavior: start with `relay-service/src/relay/*`, then compare with `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/packages/relay/src/*` and relevant upstream daemon code.
- Backend business behavior on non-open-source branches lives under `relay-service/src/auth/*`, `relay-service/src/admin/*`, and `relay-service/src/feedback/*`; the current open-source branch boots only relay-owned code paths.
- Mobile app behavior: `flutterpaseo/lib/**`.
- Desktop daemon console behavior: `electronDesktop/**`.
- Upstream reference docs: `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/CLAUDE.md`, `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/docs/ARCHITECTURE.md`, `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/docs/DEVELOPMENT.md`, `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/docs/TESTING.md`, and `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/SECURITY.md`.
- Upstream agent orchestration skills: `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/skills/*/SKILL.md`. Use them only when working with Paseo CLI/daemon agent management, chat, handoff, loops, committees, or orchestration.

## Development Boundaries

- Prefer implementing self-hosted product behavior in `relay-service`, `flutterpaseo`, and `electronDesktop`.
- Use `electronDesktop` for the Electron-first desktop product surface where the app and daemon lifecycle should feel like one local desktop program.
- Treat `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/` as upstream reference by default. Change it only when the task explicitly needs daemon/desktop compatibility work, relay endpoint customization, or a local patch required to generate QR pairing against `relay-service`.
- The current open-source branch strips commercial runtime surfaces out of the default flow: `relay-service` boots only relay plus health and defaults `HOST` to the current LAN IPv4 with port `8787`, `flutterpaseo` runs without login/register/subscription gates and keeps paired hosts locally, and `electronDesktop` requires the user to enter a relay-service address before it starts the daemon or shows a pairing QR.
- Keep Paseo relay wire compatibility unless the user explicitly approves a protocol fork.
- Never make breaking WebSocket, pairing, encryption, or message schema changes casually. Add optional fields, keep old fields accepted, and preserve old client/new relay compatibility.
- Do not replace Paseo end-to-end encryption or trust assumptions with server-readable message handling unless the user explicitly changes the security model.
- Keep business features outside the relay data plane when possible. Auth, billing, quota, and admin policy should wrap access and operations without corrupting protocol frames.
- Do not edit generated outputs such as `dist/`, copied `packages/*/dist`, `node_modules/`, IDE files, or build artifacts unless the task is specifically about those files.
- Do not commit secrets. Treat `.env`, deploy env files, JWT secrets, SMS keys, payment keys, and relay endpoints as sensitive.

## Flutter Project Directory Picker

- `flutterpaseo` opens the project directory picker at `/Users` when the connected daemon reports macOS (`platform: "darwin"`), and falls back to disk root `/` for older daemons or other platforms.
- Folder search is not local filtering or recursive file explorer listing: Flutter sends upstream `directory_suggestions_request` with `includeDirectories: true`, `includeFiles: false`, and `limit: 30`, then merges daemon results with existing project-root recommendations using the React Native `buildWorkingDirectorySuggestions` ordering semantics.
- Opening a newly selected directory must preserve the exact selected directory after git-root normalization. Do not let existing parent workspaces win by prefix matching during `open_project_request`; prefix matching is only for mapping existing agent/subdirectory activity back to registered workspaces.
- After a directory is added or an existing project is tapped, Flutter routes to a workspace chat page (`/h/:serverId/new-chat`) where the user selects provider/model and sends the first prompt; the agent is created only on first send, and the same page continues as the live chat after creation.
- New App conversations default to the provider's bypass-like mode when available: Claude `bypassPermissions`, Codex/OpenCode/Cursor `full-access`, or ACP autopilot. Fall back to the daemon/provider default only when no bypass-like mode is exposed.
- `/h/:serverId/new-chat` is a shared chat surface. Switching projects from the left workspace drawer updates that same page state instead of keying the route by project and recreating a separate chat page instance.
- When replacing the upstream `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/` checkout with a newer version, reapply the upstream directory suggestion compatibility patches documented in `.codex/skills/paseo-self-hosted/SKILL.md` before validating Flutter directory search.

## Upstream Agent Turn Compatibility

- Some upstream providers can emit foreground turn events without `turnId`. Keep the local `AgentManager` fallback that attaches the active foreground turn ID before dispatching session events; otherwise the first AI reply can render while the manager still thinks the run is active, and follow-up messages will not start normally.
- When replacing the upstream `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/` checkout with a newer version, reapply the foreground turn ID fallback documented in `.codex/skills/paseo-self-hosted/SKILL.md` and keep the regression coverage in `packages/server/src/server/agent/agent-manager.test.ts`.

## Living Project Context

AI agents are allowed and expected to update this file and the project skill when durable project facts change.

Update [AGENTS.md](AGENTS.md), `.codex/skills/paseo-self-hosted/SKILL.md`, and related compatibility entries such as `CLAUDE.md`, `.opencode/skills/paseo-self-hosted`, or `.trae/rules/project_rules.md` when:

- A directory, module, package, or ownership boundary changes.
- A new important workflow, validation command, or local setup step is discovered.
- Relay protocol, QR pairing, endpoint customization, auth, payment, admin, or deployment behavior changes.
- The current instructions would cause future AI agents to edit the wrong surface, run the wrong command, or miss an important compatibility/security constraint.

Keep these documentation changes small, factual, and tied to code reality. Do not add speculative plans as rules. If the code and docs disagree, inspect the code, update the docs, and mention the documentation update in the final response.

## Stack Notes

- `relay-service` on the current open-source branch is TypeScript + NestJS with in-memory relay session/connection tracking. It no longer mounts auth/admin/subscription/feedback/notification/public-site modules at runtime, no longer depends on MySQL/Redis, and no longer enforces free-vs-member device quotas inside relay websocket admission; only relay stats, websocket relay traffic, and `/health` remain active, and the `relay-admin/` app is removed from this branch.
- App version publishing uses platform-specific records. Android keeps `platform: "android"`; Electron desktop updates must be published separately as `electron-mac`, `electron-win`, or `electron-linux`, and the Electron app reports the matching platform from `process.platform`.
- `flutterpaseo` is Flutter/Dart with Riverpod, GoRouter, WebSocket, HTTP, `mobile_scanner`, local storage, and `in_app_purchase` for App Store subscriptions. The subscription screen on iOS/macOS should use StoreKit product queries as the display source of truth for sellable plans, while the backend still owns receipt verification and membership state. The app accepts both upstream relay v2 pairing offers and the self-hosted LAN v3 offers that prefer direct TCP while optionally keeping relay metadata for sync/fallback.
- On the current open-source branch, `flutterpaseo` no longer routes through login/register/subscription screens by default; QR pairing and pasted offers save `HostProfile` entries into local storage even when no backend auth API exists.
- On the current open-source branch, `flutterpaseo` should not assume a built-in production HTTP API base URL, privacy-policy URL, or terms URL. Use local app settings or environment configuration for deployment-specific values.
- On the current open-source branch, `flutterpaseo` does not ship WeChat login or associated-domain defaults. Keep native bundle ids, app display names, and launch branding generic (`Paseo` / `dev.paseo.opensource`) unless the deployment explicitly forks them.
- `flutterpaseo` actively probes idle daemon WebSocket sessions and triggers reconnect when a socket stays silent, and the app re-checks host connections when returning to foreground so long-idle screens recover instead of staying fake-online.
- `flutterpaseo` hold-to-talk input is app-side Qwen ASR dictation that submits recognized text as a normal chat message. Do not toggle daemon `set_voice_mode` from this dictation UI; daemon voice mode reloads the agent session and is reserved for daemon-managed audio streaming/TTS flows. On the current open-source branch, the App Settings entry and local persistence for DashScope/Qwen ASR credentials are removed, and legacy locally stored voice secrets should be cleared instead of reused or reintroduced.
- `electronDesktop` is an Electron/Node desktop surface. It resolves the upstream checkout from `PASEO_UPSTREAM_ROOT` or `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64`, starts the upstream daemon supervisor with `PASEO_DESKTOP_MANAGED=1`, injects derived `PASEO_APP_BASE_URL`, `PASEO_RELAY_ENDPOINT`, `PASEO_RELAY_PUBLIC_ENDPOINT`, and `PASEO_LISTEN=0.0.0.0:6767`, uses upstream CLI commands for status, pairing, stop, restart, and logs, treats the daemon lifecycle as bound to the Electron app, reads local provider availability from `paseo provider ls --json` when the daemon API is reachable, derives the connected-device badge from the relay stats HTTP endpoint with a daemon log fallback when that endpoint is unavailable, and manages Claude Code/Codex CLI/OpenCode via `npm install -g <package>@latest` after checking/installing Node.js/npm.
- On the current open-source branch, `electronDesktop` does not assume or auto-detect a relay endpoint. The user must enter a relay-service address in the desktop UI first; that value is persisted locally, then used to derive both `PASEO_RELAY_ENDPOINT`/`PASEO_RELAY_PUBLIC_ENDPOINT` and the HTTP base used for relay stats before daemon start and QR generation.
- On the current open-source branch, `electronDesktop` also leaves project website, public app download URL, and desktop update feed unset unless the deployment provides `PASEO_PROJECT_URL`, `PASEO_PUBLIC_APP_URL`, or `PASEO_APP_UPDATE_URL`.
- On the current open-source branch, `electronDesktop` no longer includes built-in publishing/upload helpers. Build artifacts with `npm run build:mac:dmg` or `npm run build:win:exe`, then ship them through your own release pipeline.
- `electronDesktop` macOS packaging reuses the locally installed Electron runtime from `electronDesktop/node_modules/electron/dist` via `electron-builder --config.electronDist=...`, avoiding redundant GitHub Electron zip downloads during DMG builds.
- `electronDesktop` component actions hide Upgrade when an installed npm-managed CLI matches the current npm latest version; if automated install fails, the action should become an official provider install link.
- In `electronDesktop`, Claude should be treated as ready when Paseo's bundled `@anthropic-ai/claude-agent-sdk` is present even if no global `claude` binary is on `PATH`; the global Claude Code CLI remains an optional install action.
- Upstream `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64` is intentionally trimmed on this branch to a daemon-focused npm workspace subset: `packages/server`, `packages/cli`, `packages/relay`, and `packages/highlight`. Upstream Expo app, upstream desktop, website, and other non-daemon workspaces are removed from the vendored checkout.

## Validation Commands

Run the narrowest validation that matches your change.

- Backend service:
  - `cd relay-service && npm run typecheck`
  - `cd relay-service && npm run test`
  - `cd relay-service && npm run build`
- Flutter app:
  - `cd flutterpaseo && flutter analyze`
  - `cd flutterpaseo && flutter test`
- Electron desktop:
  - `cd electronDesktop && npm run check`
  - `cd electronDesktop && npm run start`
- Upstream Paseo reference:
  - `cd electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64 && npm run typecheck --workspace=<workspace>`
  - `cd electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64 && npx vitest run <specific-test-file> --bail=1`

Avoid broad upstream test suites unless explicitly requested; upstream Paseo notes warn that full suites are heavy.

## Working Style For AI Agents

- Start by identifying which surface owns the requested behavior: app, admin, backend, or upstream compatibility.
- Read existing code before designing new abstractions.
- For relay changes, inspect tests and protocol parsing before editing.
- For cross-stack features, update contracts from backend outward: entity/service/controller, API client, UI/app state, then tests.
- When creating a new non-generated source, config, migration, test, or documentation file, add it to git with `git add <path>` before finishing. Do not add compiled outputs, generated build artifacts, dependency folders, IDE files, secrets, or other ignored/generated files.
- Preserve local user changes. The worktree may contain untracked IDE files, dependencies, copied packages, or generated artifacts.
- When uncertain whether a behavior belongs in self-hosted product code or upstream reference code, keep the product code in the self-hosted surfaces and use upstream only as a compatibility oracle.

## Tool Compatibility Entrypoints

- Generic AI IDEs: `skills/paseo-self-hosted/`
- Codex: `.codex/skills/paseo-self-hosted/`
- Claude Code: `CLAUDE.md` and `.claude/skills/paseo-self-hosted/`
- OpenCode: `.opencode/skills/paseo-self-hosted/`
- Trae: `.trae/rules/project_rules.md`, `.trae/project_rules.md`, and `.trae/skills/paseo-self-hosted/`

The tool-specific and generic skill directories should point at the shared canonical skill in `.codex/skills/paseo-self-hosted/`.

For Paseo-managed agent coordination, consult `.codex/skills/paseo-self-hosted/references/upstream-paseo-skills.md` before opening the matching upstream skill.
