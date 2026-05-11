import { normalizeWorkspaceId as normalizePersistedWorkspaceId } from "./workspace-registry-model.js";
import { deletePaseoWorktree, resolvePaseoWorktreeRootForCwd } from "../utils/worktree.js";
export async function archivePaseoWorktree(dependencies, options) {
    let targetPath = options.targetPath;
    const resolvedWorktree = await resolvePaseoWorktreeRootForCwd(targetPath, {
        paseoHome: dependencies.paseoHome,
    });
    if (resolvedWorktree) {
        targetPath = resolvedWorktree.worktreePath;
    }
    const removedAgents = new Set();
    const affectedWorkspaceCwds = new Set([targetPath]);
    const affectedWorkspaceIds = new Set([normalizePersistedWorkspaceId(targetPath)]);
    const liveAgents = dependencies.agentManager
        .listAgents()
        .filter((agent) => dependencies.isPathWithinRoot(targetPath, agent.cwd));
    for (const agent of liveAgents) {
        removedAgents.add(agent.id);
        affectedWorkspaceCwds.add(agent.cwd);
        affectedWorkspaceIds.add(normalizePersistedWorkspaceId(agent.cwd));
    }
    let storedRecords = [];
    try {
        storedRecords = await dependencies.agentStorage.list();
    }
    catch (error) {
        dependencies.sessionLogger?.warn({ err: error, targetPath }, "Failed to list stored agents during worktree archive; continuing");
    }
    const matchingStoredRecords = storedRecords.filter((record) => dependencies.isPathWithinRoot(targetPath, record.cwd));
    for (const record of matchingStoredRecords) {
        removedAgents.add(record.id);
        affectedWorkspaceCwds.add(record.cwd);
        affectedWorkspaceIds.add(normalizePersistedWorkspaceId(record.cwd));
    }
    const agentIdsToRemoveFromStorage = new Set([
        ...liveAgents.map((agent) => agent.id),
        ...matchingStoredRecords.map((record) => record.id),
    ]);
    const teardownResults = await Promise.allSettled([
        ...liveAgents.map((agent) => dependencies.agentManager.closeAgent(agent.id)),
        dependencies.killTerminalsUnderPath(targetPath),
    ]);
    for (const result of teardownResults) {
        if (result.status === "rejected") {
            dependencies.sessionLogger?.warn({ err: result.reason, targetPath }, "Worktree teardown step failed during archive; continuing");
        }
    }
    const agentIdsToRemove = Array.from(agentIdsToRemoveFromStorage);
    const storageRemovalResults = await Promise.allSettled(agentIdsToRemove.map((agentId) => dependencies.agentStorage.remove(agentId)));
    storageRemovalResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
            return;
        }
        dependencies.sessionLogger?.warn({
            err: result.reason,
            agentId: agentIdsToRemove[index],
            targetPath,
        }, "Failed to remove archived worktree agent from storage; continuing");
    });
    await deletePaseoWorktree({
        cwd: options.repoRoot,
        worktreePath: targetPath,
        worktreesRoot: options.worktreesRoot,
        paseoHome: dependencies.paseoHome,
    });
    if (options.repoRoot) {
        try {
            await dependencies.workspaceGitService.getSnapshot(options.repoRoot, {
                force: true,
                reason: "archive-worktree",
            });
        }
        catch (error) {
            dependencies.sessionLogger?.warn({ err: error, cwd: options.repoRoot }, "Failed to force-refresh workspace git snapshot after archiving worktree");
        }
    }
    for (const cwd of affectedWorkspaceCwds) {
        dependencies.github.invalidate({ cwd });
    }
    for (const workspaceId of affectedWorkspaceIds) {
        try {
            await dependencies.archiveWorkspaceRecord(workspaceId);
        }
        catch (error) {
            dependencies.sessionLogger?.warn({ err: error, workspaceId }, "Failed to archive workspace record; worktree FS already removed");
        }
    }
    for (const agentId of removedAgents) {
        dependencies.emit({
            type: "agent_deleted",
            payload: {
                agentId,
                requestId: options.requestId,
            },
        });
    }
    await dependencies.emitWorkspaceUpdatesForCwds(affectedWorkspaceCwds);
    return Array.from(removedAgents);
}
export async function killTerminalsUnderPath(dependencies, rootPath) {
    const terminalManager = dependencies.terminalManager;
    if (!terminalManager) {
        return;
    }
    const terminalIds = [];
    const terminalDirectories = [...terminalManager.listDirectories()];
    for (const terminalCwd of terminalDirectories) {
        if (!dependencies.isPathWithinRoot(rootPath, terminalCwd)) {
            continue;
        }
        try {
            const terminals = await terminalManager.getTerminals(terminalCwd);
            for (const terminal of terminals) {
                terminalIds.push(terminal.id);
            }
        }
        catch (error) {
            dependencies.sessionLogger.warn({ err: error, cwd: terminalCwd }, "Failed to enumerate worktree terminals during archive");
        }
    }
    if (terminalIds.length === 0) {
        return;
    }
    await Promise.allSettled(terminalIds.map(async (terminalId) => {
        try {
            dependencies.detachTerminalStream?.(terminalId, { emitExit: true });
            await terminalManager.killTerminalAndWait(terminalId, {
                gracefulTimeoutMs: 2000,
                forceTimeoutMs: 1500,
            });
        }
        catch (error) {
            dependencies.sessionLogger.warn({ err: error, terminalId }, "Terminal kill escalation failed during archive; proceeding anyway");
        }
    }));
}
//# sourceMappingURL=paseo-worktree-archive-service.js.map