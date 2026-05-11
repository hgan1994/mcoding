# Project Rules: Self-Hosted Paseo

Read `AGENTS.md` first. It is the canonical onboarding guide for this workspace.

This project builds a private remote AI programming service inspired by open-source Paseo:

- `flutterpaseo/`: Flutter app for mobile UX, QR scanning, auth state, and remote AI coding session control.
- `electronDesktop/`: Electron desktop app for the Electron-first bound flow where the desktop app starts/stops the upstream daemon together with the app, shows status/pairing/logs, injects self-hosted relay env vars, reads provider availability through upstream `paseo provider ls --json` when the daemon API is reachable, and manages local Claude Code/Codex CLI/OpenCode npm installs.
- `relay-service/`: NestJS backend for the self-hosted relay, auth, admin APIs, persistence, deployment, and business features such as payment/plans.
- `relay-admin/`: Vue/Vite admin console for operators.
- `paseo-0.1.64/paseo-0.1.64/`: upstream Paseo 0.1.64 reference for daemon, desktop, CLI, relay protocol, docs, and compatibility checks.

Current desktop relay endpoint for daemon/Electron pairing is `mcoding.huatongai.cn`, reverse-proxied to relay-service port 8787.

Development boundaries:

- Prefer implementing product behavior in `relay-service`, `flutterpaseo`, and `relay-admin`.
- Use `electronDesktop` for the desktop control surface.
- Treat `paseo-0.1.64/paseo-0.1.64/` as reference by default. Change it only for explicit daemon/desktop pairing, endpoint customization, or compatibility experiments.
- Preserve Paseo relay wire compatibility unless the user explicitly approves a protocol fork.
- Keep business logic outside encrypted relay frame contents. Enforce auth, quota, payment, and admin policy at connection/session boundaries.
- Do not edit generated outputs such as `dist/`, copied `packages/*/dist`, `node_modules/`, IDE files, or build artifacts unless the task is specifically about those files.
- Do not expose or commit secrets from env/deploy files.
- When an AI agent creates a new non-generated source, config, migration, test, or documentation file, add it to git with `git add <path>` before finishing. Do not add compiled outputs, generated build artifacts, dependency folders, IDE files, secrets, or other ignored/generated files.

Flutter project directory picker:

- `flutterpaseo` starts project directory selection at `/Users` when the connected daemon reports macOS (`platform: "darwin"`), and falls back to disk root `/` otherwise.
- Folder search uses upstream `directory_suggestions_request` with directory-only results and React Native `buildWorkingDirectorySuggestions` ordering semantics; empty-search browsing still uses `file_explorer_request` with `directoriesOnly: true`.
- `open_project_request` must preserve the exact selected directory after git-root normalization and should not reuse a parent workspace by prefix match.
- When replacing `paseo-0.1.64/paseo-0.1.64/` with a newer upstream version, reapply the upstream compatibility patches documented in `.codex/skills/paseo-self-hosted/SKILL.md`, including directory suggestions and foreground turn ID fallback.

Living docs:

- AI agents may update `AGENTS.md`, `.codex/skills/paseo-self-hosted/SKILL.md`, and these Trae rules when durable project facts change.
- Update them after module moves, new workflows, changed validation commands, relay protocol changes, QR pairing changes, endpoint configuration changes, or business/security boundary changes.
- Keep updates concise and based on current code, not speculative plans.

Upstream Paseo skills:

- The upstream project has agent orchestration skills in `paseo-0.1.64/paseo-0.1.64/skills/`.
- Use `.codex/skills/paseo-self-hosted/references/upstream-paseo-skills.md` as the index when a task involves Paseo CLI/daemon agents, chat, handoff, loops, committees, or orchestration.
- Do not apply upstream multi-agent workflows automatically to normal Flutter, NestJS, or admin UI edits.

Skill entrypoints:

- Generic AI IDEs can use `skills/paseo-self-hosted/`.
- Codex, Claude Code, OpenCode, and Trae compatibility entries all point to the shared skill in `.codex/skills/paseo-self-hosted/`.

For protocol work:

1. Inspect `relay-service/src/relay/*`.
2. Compare with `paseo-0.1.64/paseo-0.1.64/packages/relay/src/*`.
3. Check daemon/client expectations before changing query params, roles, versions, encryption, buffering, sticky ownership, close semantics, or reconnect behavior.
4. Add/update narrow tests in `relay-service/src/relay/*.test.ts`.

Validation:

- Backend: `cd relay-service && npm run typecheck`, `npm run test`, or `npm run build`.
- Flutter: `cd flutterpaseo && flutter analyze`, `flutter test`.
- Electron desktop: `cd electronDesktop && npm run check`.
- Upstream Paseo: run only relevant workspace checks or specific vitest files.
