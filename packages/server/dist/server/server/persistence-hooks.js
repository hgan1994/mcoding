const DEFAULT_AGENT_PROVIDER = "claude";
function getLogger(logger) {
    return logger.child({ module: "persistence" });
}
function isProviderRegistry(registeredProviders) {
    return (typeof registeredProviders === "object" &&
        registeredProviders !== null &&
        !(Symbol.iterator in registeredProviders));
}
/**
 * Attach AgentStorage persistence to an AgentManager instance so every
 * agent_state snapshot is flushed to disk.
 */
export function attachAgentStoragePersistence(logger, agentManager, storage) {
    const log = getLogger(logger);
    const unsubscribe = agentManager.subscribe((event) => {
        if (event.type !== "agent_state") {
            return;
        }
        if (event.agent.lifecycle === "closed") {
            return;
        }
        void storage.applySnapshot(event.agent).catch((error) => {
            log.error({ err: error, agentId: event.agent.id }, "Failed to persist agent snapshot");
        });
    });
    return unsubscribe;
}
export function buildConfigOverrides(record) {
    return {
        cwd: record.cwd,
        modeId: record.lastModeId ?? record.config?.modeId ?? undefined,
        model: record.config?.model ?? undefined,
        thinkingOptionId: record.config?.thinkingOptionId ?? undefined,
        featureValues: record.config?.featureValues ?? undefined,
        title: record.config?.title ?? undefined,
        extra: record.config?.extra ?? undefined,
        systemPrompt: record.config?.systemPrompt ?? undefined,
        mcpServers: record.config?.mcpServers ?? undefined,
    };
}
export function buildSessionConfig(record, options) {
    const validProviders = options?.validProviders;
    const isValidProvider = validProviders ? new Set(validProviders).has(record.provider) : true;
    if (!isValidProvider) {
        options?.logger?.warn({ agentId: record.id, provider: record.provider }, `Skipping persisted agent with unknown provider '${record.provider}'`);
        return null;
    }
    const overrides = buildConfigOverrides(record);
    return {
        provider: record.provider,
        cwd: record.cwd,
        modeId: overrides.modeId,
        model: overrides.model,
        thinkingOptionId: overrides.thinkingOptionId,
        featureValues: overrides.featureValues,
        title: overrides.title,
        extra: overrides.extra,
        systemPrompt: overrides.systemPrompt,
        mcpServers: overrides.mcpServers,
    };
}
export function extractTimestamps(record) {
    return {
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.lastActivityAt ?? record.updatedAt),
        lastUserMessageAt: record.lastUserMessageAt ? new Date(record.lastUserMessageAt) : null,
        labels: record.labels,
    };
}
function hasRegisteredProvider(registeredProviders, value) {
    if (isProviderRegistry(registeredProviders)) {
        return Object.prototype.hasOwnProperty.call(registeredProviders, value);
    }
    return new Set(registeredProviders).has(value);
}
export function isRegisteredProvider(providerRegistry, value) {
    return hasRegisteredProvider(providerRegistry, value);
}
export function coerceAgentProvider(logger, providerRegistry, value, agentId) {
    if (isRegisteredProvider(providerRegistry, value)) {
        return value;
    }
    logger.warn({ value, agentId, defaultProvider: DEFAULT_AGENT_PROVIDER }, `Unknown provider '${value}' for agent ${agentId ?? "unknown"}; defaulting to '${DEFAULT_AGENT_PROVIDER}'`);
    return DEFAULT_AGENT_PROVIDER;
}
export function toAgentPersistenceHandle(logger, registeredProviders, handle) {
    if (!handle) {
        return null;
    }
    const provider = handle.provider;
    if (!hasRegisteredProvider(registeredProviders, provider)) {
        logger.warn({ provider }, `Ignoring persistence handle with unknown provider '${provider}'`);
        return null;
    }
    if (!handle.sessionId) {
        logger.warn("Ignoring persistence handle missing sessionId");
        return null;
    }
    return {
        provider,
        sessionId: handle.sessionId,
        ...(handle.nativeHandle !== undefined ? { nativeHandle: handle.nativeHandle } : {}),
        ...(handle.metadata !== undefined ? { metadata: handle.metadata } : {}),
    };
}
//# sourceMappingURL=persistence-hooks.js.map