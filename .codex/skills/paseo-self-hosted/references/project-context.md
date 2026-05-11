# Self-Hosted Paseo Project Context

## Goal

Build a private remote AI programming service inspired by open-source Paseo. The local developer runs the Paseo daemon or desktop app, points its relay endpoint to `relay-service`, generates a QR pairing link, and connects from the Flutter app. The current desktop default relay endpoint is the production endpoint `mcoding.huatongai.cn`, with the server reverse proxy routing that domain to relay-service port 8787. The self-hosted relay adds private business features such as login, registration, payment, user management, SMS, and admin operations.

`electronDesktop` is the Electron-first self-hosted desktop surface. It starts the upstream daemon supervisor with self-hosted relay environment variables, displays status/pairing/logs, reads local Claude Code/Codex CLI/OpenCode provider availability from upstream `paseo provider ls --json` when the daemon API is reachable, manages local CLI installs, and treats the local daemon lifecycle as bound to the Electron app: launch together, quit together. Claude/Codex/OpenCode use global npm installs.

Claude availability in `electronDesktop` mirrors upstream Paseo: the bundled `@anthropic-ai/claude-agent-sdk` is sufficient for the Claude provider even without a global `claude` binary.

Relay address changes are documented in the main skill's "Relay Address Changes" section. Keep daemon QR endpoints, Flutter HTTP API base URLs, admin dev proxy targets, and `relay-service` bind settings distinct.

## Surfaces

- `flutterpaseo/`: Flutter app. Owns mobile user experience, QR scanning, remote session/control UI, auth state, app-side API clients, local storage, and parsing both relay v2 and self-hosted LAN v3 pairing offers.
- `electronDesktop/`: Electron desktop app. Owns the Electron-first daemon lifecycle experiment, including app-owned daemon startup/shutdown, pairing display, daemon status, and daemon logs.
- `relay-service/`: NestJS backend. Owns relay compatibility, WebSocket upgrade handling, session/connection registry, MySQL snapshots, Redis sticky ownership, auth, admin APIs, and future business modules such as payment or plans.
- Production `relay-service` deployment reaches MySQL through the server private network address `172.17.0.4:3306`.
- Apple subscription membership currently lives in `relay-service/src/auth/*`: user summary fields are stored on `users`, subscription records are stored in `user_subscriptions`, iOS receipt verification happens at `/auth/subscriptions/apple/verify`, and the app refreshes profile state from `/auth/me`.
- `relay-admin/`: Vue/Vite admin UI. Owns operator workflows. Current checkout includes only partial source files, so verify package/scaffold files before running or extending it.
- `paseo-0.1.64/paseo-0.1.64/`: Upstream reference. Owns the original daemon, desktop, Expo app, CLI, relay package, docs, tests, and assumptions. Treat it as an oracle for compatibility unless the user requests a local fork patch.

## Important Code Areas

- Backend relay: `relay-service/src/relay/`
- Backend auth/business: `relay-service/src/auth/`, `relay-service/src/admin/`
- Backend config: `relay-service/src/config/relay-service-config.ts`
- Backend deploy: `relay-service/deploy/`
- Flutter app: `flutterpaseo/lib/`
- Electron desktop daemon console: `electronDesktop/`
- Admin API client: `relay-admin/src/api/index.ts`
- Admin routes: `relay-admin/src/router/index.ts`
- Upstream relay package: `paseo-0.1.64/paseo-0.1.64/packages/relay/src/`
- Upstream onboarding: `paseo-0.1.64/paseo-0.1.64/CLAUDE.md`
- Upstream architecture/security docs: `paseo-0.1.64/paseo-0.1.64/docs/ARCHITECTURE.md`, `paseo-0.1.64/paseo-0.1.64/SECURITY.md`
- Upstream agent skills: `paseo-0.1.64/paseo-0.1.64/skills/*/SKILL.md`

## Boundary Heuristics

- If it is about how encrypted relay bytes move between daemon and app, start in `relay-service/src/relay` and compare upstream.
- If it is about whether a user may connect, pay, manage devices, or be disabled, start in `relay-service` business modules.
- If it is about what the mobile user sees or scans, start in `flutterpaseo`.
- If it is about launching the local daemon from a desktop app, displaying the local pairing QR, or checking daemon lifecycle, start in `electronDesktop`.
- If it is about what an operator sees, start in `relay-admin`.
- If it is about how the local daemon generates pairing links or which relay host it points at, inspect `paseo-0.1.64/paseo-0.1.64` but prefer config/env overrides over permanent upstream source edits.

## Context Maintenance

Treat `AGENTS.md` and this skill as living context. When code changes make these instructions stale, update them in the same development pass. This is especially important after adding or moving modules, changing API contracts, changing relay protocol behavior, changing validation commands, adding payment/business workflows, or discovering a sharper boundary between upstream Paseo and self-hosted code.

Prefer small factual updates over broad rewrites. Remove or revise stale guidance instead of layering contradictory notes.

When an AI agent creates a new non-generated source, config, migration, test, or documentation file, add it to git with `git add <path>` before finishing. Do not add compiled outputs, generated build artifacts, dependency folders, IDE files, secrets, or other ignored/generated files.

## Upstream Skill References

The upstream Paseo skills are useful when this project uses Paseo itself as the development control plane. They describe CLI agent commands, chat rooms, handoffs, loops, committees, and orchestration. They do not define this product's backend/app/admin ownership boundaries.

If the user asks to coordinate agents through Paseo, hand off work, loop until a condition passes, or orchestrate a larger implementation through the local daemon, consult `references/upstream-paseo-skills.md` and then the matching upstream skill.

## Compatibility Notes

The relay must remain compatible with current Paseo pairing and WebSocket expectations unless the user approves a deliberate protocol fork. Pay special attention to:

- `serverId`, `connectionId`, `role`, and protocol `v` query parameters.
- Control socket versus data socket behavior.
- Client frame buffering before daemon data sockets attach.
- E2E encryption boundaries.
- Sticky routing and ownership when multiple relay instances run.
- Close/reconnect behavior and stale session cleanup.

When upgrading the upstream `paseo-0.1.64/paseo-0.1.64/` checkout to a newer Paseo version, also port the upstream file explorer compatibility patches documented in the main skill's "Upstream Paseo Compatibility Patches" section before validating Flutter project directory search.

## Validation Strategy

Prefer narrow, surface-specific validation:

- Backend relay or API change: `cd relay-service && npm run typecheck && npm run test`.
- Backend runtime/deploy change: also run `cd relay-service && npm run build`.
- Flutter mobile change: `cd flutterpaseo && flutter analyze`; add `flutter test` when tests exist or behavior changed.
- Electron desktop change: `cd electronDesktop && npm run check`; run `npm run start` when manually checking the desktop window and daemon lifecycle.
- Upstream reference change: run only the relevant workspace/typecheck or specific vitest file from `paseo-0.1.64/paseo-0.1.64`.

If a command cannot run because scaffolding is incomplete, missing dependencies, or local services are absent, record that clearly and explain the residual risk.
