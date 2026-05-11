import { connectToDaemon, getDaemonHost } from "../../utils/client.js";
import { parseDuration } from "../../utils/duration.js";
export async function connectChatClient(host) {
    const daemonHost = getDaemonHost({ host });
    try {
        const client = await connectToDaemon({ host });
        return { client, daemonHost };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const error = {
            code: "DAEMON_NOT_RUNNING",
            message: `Cannot connect to daemon at ${daemonHost}: ${message}`,
            details: "Start the daemon with: paseo daemon start",
        };
        throw error;
    }
}
export async function attachAgentNamesToMessages(client, messages) {
    const agentIds = new Set();
    for (const message of messages) {
        agentIds.add(message.author);
        for (const mentionId of message.mentionAgentIds) {
            agentIds.add(mentionId);
        }
    }
    if (agentIds.size === 0) {
        return messages;
    }
    const payload = await client.fetchAgents({
        filter: { includeArchived: true },
    });
    const agentNames = new Map();
    for (const entry of payload.entries) {
        const title = entry.agent.title?.trim();
        if (title) {
            agentNames.set(entry.agent.id, title);
        }
    }
    return messages.map((message) => ({
        ...message,
        authorName: agentNames.get(message.author) ?? null,
        mentionLabels: message.mentionAgentIds.map((agentId) => {
            const name = agentNames.get(agentId);
            return name ? `${name} (${agentId})` : agentId;
        }),
    }));
}
export function toChatCommandError(code, action, err) {
    if (err && typeof err === "object" && "code" in err && "message" in err) {
        return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    const rpcCode = typeof err === "object" && err !== null && "code" in err && typeof err.code === "string"
        ? err.code
        : undefined;
    return {
        code: rpcCode ?? code,
        message: `Failed to ${action}: ${message}`,
    };
}
export function parseSinceValue(input) {
    if (!input) {
        return undefined;
    }
    try {
        const durationMs = parseDuration(input);
        return new Date(Date.now() - durationMs).toISOString();
    }
    catch {
        const timestamp = new Date(input);
        if (Number.isNaN(timestamp.getTime())) {
            const error = {
                code: "INVALID_SINCE",
                message: "Invalid --since value",
                details: "Use a duration like 10m or an ISO timestamp.",
            };
            throw error;
        }
        return timestamp.toISOString();
    }
}
export function parseTimeoutMs(input) {
    if (!input) {
        return undefined;
    }
    try {
        const timeoutMs = parseDuration(input);
        if (timeoutMs <= 0) {
            throw new Error("Timeout must be positive");
        }
        return timeoutMs;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const error = {
            code: "INVALID_TIMEOUT",
            message: "Invalid timeout value",
            details: message,
        };
        throw error;
    }
}
export function resolveChatAuthorAgentId() {
    const agentId = process.env.PASEO_AGENT_ID?.trim();
    return agentId && agentId.length > 0 ? agentId : "manual";
}
//# sourceMappingURL=shared.js.map