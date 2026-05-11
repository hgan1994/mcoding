import { homedir } from "node:os";
import { basename, join, sep } from "node:path";
import { connectToDaemon, getDaemonHost } from "../../utils/client.js";
/** Shorten home directory in path */
function shortenPath(path) {
    const home = process.env.HOME;
    if (home && path.startsWith(home)) {
        return "~" + path.slice(home.length);
    }
    return path;
}
/** Extract worktree name from path */
function extractWorktreeName(path) {
    return basename(path);
}
export function resolvePaseoHomePath() {
    return process.env.PASEO_HOME ?? join(homedir(), ".paseo");
}
export function resolvePaseoWorktreesDir() {
    return join(resolvePaseoHomePath(), "worktrees");
}
function isAgentInManagedWorktree(agentCwd) {
    const worktreesDir = resolvePaseoWorktreesDir();
    return agentCwd === worktreesDir || agentCwd.startsWith(worktreesDir + sep);
}
/** Schema for worktree ls output */
export const worktreeLsSchema = {
    idField: "name",
    columns: [
        { header: "NAME", field: "name", width: 20 },
        { header: "BRANCH", field: "branch", width: 25 },
        { header: "CWD", field: "cwd", width: 45 },
        { header: "AGENT", field: "agent", width: 10 },
    ],
};
export async function runLsCommand(options, _command) {
    const host = getDaemonHost({ host: options.host });
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
        const agentsPayload = await client.fetchAgents({ filter: { includeArchived: true } });
        const agents = agentsPayload.entries.map((entry) => entry.agent);
        // Get worktree list from daemon
        const response = await client.getPaseoWorktreeList({});
        await client.close();
        if (response.error) {
            const error = {
                code: "WORKTREE_LIST_FAILED",
                message: `Failed to list worktrees: ${response.error.message}`,
            };
            throw error;
        }
        // Build a map of worktree paths to agent IDs
        const worktreeAgentMap = new Map();
        for (const agent of agents) {
            if (isAgentInManagedWorktree(agent.cwd)) {
                worktreeAgentMap.set(agent.cwd, agent.id.slice(0, 7));
            }
        }
        const items = response.worktrees.map((wt) => ({
            name: extractWorktreeName(wt.worktreePath),
            branch: wt.branchName ?? "-",
            cwd: shortenPath(wt.worktreePath),
            agent: worktreeAgentMap.get(wt.worktreePath) ?? "-",
        }));
        return {
            type: "list",
            data: items,
            schema: worktreeLsSchema,
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
            code: "WORKTREE_LIST_FAILED",
            message: `Failed to list worktrees: ${message}`,
        };
        throw error;
    }
}
//# sourceMappingURL=ls.js.map