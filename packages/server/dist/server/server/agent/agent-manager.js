import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { stat } from "node:fs/promises";
import { AGENT_LIFECYCLE_STATUSES, } from "../../shared/agent-lifecycle.js";
import { z } from "zod";
import { InMemoryAgentTimelineStore, } from "./agent-timeline-store.js";
import { AGENT_STREAM_COALESCE_DEFAULT_WINDOW_MS, AgentStreamCoalescer, } from "./agent-stream-coalescer.js";
import { getAgentProviderDefinition } from "./provider-manifest.js";
const RELOAD_SESSION_CLOSE_TIMEOUT_MS = 3000;
const INTERRUPT_SESSION_TIMEOUT_MS = 2000;
export { AGENT_LIFECYCLE_STATUSES };
const SYSTEM_ERROR_PREFIX = "[System Error]";
function attachPersistenceCwd(handle, cwd) {
    if (!handle) {
        return null;
    }
    return {
        ...handle,
        metadata: {
            ...(handle.metadata ?? {}),
            cwd,
        },
    };
}
const BUSY_STATUSES = ["initializing", "running"];
const AgentIdSchema = z.string().uuid();
function isAgentBusy(status) {
    return BUSY_STATUSES.includes(status);
}
function isTurnTerminalEvent(event) {
    return (event.type === "turn_completed" ||
        event.type === "turn_failed" ||
        event.type === "turn_canceled");
}
function createAbortError(signal, fallbackMessage) {
    const reason = signal?.reason;
    const message = typeof reason === "string"
        ? reason
        : reason instanceof Error
            ? reason.message
            : fallbackMessage;
    return Object.assign(new Error(message), { name: "AbortError" });
}
function validateAgentId(agentId, source) {
    const result = AgentIdSchema.safeParse(agentId);
    if (!result.success) {
        throw new Error(`${source}: agentId must be a UUID`);
    }
    return result.data;
}
function normalizeMessageId(messageId) {
    if (typeof messageId !== "string") {
        return undefined;
    }
    const trimmed = messageId.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
export class AgentManager {
    constructor(options) {
        this.clients = new Map();
        this.agents = new Map();
        this.timelineStore = new InMemoryAgentTimelineStore();
        this.agentsAwaitingInitialSnapshotPersist = new Set();
        this.sessionEventTails = new Map();
        this.pendingForegroundRuns = new Map();
        this.subscribers = new Set();
        this.previousStatuses = new Map();
        this.backgroundTasks = new Set();
        this.idFactory = options?.idFactory ?? (() => randomUUID());
        this.registry = options?.registry;
        this.durableTimelineStore = options?.durableTimelineStore;
        this.onAgentAttention = options?.onAgentAttention;
        this.mcpBaseUrl = options?.mcpBaseUrl ?? null;
        this.logger = options.logger.child({ module: "agent", component: "agent-manager" });
        this.rescueTimeouts = {
            reloadSessionCloseMs: options.rescueTimeouts?.reloadSessionCloseMs ?? RELOAD_SESSION_CLOSE_TIMEOUT_MS,
            interruptSessionMs: options.rescueTimeouts?.interruptSessionMs ?? INTERRUPT_SESSION_TIMEOUT_MS,
        };
        this.agentStreamCoalescer = new AgentStreamCoalescer({
            windowMs: options.agentStreamCoalesceWindowMs ?? AGENT_STREAM_COALESCE_DEFAULT_WINDOW_MS,
            timers: { setTimeout, clearTimeout },
            onFlush: ({ agentId, item, provider, turnId }) => {
                const event = this.recordAndDispatchTimelineItem(agentId, item, provider, turnId);
                this.notifyForegroundTurnWaiters(agentId, event);
            },
        });
        if (options?.clients) {
            for (const [provider, client] of Object.entries(options.clients)) {
                if (client) {
                    this.registerClient(provider, client);
                }
            }
        }
    }
    registerClient(provider, client) {
        this.clients.set(provider, client);
    }
    getRegisteredProviderIds() {
        return Array.from(this.clients.keys());
    }
    setAgentAttentionCallback(callback) {
        this.onAgentAttention = callback;
    }
    setMcpBaseUrl(url) {
        this.mcpBaseUrl = url;
    }
    getMetricsSnapshot() {
        const byLifecycle = {};
        let withActiveForegroundTurn = 0;
        let totalItems = 0;
        let maxItemsPerAgent = 0;
        for (const agent of this.agents.values()) {
            byLifecycle[agent.lifecycle] = (byLifecycle[agent.lifecycle] ?? 0) + 1;
            if (agent.activeForegroundTurnId !== null) {
                withActiveForegroundTurn++;
            }
            if (!this.timelineStore.has(agent.id)) {
                continue;
            }
            const len = this.timelineStore.getItems(agent.id).length;
            totalItems += len;
            if (len > maxItemsPerAgent) {
                maxItemsPerAgent = len;
            }
        }
        return {
            total: this.agents.size,
            byLifecycle,
            withActiveForegroundTurn,
            timelineStats: {
                totalItems,
                maxItemsPerAgent,
            },
        };
    }
    touchUpdatedAt(agent) {
        const nowMs = Date.now();
        const previousMs = agent.updatedAt.getTime();
        const nextMs = nowMs > previousMs ? nowMs : previousMs + 1;
        const next = new Date(nextMs);
        agent.updatedAt = next;
        return next;
    }
    hasInFlightRun(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        return (agent.lifecycle === "running" ||
            Boolean(agent.activeForegroundTurnId) ||
            this.hasPendingForegroundRun(agentId));
    }
    subscribe(callback, options) {
        const targetAgentId = options?.agentId == null ? null : validateAgentId(options.agentId, "subscribe");
        const record = {
            callback,
            agentId: targetAgentId,
        };
        this.subscribers.add(record);
        if (options?.replayState !== false) {
            if (record.agentId) {
                const agent = this.agents.get(record.agentId);
                if (agent) {
                    callback({
                        type: "agent_state",
                        agent: { ...agent },
                    });
                }
            }
            else {
                // For global subscribers, skip internal agents during replay
                for (const agent of this.agents.values()) {
                    if (agent.internal) {
                        continue;
                    }
                    callback({
                        type: "agent_state",
                        agent: { ...agent },
                    });
                }
            }
        }
        return () => {
            this.subscribers.delete(record);
        };
    }
    listAgents() {
        return Array.from(this.agents.values())
            .filter((agent) => !agent.internal)
            .map((agent) => ({
            ...agent,
        }));
    }
    async listPersistedAgents(options) {
        if (options?.provider) {
            const client = this.requireClient(options.provider);
            if (!client.listPersistedAgents) {
                return [];
            }
            return client.listPersistedAgents({ limit: options.limit });
        }
        const descriptors = [];
        for (const [provider, client] of this.clients.entries()) {
            if (!client.listPersistedAgents) {
                continue;
            }
            try {
                const entries = await client.listPersistedAgents({
                    limit: options?.limit,
                });
                descriptors.push(...entries);
            }
            catch (error) {
                this.logger.warn({ err: error, provider }, "Failed to list persisted agents for provider");
            }
        }
        const limit = options?.limit ?? 20;
        return descriptors
            .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
            .slice(0, limit);
    }
    async listProviderAvailability() {
        const checks = Array.from(this.clients.keys()).map(async (provider) => {
            const client = this.clients.get(provider);
            if (!client) {
                return {
                    provider,
                    available: false,
                    error: `No client registered for provider '${provider}'`,
                };
            }
            try {
                const available = await client.isAvailable();
                return {
                    provider,
                    available,
                    error: null,
                };
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.warn({ err: error, provider }, "Failed to check provider availability");
                return {
                    provider,
                    available: false,
                    error: message,
                };
            }
        });
        return Promise.all(checks);
    }
    async listDraftCommands(config) {
        const normalizedConfig = await this.normalizeConfig(config);
        const client = this.requireClient(normalizedConfig.provider);
        const available = await client.isAvailable();
        if (!available) {
            throw new Error(`Provider '${normalizedConfig.provider}' is not available. Please ensure the CLI is installed.`);
        }
        const session = await client.createSession(normalizedConfig);
        try {
            if (!session.listCommands) {
                throw new Error(`Provider '${normalizedConfig.provider}' does not support listing commands`);
            }
            return await session.listCommands();
        }
        finally {
            try {
                await session.close();
            }
            catch (error) {
                this.logger.warn({ err: error, provider: normalizedConfig.provider }, "Failed to close draft command listing session");
            }
        }
    }
    async listDraftFeatures(config) {
        const normalizedConfig = await this.normalizeConfig(config);
        const client = this.requireClient(normalizedConfig.provider);
        const available = await client.isAvailable();
        if (!available) {
            throw new Error(`Provider '${normalizedConfig.provider}' is not available. Please ensure the CLI is installed.`);
        }
        const session = await client.createSession(normalizedConfig);
        try {
            return session.features ?? [];
        }
        finally {
            try {
                await session.close();
            }
            catch (error) {
                this.logger.warn({ err: error, provider: normalizedConfig.provider }, "Failed to close draft feature listing session");
            }
        }
    }
    getAgent(id) {
        const agent = this.agents.get(id);
        return agent ? { ...agent } : null;
    }
    getTimeline(id) {
        this.requireAgent(id);
        return this.timelineStore.getItems(id);
    }
    async getTimelineRows(id) {
        this.requireAgent(id);
        if (this.durableTimelineStore) {
            return await this.durableTimelineStore.getCommittedRows(id);
        }
        return this.timelineStore.getRows(id);
    }
    fetchTimeline(id, options) {
        this.requireAgent(id);
        return this.timelineStore.fetch(id, options);
    }
    async createAgent(config, agentId, options) {
        const resolvedAgentId = validateAgentId(agentId ?? this.idFactory(), "createAgent");
        const injectedConfig = this.mcpBaseUrl == null
            ? config
            : {
                ...config,
                mcpServers: {
                    paseo: {
                        type: "http",
                        url: `${this.mcpBaseUrl}?callerAgentId=${resolvedAgentId}`,
                    },
                    ...(config.mcpServers ?? {}),
                },
            };
        const normalizedConfig = await this.normalizeConfig(injectedConfig);
        const launchContext = this.buildLaunchContext(resolvedAgentId);
        const client = this.requireClient(normalizedConfig.provider);
        const available = await client.isAvailable();
        if (!available) {
            throw new Error(`Provider '${normalizedConfig.provider}' is not available. Please ensure the CLI is installed.`);
        }
        const session = await client.createSession(normalizedConfig, launchContext);
        return this.registerSession(session, normalizedConfig, resolvedAgentId, {
            labels: options?.labels,
            workspaceId: options?.workspaceId,
        });
    }
    // Reconstruct an agent from provider persistence. Callers should explicitly
    // hydrate timeline history after resume.
    async resumeAgentFromPersistence(handle, overrides, agentId, options) {
        const resolvedAgentId = validateAgentId(agentId ?? this.idFactory(), "resumeAgentFromPersistence");
        const metadata = (handle.metadata ?? {});
        const mergedConfig = {
            ...metadata,
            ...overrides,
            provider: handle.provider,
        };
        const normalizedConfig = await this.normalizeConfig(mergedConfig);
        const resumeOverrides = normalizedConfig.model !== mergedConfig.model
            ? { ...overrides, model: normalizedConfig.model }
            : overrides;
        const launchContext = this.buildLaunchContext(resolvedAgentId);
        const client = this.requireClient(handle.provider);
        const available = await client.isAvailable();
        if (!available) {
            throw new Error(`Provider '${handle.provider}' is not available. Please ensure the CLI is installed.`);
        }
        const session = await client.resumeSession(handle, resumeOverrides, launchContext);
        return this.registerSession(session, normalizedConfig, resolvedAgentId, options);
    }
    // Hot-reload an active agent session with config overrides while preserving
    // in-memory timeline state.
    async reloadAgentSession(agentId, overrides) {
        let existing = this.requireSessionAgent(agentId);
        if (this.hasInFlightRun(agentId)) {
            await this.cancelAgentRun(agentId);
            existing = this.requireSessionAgent(agentId);
        }
        const preservedHistoryPrimed = existing.historyPrimed;
        const preservedLastUsage = existing.lastUsage;
        const preservedLastError = existing.lastError;
        const preservedAttention = existing.attention;
        const handle = existing.persistence;
        const provider = handle?.provider ?? existing.provider;
        const client = this.requireClient(provider);
        const refreshConfig = {
            ...existing.config,
            ...overrides,
            provider,
        };
        const normalizedConfig = await this.normalizeConfig(refreshConfig);
        const launchContext = this.buildLaunchContext(agentId);
        const session = handle
            ? await client.resumeSession(handle, normalizedConfig, launchContext)
            : await client.createSession(normalizedConfig, launchContext);
        this.agentStreamCoalescer.flushAndDiscard(agentId);
        // Remove the existing agent entry before swapping sessions
        this.agents.delete(agentId);
        if (existing.unsubscribeSession) {
            existing.unsubscribeSession();
            existing.unsubscribeSession = null;
        }
        for (const waiter of existing.foregroundTurnWaiters) {
            this.settleForegroundTurnWaiter(waiter);
        }
        existing.foregroundTurnWaiters.clear();
        this.settlePendingForegroundRun(agentId);
        await this.closeReloadedSession(existing.session, agentId);
        // Preserve existing labels and timeline during reload.
        return this.registerSession(session, normalizedConfig, agentId, {
            labels: existing.labels,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
            lastUserMessageAt: existing.lastUserMessageAt,
            historyPrimed: preservedHistoryPrimed,
            lastUsage: preservedLastUsage,
            lastError: preservedLastError,
            attention: preservedAttention,
        });
    }
    async closeReloadedSession(session, agentId) {
        try {
            const result = await this.waitWithTimeout({
                operation: session.close(),
                timeoutMs: this.rescueTimeouts.reloadSessionCloseMs,
                onLateError: (error) => {
                    this.logger.warn({ err: error, agentId }, "Previous session close failed after refresh timeout");
                },
            });
            if (result === "timed_out") {
                this.logger.warn({ agentId, timeoutMs: this.rescueTimeouts.reloadSessionCloseMs }, "Timed out closing previous session during refresh");
            }
        }
        catch (error) {
            this.logger.warn({ err: error, agentId }, "Failed to close previous session during refresh");
        }
    }
    async waitWithTimeout(options) {
        let didTimeOut = false;
        let timer = null;
        const operation = options.operation
            .then(() => "completed")
            .catch((error) => {
            if (didTimeOut) {
                options.onLateError?.(error);
                return "timed_out";
            }
            throw error;
        });
        try {
            return await Promise.race([
                operation,
                new Promise((resolve) => {
                    timer = setTimeout(() => {
                        didTimeOut = true;
                        resolve("timed_out");
                    }, options.timeoutMs);
                }),
            ]);
        }
        finally {
            if (timer) {
                clearTimeout(timer);
            }
        }
    }
    async closeAgent(agentId) {
        const agent = this.requireAgent(agentId);
        this.logger.trace({
            agentId,
            lifecycle: agent.lifecycle,
            activeForegroundTurnId: agent.activeForegroundTurnId,
            pendingPermissions: agent.pendingPermissions.size,
        }, "closeAgent: start");
        const closedAgent = this.prepareAgentForClosure(agent, "agent closed");
        await agent.session.close();
        this.timelineStore.delete(agentId);
        await this.persistSnapshot(closedAgent);
        this.emitClosedAgent(closedAgent, { persist: false });
        this.logger.trace({ agentId }, "closeAgent: completed");
    }
    async archiveAgent(agentId) {
        const agent = this.requireAgent(agentId);
        if (!this.registry) {
            throw new Error("Agent storage is not configured");
        }
        await this.registry.applySnapshot(agent, {
            internal: agent.internal,
        });
        const stored = await this.registry.get(agentId);
        if (!stored) {
            throw new Error(`Agent ${agentId} not found in storage after snapshot`);
        }
        const archivedAt = new Date().toISOString();
        const normalizedStatus = stored.lastStatus === "running" || stored.lastStatus === "initializing"
            ? "idle"
            : stored.lastStatus;
        await this.registry.upsert({
            ...stored,
            archivedAt,
            updatedAt: archivedAt,
            lastStatus: normalizedStatus,
            requiresAttention: false,
            attentionReason: null,
            attentionTimestamp: null,
        });
        this.notifyAgentState(agentId);
        await this.closeAgent(agentId);
        return { archivedAt };
    }
    async setAgentMode(agentId, modeId) {
        const agent = this.requireSessionAgent(agentId);
        await agent.session.setMode(modeId);
        agent.config.modeId = modeId;
        agent.currentModeId = modeId;
        // Update runtimeInfo to reflect the new mode
        if (agent.runtimeInfo) {
            agent.runtimeInfo = { ...agent.runtimeInfo, modeId };
        }
        this.touchUpdatedAt(agent);
        this.emitState(agent);
    }
    async setAgentModel(agentId, modelId) {
        const agent = this.requireSessionAgent(agentId);
        const normalizedModelId = typeof modelId === "string" && modelId.trim().length > 0 ? modelId : null;
        if (agent.session.setModel) {
            await agent.session.setModel(normalizedModelId);
        }
        agent.config.model = normalizedModelId ?? undefined;
        if (agent.runtimeInfo) {
            agent.runtimeInfo = { ...agent.runtimeInfo, model: normalizedModelId };
        }
        this.touchUpdatedAt(agent);
        this.emitState(agent);
    }
    async setAgentThinkingOption(agentId, thinkingOptionId) {
        const agent = this.requireSessionAgent(agentId);
        const normalizedThinkingOptionId = typeof thinkingOptionId === "string" && thinkingOptionId.trim().length > 0
            ? thinkingOptionId
            : null;
        if (agent.session.setThinkingOption) {
            await agent.session.setThinkingOption(normalizedThinkingOptionId);
        }
        agent.config.thinkingOptionId = normalizedThinkingOptionId ?? undefined;
        if (agent.runtimeInfo) {
            agent.runtimeInfo = {
                ...agent.runtimeInfo,
                thinkingOptionId: normalizedThinkingOptionId,
            };
        }
        this.touchUpdatedAt(agent);
        this.emitState(agent);
    }
    async setAgentFeature(agentId, featureId, value) {
        const agent = this.requireAgent(agentId);
        if (!agent.session.setFeature) {
            throw new Error("Agent session does not support setting features");
        }
        await agent.session.setFeature(featureId, value);
        agent.config.featureValues = { ...agent.config.featureValues, [featureId]: value };
        this.touchUpdatedAt(agent);
        this.emitState(agent);
    }
    async setTitle(agentId, title) {
        const agent = this.requireAgent(agentId);
        const normalizedTitle = title.trim();
        if (!normalizedTitle) {
            return;
        }
        if (this.agentsAwaitingInitialSnapshotPersist.has(agent.id) &&
            this.registry &&
            (await this.registry.get(agent.id)) === null) {
            return;
        }
        this.touchUpdatedAt(agent);
        await this.persistSnapshot(agent, { title: normalizedTitle });
        this.emitState(agent, { persist: false });
    }
    async setLabels(agentId, labels) {
        const agent = this.requireAgent(agentId);
        agent.labels = { ...agent.labels, ...labels };
        this.touchUpdatedAt(agent);
        await this.persistSnapshot(agent);
        this.emitState(agent, { persist: false });
    }
    notifyAgentState(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent || agent.internal) {
            return;
        }
        this.touchUpdatedAt(agent);
        this.emitState(agent);
    }
    async clearAgentAttention(agentId) {
        const agent = this.requireAgent(agentId);
        if (agent.attention.requiresAttention) {
            agent.attention = { requiresAttention: false };
            await this.persistSnapshot(agent);
            this.emitState(agent, { persist: false });
        }
    }
    async archiveSnapshot(agentId, archivedAt) {
        const registry = this.requireRegistry();
        const liveAgent = this.getAgent(agentId);
        if (liveAgent) {
            await this.persistSnapshot(liveAgent, {
                internal: liveAgent.internal,
            });
        }
        const record = await registry.get(agentId);
        if (!record) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        const normalizedStatus = record.lastStatus === "running" || record.lastStatus === "initializing"
            ? "idle"
            : record.lastStatus;
        const nextRecord = {
            ...record,
            archivedAt,
            lastStatus: normalizedStatus,
            requiresAttention: false,
            attentionReason: null,
            attentionTimestamp: null,
        };
        await registry.upsert(nextRecord);
        return nextRecord;
    }
    async unarchiveSnapshot(agentId) {
        const registry = this.requireRegistry();
        const record = await registry.get(agentId);
        if (!record || !record.archivedAt) {
            return false;
        }
        await registry.upsert({
            ...record,
            archivedAt: null,
        });
        if (this.getAgent(agentId)) {
            this.notifyAgentState(agentId);
        }
        return true;
    }
    async unarchiveSnapshotByHandle(handle) {
        const registry = this.requireRegistry();
        const records = await registry.list();
        const matched = records.find((record) => record.persistence?.provider === handle.provider &&
            record.persistence?.sessionId === handle.sessionId);
        if (!matched) {
            return;
        }
        await this.unarchiveSnapshot(matched.id);
    }
    async updateAgentMetadata(agentId, updates) {
        const liveAgent = this.getAgent(agentId);
        if (liveAgent) {
            if (updates.title) {
                await this.setTitle(agentId, updates.title);
            }
            if (updates.labels) {
                await this.setLabels(agentId, updates.labels);
            }
            return;
        }
        const registry = this.requireRegistry();
        const existing = await registry.get(agentId);
        if (!existing) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        await registry.upsert({
            ...existing,
            ...(updates.title ? { title: updates.title } : {}),
            ...(updates.labels ? { labels: { ...existing.labels, ...updates.labels } } : {}),
        });
    }
    async runAgent(agentId, prompt, options) {
        const events = this.streamAgent(agentId, prompt, options);
        const timeline = [];
        let finalText = "";
        let usage;
        let canceled = false;
        for await (const event of events) {
            if (event.type === "timeline") {
                timeline.push(event.item);
            }
            else if (event.type === "turn_completed") {
                usage = event.usage;
            }
            else if (event.type === "turn_failed") {
                throw new Error(this.formatTurnFailedMessage(event));
            }
            else if (event.type === "turn_canceled") {
                canceled = true;
            }
        }
        finalText = this.getLastAssistantMessageFromTimeline(timeline) ?? "";
        const agent = this.requireAgent(agentId);
        const sessionId = agent.persistence?.sessionId;
        if (!sessionId) {
            throw new Error(`Agent ${agentId} has no persistence.sessionId after run completed`);
        }
        return {
            sessionId,
            finalText,
            usage,
            timeline,
            canceled,
        };
    }
    recordUserMessage(agentId, text, options) {
        const agent = this.requireAgent(agentId);
        const normalizedMessageId = normalizeMessageId(options?.messageId);
        const item = {
            type: "user_message",
            text,
            messageId: normalizedMessageId,
        };
        const updatedAt = this.touchUpdatedAt(agent);
        agent.lastUserMessageAt = updatedAt;
        const row = this.recordTimeline(agentId, item);
        this.dispatchStream(agentId, {
            type: "timeline",
            item,
            provider: agent.provider,
        }, {
            seq: row.seq,
            epoch: this.timelineStore.getEpoch(agentId),
        });
        if (options?.emitState !== false) {
            this.emitState(agent);
        }
    }
    async appendTimelineItem(agentId, item) {
        const agent = this.requireAgent(agentId);
        this.touchUpdatedAt(agent);
        const row = this.recordTimeline(agentId, item);
        this.dispatchStream(agentId, {
            type: "timeline",
            item,
            provider: agent.provider,
        }, {
            seq: row.seq,
            epoch: this.timelineStore.getEpoch(agentId),
        });
        await this.persistSnapshot(agent);
    }
    async emitLiveTimelineItem(agentId, item) {
        const agent = this.requireAgent(agentId);
        this.touchUpdatedAt(agent);
        this.dispatchStream(agentId, {
            type: "timeline",
            item,
            provider: agent.provider,
        });
    }
    streamAgent(agentId, prompt, options) {
        const existingAgent = this.requireSessionAgent(agentId);
        this.logger.trace({
            agentId,
            lifecycle: existingAgent.lifecycle,
            activeForegroundTurnId: existingAgent.activeForegroundTurnId,
            hasPendingForegroundRun: this.hasPendingForegroundRun(agentId),
            promptType: typeof prompt === "string" ? "string" : "structured",
            hasRunOptions: Boolean(options),
        }, "streamAgent: requested");
        if (existingAgent.activeForegroundTurnId || this.hasPendingForegroundRun(agentId)) {
            this.logger.trace({
                agentId,
                lifecycle: existingAgent.lifecycle,
                hasPendingForegroundRun: this.hasPendingForegroundRun(agentId),
            }, "streamAgent: rejected because a foreground run is already in flight");
            throw new Error(`Agent ${agentId} already has an active run`);
        }
        const agent = existingAgent;
        agent.pendingReplacement = false;
        agent.lastError = undefined;
        const self = this;
        const pendingRun = self.createPendingForegroundRun();
        self.pendingForegroundRuns.set(agentId, pendingRun);
        const streamForwarder = (async function* streamForwarder() {
            let turnId;
            let waiter = null;
            try {
                const result = await agent.session.startTurn(prompt, options);
                turnId = result.turnId;
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : "Failed to start turn";
                self.handleStreamEvent(agent, {
                    type: "turn_failed",
                    provider: agent.provider,
                    error: errorMsg,
                });
                self.finalizeForegroundTurn(agent);
                throw error;
            }
            pendingRun.started = true;
            agent.activeForegroundTurnId = turnId;
            agent.lifecycle = "running";
            self.touchUpdatedAt(agent);
            self.emitState(agent);
            self.logger.trace({
                agentId,
                lifecycle: agent.lifecycle,
                activeForegroundTurnId: agent.activeForegroundTurnId,
            }, "streamAgent: started");
            // Create a pushable queue for this foreground turn
            const queue = [];
            let queueResolve = null;
            let done = false;
            let resolveSettled;
            const settledPromise = new Promise((resolve) => {
                resolveSettled = resolve;
            });
            waiter = {
                turnId,
                settled: false,
                settledPromise,
                resolveSettled,
                callback: (event) => {
                    queue.push(event);
                    if (queueResolve) {
                        queueResolve();
                        queueResolve = null;
                    }
                },
            };
            agent.foregroundTurnWaiters.add(waiter);
            try {
                while (!done) {
                    while (queue.length > 0) {
                        const event = queue.shift();
                        yield event;
                        if (isTurnTerminalEvent(event)) {
                            done = true;
                            break;
                        }
                    }
                    if (!done && queue.length === 0) {
                        if (waiter.settled) {
                            break;
                        }
                        await new Promise((resolve) => {
                            queueResolve = resolve;
                        });
                    }
                }
            }
            finally {
                if (waiter) {
                    agent.foregroundTurnWaiters.delete(waiter);
                    self.settleForegroundTurnWaiter(waiter);
                }
                self.settlePendingForegroundRun(agentId, pendingRun.token);
                if (!agent.activeForegroundTurnId) {
                    await self.refreshRuntimeInfo(agent);
                }
            }
        })();
        return streamForwarder;
    }
    finalizeForegroundTurn(agent, turnId) {
        const mutableAgent = agent;
        if (turnId) {
            this.rememberFinalizedForegroundTurn(mutableAgent, turnId);
        }
        mutableAgent.activeForegroundTurnId = null;
        const terminalError = mutableAgent.lastError;
        const shouldHoldBusyForReplacement = mutableAgent.pendingReplacement && !terminalError;
        mutableAgent.lifecycle = shouldHoldBusyForReplacement
            ? "running"
            : terminalError
                ? "error"
                : "idle";
        const persistenceHandle = mutableAgent.session.describePersistence() ??
            (mutableAgent.runtimeInfo?.sessionId
                ? { provider: mutableAgent.provider, sessionId: mutableAgent.runtimeInfo.sessionId }
                : null);
        if (persistenceHandle) {
            mutableAgent.persistence = attachPersistenceCwd(persistenceHandle, mutableAgent.cwd);
        }
        this.logger.trace({
            agentId: agent.id,
            lifecycle: mutableAgent.lifecycle,
            terminalError,
            pendingReplacement: mutableAgent.pendingReplacement,
        }, "finalizeForegroundTurn: applying terminal state");
        if (!shouldHoldBusyForReplacement) {
            this.touchUpdatedAt(mutableAgent);
            this.emitState(mutableAgent);
        }
    }
    replaceAgentRun(agentId, prompt, options) {
        const snapshot = this.requireAgent(agentId);
        if (snapshot.lifecycle !== "running" &&
            !snapshot.activeForegroundTurnId &&
            !this.hasPendingForegroundRun(agentId)) {
            return this.streamAgent(agentId, prompt, options);
        }
        const agent = this.requireSessionAgent(agentId);
        agent.pendingReplacement = true;
        agent.lifecycle = "running";
        this.touchUpdatedAt(agent);
        this.emitState(agent);
        const self = this;
        return (async function* replaceRunForwarder() {
            try {
                await self.cancelAgentRun(agentId);
                const nextRun = self.streamAgent(agentId, prompt, options);
                for await (const event of nextRun) {
                    yield event;
                }
            }
            catch (error) {
                const latest = self.agents.get(agentId);
                if (latest) {
                    const latestActive = latest;
                    latestActive.pendingReplacement = false;
                    if (!latestActive.activeForegroundTurnId && latestActive.lifecycle === "running") {
                        latestActive.lifecycle = "idle";
                        self.touchUpdatedAt(latestActive);
                        self.emitState(latestActive);
                    }
                }
                throw error;
            }
        })();
    }
    async waitForAgentRunStart(agentId, options) {
        const snapshot = this.getAgent(agentId);
        if (!snapshot) {
            throw new Error(`Agent ${agentId} not found`);
        }
        const pendingRun = this.getPendingForegroundRun(agentId);
        if ((snapshot.lifecycle === "running" || pendingRun?.started) && !snapshot.pendingReplacement) {
            return;
        }
        if (!snapshot.activeForegroundTurnId && !pendingRun && !snapshot.pendingReplacement) {
            throw new Error(`Agent ${agentId} has no pending run`);
        }
        if (options?.signal?.aborted) {
            throw createAbortError(options.signal, "wait_for_agent_start aborted");
        }
        await new Promise((resolve, reject) => {
            if (options?.signal?.aborted) {
                reject(createAbortError(options.signal, "wait_for_agent_start aborted"));
                return;
            }
            let unsubscribe = null;
            let abortHandler = null;
            const cleanup = () => {
                if (unsubscribe) {
                    try {
                        unsubscribe();
                    }
                    catch {
                        // ignore cleanup errors
                    }
                    unsubscribe = null;
                }
                if (abortHandler && options?.signal) {
                    try {
                        options.signal.removeEventListener("abort", abortHandler);
                    }
                    catch {
                        // ignore cleanup errors
                    }
                    abortHandler = null;
                }
            };
            const finishOk = () => {
                cleanup();
                resolve();
            };
            const finishErr = (error) => {
                cleanup();
                reject(error);
            };
            if (options?.signal) {
                abortHandler = () => finishErr(createAbortError(options.signal, "wait_for_agent_start aborted"));
                options.signal.addEventListener("abort", abortHandler, { once: true });
            }
            const checkCurrentState = () => {
                const current = this.getAgent(agentId);
                if (!current) {
                    finishErr(new Error(`Agent ${agentId} not found`));
                    return true;
                }
                const currentPendingRun = this.getPendingForegroundRun(agentId);
                if ((current.lifecycle === "running" || currentPendingRun?.started) &&
                    !current.pendingReplacement) {
                    finishOk();
                    return true;
                }
                if (current.lifecycle === "error" && !currentPendingRun?.started) {
                    finishErr(new Error(current.lastError ?? `Agent ${agentId} failed to start`));
                    return true;
                }
                if (!currentPendingRun && !current.activeForegroundTurnId && !current.pendingReplacement) {
                    finishErr(new Error(`Agent ${agentId} run finished before starting`));
                    return true;
                }
                return false;
            };
            unsubscribe = this.subscribe((event) => {
                if (event.type !== "agent_state" || event.agent.id !== agentId) {
                    return;
                }
                checkCurrentState();
            }, { agentId, replayState: false });
            checkCurrentState();
        });
    }
    async respondToPermission(agentId, requestId, response) {
        const agent = this.requireAgent(agentId);
        agent.inFlightPermissionResponses.add(requestId);
        try {
            const result = await agent.session.respondToPermission(requestId, response);
            agent.pendingPermissions.delete(requestId);
            try {
                await this.refreshSessionState(agent);
            }
            catch {
                // Ignore refresh errors - state sync after permission approval is best effort.
            }
            this.touchUpdatedAt(agent);
            await this.persistSnapshot(agent);
            this.emitState(agent);
            const bufferedResolution = agent.bufferedPermissionResolutions.get(requestId);
            if (bufferedResolution) {
                agent.bufferedPermissionResolutions.delete(requestId);
                this.dispatchStream(agent.id, bufferedResolution);
            }
            return result;
        }
        finally {
            agent.inFlightPermissionResponses.delete(requestId);
            agent.bufferedPermissionResolutions.delete(requestId);
        }
    }
    async cancelAgentRun(agentId) {
        const agent = this.requireSessionAgent(agentId);
        const pendingRun = this.getPendingForegroundRun(agentId);
        const foregroundTurnId = agent.activeForegroundTurnId;
        const hasForegroundTurn = Boolean(foregroundTurnId);
        const isAutonomousRunning = agent.lifecycle === "running" && !hasForegroundTurn && !pendingRun;
        if (!hasForegroundTurn && !isAutonomousRunning && !pendingRun) {
            return false;
        }
        await this.interruptSession(agent.session, agentId);
        // The interrupt will produce a turn_canceled/turn_failed event via subscribe(),
        // which flows through the session event dispatcher and settles the foreground turn waiter.
        // Wait briefly for the event to propagate if there's an active foreground turn.
        if (foregroundTurnId) {
            const waiter = Array.from(agent.foregroundTurnWaiters).find((candidate) => candidate.turnId === foregroundTurnId);
            const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
            if (waiter) {
                await Promise.race([waiter.settledPromise, timeout]);
            }
            else if (agent.activeForegroundTurnId === foregroundTurnId) {
                await Promise.race([
                    new Promise((resolve) => {
                        const unsubscribe = this.subscribe((event) => {
                            if (event.type === "agent_state" &&
                                event.agent.id === agentId &&
                                !event.agent.activeForegroundTurnId) {
                                unsubscribe();
                                resolve();
                            }
                        }, { agentId, replayState: false });
                    }),
                    timeout,
                ]);
            }
            // The waiter settling wakes up the streamForwarder generator, but its
            // finally block (which deletes the pendingForegroundRun) runs asynchronously.
            // Wait for the pending run to be fully cleaned up so the next streamAgent
            // call doesn't see a stale entry and reject with "already has an active run".
            if (pendingRun && !pendingRun.settled) {
                await Promise.race([pendingRun.settledPromise, timeout]);
            }
        }
        else if (pendingRun) {
            const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
            await Promise.race([pendingRun.settledPromise, timeout]);
        }
        // If the foreground turn is still stuck after the timeout, force-dispatch a
        // synthetic turn_canceled so the normal event pipeline cleans up
        // activeForegroundTurnId, settles waiters, and unblocks the streamForwarder.
        if (foregroundTurnId && agent.activeForegroundTurnId === foregroundTurnId) {
            this.logger.warn({ agentId, foregroundTurnId }, "cancelAgentRun: foreground turn still active after timeout, force-canceling");
            this.dispatchSessionEvent(agent, {
                type: "turn_canceled",
                provider: agent.provider,
                reason: "interrupted",
                turnId: foregroundTurnId,
            });
            // The synthetic event unblocks the streamForwarder generator, whose finally
            // block settles the pending foreground run asynchronously. Wait for it.
            const staleRun = this.getPendingForegroundRun(agentId);
            if (staleRun && !staleRun.settled) {
                await staleRun.settledPromise;
            }
        }
        // Clear any pending permissions that weren't cleaned up by handleStreamEvent.
        if (agent.pendingPermissions.size > 0) {
            for (const [requestId] of agent.pendingPermissions) {
                this.dispatchStream(agent.id, {
                    type: "permission_resolved",
                    provider: agent.provider,
                    requestId,
                    resolution: { behavior: "deny", message: "Interrupted" },
                });
            }
            agent.pendingPermissions.clear();
            this.touchUpdatedAt(agent);
            this.emitState(agent);
        }
        return true;
    }
    async interruptSession(session, agentId) {
        try {
            const result = await this.waitWithTimeout({
                operation: session.interrupt(),
                timeoutMs: this.rescueTimeouts.interruptSessionMs,
                onLateError: (error) => {
                    this.logger.warn({ err: error, agentId }, "Session interrupt failed after timeout during cancel");
                },
            });
            if (result === "timed_out") {
                this.logger.warn({ agentId, timeoutMs: this.rescueTimeouts.interruptSessionMs }, "Timed out interrupting session during cancel");
            }
        }
        catch (error) {
            this.logger.error({ err: error, agentId }, "Failed to interrupt session");
        }
    }
    getPendingPermissions(agentId) {
        const agent = this.requireSessionAgent(agentId);
        return Array.from(agent.pendingPermissions.values());
    }
    peekPendingPermission(agent) {
        const iterator = agent.pendingPermissions.values().next();
        return iterator.done ? null : iterator.value;
    }
    /**
     * Hydrates the timeline from provider history if the agent's durable
     * timeline is empty (e.g., imported agents that have provider history
     * on disk but no persisted timeline rows). No-ops if already hydrated.
     */
    async hydrateTimelineFromProvider(agentId) {
        const agent = this.requireSessionAgent(agentId);
        await this.hydrateTimelineFromLegacyProviderHistory(agent);
    }
    async deleteCommittedTimeline(agentId) {
        if (!this.durableTimelineStore) {
            return;
        }
        await this.durableTimelineStore.deleteAgent(agentId);
    }
    async getLastAssistantMessage(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return null;
        }
        return await this.getLastAssistantMessageFromStores(agentId);
    }
    getLastAssistantMessageFromTimeline(timeline) {
        return this.getLastAssistantMessageSegmentFromTimeline(timeline)?.text ?? null;
    }
    getLastAssistantMessageSegmentFromTimeline(timeline) {
        // Collect the last contiguous assistant messages (Claude streams chunks)
        const chunks = [];
        let startsAtBeginning = false;
        for (let i = timeline.length - 1; i >= 0; i--) {
            const item = timeline[i];
            if (item.type !== "assistant_message") {
                if (chunks.length) {
                    break;
                }
                continue;
            }
            chunks.push(item.text);
            startsAtBeginning = i === 0;
        }
        if (!chunks.length) {
            return null;
        }
        return {
            text: chunks.reverse().join(""),
            startsAtBeginning,
        };
    }
    async getLastAssistantMessageFromStores(agentId) {
        const liveTimeline = this.timelineStore.getItems(agentId);
        const liveSegment = this.getLastAssistantMessageSegmentFromTimeline(liveTimeline);
        if (!this.durableTimelineStore) {
            return liveSegment?.text ?? null;
        }
        if (!liveSegment) {
            return await this.durableTimelineStore.getLastAssistantMessage(agentId);
        }
        if (!liveSegment.startsAtBeginning) {
            return liveSegment.text;
        }
        const lastDurableItem = await this.durableTimelineStore.getLastItem(agentId);
        if (lastDurableItem?.type !== "assistant_message") {
            return liveSegment.text;
        }
        const durableMessage = await this.durableTimelineStore.getLastAssistantMessage(agentId);
        return durableMessage ? `${durableMessage}${liveSegment.text}` : liveSegment.text;
    }
    async getLastItemFromStores(agentId) {
        const lastLiveItem = this.timelineStore.getLastItem(agentId);
        if (lastLiveItem) {
            return lastLiveItem;
        }
        if (!this.durableTimelineStore) {
            return null;
        }
        return await this.durableTimelineStore.getLastItem(agentId);
    }
    async hasCommittedUserMessageFromStores(agentId, options) {
        if (this.timelineStore.hasCommittedUserMessage(agentId, options)) {
            return true;
        }
        if (!this.durableTimelineStore) {
            return false;
        }
        return await this.durableTimelineStore.hasCommittedUserMessage(agentId, options);
    }
    async waitForAgentEvent(agentId, options) {
        const snapshot = this.getAgent(agentId);
        if (!snapshot) {
            throw new Error(`Agent ${agentId} not found`);
        }
        const pendingForegroundRun = this.getPendingForegroundRun(agentId);
        const hasForegroundTurn = Boolean(snapshot.activeForegroundTurnId) || Boolean(pendingForegroundRun);
        const immediatePermission = this.peekPendingPermission(snapshot);
        if (immediatePermission) {
            return {
                status: snapshot.lifecycle,
                permission: immediatePermission,
                lastMessage: await this.getLastAssistantMessage(agentId),
            };
        }
        const initialStatus = snapshot.lifecycle;
        const initialBusy = isAgentBusy(initialStatus) || hasForegroundTurn;
        const waitForActive = options?.waitForActive ?? false;
        if (!waitForActive && !initialBusy) {
            return {
                status: initialStatus,
                permission: null,
                lastMessage: await this.getLastAssistantMessage(agentId),
            };
        }
        if (waitForActive && !initialBusy && !hasForegroundTurn) {
            return {
                status: initialStatus,
                permission: null,
                lastMessage: await this.getLastAssistantMessage(agentId),
            };
        }
        if (options?.signal?.aborted) {
            throw createAbortError(options.signal, "wait_for_agent aborted");
        }
        return await new Promise((resolve, reject) => {
            // Bug #1 Fix: Check abort signal AGAIN inside Promise constructor
            // to avoid race condition between pre-Promise check and abort listener registration
            if (options?.signal?.aborted) {
                reject(createAbortError(options.signal, "wait_for_agent aborted"));
                return;
            }
            let currentStatus = initialStatus;
            let hasStarted = isAgentBusy(initialStatus) ||
                Boolean(snapshot.activeForegroundTurnId) ||
                Boolean(pendingForegroundRun?.started);
            let terminalStatusOverride = null;
            let finished = false;
            // Bug #3 Fix: Declare unsubscribe and abortHandler upfront so cleanup can reference them
            let unsubscribe = null;
            let abortHandler = null;
            const cleanup = () => {
                // Clean up subscription
                if (unsubscribe) {
                    try {
                        unsubscribe();
                    }
                    catch {
                        // ignore cleanup errors
                    }
                    unsubscribe = null;
                }
                // Clean up abort listener
                if (abortHandler && options?.signal) {
                    try {
                        options.signal.removeEventListener("abort", abortHandler);
                    }
                    catch {
                        // ignore cleanup errors
                    }
                    abortHandler = null;
                }
            };
            const finish = (permission) => {
                if (finished) {
                    return;
                }
                finished = true;
                cleanup();
                void this.getLastAssistantMessage(agentId)
                    .then((lastMessage) => {
                    resolve({
                        status: currentStatus,
                        permission,
                        lastMessage,
                    });
                })
                    .catch(reject);
            };
            // Bug #3 Fix: Set up abort handler BEFORE subscription
            // to ensure cleanup handlers exist before callback can fire
            if (options?.signal) {
                abortHandler = () => {
                    cleanup();
                    reject(createAbortError(options.signal, "wait_for_agent aborted"));
                };
                options.signal.addEventListener("abort", abortHandler, { once: true });
            }
            // Bug #3 Fix: Now subscribe with cleanup handlers already in place
            // This prevents race condition if callback fires synchronously with replayState: true
            unsubscribe = this.subscribe((event) => {
                if (event.type === "agent_state") {
                    currentStatus = event.agent.lifecycle;
                    const pending = this.peekPendingPermission(event.agent);
                    if (pending) {
                        finish(pending);
                        return;
                    }
                    if (isAgentBusy(event.agent.lifecycle)) {
                        hasStarted = true;
                        return;
                    }
                    if (!waitForActive || hasStarted) {
                        if (terminalStatusOverride) {
                            currentStatus = terminalStatusOverride;
                        }
                        finish(null);
                    }
                    return;
                }
                if (event.type === "agent_stream") {
                    if (event.event.type === "permission_requested") {
                        finish(event.event.request);
                        return;
                    }
                    if (event.event.type === "turn_failed") {
                        hasStarted = true;
                        terminalStatusOverride = "error";
                        return;
                    }
                    if (event.event.type === "turn_completed") {
                        hasStarted = true;
                    }
                    if (event.event.type === "turn_canceled") {
                        hasStarted = true;
                    }
                }
            }, { agentId, replayState: true });
        });
    }
    async registerSession(session, config, agentId, options) {
        const resolvedAgentId = validateAgentId(agentId, "registerSession");
        if (this.agents.has(resolvedAgentId)) {
            throw new Error(`Agent with id ${resolvedAgentId} already exists`);
        }
        const initialPersistedTitle = await this.resolveInitialPersistedTitle(resolvedAgentId, config);
        const now = new Date();
        const explicitTimelineSeed = options?.timeline?.length ||
            options?.timelineRows?.length ||
            options?.timelineNextSeq !== undefined
            ? {
                items: options?.timeline,
                rows: options?.timelineRows,
                nextSeq: options?.timelineNextSeq,
                timestamp: (options?.updatedAt ?? options?.createdAt ?? now).toISOString(),
            }
            : null;
        const shouldSeedFromDurable = !explicitTimelineSeed &&
            !this.timelineStore.has(resolvedAgentId) &&
            this.durableTimelineStore !== undefined;
        const durableTimelineSeed = shouldSeedFromDurable
            ? await this.loadCommittedTimelineSeed(resolvedAgentId, now)
            : null;
        const durableTimelineHasRows = durableTimelineSeed != null && (durableTimelineSeed.nextSeq ?? 1) > 1;
        const timelineSeed = explicitTimelineSeed ?? durableTimelineSeed;
        if (timelineSeed || !this.timelineStore.has(resolvedAgentId)) {
            this.timelineStore.initialize(resolvedAgentId, timelineSeed ?? { timestamp: now.toISOString() });
        }
        if (options?.timelineRows?.length) {
            this.enqueueDurableTimelineBulkInsert(resolvedAgentId, options.timelineRows);
        }
        const managed = {
            id: resolvedAgentId,
            provider: config.provider,
            cwd: config.cwd,
            session,
            capabilities: session.capabilities,
            config,
            runtimeInfo: undefined,
            lifecycle: "initializing",
            createdAt: options?.createdAt ?? now,
            updatedAt: options?.updatedAt ?? now,
            availableModes: [],
            currentModeId: null,
            pendingPermissions: new Map(),
            bufferedPermissionResolutions: new Map(),
            inFlightPermissionResponses: new Set(),
            pendingReplacement: false,
            activeForegroundTurnId: null,
            foregroundTurnWaiters: new Set(),
            finalizedForegroundTurnIds: new Set(),
            unsubscribeSession: null,
            persistence: attachPersistenceCwd(session.describePersistence(), config.cwd),
            historyPrimed: options?.historyPrimed ?? durableTimelineHasRows,
            lastUserMessageAt: options?.lastUserMessageAt ?? null,
            lastUsage: options?.lastUsage,
            lastError: options?.lastError,
            attention: options?.attention != null
                ? options.attention.requiresAttention
                    ? {
                        requiresAttention: true,
                        attentionReason: options.attention.attentionReason,
                        attentionTimestamp: new Date(options.attention.attentionTimestamp),
                    }
                    : { requiresAttention: false }
                : { requiresAttention: false },
            internal: config.internal ?? false,
            labels: options?.labels ?? {},
        };
        this.agents.set(resolvedAgentId, managed);
        // Initialize previousStatus to track transitions
        this.previousStatuses.set(resolvedAgentId, managed.lifecycle);
        await this.refreshRuntimeInfo(managed);
        await this.persistSnapshot(managed, {
            workspaceId: options?.workspaceId,
            title: initialPersistedTitle,
        });
        this.emitState(managed, { persist: false });
        await this.refreshSessionState(managed);
        managed.lifecycle = "idle";
        await this.persistSnapshot(managed, { workspaceId: options?.workspaceId });
        this.emitState(managed, { persist: false });
        this.subscribeToSession(managed);
        return { ...managed };
    }
    async loadCommittedTimelineSeed(agentId, now) {
        if (!this.durableTimelineStore) {
            return { timestamp: now.toISOString() };
        }
        return {
            nextSeq: (await this.durableTimelineStore.getLatestCommittedSeq(agentId)) + 1,
            timestamp: now.toISOString(),
        };
    }
    prepareAgentForClosure(agent, cancelReason) {
        this.agentStreamCoalescer.flushAndDiscard(agent.id);
        this.agents.delete(agent.id);
        this.previousStatuses.delete(agent.id);
        if (agent.unsubscribeSession) {
            agent.unsubscribeSession();
            agent.unsubscribeSession = null;
        }
        for (const waiter of agent.foregroundTurnWaiters) {
            waiter.callback({
                type: "turn_canceled",
                provider: agent.provider,
                reason: cancelReason,
                turnId: waiter.turnId,
            });
            this.settleForegroundTurnWaiter(waiter);
        }
        agent.foregroundTurnWaiters.clear();
        this.settlePendingForegroundRun(agent.id);
        return {
            ...agent,
            lifecycle: "closed",
            session: null,
            activeForegroundTurnId: null,
        };
    }
    emitClosedAgent(agent, options) {
        this.emitState(agent, options);
    }
    subscribeToSession(agent) {
        if (agent.unsubscribeSession) {
            return;
        }
        const agentId = agent.id;
        const unsubscribe = agent.session.subscribe((event) => {
            this.enqueueSessionEvent(agentId, event);
        });
        agent.unsubscribeSession = unsubscribe;
    }
    enqueueSessionEvent(agentId, event) {
        const previous = this.sessionEventTails.get(agentId) ?? Promise.resolve();
        const next = previous
            .catch(() => undefined)
            .then(async () => {
            const current = this.agents.get(agentId);
            if (!current) {
                return;
            }
            if (current.session == null) {
                return;
            }
            await this.dispatchSessionEvent(current, event);
        })
            .catch((err) => {
            this.logger.error({ err, agentId, eventType: event.type }, "Failed to process session event");
        });
        this.sessionEventTails.set(agentId, next);
        this.trackBackgroundTask(next);
        void next.finally(() => {
            if (this.sessionEventTails.get(agentId) === next) {
                this.sessionEventTails.delete(agentId);
            }
        });
    }
    async dispatchSessionEvent(agent, event) {
        const turnId = event.turnId;
        const matchingWaiters = turnId == null
            ? []
            : Array.from(agent.foregroundTurnWaiters).filter((waiter) => waiter.turnId === turnId && !waiter.settled);
        const shouldNotifyWaiters = await this.handleStreamEvent(agent, event);
        if (!shouldNotifyWaiters) {
            return;
        }
        for (const waiter of matchingWaiters) {
            waiter.callback(event);
            if (isTurnTerminalEvent(event)) {
                this.settleForegroundTurnWaiter(waiter);
            }
        }
    }
    settleForegroundTurnWaiter(waiter) {
        if (waiter.settled) {
            return;
        }
        waiter.settled = true;
        waiter.resolveSettled();
    }
    rememberFinalizedForegroundTurn(agent, turnId) {
        agent.finalizedForegroundTurnIds.add(turnId);
        if (agent.finalizedForegroundTurnIds.size <= 50) {
            return;
        }
        const oldest = agent.finalizedForegroundTurnIds.values().next().value;
        if (oldest) {
            agent.finalizedForegroundTurnIds.delete(oldest);
        }
    }
    createPendingForegroundRun() {
        let resolveSettled;
        const settledPromise = new Promise((resolve) => {
            resolveSettled = resolve;
        });
        return {
            token: randomUUID(),
            started: false,
            settled: false,
            settledPromise,
            resolveSettled,
        };
    }
    getPendingForegroundRun(agentId) {
        return this.pendingForegroundRuns.get(agentId) ?? null;
    }
    hasPendingForegroundRun(agentId) {
        return this.pendingForegroundRuns.has(agentId);
    }
    settlePendingForegroundRun(agentId, token) {
        const pendingRun = this.pendingForegroundRuns.get(agentId);
        if (!pendingRun) {
            return;
        }
        if (token && pendingRun.token !== token) {
            return;
        }
        this.pendingForegroundRuns.delete(agentId);
        if (pendingRun.settled) {
            return;
        }
        pendingRun.settled = true;
        pendingRun.resolveSettled();
    }
    async resolveInitialPersistedTitle(agentId, config) {
        const existing = await this.registry?.get(agentId);
        if (existing) {
            return existing.title ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(config, "title")) {
            return config.title ?? null;
        }
        return null;
    }
    async persistSnapshot(agent, options) {
        if (!this.registry) {
            return;
        }
        // Don't persist internal agents - they're ephemeral system tasks
        if (agent.internal) {
            return;
        }
        if (options?.workspaceId !== undefined) {
            await this.registry.applySnapshot(agent, options.workspaceId, options);
            return;
        }
        await this.registry.applySnapshot(agent, options);
    }
    requireRegistry() {
        if (!this.registry) {
            throw new Error("Agent storage unavailable");
        }
        return this.registry;
    }
    async refreshSessionState(agent) {
        try {
            const modes = await agent.session.getAvailableModes();
            agent.availableModes = modes;
        }
        catch {
            agent.availableModes = [];
        }
        try {
            agent.currentModeId = await agent.session.getCurrentMode();
        }
        catch {
            agent.currentModeId = null;
        }
        try {
            const pending = agent.session.getPendingPermissions();
            agent.pendingPermissions = new Map(pending.map((request) => [request.id, request]));
        }
        catch {
            agent.pendingPermissions.clear();
        }
        this.syncFeaturesFromSession(agent);
        await this.refreshRuntimeInfo(agent);
    }
    async refreshRuntimeInfo(agent) {
        try {
            const newInfo = await agent.session.getRuntimeInfo();
            const changed = newInfo.model !== agent.runtimeInfo?.model ||
                newInfo.thinkingOptionId !== agent.runtimeInfo?.thinkingOptionId ||
                newInfo.sessionId !== agent.runtimeInfo?.sessionId ||
                newInfo.modeId !== agent.runtimeInfo?.modeId;
            agent.runtimeInfo = newInfo;
            if (!agent.persistence && newInfo.sessionId) {
                agent.persistence = attachPersistenceCwd({ provider: agent.provider, sessionId: newInfo.sessionId }, agent.cwd);
            }
            // Emit state if runtimeInfo changed so clients get the updated model
            if (changed) {
                this.emitState(agent);
            }
        }
        catch {
            // Keep existing runtimeInfo if refresh fails.
        }
    }
    async hydrateTimelineFromLegacyProviderHistory(agent) {
        if (agent.historyPrimed) {
            return;
        }
        agent.historyPrimed = true;
        const canonicalUserMessagesById = this.timelineStore.getCanonicalUserMessagesById(agent.id);
        try {
            for await (const event of agent.session.streamHistory()) {
                if (event.type !== "timeline") {
                    continue;
                }
                if (event.item.type === "user_message") {
                    const eventMessageId = normalizeMessageId(event.item.messageId);
                    if (eventMessageId) {
                        const canonicalText = canonicalUserMessagesById.get(eventMessageId);
                        if (canonicalText === event.item.text) {
                            continue;
                        }
                    }
                }
                this.recordTimeline(agent.id, event.item);
            }
        }
        catch {
            // ignore history failures
        }
    }
    notifyForegroundTurnWaiters(agentId, event) {
        const turnId = event.turnId;
        if (turnId == null) {
            return;
        }
        const agent = this.agents.get(agentId);
        if (!agent) {
            return;
        }
        for (const waiter of agent.foregroundTurnWaiters) {
            if (waiter.turnId === turnId && !waiter.settled) {
                waiter.callback(event);
            }
        }
    }
    async handleStreamEvent(agent, event, options) {
        const eventTurnId = event.turnId;
        const isForegroundEvent = Boolean(eventTurnId && agent.activeForegroundTurnId === eventTurnId);
        if (eventTurnId &&
            isTurnTerminalEvent(event) &&
            agent.finalizedForegroundTurnIds.has(eventTurnId)) {
            return false;
        }
        // Only update timestamp for live events, not history replay
        if (!options?.fromHistory) {
            this.touchUpdatedAt(agent);
            if (this.agentStreamCoalescer.handle(agent.id, event)) {
                return false;
            }
            this.agentStreamCoalescer.flushFor(agent.id);
        }
        let shouldDispatchEvent = true;
        let shouldNotifyWaiters = true;
        switch (event.type) {
            case "thread_started":
                {
                    const previousSessionId = agent.persistence?.sessionId ?? null;
                    const handle = agent.session.describePersistence();
                    if (handle) {
                        agent.persistence = attachPersistenceCwd(handle, agent.cwd);
                        if (agent.persistence?.sessionId !== previousSessionId) {
                            this.emitState(agent);
                        }
                    }
                    void this.refreshRuntimeInfo(agent);
                }
                break;
            case "usage_updated":
                agent.lastUsage = event.usage;
                this.emitState(agent);
                break;
            case "timeline":
                {
                    // Skip provider-replayed user_message items during history hydration.
                    if (options?.fromHistory && event.item.type === "user_message") {
                        const eventMessageId = normalizeMessageId(event.item.messageId);
                        if (eventMessageId) {
                            const canonicalText = options?.canonicalUserMessagesById?.get(eventMessageId);
                            if (canonicalText === event.item.text) {
                                shouldDispatchEvent = false;
                                shouldNotifyWaiters = false;
                                break;
                            }
                        }
                    }
                    // Suppress user_message echoes for the active foreground turn.
                    if (!options?.fromHistory && event.item.type === "user_message" && isForegroundEvent) {
                        const eventMessageId = normalizeMessageId(event.item.messageId);
                        if (eventMessageId &&
                            (await this.hasCommittedUserMessageFromStores(agent.id, {
                                messageId: eventMessageId,
                                text: event.item.text,
                            }))) {
                            break;
                        }
                    }
                    if (options?.fromHistory) {
                        this.recordTimeline(agent.id, event.item);
                        shouldDispatchEvent = false;
                        shouldNotifyWaiters = false;
                        break;
                    }
                    this.recordAndDispatchTimelineItem(agent.id, event.item, event.provider, event.turnId);
                    if (event.item.type === "user_message") {
                        agent.lastUserMessageAt = new Date();
                        this.emitState(agent);
                    }
                    shouldDispatchEvent = false;
                    shouldNotifyWaiters = true;
                }
                break;
            case "turn_completed":
                this.logger.trace({
                    agentId: agent.id,
                    lifecycle: agent.lifecycle,
                    activeForegroundTurnId: agent.activeForegroundTurnId,
                    eventTurnId,
                }, "handleStreamEvent: turn_completed");
                agent.lastUsage = event.usage;
                agent.lastError = undefined;
                // For autonomous turns (not foreground), transition to idle
                // unless a replacement is pending (avoid idle flash during replace)
                if (!isForegroundEvent && agent.lifecycle !== "idle" && !agent.pendingReplacement) {
                    agent.lifecycle = "idle";
                    this.emitState(agent);
                }
                void this.refreshRuntimeInfo(agent);
                break;
            case "turn_failed":
                this.logger.warn({
                    agentId: agent.id,
                    lifecycle: agent.lifecycle,
                    activeForegroundTurnId: agent.activeForegroundTurnId,
                    eventTurnId,
                    error: event.error,
                    code: event.code,
                    diagnostic: event.diagnostic,
                }, "handleStreamEvent: turn_failed");
                // For autonomous turns, set error state directly
                if (!isForegroundEvent) {
                    agent.lifecycle = "error";
                }
                agent.lastError = event.error;
                await this.appendSystemErrorTimelineMessage(agent, event.provider, this.formatTurnFailedMessage(event), options);
                for (const [requestId] of agent.pendingPermissions) {
                    agent.pendingPermissions.delete(requestId);
                    if (!options?.fromHistory) {
                        this.dispatchStream(agent.id, {
                            type: "permission_resolved",
                            provider: event.provider,
                            requestId,
                            resolution: { behavior: "deny", message: "Turn failed" },
                        });
                    }
                }
                if (!isForegroundEvent) {
                    this.emitState(agent);
                }
                break;
            case "turn_canceled":
                this.logger.trace({
                    agentId: agent.id,
                    lifecycle: agent.lifecycle,
                    activeForegroundTurnId: agent.activeForegroundTurnId,
                    eventTurnId,
                }, "handleStreamEvent: turn_canceled");
                // For autonomous turns, transition to idle
                // unless a replacement is pending (avoid idle flash during replace)
                if (!isForegroundEvent && !agent.pendingReplacement) {
                    agent.lifecycle = "idle";
                }
                agent.lastError = undefined;
                for (const [requestId] of agent.pendingPermissions) {
                    agent.pendingPermissions.delete(requestId);
                    if (!options?.fromHistory) {
                        this.dispatchStream(agent.id, {
                            type: "permission_resolved",
                            provider: event.provider,
                            requestId,
                            resolution: { behavior: "deny", message: "Interrupted" },
                        });
                    }
                }
                if (!isForegroundEvent) {
                    this.emitState(agent);
                }
                break;
            case "turn_started":
                this.logger.trace({
                    agentId: agent.id,
                    lifecycle: agent.lifecycle,
                    activeForegroundTurnId: agent.activeForegroundTurnId,
                    eventTurnId,
                }, "handleStreamEvent: turn_started");
                // For autonomous turn_started (no foreground match), set running
                if (!isForegroundEvent) {
                    agent.lifecycle = "running";
                    this.emitState(agent);
                }
                break;
            case "permission_requested":
                {
                    const hadPendingPermissions = agent.pendingPermissions.size > 0;
                    agent.pendingPermissions.set(event.request.id, event.request);
                    if (!hadPendingPermissions && !agent.internal) {
                        this.broadcastAgentAttention(agent, "permission");
                    }
                }
                this.emitState(agent);
                break;
            case "permission_resolved":
                agent.pendingPermissions.delete(event.requestId);
                if (!options?.fromHistory && agent.inFlightPermissionResponses.has(event.requestId)) {
                    agent.bufferedPermissionResolutions.set(event.requestId, event);
                    shouldDispatchEvent = false;
                    break;
                }
                this.emitState(agent);
                break;
            default:
                break;
        }
        if (!options?.fromHistory && isForegroundEvent && isTurnTerminalEvent(event)) {
            this.finalizeForegroundTurn(agent, eventTurnId);
        }
        // Skip dispatching individual stream events during history replay.
        if (!options?.fromHistory && shouldDispatchEvent) {
            this.dispatchStream(agent.id, event);
        }
        return shouldNotifyWaiters;
    }
    recordAndDispatchTimelineItem(agentId, item, provider, turnId) {
        const row = this.recordTimeline(agentId, item);
        const event = {
            type: "timeline",
            item,
            provider,
            ...(turnId !== undefined ? { turnId } : {}),
        };
        this.dispatchStream(agentId, event, {
            seq: row.seq,
            epoch: this.timelineStore.getEpoch(agentId),
        });
        return event;
    }
    async appendSystemErrorTimelineMessage(agent, provider, message, options) {
        if (options?.fromHistory) {
            return;
        }
        const normalized = message.trim();
        if (!normalized) {
            return;
        }
        const text = `${SYSTEM_ERROR_PREFIX} ${normalized}`;
        const lastItem = await this.getLastItemFromStores(agent.id);
        if (lastItem?.type === "assistant_message" && lastItem.text === text) {
            return;
        }
        const item = { type: "assistant_message", text };
        const row = this.recordTimeline(agent.id, item);
        this.dispatchStream(agent.id, {
            type: "timeline",
            item,
            provider,
        }, {
            seq: row.seq,
            epoch: this.timelineStore.getEpoch(agent.id),
        });
    }
    formatTurnFailedMessage(event) {
        const base = event.error.trim();
        const parts = [base.length > 0 ? base : "Provider run failed"];
        const code = event.code?.trim();
        if (code) {
            parts.push(`code: ${code}`);
        }
        const diagnostic = event.diagnostic?.trim();
        if (diagnostic && diagnostic !== base) {
            parts.push(diagnostic);
        }
        return parts.join("\n\n");
    }
    recordTimeline(agentId, item) {
        const row = this.timelineStore.append(agentId, item);
        this.enqueueDurableTimelineAppend(agentId, row);
        return row;
    }
    emitState(agent, options) {
        // Keep attention as an edge-triggered unread signal, not a level signal.
        this.checkAndSetAttention(agent);
        if (options?.persist !== false) {
            this.enqueueBackgroundPersist(agent);
        }
        this.syncFeaturesFromSession(agent);
        this.dispatch({
            type: "agent_state",
            agent: { ...agent },
        });
    }
    syncFeaturesFromSession(agent) {
        if ("session" in agent && agent.session?.features) {
            agent.features = agent.session.features;
        }
    }
    checkAndSetAttention(agent) {
        const previousStatus = this.previousStatuses.get(agent.id);
        const currentStatus = agent.lifecycle;
        // Track the new status
        this.previousStatuses.set(agent.id, currentStatus);
        // Skip attention tracking for internal agents
        if (agent.internal) {
            return;
        }
        // Skip if already requires attention
        if (agent.attention.requiresAttention) {
            return;
        }
        // Check if agent transitioned from running to idle (finished)
        if (previousStatus === "running" && currentStatus === "idle") {
            agent.attention = {
                requiresAttention: true,
                attentionReason: "finished",
                attentionTimestamp: new Date(),
            };
            this.broadcastAgentAttention(agent, "finished");
            return;
        }
        // Check if agent entered error state
        if (previousStatus !== "error" && currentStatus === "error") {
            agent.attention = {
                requiresAttention: true,
                attentionReason: "error",
                attentionTimestamp: new Date(),
            };
            this.broadcastAgentAttention(agent, "error");
            return;
        }
    }
    enqueueBackgroundPersist(agent) {
        const task = this.persistSnapshot(agent).catch((err) => {
            this.logger.error({ err, agentId: agent.id }, "Failed to persist agent snapshot");
        });
        this.trackBackgroundTask(task);
    }
    enqueueDurableTimelineAppend(agentId, row) {
        if (!this.durableTimelineStore) {
            return;
        }
        const task = this.durableTimelineStore
            .bulkInsert(agentId, [row])
            .then(() => undefined)
            .catch((err) => {
            this.logger.error({ err, agentId, seq: row.seq, itemType: row.item.type }, "Failed to append timeline row to durable store");
        });
        this.trackBackgroundTask(task);
    }
    enqueueDurableTimelineBulkInsert(agentId, rows) {
        if (!this.durableTimelineStore || rows.length === 0) {
            return;
        }
        const task = this.durableTimelineStore.bulkInsert(agentId, rows).catch((err) => {
            this.logger.error({ err, agentId, rowCount: rows.length }, "Failed to seed durable timeline store");
        });
        this.trackBackgroundTask(task);
    }
    trackBackgroundTask(task) {
        this.backgroundTasks.add(task);
        void task.finally(() => {
            this.backgroundTasks.delete(task);
        });
    }
    /**
     * Flush any background persistence work (best-effort).
     * Used by daemon shutdown paths to avoid unhandled rejections after cleanup.
     */
    async flush() {
        this.agentStreamCoalescer.flushAll();
        // Drain tasks, including tasks spawned while awaiting.
        while (this.backgroundTasks.size > 0) {
            const pending = Array.from(this.backgroundTasks);
            await Promise.allSettled(pending);
        }
    }
    broadcastAgentAttention(agent, reason) {
        this.onAgentAttention?.({
            agentId: agent.id,
            provider: agent.provider,
            reason,
        });
    }
    dispatchStream(agentId, event, metadata) {
        this.dispatch({ type: "agent_stream", agentId, event, ...metadata });
    }
    dispatch(event) {
        for (const subscriber of this.subscribers) {
            if (subscriber.agentId &&
                event.type === "agent_stream" &&
                subscriber.agentId !== event.agentId) {
                continue;
            }
            if (subscriber.agentId &&
                event.type === "agent_state" &&
                subscriber.agentId !== event.agent.id) {
                continue;
            }
            // Skip internal agents for global subscribers (those without a specific agentId)
            if (!subscriber.agentId) {
                if (event.type === "agent_state" && event.agent.internal) {
                    continue;
                }
                if (event.type === "agent_stream") {
                    const agent = this.agents.get(event.agentId);
                    if (agent?.internal) {
                        continue;
                    }
                }
            }
            subscriber.callback(event);
        }
    }
    async normalizeConfig(config) {
        const normalized = { ...config };
        // Always resolve cwd to absolute path for consistent history file lookup
        if (normalized.cwd) {
            normalized.cwd = resolve(normalized.cwd);
            try {
                const cwdStats = await stat(normalized.cwd);
                if (!cwdStats.isDirectory()) {
                    throw new Error(`Working directory is not a directory: ${normalized.cwd}`);
                }
            }
            catch (error) {
                if (error instanceof Error &&
                    "code" in error &&
                    error.code === "ENOENT") {
                    throw new Error(`Working directory does not exist: ${normalized.cwd}`);
                }
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error(`Failed to access working directory: ${normalized.cwd}`);
            }
        }
        if (typeof normalized.model === "string") {
            const trimmed = normalized.model.trim();
            normalized.model = trimmed.length > 0 && trimmed !== "default" ? trimmed : undefined;
        }
        if (!normalized.model) {
            const client = this.clients.get(normalized.provider);
            if (client) {
                try {
                    const models = await client.listModels({ cwd: normalized.cwd, force: false });
                    const defaultModel = models.find((model) => model.isDefault) ?? models[0];
                    if (defaultModel) {
                        normalized.model = defaultModel.id;
                    }
                }
                catch {
                    // Provider may not support model listing — leave model undefined
                }
            }
        }
        if (!normalized.modeId) {
            try {
                normalized.modeId =
                    getAgentProviderDefinition(normalized.provider).defaultModeId ?? undefined;
            }
            catch {
                // Unknown provider
            }
        }
        return normalized;
    }
    buildLaunchContext(agentId) {
        return {
            env: {
                PASEO_AGENT_ID: agentId,
            },
        };
    }
    requireClient(provider) {
        const client = this.clients.get(provider);
        if (!client) {
            throw new Error(`No client registered for provider '${provider}'`);
        }
        return client;
    }
    requireAgent(id) {
        const normalizedId = validateAgentId(id, "requireAgent");
        const agent = this.agents.get(normalizedId);
        if (!agent) {
            throw new Error(`Unknown agent '${normalizedId}'`);
        }
        return agent;
    }
    requireSessionAgent(id) {
        const agent = this.requireAgent(id);
        if (agent.session === null) {
            throw new Error(`Agent '${agent.id}' has no managed session`);
        }
        return agent;
    }
}
//# sourceMappingURL=agent-manager.js.map