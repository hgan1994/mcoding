# Claude Code Project Context

Read [AGENTS.md](AGENTS.md) first. It is the canonical AI onboarding guide for this self-hosted Paseo workspace.

Project skill:

- `skills/paseo-self-hosted/` is the generic AI IDE skill entry.
- `.claude/skills/paseo-self-hosted/` links to the shared skill at `.codex/skills/paseo-self-hosted/`.
- Use that skill for work on `flutterpaseo`, `electronDesktop`, `relay-service`, upstream `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64` compatibility, QR pairing, relay endpoint customization, auth/admin/payment features, or cross-stack changes.

Important boundary:

- Default product work belongs in `relay-service/` and `flutterpaseo/`, with desktop daemon UX in `electronDesktop/`.
- Treat `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/` as an intentionally trimmed upstream daemon subset unless the task explicitly asks for daemon/desktop compatibility patches.
- Local daemon/Electron pairing on the current open-source branch should use the relay-service address supplied by the user or deployment environment; `relay-service` itself defaults to the current LAN IPv4 on port `8787`, but Electron Desktop should not auto-detect the endpoint. Do not assume a built-in production relay endpoint.
- `electronDesktop` is the standalone Electron desktop surface for bound app-owned daemon startup/shutdown, status, pairing QR, logs, upstream `paseo provider ls --json` availability display, and local Claude Code/Codex CLI/OpenCode npm install/upgrade management; it resolves the upstream checkout from `PASEO_UPSTREAM_ROOT` or the local `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64`.
- Preserve Paseo relay wire compatibility and E2E encryption assumptions unless the user explicitly approves a protocol/security model change.
- When an AI agent creates a new non-generated source, config, migration, test, or documentation file, add it to git with `git add <path>` before finishing. Do not add compiled outputs, generated build artifacts, dependency folders, IDE files, secrets, or other ignored/generated files.

Living docs:

- When code changes make project instructions stale, update `AGENTS.md` and the shared skill at `.codex/skills/paseo-self-hosted/` in the same pass.
- Keep updates factual, concise, and grounded in the current codebase.

Upstream Paseo skills:

- If the task involves Paseo CLI/daemon agent management, chat rooms, handoff, loops, committees, or orchestration, consult `.codex/skills/paseo-self-hosted/references/upstream-paseo-skills.md` and then the relevant file under `electronDesktop/upstream/paseo-0.1.64/paseo-0.1.64/skills/`.
