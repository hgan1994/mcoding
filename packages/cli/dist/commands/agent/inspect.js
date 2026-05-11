import { connectToDaemon, getDaemonHost } from "../../utils/client.js";
export function addInspectOptions(cmd) {
    return cmd
        .description("Show detailed information about an agent")
        .argument("<id>", "Agent ID (or prefix)");
}
/** Schema for key-value display with custom serialization for JSON/YAML */
function createInspectSchema(agent) {
    return {
        idField: "key",
        columns: [
            { header: "KEY", field: "key" },
            {
                header: "VALUE",
                field: "value",
                color: (_, item) => {
                    if (item.key === "Status") {
                        if (item.value === "running")
                            return "green";
                        if (item.value === "idle")
                            return "yellow";
                        if (item.value === "error")
                            return "red";
                    }
                    return undefined;
                },
            },
        ],
        // For JSON/YAML, return the structured agent object
        serialize: (_item) => agent,
    };
}
/** Shorten home directory in path */
function shortenPath(path) {
    const home = process.env.HOME;
    if (home && path.startsWith(home)) {
        return "~" + path.slice(home.length);
    }
    return path;
}
/** Format cost in USD */
function formatCost(costUsd) {
    if (costUsd === 0)
        return "$0.00";
    if (costUsd < 0.01)
        return `$${costUsd.toFixed(4)}`;
    return `$${costUsd.toFixed(2)}`;
}
function normalizeModelId(value) {
    if (typeof value !== "string")
        return null;
    const normalized = value.trim();
    if (!normalized || normalized.toLowerCase() === "default")
        return null;
    return normalized;
}
function resolveModel(snapshot) {
    return normalizeModelId(snapshot.runtimeInfo?.model) ?? normalizeModelId(snapshot.model);
}
/** Convert agent snapshot to inspection data */
function toInspectData(snapshot) {
    const lastUsage = snapshot.lastUsage
        ? {
            InputTokens: snapshot.lastUsage.inputTokens ?? 0,
            OutputTokens: snapshot.lastUsage.outputTokens ?? 0,
            CachedTokens: snapshot.lastUsage.cachedInputTokens ?? 0,
            CostUsd: snapshot.lastUsage.totalCostUsd ?? 0,
        }
        : null;
    const capabilities = snapshot.capabilities
        ? {
            Streaming: snapshot.capabilities.supportsStreaming ?? false,
            Persistence: snapshot.capabilities.supportsSessionPersistence ?? false,
            DynamicModes: snapshot.capabilities.supportsDynamicModes ?? false,
            McpServers: snapshot.capabilities.supportsMcpServers ?? false,
        }
        : null;
    // Extract worktree and parentAgentId from labels if they exist
    const worktree = snapshot.labels?.["paseo.worktree"] ?? null;
    const parentAgentId = snapshot.labels?.["paseo.parent-agent-id"] ?? null;
    return {
        Id: snapshot.id,
        Name: snapshot.title ?? "-",
        Provider: snapshot.provider,
        Model: resolveModel(snapshot) ?? "-",
        Thinking: snapshot.effectiveThinkingOptionId ?? "auto",
        Status: snapshot.status,
        Archived: snapshot.archivedAt != null,
        ArchivedAt: snapshot.archivedAt ?? null,
        Mode: snapshot.currentModeId ?? "default",
        Cwd: snapshot.cwd,
        CreatedAt: snapshot.createdAt,
        UpdatedAt: snapshot.updatedAt,
        LastUsage: lastUsage,
        Capabilities: capabilities,
        AvailableModes: snapshot.availableModes
            ? snapshot.availableModes.map((m) => ({ id: m.id, label: m.label }))
            : null,
        PendingPermissions: (snapshot.pendingPermissions ?? []).map((p) => ({
            id: p.id,
            tool: p.name ?? "unknown",
        })),
        Worktree: worktree,
        ParentAgentId: parentAgentId,
    };
}
/** Convert agent to key-value rows for table display */
function toInspectRows(agent) {
    const rows = [
        { key: "Id", value: agent.Id },
        { key: "Name", value: agent.Name },
        { key: "Provider", value: agent.Provider },
        { key: "Model", value: agent.Model },
        { key: "Thinking", value: agent.Thinking },
        { key: "Status", value: agent.Status },
        { key: "Archived", value: String(agent.Archived) },
        { key: "ArchivedAt", value: agent.ArchivedAt ?? "null" },
        { key: "Mode", value: agent.Mode },
        { key: "Cwd", value: shortenPath(agent.Cwd) },
        { key: "CreatedAt", value: agent.CreatedAt },
        { key: "UpdatedAt", value: agent.UpdatedAt },
    ];
    if (agent.LastUsage) {
        rows.push({
            key: "LastUsage",
            value: `InputTokens: ${agent.LastUsage.InputTokens}, OutputTokens: ${agent.LastUsage.OutputTokens}, CachedTokens: ${agent.LastUsage.CachedTokens}, CostUsd: ${formatCost(agent.LastUsage.CostUsd)}`,
        });
    }
    if (agent.Capabilities) {
        rows.push({
            key: "Capabilities",
            value: `Streaming: ${agent.Capabilities.Streaming}, Persistence: ${agent.Capabilities.Persistence}, DynamicModes: ${agent.Capabilities.DynamicModes}, McpServers: ${agent.Capabilities.McpServers}`,
        });
    }
    if (agent.AvailableModes && agent.AvailableModes.length > 0) {
        rows.push({
            key: "AvailableModes",
            value: agent.AvailableModes.map((m) => `${m.id} (${m.label})`).join(", "),
        });
    }
    rows.push({
        key: "PendingPermissions",
        value: agent.PendingPermissions.length > 0
            ? agent.PendingPermissions.map((p) => `${p.id} (${p.tool})`).join(", ")
            : "[]",
    });
    rows.push({ key: "Worktree", value: agent.Worktree ?? "null" });
    rows.push({ key: "ParentAgentId", value: agent.ParentAgentId ?? "null" });
    return rows;
}
export async function runInspectCommand(agentIdArg, options, _command) {
    const host = getDaemonHost({ host: options.host });
    // Validate arguments
    if (!agentIdArg || agentIdArg.trim().length === 0) {
        const error = {
            code: "MISSING_AGENT_ID",
            message: "Agent ID is required",
            details: "Usage: paseo agent inspect <id>",
        };
        throw error;
    }
    let client;
    try {
        client = await connectToDaemon({ host: options.host });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const error = {
            code: "DAEMON_NOT_RUNNING",
            message: `Cannot connect to daemon at ${host}: ${message}`,
            details: "Start the daemon with: paseo daemon start",
        };
        throw error;
    }
    try {
        const fetchResult = await client.fetchAgent(agentIdArg);
        if (!fetchResult) {
            const error = {
                code: "AGENT_NOT_FOUND",
                message: `Agent not found: ${agentIdArg}`,
                details: 'Use "paseo ls" to list available agents',
            };
            throw error;
        }
        await client.close();
        const inspectData = toInspectData(fetchResult.agent);
        return {
            type: "list",
            data: toInspectRows(inspectData),
            schema: createInspectSchema(inspectData),
        };
    }
    catch (err) {
        await client.close().catch(() => { });
        // Re-throw CommandError as-is
        if (err && typeof err === "object" && "code" in err) {
            throw err;
        }
        const message = err instanceof Error ? err.message : String(err);
        const error = {
            code: "INSPECT_FAILED",
            message: `Failed to inspect agent: ${message}`,
        };
        throw error;
    }
}
//# sourceMappingURL=inspect.js.map