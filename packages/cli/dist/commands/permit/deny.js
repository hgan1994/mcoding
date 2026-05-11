import { connectToDaemon, getDaemonHost } from "../../utils/client.js";
import { permitResponseSchema } from "./allow.js";
export async function runDenyCommand(agentIdOrPrefix, reqId, options, _command) {
    const host = getDaemonHost({ host: options.host });
    // Validate arguments
    if (!options.all && !reqId) {
        const error = {
            code: "MISSING_ARGUMENT",
            message: "Request ID is required unless --all is specified",
            details: "Usage: paseo permit deny <agent> <req_id> or paseo permit deny <agent> --all",
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
        const fetchResult = await client.fetchAgent(agentIdOrPrefix);
        if (!fetchResult) {
            await client.close();
            const error = {
                code: "AGENT_NOT_FOUND",
                message: `Agent not found: ${agentIdOrPrefix}`,
                details: 'Use "paseo ls" to list available agents',
            };
            throw error;
        }
        const agent = fetchResult.agent;
        const resolvedAgentId = agent.id;
        // Get pending permissions for this agent
        const pendingPermissions = agent.pendingPermissions || [];
        if (pendingPermissions.length === 0) {
            await client.close();
            const error = {
                code: "NO_PENDING_PERMISSIONS",
                message: `No pending permissions for agent ${agent.id.slice(0, 7)}`,
            };
            throw error;
        }
        // Determine which permissions to deny
        let permissionsToDeny;
        if (options.all) {
            permissionsToDeny = pendingPermissions;
        }
        else {
            // Find permission by ID prefix
            const permission = pendingPermissions.find((p) => p.id === reqId || p.id.startsWith(reqId));
            if (!permission) {
                await client.close();
                const error = {
                    code: "PERMISSION_NOT_FOUND",
                    message: `Permission request not found: ${reqId}`,
                    details: `Available requests: ${pendingPermissions.map((p) => p.id.slice(0, 8)).join(", ")}`,
                };
                throw error;
            }
            permissionsToDeny = [permission];
        }
        // Deny permissions
        const results = [];
        for (const permission of permissionsToDeny) {
            await client.respondToPermission(resolvedAgentId, permission.id, {
                behavior: "deny",
                ...(options.message ? { message: options.message } : {}),
                ...(options.interrupt ? { interrupt: true } : {}),
            });
            results.push({
                requestId: permission.id.slice(0, 8),
                agentId: resolvedAgentId,
                agentShortId: resolvedAgentId.slice(0, 7),
                name: permission.name,
                result: "denied",
            });
        }
        await client.close();
        return {
            type: "list",
            data: results,
            schema: permitResponseSchema,
        };
    }
    catch (err) {
        await client.close().catch(() => { });
        // Re-throw CommandErrors
        if (err && typeof err === "object" && "code" in err) {
            throw err;
        }
        const message = err instanceof Error ? err.message : String(err);
        const error = {
            code: "DENY_PERMISSION_FAILED",
            message: `Failed to deny permission: ${message}`,
        };
        throw error;
    }
}
//# sourceMappingURL=deny.js.map