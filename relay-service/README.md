# Relay Service

`@getpaseo/relay-service` is a self-hosted NestJS relay that stays wire-compatible
with the current Paseo relay protocol.

This open-source branch is intentionally relay-only and database-free.

## What it provides

- `GET /health`
- `GET /relay/daemon/:serverId/stats`
- `WS /ws?serverId=...&role=...&v=...`
- relay protocol `v1` and `v2`
- daemon control socket notifications
- client/server data socket routing
- buffered client frames until daemon data sockets attach
- in-memory daemon/session stats for the current process

## Run

1. Copy `.env.example` to `.env` if you want to override `HOST`, `PORT`, or `CORS_ORIGINS`.
2. Start the service:

```bash
npm run dev --workspace=@getpaseo/relay-service
```

The service listens on `HOST:PORT` and exposes:

- `GET /health`
- `GET /relay/daemon/:serverId/stats`
- `WS /ws`

## Point Paseo at your relay

Set these in the daemon environment or `~/.paseo/config.json`:

- `PASEO_RELAY_ENDPOINT=your-relay.example.com:443`
- `PASEO_RELAY_PUBLIC_ENDPOINT=your-relay.example.com:443`

Then generate a new pairing link with `paseo daemon pair`.
