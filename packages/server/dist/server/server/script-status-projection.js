import { buildScriptHostname } from "../utils/script-hostname.js";
import { getScriptConfigs, isServiceScript } from "../utils/worktree.js";
import { deriveProjectSlug } from "./workspace-git-metadata.js";
function resolveDaemonPort(daemonPort) {
    if (typeof daemonPort === "function") {
        return daemonPort();
    }
    return daemonPort;
}
function toServiceProxyUrl(hostname, daemonPort) {
    if (daemonPort === null) {
        return null;
    }
    return `http://${hostname}:${daemonPort}`;
}
function toWireHealth(health) {
    if (health === "pending" || health === null) {
        return null;
    }
    return health;
}
function sortPayloads(payloads) {
    return payloads.sort((left, right) => left.scriptName.localeCompare(right.scriptName, undefined, {
        numeric: true,
        sensitivity: "base",
    }));
}
export function buildWorkspaceScriptPayloads(options) {
    const workspaceId = options.workspaceId;
    const workspaceDirectory = options.workspaceDirectory;
    const projectSlug = options.gitMetadata?.projectSlug ?? deriveProjectSlug(workspaceDirectory);
    const branchName = options.gitMetadata?.currentBranch ?? null;
    const scriptConfigs = getScriptConfigs(workspaceDirectory);
    const runtimeEntries = new Map(options.runtimeStore
        .listForWorkspace(workspaceId)
        .map((entry) => [entry.scriptName, entry]));
    const routesByScriptName = new Map(options.routeStore
        .listRoutesForWorkspace(workspaceId)
        .map((entry) => [entry.scriptName, entry]));
    const payloads = [];
    for (const [scriptName, config] of scriptConfigs.entries()) {
        const configIsService = isServiceScript(config);
        const type = configIsService ? "service" : "script";
        const configuredPort = configIsService ? (config.port ?? null) : null;
        const runtimeEntry = runtimeEntries.get(scriptName) ?? null;
        const routeEntry = routesByScriptName.get(scriptName) ?? null;
        const hostname = type === "service"
            ? (routeEntry?.hostname ??
                buildScriptHostname({
                    projectSlug,
                    branchName,
                    scriptName,
                }))
            : scriptName;
        payloads.push({
            scriptName,
            type,
            hostname,
            port: type === "service" ? (routeEntry?.port ?? configuredPort) : null,
            proxyUrl: type === "service" ? toServiceProxyUrl(hostname, options.daemonPort) : null,
            lifecycle: runtimeEntry?.lifecycle ?? "stopped",
            health: type === "service" ? toWireHealth(options.resolveHealth?.(hostname) ?? null) : null,
            exitCode: runtimeEntry?.exitCode ?? null,
            terminalId: runtimeEntry?.terminalId ?? null,
        });
    }
    for (const runtimeEntry of runtimeEntries.values()) {
        if (scriptConfigs.has(runtimeEntry.scriptName) || runtimeEntry.lifecycle !== "running") {
            continue;
        }
        const routeEntry = routesByScriptName.get(runtimeEntry.scriptName) ?? null;
        const type = runtimeEntry.type;
        const hostname = type === "service"
            ? (routeEntry?.hostname ??
                buildScriptHostname({
                    projectSlug,
                    branchName,
                    scriptName: runtimeEntry.scriptName,
                }))
            : runtimeEntry.scriptName;
        payloads.push({
            scriptName: runtimeEntry.scriptName,
            type,
            hostname,
            port: type === "service" ? (routeEntry?.port ?? null) : null,
            proxyUrl: type === "service" ? toServiceProxyUrl(hostname, options.daemonPort) : null,
            lifecycle: runtimeEntry.lifecycle,
            health: type === "service" && routeEntry
                ? toWireHealth(options.resolveHealth?.(hostname) ?? null)
                : null,
            exitCode: runtimeEntry.exitCode,
            terminalId: runtimeEntry.terminalId,
        });
    }
    return sortPayloads(payloads);
}
function buildScriptStatusUpdateMessage(params) {
    return {
        type: "script_status_update",
        payload: {
            workspaceId: params.workspaceId,
            scripts: params.scripts,
        },
    };
}
export function createScriptStatusEmitter({ sessions, routeStore, runtimeStore, daemonPort, resolveWorkspaceDirectory, }) {
    return (workspaceId, scripts) => {
        void (async () => {
            const workspaceDirectory = await resolveWorkspaceDirectory(workspaceId);
            if (!workspaceDirectory) {
                return;
            }
            const resolvedDaemonPort = resolveDaemonPort(daemonPort);
            const scriptHealthByHostname = new Map(scripts.map((script) => [script.hostname, script.health]));
            const projected = buildWorkspaceScriptPayloads({
                workspaceId,
                workspaceDirectory,
                routeStore,
                runtimeStore,
                daemonPort: resolvedDaemonPort,
                resolveHealth: (hostname) => scriptHealthByHostname.get(hostname) ?? null,
            });
            const message = buildScriptStatusUpdateMessage({
                workspaceId,
                scripts: projected,
            });
            for (const session of sessions()) {
                session.emit(message);
            }
        })();
    };
}
//# sourceMappingURL=script-status-projection.js.map