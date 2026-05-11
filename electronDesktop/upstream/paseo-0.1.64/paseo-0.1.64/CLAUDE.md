# CLAUDE.md

This vendored upstream checkout is a daemon-focused subset of Paseo used by the
self-hosted open-source branch. It keeps the upstream daemon, CLI, relay
transport helpers, and syntax highlighting package.

## Repository map

This is an npm workspace monorepo:

- `packages/server` — Daemon: agent lifecycle, WebSocket API, MCP server
- `packages/cli` — Docker-style CLI (`paseo run/ls/logs/wait`)
- `packages/relay` — E2E relay transport and crypto used by the daemon
- `packages/highlight` — Syntax highlighting utilities used by the daemon

## Documentation

| Doc                                                  | What's in it                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | System design, package layering, WebSocket protocol, agent lifecycle, data flow   |
| [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) | Type hygiene, error handling, file organization                                     |
| [docs/TESTING.md](docs/TESTING.md)                   | TDD workflow, determinism, real dependencies over mocks, test organization        |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)           | Dev server, build sync gotchas, CLI reference, agent state, Playwright MCP        |
| [docs/RELEASE.md](docs/RELEASE.md)                   | Release playbook, draft releases, completion checklist                            |
| [docs/CUSTOM-PROVIDERS.md](docs/CUSTOM-PROVIDERS.md) | Custom provider config: Z.AI, Alibaba/Qwen, ACP agents, profiles, custom binaries |
| [SECURITY.md](SECURITY.md)                           | Relay threat model, E2E encryption, DNS rebinding, agent auth                     |

## Quick start

```bash
npm run dev                          # Start the daemon dev loop
npm run cli -- ls -a -g              # List all agents
npm run cli -- daemon status         # Check daemon status
npm run typecheck                    # Always run after changes
npm run lint                         # Always run after changes
npm run format                       # Auto-format with Biome
npm run format:check                 # Check formatting without writing
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for full setup, build sync requirements, and debugging.

## Critical rules

- **NEVER restart the main Paseo daemon on port 6767 without permission** — it manages all running agents. If you're an agent, restarting it kills your own process.
- **NEVER assume a timeout means the service needs restarting** — timeouts can be transient.
- **NEVER add auth checks to tests** — agent providers handle their own auth.
- **NEVER run the full test suite locally.** The test suites are heavy and will freeze the machine, especially if multiple agents run them in parallel. Rules:
  - Run only the specific test file you changed: `npx vitest run <file> --bail=1`
  - Never run `npm run test` for an entire workspace unless explicitly asked.
  - If you must run a broad suite, pipe output to a file and read it afterward: `npx vitest run <file> --bail=1 > /tmp/test-output.txt 2>&1` then read the file.
  - Never re-run a test suite that another agent already ran and reported green — trust the result.
  - For full suite verification, push to CI and check GitHub Actions instead.
- **Always run typecheck and lint after every change.**
- **Run `npm run format` before committing.** This repo uses Biome for formatting. Do not manually fix formatting — let the formatter handle it.
- **Always use npm scripts for linting and formatting.** Do not run tools directly with `npx eslint`, `npx oxfmt`, `npx oxlint`, or package-local binaries. For targeted checks, pass file paths through the npm script:
  - `npm run lint -- packages/server/src/server/index.ts`
  - `npm run format:files -- CLAUDE.md packages/server/src/server/index.ts`
- **NEVER make breaking changes to WebSocket or message schemas.** The primary compatibility path is old mobile app clients talking to newly updated daemons. Users update desktop and daemon first, then keep running the old app for a while. Every schema change MUST be backward-compatible for old clients against new daemons:
  - New fields: always `.optional()` with a sensible default or `.transform()` fallback.
  - Never change a field from optional to required.
  - Never remove a field — deprecate it (keep accepting it, stop sending it).
  - Never narrow a field's type (e.g. `string` → `enum`, `nullable` → non-null).
  - Test with: "does a 6-month-old client still parse this?" and "does a 6-month-old daemon still send something this client accepts?"

## Debugging

Find the complete daemon logs and traces in the $PASEO_HOME/daemon.log
