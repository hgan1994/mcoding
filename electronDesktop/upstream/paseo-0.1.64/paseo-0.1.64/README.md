## Paseo daemon upstream subset

This checkout is intentionally trimmed for the self-hosted open-source branch.

It keeps only the upstream packages that our desktop-managed daemon flow still
depends on:

- `packages/server`: daemon runtime and WebSocket API
- `packages/cli`: local `paseo` CLI used by the desktop wrapper
- `packages/relay`: relay transport and E2EE helpers imported by the daemon
- `packages/highlight`: terminal/code highlighting helpers imported by the daemon

The upstream Expo app, upstream Electron app, website, and other non-daemon
surfaces are removed here on purpose. Product-facing app work lives in this
repository's own `flutterpaseo/`, `electronDesktop/`, and `relay-service/`.

## Getting Started

Paseo runs a local server called the daemon that manages your coding agents.
In this workspace, the daemon is consumed by our self-hosted desktop wrapper and
mobile app compatibility layer rather than the upstream clients.

### Prerequisites

You need at least one agent CLI installed and configured with your credentials:

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Codex](https://github.com/openai/codex)
- [OpenCode](https://github.com/anomalyco/opencode)

### CLI / headless

Install the CLI and start Paseo:

```bash
npm install -g @getpaseo/cli
paseo
```

This shows a QR code in the terminal. This path is useful for servers and
remote machines.

## CLI

Everything you can do in the app, you can do from the terminal.

```bash
paseo run --provider claude/opus-4.6 "implement user authentication"
paseo run --provider codex/gpt-5.4 --worktree feature-x "implement feature X"

paseo ls                           # list running agents
paseo attach abc123                # stream live output
paseo send abc123 "also add tests" # follow-up task

# run on a remote daemon
paseo --host workstation.local:6767 run "run the full test suite"
```

## Development

Quick monorepo package map:

- `packages/server`: Paseo daemon (agent process orchestration, WebSocket API, MCP server)
- `packages/cli`: `paseo` CLI for daemon and agent workflows
- `packages/relay`: relay transport and end-to-end encryption helpers required by the daemon
- `packages/highlight`: syntax highlighting helpers required by the daemon

Common commands:

```bash
# run the local daemon in dev mode
npm run dev

# run individual daemon-related workspaces
npm run dev:server

# build the daemon
npm run build:daemon

# repo-wide checks
npm run typecheck
```

## License

AGPL-3.0
