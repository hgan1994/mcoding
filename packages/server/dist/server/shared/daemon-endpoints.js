export const CURRENT_RELAY_PROTOCOL_VERSION = "2";
export function normalizeRelayProtocolVersion(value, fallback = CURRENT_RELAY_PROTOCOL_VERSION) {
    if (value == null) {
        return fallback;
    }
    const normalized = typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
    if (!normalized) {
        return fallback;
    }
    if (normalized === "1" || normalized === "2") {
        return normalized;
    }
    throw new Error('Relay version must be "1" or "2"');
}
function parsePort(portStr, context) {
    const port = Number(portStr);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`${context}: port must be between 1 and 65535`);
    }
    return port;
}
export function parseHostPort(input) {
    const trimmed = input.trim();
    if (!trimmed) {
        throw new Error("Host is required");
    }
    // IPv6: [::1]:6767
    if (trimmed.startsWith("[")) {
        const match = trimmed.match(/^\[([^\]]+)\]:(\d{1,5})$/);
        if (!match) {
            throw new Error("Invalid host:port (expected [::1]:6767)");
        }
        const host = match[1].trim();
        if (!host)
            throw new Error("Host is required");
        const port = parsePort(match[2], "Invalid host:port");
        return { host, port, isIpv6: true };
    }
    const match = trimmed.match(/^(.+):(\d{1,5})$/);
    if (!match) {
        throw new Error("Invalid host:port (expected localhost:6767)");
    }
    const host = match[1].trim();
    if (!host)
        throw new Error("Host is required");
    const port = parsePort(match[2], "Invalid host:port");
    return { host, port, isIpv6: false };
}
export function normalizeHostPort(input) {
    const { host, port, isIpv6 } = parseHostPort(input);
    return isIpv6 ? `[${host}]:${port}` : `${host}:${port}`;
}
export function normalizeLoopbackToLocalhost(endpoint) {
    const { host, port, isIpv6 } = parseHostPort(endpoint);
    if (host === "127.0.0.1" || (!isIpv6 && host === "0.0.0.0")) {
        return `localhost:${port}`;
    }
    if (isIpv6 && (host === "::1" || host === "::")) {
        return `localhost:${port}`;
    }
    return endpoint;
}
export function deriveLabelFromEndpoint(endpoint) {
    try {
        const { host } = parseHostPort(endpoint);
        return host || "Unnamed Host";
    }
    catch {
        return "Unnamed Host";
    }
}
function shouldUseSecureWebSocket(port) {
    return port === 443;
}
export function buildDaemonWebSocketUrl(endpoint) {
    const { host, port, isIpv6 } = parseHostPort(endpoint);
    const protocol = shouldUseSecureWebSocket(port) ? "wss" : "ws";
    const hostPart = isIpv6 ? `[${host}]` : host;
    return new URL(`${protocol}://${hostPart}:${port}/ws`).toString();
}
export function buildRelayWebSocketUrl(params) {
    const { host, port, isIpv6 } = parseHostPort(params.endpoint);
    const protocol = shouldUseSecureWebSocket(port) ? "wss" : "ws";
    const hostPart = isIpv6 ? `[${host}]` : host;
    const url = new URL(`${protocol}://${hostPart}:${port}/ws`);
    url.searchParams.set("serverId", params.serverId);
    url.searchParams.set("role", params.role);
    url.searchParams.set("v", normalizeRelayProtocolVersion(params.version));
    if (params.connectionId) {
        url.searchParams.set("connectionId", params.connectionId);
    }
    return url.toString();
}
export function extractHostPortFromWebSocketUrl(wsUrl) {
    const parsed = new URL(wsUrl);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
        throw new Error("Invalid WebSocket URL protocol");
    }
    if (parsed.pathname.replace(/\/+$/, "") !== "/ws") {
        throw new Error("Invalid WebSocket URL (expected /ws path)");
    }
    const host = parsed.hostname;
    const port = parsed.port ? Number(parsed.port) : parsed.protocol === "wss:" ? 443 : 80;
    if (!host) {
        throw new Error("Invalid WebSocket URL (missing hostname)");
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("Invalid WebSocket URL (invalid port)");
    }
    const isIpv6 = host.includes(":") && !host.startsWith("[") && !host.endsWith("]");
    return isIpv6 ? `[${host}]:${port}` : `${host}:${port}`;
}
export function isRelayClientWebSocketUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.searchParams.get("role") === "client" && parsed.searchParams.has("serverId");
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=daemon-endpoints.js.map