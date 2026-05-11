"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRelayVersion = normalizeRelayVersion;
exports.parseRelayUpgradeRequest = parseRelayUpgradeRequest;
exports.createRelayConnectionId = createRelayConnectionId;
exports.normalizeFrameForSend = normalizeFrameForSend;
exports.normalizeIncomingFrame = normalizeIncomingFrame;
exports.parseControlMessage = parseControlMessage;
const node_crypto_1 = require("node:crypto");
const node_url_1 = require("node:url");
const LEGACY_RELAY_PROTOCOL_VERSION = "1";
const CURRENT_RELAY_PROTOCOL_VERSION = "2";
function normalizeRelayVersion(rawValue) {
    if (rawValue == null)
        return LEGACY_RELAY_PROTOCOL_VERSION;
    const value = rawValue.trim();
    if (!value)
        return LEGACY_RELAY_PROTOCOL_VERSION;
    if (value === LEGACY_RELAY_PROTOCOL_VERSION || value === CURRENT_RELAY_PROTOCOL_VERSION) {
        return value;
    }
    return null;
}
function parseRelayUpgradeRequest(request) {
    const host = request.headers.host ?? "localhost";
    const requestUrl = request.url ?? "/";
    const url = new node_url_1.URL(requestUrl, `http://${host}`);
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
    return {
        role,
        serverId,
        version,
        connectionId,
    };
}
function createRelayConnectionId() {
    return `conn_${(0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 16)}`;
}
function normalizeFrameForSend(frame) {
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
function normalizeIncomingFrame(data, isBinary) {
    return isBinary ? Buffer.from(data) : data.toString("utf8");
}
function parseControlMessage(frame) {
    const text = typeof frame === "string"
        ? frame
        : Buffer.isBuffer(frame)
            ? frame.toString("utf8")
            : frame instanceof Uint8Array
                ? Buffer.from(frame).toString("utf8")
                : Buffer.from(frame).toString("utf8");
    try {
        const parsed = JSON.parse(text);
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
                connectionIds: parsed.connectionIds.filter((connectionId) => typeof connectionId === "string" && connectionId.trim().length > 0),
            };
        }
    }
    catch {
        return null;
    }
    return null;
}
//# sourceMappingURL=relay.protocol.js.map