import { buildConfigOverrides, buildSessionConfig, extractTimestamps, toAgentPersistenceHandle, } from "../persistence-hooks.js";
const pendingAgentInitializations = new Map();
export async function ensureAgentLoaded(agentId, deps) {
    const existing = deps.agentManager.getAgent(agentId);
    if (existing) {
        return existing;
    }
    const inflight = pendingAgentInitializations.get(agentId);
    if (inflight) {
        return inflight;
    }
    const initPromise = (async () => {
        const record = await deps.agentStorage.get(agentId);
        if (!record) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        const validProviders = deps.validProviders ?? deps.agentManager.getRegisteredProviderIds();
        const handle = toAgentPersistenceHandle(deps.logger, validProviders, record.persistence);
        let snapshot;
        if (handle) {
            snapshot = await deps.agentManager.resumeAgentFromPersistence(handle, buildConfigOverrides(record), agentId, extractTimestamps(record));
            deps.logger.info({ agentId, provider: record.provider }, "Agent resumed from persistence");
        }
        else {
            const config = buildSessionConfig(record, {
                validProviders,
                logger: deps.logger,
            });
            if (!config) {
                throw new Error(`Agent ${agentId} references unavailable provider '${record.provider}'`);
            }
            snapshot = await deps.agentManager.createAgent(config, agentId, { labels: record.labels });
            deps.logger.info({ agentId, provider: record.provider }, "Agent created from stored config");
        }
        await deps.agentManager.hydrateTimelineFromProvider(agentId);
        return deps.agentManager.getAgent(agentId) ?? snapshot;
    })();
    pendingAgentInitializations.set(agentId, initPromise);
    try {
        return await initPromise;
    }
    finally {
        const current = pendingAgentInitializations.get(agentId);
        if (current === initPromise) {
            pendingAgentInitializations.delete(agentId);
        }
    }
}
//# sourceMappingURL=agent-loading.js.map