import { randomUUID } from "node:crypto";
import { URL } from "node:url";
import type { IncomingMessage } from "node:http";

import type { ControlMessage, RelayFrame, RelayProtocolVersion, RelayRole } from "./relay.types";

const LEGACY_RELAY_PROTOCOL_VERSION: RelayProtocolVersion = "1";
const CURRENT_RELAY_PROTOCOL_VERSION: RelayProtocolVersion = "2";

export type RelayUpgradeParams = {
  serverId: string;
  role: RelayRole;
  version: RelayProtocolVersion;
  connectionId: string | null;
  hostname: string | null;
};

export function normalizeRelayVersion(rawValue: string | null): RelayProtocolVersion | null {
  if (rawValue == null) return LEGACY_RELAY_PROTOCOL_VERSION;
  const value = rawValue.trim();
  if (!value) return LEGACY_RELAY_PROTOCOL_VERSION;
  if (value === LEGACY_RELAY_PROTOCOL_VERSION || value === CURRENT_RELAY_PROTOCOL_VERSION) {
    return value;
  }
  return null;
}

export function parseRelayUpgradeRequest(request: IncomingMessage): RelayUpgradeParams {
  const host = request.headers.host ?? "localhost";
  const requestUrl = request.url ?? "/";
  const url = new URL(requestUrl, `http://${host}`);

  if (url.pathname !== "/ws") {
    throw new Error("Invalid websocket path");
  }

  const role = url.searchParams.get("role");
  if (role !== "server" && role !== "client") {
    throw new Error("Missing or invalid role parameter");
  }

  const serverId = url.searchParams.get("serverId")?.trim();
  if (!serverId) {
    throw new Error("Missing serverId parameter");
  }

  const version = normalizeRelayVersion(url.searchParams.get("v"));
  if (!version) {
    throw new Error("Invalid v parameter (expected 1 or 2)");
  }

  const connectionId = url.searchParams.get("connectionId")?.trim() || null;
  const hostname = url.searchParams.get("hostname")?.trim() || null;
  return {
    role,
    serverId,
    version,
    connectionId,
    hostname,
  };
}

export function createRelayConnectionId(): string {
  return `conn_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function normalizeFrameForSend(frame: RelayFrame): string | Buffer {
  if (typeof frame === "string") {
    return frame;
  }
  if (Buffer.isBuffer(frame)) {
    return frame;
  }
  if (frame instanceof Uint8Array) {
    return Buffer.from(frame);
  }
  return Buffer.from(frame);
}

export function normalizeIncomingFrame(data: Buffer, isBinary: boolean): RelayFrame {
  return isBinary ? Buffer.from(data) : data.toString("utf8");
}

export function parseControlMessage(frame: RelayFrame): ControlMessage | null {
  const text =
    typeof frame === "string"
      ? frame
      : Buffer.isBuffer(frame)
        ? frame.toString("utf8")
        : frame instanceof Uint8Array
          ? Buffer.from(frame).toString("utf8")
          : Buffer.from(frame).toString("utf8");

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed.type === "ping") {
      return { type: "ping", ts: typeof parsed.ts === "number" ? parsed.ts : undefined };
    }
    if (parsed.type === "pong") {
      return { type: "pong", ts: typeof parsed.ts === "number" ? parsed.ts : undefined };
    }
    if (parsed.type === "connected" && typeof parsed.connectionId === "string") {
      return { type: "connected", connectionId: parsed.connectionId };
    }
    if (parsed.type === "disconnected" && typeof parsed.connectionId === "string") {
      return { type: "disconnected", connectionId: parsed.connectionId };
    }
    if (parsed.type === "sync" && Array.isArray(parsed.connectionIds)) {
      return {
        type: "sync",
        connectionIds: parsed.connectionIds.filter(
          (connectionId): connectionId is string =>
            typeof connectionId === "string" && connectionId.trim().length > 0,
        ),
      };
    }
  } catch {
    return null;
  }

  return null;
}
