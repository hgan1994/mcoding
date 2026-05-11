import { connectToDaemon, getDaemonHost } from "../../utils/client.js";
import { isSameOrDescendantPath } from "../../utils/paths.js";
export function addDeleteOptions(cmd) {
    return cmd
        .description("Delete an agent (interrupt if running, then hard-delete)")
        .argument("[id]", "Agent ID (or prefix) - optional if --all or --cwd specified")
        .option("--all", "Delete all agents")
        .option("--cwd <path>", "Delete all agents in directory");
}
export const deleteSchema = {
    idField: (item) => item.agentIds.join("\n"),
    columns: [{ header: "DELETED", field: "deletedCount" }],
};
export async function runDeleteCommand(id, options, _command) {
    const host = getDaemonHost({ host: options.host });
    if (!id && !options.all && !options.cwd) {
        const error = {
            code: "MISSING_ARGUMENT",
            message: "Agent ID required unless --all or --cwd is specified",
            details: "Usage: paseo agent delete <id> | --all | --cwd <path>",
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
        const fetchPayload = await client.fetchAgents({ filter: { includeArchived: true } });
        let agents = fetchPayload.entries.map((entry) => entry.agent);
        const deletedIds = [];
        if (options.all) {
            agents = agents.filter((a) => !a.archivedAt);
        }
        else if (options.cwd) {
            agents = agents.filter((a) => {
                if (a.archivedAt)
                    return false;
                return isSameOrDescendantPath(options.cwd, a.cwd);
            });
        }
        else if (id) {
            const fetchResult = await client.fetchAgent(id);
            if (!fetchResult) {
                const error = {
                    code: "AGENT_NOT_FOUND",
                    message: `No agent found matching: ${id}`,
                    details: "Use `paseo ls` to list available agents",
                };
                throw error;
            }
            agents = [fetchResult.agent];
        }
        for (const agent of agents) {
            try {
                if (agent.status === "running") {
                    await client.cancelAgent(agent.id);
                }
                await client.deleteAgent(agent.id);
                deletedIds.push(agent.id);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`Warning: Failed to delete agent ${agent.id.slice(0, 7)}: ${message}`);
            }
        }
        await client.close();
        return {
            type: "single",
            data: {
                deletedCount: deletedIds.length,
                agentIds: deletedIds,
            },
            schema: deleteSchema,
        };
    }
    catch (err) {
        await client.close().catch(() => { });
        if (err && typeof err === "object" && "code" in err) {
            throw err;
        }
        const message = err instanceof Error ? err.message : String(err);
        const error = {
            code: "DELETE_AGENT_FAILED",
            message: `Failed to delete agent(s): ${message}`,
        };
        throw error;
    }
}
//# sourceMappingURL=delete.js.map