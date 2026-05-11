import { WebSocketServer } from "ws";
import { join } from "path";
import { hostname as getHostname } from "node:os";
import { WSInboundMessageSchema, wrapSessionMessage, } from "./messages.js";
import { asUint8Array, decodeTerminalStreamFrame } from "../shared/terminal-stream-protocol.js";
import { isHostnameAllowed } from "./hostnames.js";
import { Session } from "./session.js";
import { ProviderSnapshotManager } from "./agent/provider-snapshot-manager.js";
import { buildProviderRegistry } from "./agent/provider-registry.js";
import { PushTokenStore } from "./push/token-store.js";
import { PushService } from "./push/push-service.js";
import { computeNotificationPlan } from "./agent-attention-policy.js";
import { buildAgentAttentionNotificationPayload, findLatestPermissionRequest, } from "../shared/agent-attention-notification.js";
import { createGitHubService } from "../services/github-service.js";
function createFallbackWorkspaceGitService() {
    return {
        subscribe: async ({ cwd }) => ({
            initial: {
                cwd,
                git: {
                    isGit: false,
                    repoRoot: null,
                    mainRepoRoot: null,
                    currentBranch: null,
                    remoteUrl: null,
                    isPaseoOwnedWorktree: false,
                    isDirty: null,
                    aheadBehind: null,
                    aheadOfOrigin: null,
                    behindOfOrigin: null,
                    diffStat: null,
                },
                github: {
                    featuresEnabled: false,
                    pullRequest: null,
                    error: null,
                },
            },
            unsubscribe: () => { },
        }),
        peekSnapshot: () => null,
        getSnapshot: async (cwd) => ({
            cwd,
            git: {
                isGit: false,
                repoRoot: null,
                mainRepoRoot: null,
                currentBranch: null,
                remoteUrl: null,
                isPaseoOwnedWorktree: false,
                isDirty: null,
                aheadBehind: null,
                aheadOfOrigin: null,
                behindOfOrigin: null,
                diffStat: null,
            },
            github: {
                featuresEnabled: false,
                pullRequest: null,
                error: null,
            },
        }),
        refresh: async () => { },
        requestWorkingTreeWatch: async (cwd) => ({
            repoRoot: cwd,
            unsubscribe: () => { },
        }),
        scheduleRefreshForCwd: () => { },
        dispose: () => { },
    };
}
function createNoopProjectRegistry() {
    return {
        initialize: async () => { },
        existsOnDisk: async () => true,
        list: async () => [],
        get: async () => null,
        upsert: async () => { },
        archive: async () => { },
        remove: async () => { },
    };
}
function createNoopWorkspaceRegistry() {
    return {
        initialize: async () => { },
        existsOnDisk: async () => true,
        list: async () => [],
        get: async () => null,
        upsert: async () => { },
        archive: async () => { },
        remove: async () => { },
    };
}
function toServerCapabilityState(params) {
    const { state, reason } = params;
    return {
        enabled: state.enabled,
        reason,
    };
}
function resolveCapabilityReason(params) {
    const { state, readiness } = params;
    if (state.available) {
        return "";
    }
    if (readiness.voiceFeature.reasonCode === "model_download_in_progress") {
        const baseMessage = readiness.voiceFeature.message.trim();
        if (baseMessage.includes("Try again in a few minutes")) {
            return baseMessage;
        }
        return `${baseMessage} Try again in a few minutes.`;
    }
    return state.message;
}
function buildServerCapabilities(params) {
    const readiness = params.readiness;
    if (!readiness) {
        return undefined;
    }
    return {
        voice: {
            dictation: toServerCapabilityState({
                state: readiness.dictation,
                reason: resolveCapabilityReason({
                    state: readiness.dictation,
                    readiness,
                }),
            }),
            voice: toServerCapabilityState({
                state: readiness.realtimeVoice,
                reason: resolveCapabilityReason({
                    state: readiness.realtimeVoice,
                    readiness,
                }),
            }),
        },
    };
}
function areServerCapabilitiesEqual(current, next) {
    return JSON.stringify(current ?? null) === JSON.stringify(next ?? null);
}
function bufferFromWsData(data) {
    if (typeof data === "string")
        return Buffer.from(data, "utf8");
    if (Array.isArray(data)) {
        return Buffer.concat(data.map((item) => (Buffer.isBuffer(item) ? item : Buffer.from(item))));
    }
    if (Buffer.isBuffer(data))
        return data;
    return Buffer.from(data);
}
const SLOW_REQUEST_THRESHOLD_MS = 500;
const EXTERNAL_SESSION_DISCONNECT_GRACE_MS = 90000;
const HELLO_TIMEOUT_MS = 15000;
const WS_CLOSE_HELLO_TIMEOUT = 4001;
const WS_CLOSE_INVALID_HELLO = 4002;
const WS_CLOSE_INCOMPATIBLE_PROTOCOL = 4003;
const WS_PROTOCOL_VERSION = 1;
const WS_RUNTIME_METRICS_FLUSH_MS = 30000;
export class MissingDaemonVersionError extends Error {
    constructor() {
        super("VoiceAssistantWebSocketServer requires a non-empty daemonVersion.");
        this.name = "MissingDaemonVersionError";
    }
}
/**
 * WebSocket server that only accepts sockets + parses/forwards messages to the session layer.
 */
export class VoiceAssistantWebSocketServer {
    constructor(server, logger, serverId, agentManager, agentStorage, downloadTokenStore, paseoHome, daemonConfigStore, mcpBaseUrl, wsConfig, speech, terminalManager, dictation, agentProviderRuntimeSettings, providerOverrides, isDev, daemonVersion, onLifecycleIntent, projectRegistry, workspaceRegistry, chatService, loopService, scheduleService, checkoutDiffManager, scriptRouteStore, scriptRuntimeStore, onBranchChanged, getDaemonTcpPort, getDaemonTcpHost, resolveScriptHealth, workspaceGitService, github) {
        this.pendingConnections = new Map();
        this.sessions = new Map();
        this.externalSessionsByKey = new Map();
        this.voiceSpeakHandlers = new Map();
        this.voiceCallerContexts = new Map();
        this.workspaceSetupSnapshots = new Map();
        this.runtimeWindowStartedAt = Date.now();
        this.runtimeCounters = {
            connectedAwaitingHello: 0,
            helloResumed: 0,
            helloNew: 0,
            pendingDisconnected: 0,
            sessionDisconnectedWaitingReconnect: 0,
            sessionSocketDisconnectedAttached: 0,
            sessionCleanup: 0,
            validationFailed: 0,
            binaryBeforeHelloRejected: 0,
            pendingMessageRejectedBeforeHello: 0,
            missingConnectionForMessage: 0,
            unexpectedHelloOnActiveConnection: 0,
            relayExternalSocketAttached: 0,
            originRejected: 0,
            hostRejected: 0,
        };
        this.inboundMessageCounts = new Map();
        this.inboundSessionRequestCounts = new Map();
        this.outboundMessageCounts = new Map();
        this.outboundSessionMessageCounts = new Map();
        this.outboundAgentStreamCounts = new Map();
        this.outboundAgentStreamByAgentCounts = new Map();
        this.outboundBinaryFrameCounts = new Map();
        this.bufferedAmountSamples = [];
        this.requestLatencies = new Map();
        this.runtimeMetricsInterval = null;
        this.unsubscribeSpeechReadiness = null;
        this.unsubscribeDaemonConfigChange = null;
        this.logger = logger.child({ module: "websocket-server" });
        this.serverId = serverId;
        if (typeof daemonVersion !== "string" || daemonVersion.trim().length === 0) {
            throw new MissingDaemonVersionError();
        }
        this.daemonVersion = daemonVersion.trim();
        this.agentManager = agentManager;
        this.agentStorage = agentStorage;
        this.projectRegistry = projectRegistry ?? createNoopProjectRegistry();
        this.workspaceRegistry = workspaceRegistry ?? createNoopWorkspaceRegistry();
        if (!chatService) {
            throw new Error("VoiceAssistantWebSocketServer requires a chat service.");
        }
        this.chatService = chatService;
        if (!loopService) {
            throw new Error("VoiceAssistantWebSocketServer requires a loop service.");
        }
        this.loopService = loopService;
        if (!scheduleService) {
            throw new Error("VoiceAssistantWebSocketServer requires a schedule service.");
        }
        this.scheduleService = scheduleService;
        if (!checkoutDiffManager) {
            throw new Error("VoiceAssistantWebSocketServer requires a checkout diff manager.");
        }
        this.checkoutDiffManager = checkoutDiffManager;
        this.github = github ?? createGitHubService();
        this.workspaceGitService = workspaceGitService ?? createFallbackWorkspaceGitService();
        this.downloadTokenStore = downloadTokenStore;
        this.paseoHome = paseoHome;
        this.daemonConfigStore = daemonConfigStore;
        this.mcpBaseUrl = mcpBaseUrl;
        this.speech = speech ?? null;
        this.terminalManager = terminalManager ?? null;
        this.dictation = dictation ?? null;
        this.agentProviderRuntimeSettings = agentProviderRuntimeSettings;
        this.providerOverrides = providerOverrides;
        this.isDev = isDev === true;
        const providerSnapshotLogger = this.logger.child({ module: "provider-snapshot-manager" });
        this.providerSnapshotManager = new ProviderSnapshotManager(buildProviderRegistry(providerSnapshotLogger, {
            runtimeSettings: this.agentProviderRuntimeSettings,
            providerOverrides: this.providerOverrides,
            isDev: this.isDev,
        }), providerSnapshotLogger);
        this.onLifecycleIntent = onLifecycleIntent ?? null;
        this.scriptRouteStore = scriptRouteStore ?? null;
        this.scriptRuntimeStore = scriptRuntimeStore ?? null;
        this.onBranchChanged = onBranchChanged ?? null;
        this.getDaemonTcpPort = getDaemonTcpPort ?? null;
        this.getDaemonTcpHost = getDaemonTcpHost ?? null;
        this.resolveScriptHealth = resolveScriptHealth ?? null;
        this.serverCapabilities = buildServerCapabilities({
            readiness: this.speech?.getReadiness() ?? null,
        });
        this.unsubscribeSpeechReadiness =
            this.speech?.onReadinessChange((snapshot) => {
                this.publishSpeechReadiness(snapshot);
            }) ?? null;
        this.unsubscribeDaemonConfigChange = this.daemonConfigStore.onChange((config) => {
            this.broadcastDaemonConfigChanged(config);
        });
        const pushLogger = this.logger.child({ module: "push" });
        this.pushTokenStore = new PushTokenStore(pushLogger, join(paseoHome, "push-tokens.json"));
        this.pushService = new PushService(pushLogger, this.pushTokenStore);
        this.agentManager.setAgentAttentionCallback((params) => {
            void this.broadcastAgentAttention(params).catch((err) => {
                this.logger.warn({ err, agentId: params.agentId }, "Failed to broadcast agent attention");
            });
        });
        const { allowedOrigins, hostnames } = wsConfig;
        this.wss = new WebSocketServer({
            server,
            path: "/ws",
            verifyClient: ({ req }, callback) => {
                const requestMetadata = extractSocketRequestMetadata(req);
                const origin = requestMetadata.origin;
                const requestHost = requestMetadata.host ?? null;
                if (requestHost && !isHostnameAllowed(requestHost, hostnames)) {
                    this.incrementRuntimeCounter("hostRejected");
                    this.logger.warn({ ...requestMetadata, host: requestHost }, "Rejected connection from disallowed host");
                    callback(false, 403, "Host not allowed");
                    return;
                }
                const sameOrigin = !!origin &&
                    !!requestHost &&
                    (origin === `http://${requestHost}` || origin === `https://${requestHost}`);
                if (!origin || allowedOrigins.has("*") || allowedOrigins.has(origin) || sameOrigin) {
                    callback(true);
                }
                else {
                    this.incrementRuntimeCounter("originRejected");
                    this.logger.warn({ ...requestMetadata, origin }, "Rejected connection from origin");
                    callback(false, 403, "Origin not allowed");
                }
            },
        });
        this.wss.on("connection", (ws, request) => {
            void this.attachSocket(ws, request);
        });
        const runtimeMetricsInterval = setInterval(() => {
            this.flushRuntimeMetrics();
        }, WS_RUNTIME_METRICS_FLUSH_MS);
        this.runtimeMetricsInterval = runtimeMetricsInterval;
        runtimeMetricsInterval.unref?.();
        this.logger.info("WebSocket server initialized on /ws");
    }
    broadcast(message) {
        const payload = JSON.stringify(message);
        for (const ws of this.sessions.keys()) {
            // WebSocket.OPEN = 1
            if (ws.readyState === 1) {
                ws.send(payload);
                this.recordOutboundMessage(message, ws);
            }
        }
    }
    listActiveSessions() {
        return Array.from(new Set([...this.sessions.values(), ...this.externalSessionsByKey.values()].map((connection) => connection.session)));
    }
    publishSpeechReadiness(readiness) {
        this.updateServerCapabilities(buildServerCapabilities({ readiness }));
    }
    updateServerCapabilities(capabilities) {
        const next = capabilities ?? undefined;
        if (areServerCapabilitiesEqual(this.serverCapabilities, next)) {
            return;
        }
        this.serverCapabilities = next;
        this.broadcastCapabilitiesUpdate();
    }
    async attachExternalSocket(ws, metadata) {
        if (metadata?.transport === "relay") {
            this.incrementRuntimeCounter("relayExternalSocketAttached");
        }
        await this.attachSocket(ws, undefined, metadata);
    }
    async close() {
        this.unsubscribeSpeechReadiness?.();
        this.unsubscribeSpeechReadiness = null;
        this.unsubscribeDaemonConfigChange?.();
        this.unsubscribeDaemonConfigChange = null;
        if (this.runtimeMetricsInterval) {
            clearInterval(this.runtimeMetricsInterval);
            this.runtimeMetricsInterval = null;
        }
        this.flushRuntimeMetrics({ final: true });
        const uniqueConnections = new Set([
            ...this.sessions.values(),
            ...this.externalSessionsByKey.values(),
        ]);
        const pendingSockets = new Set(this.pendingConnections.keys());
        for (const pending of this.pendingConnections.values()) {
            if (pending.helloTimeout) {
                clearTimeout(pending.helloTimeout);
                pending.helloTimeout = null;
            }
        }
        const cleanupPromises = [];
        for (const connection of uniqueConnections) {
            if (connection.externalDisconnectCleanupTimeout) {
                clearTimeout(connection.externalDisconnectCleanupTimeout);
                connection.externalDisconnectCleanupTimeout = null;
            }
            cleanupPromises.push(connection.session.cleanup());
            for (const ws of connection.sockets) {
                cleanupPromises.push(new Promise((resolve) => {
                    // WebSocket.CLOSED = 3
                    if (ws.readyState === 3) {
                        resolve();
                        return;
                    }
                    ws.once("close", () => resolve());
                    ws.close();
                }));
            }
        }
        for (const ws of pendingSockets) {
            cleanupPromises.push(new Promise((resolve) => {
                if (ws.readyState === 3) {
                    resolve();
                    return;
                }
                ws.once("close", () => resolve());
                ws.close();
            }));
        }
        await Promise.all(cleanupPromises);
        this.providerSnapshotManager.destroy();
        this.checkoutDiffManager.dispose();
        this.workspaceGitService.dispose();
        this.pendingConnections.clear();
        this.sessions.clear();
        this.externalSessionsByKey.clear();
        this.wss.close();
    }
    sendToClient(ws, message) {
        // WebSocket.OPEN = 1
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(message));
            this.recordOutboundMessage(message, ws);
        }
    }
    sendBinaryToClient(ws, frame) {
        if (ws.readyState !== 1) {
            return;
        }
        ws.send(frame);
        this.recordOutboundBinaryFrame(ws);
    }
    sendToConnection(connection, message) {
        for (const ws of connection.sockets) {
            this.sendToClient(ws, message);
        }
    }
    sendBinaryToConnection(connection, frame) {
        for (const ws of connection.sockets) {
            this.sendBinaryToClient(ws, frame);
        }
    }
    async attachSocket(ws, request, metadata) {
        const requestMetadata = extractSocketRequestMetadata(request);
        const connectionLoggerFields = {
            transport: metadata?.transport === "relay" ? "relay" : "direct",
        };
        if (requestMetadata.host) {
            connectionLoggerFields.host = requestMetadata.host;
        }
        if (requestMetadata.origin) {
            connectionLoggerFields.origin = requestMetadata.origin;
        }
        if (requestMetadata.userAgent) {
            connectionLoggerFields.userAgent = requestMetadata.userAgent;
        }
        if (requestMetadata.remoteAddress) {
            connectionLoggerFields.remoteAddress = requestMetadata.remoteAddress;
        }
        const connectionLogger = this.logger.child(connectionLoggerFields);
        const pending = {
            connectionLogger,
            helloTimeout: null,
        };
        const timeout = setTimeout(() => {
            if (this.pendingConnections.get(ws) !== pending) {
                return;
            }
            pending.helloTimeout = null;
            this.pendingConnections.delete(ws);
            pending.connectionLogger.warn({ timeoutMs: HELLO_TIMEOUT_MS }, "Closing connection due to missing hello");
            try {
                ws.close(WS_CLOSE_HELLO_TIMEOUT, "Hello timeout");
            }
            catch {
                // ignore close errors
            }
        }, HELLO_TIMEOUT_MS);
        pending.helloTimeout = timeout;
        timeout.unref?.();
        this.pendingConnections.set(ws, pending);
        this.incrementRuntimeCounter("connectedAwaitingHello");
        this.bindSocketHandlers(ws);
        pending.connectionLogger.trace({
            totalPendingConnections: this.pendingConnections.size,
        }, "Client connected; awaiting hello");
    }
    createSessionConnection(params) {
        const { ws, clientId, appVersion, connectionLogger } = params;
        let connection = null;
        const session = new Session({
            clientId,
            appVersion,
            onMessage: (msg) => {
                if (!connection) {
                    return;
                }
                this.sendToConnection(connection, wrapSessionMessage(msg));
            },
            onBinaryMessage: (frame) => {
                if (!connection) {
                    return;
                }
                this.sendBinaryToConnection(connection, frame);
            },
            onLifecycleIntent: (intent) => {
                this.onLifecycleIntent?.(intent);
            },
            logger: connectionLogger.child({ module: "session" }),
            downloadTokenStore: this.downloadTokenStore,
            pushTokenStore: this.pushTokenStore,
            paseoHome: this.paseoHome,
            agentManager: this.agentManager,
            agentStorage: this.agentStorage,
            projectRegistry: this.projectRegistry,
            workspaceRegistry: this.workspaceRegistry,
            chatService: this.chatService,
            loopService: this.loopService,
            scheduleService: this.scheduleService,
            checkoutDiffManager: this.checkoutDiffManager,
            github: this.github,
            workspaceGitService: this.workspaceGitService,
            daemonConfigStore: this.daemonConfigStore,
            mcpBaseUrl: this.mcpBaseUrl,
            stt: () => this.speech?.resolveStt() ?? null,
            tts: () => this.speech?.resolveTts() ?? null,
            terminalManager: this.terminalManager,
            providerSnapshotManager: this.providerSnapshotManager,
            scriptRouteStore: this.scriptRouteStore ?? undefined,
            scriptRuntimeStore: this.scriptRuntimeStore ?? undefined,
            workspaceSetupSnapshots: this.workspaceSetupSnapshots,
            onBranchChanged: this.onBranchChanged ?? undefined,
            getDaemonTcpPort: this.getDaemonTcpPort ?? undefined,
            getDaemonTcpHost: this.getDaemonTcpHost ?? undefined,
            resolveScriptHealth: this.resolveScriptHealth ?? undefined,
            voice: {
                turnDetection: () => this.speech?.resolveTurnDetection() ?? null,
            },
            voiceBridge: {
                registerVoiceSpeakHandler: (agentId, handler) => {
                    this.voiceSpeakHandlers.set(agentId, handler);
                },
                unregisterVoiceSpeakHandler: (agentId) => {
                    this.voiceSpeakHandlers.delete(agentId);
                },
                registerVoiceCallerContext: (agentId, context) => {
                    this.voiceCallerContexts.set(agentId, context);
                },
                unregisterVoiceCallerContext: (agentId) => {
                    this.voiceCallerContexts.delete(agentId);
                },
            },
            dictation: this.dictation || this.speech
                ? {
                    finalTimeoutMs: this.dictation?.finalTimeoutMs,
                    stt: () => this.speech?.resolveDictationStt() ?? null,
                    getSpeechReadiness: () => this.speech.getReadiness(),
                }
                : undefined,
            agentProviderRuntimeSettings: this.agentProviderRuntimeSettings,
            providerOverrides: this.providerOverrides,
            isDev: this.isDev,
        });
        connection = {
            session,
            clientId,
            appVersion,
            connectionLogger,
            sockets: new Set([ws]),
            externalDisconnectCleanupTimeout: null,
        };
        return connection;
    }
    clearPendingConnection(ws) {
        const pending = this.pendingConnections.get(ws);
        if (!pending) {
            return null;
        }
        if (pending.helloTimeout) {
            clearTimeout(pending.helloTimeout);
            pending.helloTimeout = null;
        }
        this.pendingConnections.delete(ws);
        return pending;
    }
    handleHello(params) {
        const { ws, message, pending } = params;
        if (message.protocolVersion !== WS_PROTOCOL_VERSION) {
            this.clearPendingConnection(ws);
            pending.connectionLogger.warn({
                receivedProtocolVersion: message.protocolVersion,
                expectedProtocolVersion: WS_PROTOCOL_VERSION,
            }, "Rejected hello due to protocol version mismatch");
            try {
                ws.close(WS_CLOSE_INCOMPATIBLE_PROTOCOL, "Incompatible protocol version");
            }
            catch {
                // ignore close errors
            }
            return;
        }
        const clientId = message.clientId.trim();
        if (clientId.length === 0) {
            this.clearPendingConnection(ws);
            pending.connectionLogger.warn("Rejected hello with empty clientId");
            try {
                ws.close(WS_CLOSE_INVALID_HELLO, "Invalid hello");
            }
            catch {
                // ignore close errors
            }
            return;
        }
        this.clearPendingConnection(ws);
        const existing = this.externalSessionsByKey.get(clientId);
        if (existing) {
            this.incrementRuntimeCounter("helloResumed");
            if (existing.externalDisconnectCleanupTimeout) {
                clearTimeout(existing.externalDisconnectCleanupTimeout);
                existing.externalDisconnectCleanupTimeout = null;
            }
            const newAppVersion = message.appVersion ?? null;
            if (newAppVersion && newAppVersion !== existing.appVersion) {
                existing.appVersion = newAppVersion;
                existing.session.updateAppVersion(newAppVersion);
            }
            existing.sockets.add(ws);
            this.sessions.set(ws, existing);
            this.sendToClient(ws, this.createServerInfoMessage());
            existing.connectionLogger.trace({
                clientId,
                resumed: true,
                totalSessions: this.sessions.size,
            }, "Client connected via hello");
            return;
        }
        const connectionLogger = pending.connectionLogger.child({ clientId });
        this.incrementRuntimeCounter("helloNew");
        const connection = this.createSessionConnection({
            ws,
            clientId,
            appVersion: message.appVersion ?? null,
            connectionLogger,
        });
        this.sessions.set(ws, connection);
        this.externalSessionsByKey.set(clientId, connection);
        this.sendToClient(ws, this.createServerInfoMessage());
        connection.connectionLogger.trace({
            clientId,
            resumed: false,
            totalSessions: this.sessions.size,
        }, "Client connected via hello");
    }
    buildServerInfoStatusPayload() {
        return {
            status: "server_info",
            serverId: this.serverId,
            hostname: getHostname(),
            version: this.daemonVersion,
            ...(this.serverCapabilities ? { capabilities: this.serverCapabilities } : {}),
            features: {
                // COMPAT(providersSnapshot): keep optional until all clients rely on snapshot flow.
                providersSnapshot: true,
            },
        };
    }
    createServerInfoMessage() {
        return {
            type: "session",
            message: {
                type: "status",
                payload: this.buildServerInfoStatusPayload(),
            },
        };
    }
    createDaemonConfigChangedMessage(config) {
        return wrapSessionMessage({
            type: "status",
            payload: {
                status: "daemon_config_changed",
                config,
            },
        });
    }
    broadcastCapabilitiesUpdate() {
        this.broadcast(this.createServerInfoMessage());
    }
    broadcastDaemonConfigChanged(config) {
        this.broadcast(this.createDaemonConfigChangedMessage(config));
    }
    bindSocketHandlers(ws) {
        ws.on("message", (data) => {
            void this.handleRawMessage(ws, data);
        });
        ws.on("close", async (code, reason) => {
            await this.detachSocket(ws, {
                code: typeof code === "number" ? code : undefined,
                reason,
            });
        });
        ws.on("error", async (error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            const active = this.sessions.get(ws);
            const pending = this.pendingConnections.get(ws);
            const log = active?.connectionLogger ?? pending?.connectionLogger ?? this.logger;
            log.error({ err }, "Client error");
            await this.detachSocket(ws, { error: err });
        });
    }
    resolveVoiceSpeakHandler(callerAgentId) {
        return this.voiceSpeakHandlers.get(callerAgentId) ?? null;
    }
    resolveVoiceCallerContext(callerAgentId) {
        return this.voiceCallerContexts.get(callerAgentId) ?? null;
    }
    async detachSocket(ws, details) {
        const pending = this.clearPendingConnection(ws);
        if (pending) {
            this.incrementRuntimeCounter("pendingDisconnected");
            pending.connectionLogger.trace({
                code: details.code,
                reason: stringifyCloseReason(details.reason),
            }, "Pending client disconnected");
            return;
        }
        const connection = this.sessions.get(ws);
        if (!connection) {
            return;
        }
        this.sessions.delete(ws);
        connection.sockets.delete(ws);
        if (connection.sockets.size === 0) {
            this.incrementRuntimeCounter("sessionDisconnectedWaitingReconnect");
            if (connection.externalDisconnectCleanupTimeout) {
                clearTimeout(connection.externalDisconnectCleanupTimeout);
            }
            const timeout = setTimeout(() => {
                if (connection.externalDisconnectCleanupTimeout !== timeout) {
                    return;
                }
                connection.externalDisconnectCleanupTimeout = null;
                void this.cleanupConnection(connection, "Client disconnected (grace timeout)");
            }, EXTERNAL_SESSION_DISCONNECT_GRACE_MS);
            connection.externalDisconnectCleanupTimeout = timeout;
            connection.connectionLogger.trace({
                clientId: connection.clientId,
                code: details.code,
                reason: stringifyCloseReason(details.reason),
                reconnectGraceMs: EXTERNAL_SESSION_DISCONNECT_GRACE_MS,
            }, "Client disconnected; waiting for reconnect");
            return;
        }
        if (connection.sockets.size > 0) {
            this.incrementRuntimeCounter("sessionSocketDisconnectedAttached");
            connection.connectionLogger.trace({
                clientId: connection.clientId,
                remainingSockets: connection.sockets.size,
                code: details.code,
                reason: stringifyCloseReason(details.reason),
            }, "Client socket disconnected; session remains attached");
            return;
        }
        await this.cleanupConnection(connection, "Client disconnected");
    }
    async cleanupConnection(connection, logMessage) {
        this.incrementRuntimeCounter("sessionCleanup");
        if (connection.externalDisconnectCleanupTimeout) {
            clearTimeout(connection.externalDisconnectCleanupTimeout);
            connection.externalDisconnectCleanupTimeout = null;
        }
        for (const socket of connection.sockets) {
            this.sessions.delete(socket);
        }
        connection.sockets.clear();
        const existing = this.externalSessionsByKey.get(connection.clientId);
        if (existing === connection) {
            this.externalSessionsByKey.delete(connection.clientId);
        }
        connection.connectionLogger.trace({ clientId: connection.clientId, totalSessions: this.sessions.size }, logMessage);
        await connection.session.cleanup();
    }
    async handleRawMessage(ws, data) {
        const activeConnection = this.sessions.get(ws);
        const pendingConnection = this.pendingConnections.get(ws);
        const log = activeConnection?.connectionLogger ?? pendingConnection?.connectionLogger ?? this.logger;
        try {
            const buffer = bufferFromWsData(data);
            const asBytes = asUint8Array(buffer);
            if (asBytes) {
                const frame = decodeTerminalStreamFrame(asBytes);
                if (frame) {
                    if (!activeConnection) {
                        this.incrementRuntimeCounter("binaryBeforeHelloRejected");
                        log.warn("Rejected binary frame before hello");
                        this.clearPendingConnection(ws);
                        try {
                            ws.close(WS_CLOSE_INVALID_HELLO, "Session message before hello");
                        }
                        catch {
                            // ignore close errors
                        }
                        return;
                    }
                    activeConnection.session.handleBinaryFrame(frame);
                    return;
                }
            }
            const parsed = JSON.parse(buffer.toString());
            const parsedMessage = WSInboundMessageSchema.safeParse(parsed);
            if (!parsedMessage.success) {
                this.incrementRuntimeCounter("validationFailed");
                if (pendingConnection) {
                    pendingConnection.connectionLogger.warn({
                        error: parsedMessage.error.message,
                    }, "Rejected pending message before hello");
                    this.clearPendingConnection(ws);
                    try {
                        ws.close(WS_CLOSE_INVALID_HELLO, "Invalid hello");
                    }
                    catch {
                        // ignore close errors
                    }
                    return;
                }
                const requestInfo = extractRequestInfoFromUnknownWsInbound(parsed);
                const isUnknownSchema = requestInfo?.requestId != null &&
                    typeof parsed === "object" &&
                    parsed != null &&
                    "type" in parsed &&
                    parsed.type === "session";
                log.warn({
                    clientId: activeConnection?.clientId,
                    requestId: requestInfo?.requestId,
                    requestType: requestInfo?.requestType,
                    error: parsedMessage.error.message,
                }, "WS inbound message validation failed");
                if (requestInfo) {
                    this.sendToClient(ws, wrapSessionMessage({
                        type: "rpc_error",
                        payload: {
                            requestId: requestInfo.requestId,
                            requestType: requestInfo.requestType,
                            error: isUnknownSchema ? "Unknown request schema" : "Invalid message",
                            code: isUnknownSchema ? "unknown_schema" : "invalid_message",
                        },
                    }));
                    return;
                }
                const errorMessage = `Invalid message: ${parsedMessage.error.message}`;
                this.sendToClient(ws, wrapSessionMessage({
                    type: "status",
                    payload: {
                        status: "error",
                        message: errorMessage,
                    },
                }));
                return;
            }
            const message = parsedMessage.data;
            this.recordInboundMessageType(message.type);
            if (message.type === "ping") {
                this.sendToClient(ws, { type: "pong" });
                return;
            }
            if (message.type === "recording_state") {
                return;
            }
            if (pendingConnection) {
                if (message.type === "hello") {
                    this.handleHello({
                        ws,
                        message,
                        pending: pendingConnection,
                    });
                    return;
                }
                pendingConnection.connectionLogger.warn({
                    messageType: message.type,
                }, "Rejected pending message before hello");
                this.incrementRuntimeCounter("pendingMessageRejectedBeforeHello");
                this.clearPendingConnection(ws);
                try {
                    ws.close(WS_CLOSE_INVALID_HELLO, "Session message before hello");
                }
                catch {
                    // ignore close errors
                }
                return;
            }
            if (!activeConnection) {
                this.incrementRuntimeCounter("missingConnectionForMessage");
                this.logger.error("No connection found for websocket");
                return;
            }
            if (message.type === "hello") {
                this.incrementRuntimeCounter("unexpectedHelloOnActiveConnection");
                activeConnection.connectionLogger.warn("Received hello on active connection");
                try {
                    ws.close(WS_CLOSE_INVALID_HELLO, "Unexpected hello");
                }
                catch {
                    // ignore close errors
                }
                return;
            }
            if (message.type === "session") {
                this.recordInboundSessionRequestType(message.message.type);
                const startMs = performance.now();
                await activeConnection.session.handleMessage(message.message);
                const durationMs = performance.now() - startMs;
                this.recordRequestLatency(message.message.type, durationMs);
                if (durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
                    activeConnection.connectionLogger.warn({
                        requestType: message.message.type,
                        durationMs: Math.round(durationMs),
                        inflightRequests: activeConnection.session.getRuntimeMetrics().inflightRequests,
                    }, "ws_slow_request");
                }
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            let rawPayload = null;
            let parsedPayload = null;
            try {
                const buffer = bufferFromWsData(data);
                rawPayload = buffer.toString();
                parsedPayload = JSON.parse(rawPayload);
            }
            catch (payloadError) {
                rawPayload = rawPayload ?? "<unreadable>";
                parsedPayload = parsedPayload ?? rawPayload;
                const payloadErr = payloadError instanceof Error ? payloadError : new Error(String(payloadError));
                this.logger.error({ err: payloadErr }, "Failed to decode raw payload");
            }
            const trimmedRawPayload = typeof rawPayload === "string" && rawPayload.length > 2000
                ? `${rawPayload.slice(0, 2000)}... (truncated)`
                : rawPayload;
            log.error({
                err,
                rawPayload: trimmedRawPayload,
                parsedPayload,
            }, "Failed to parse/handle message");
            if (this.pendingConnections.has(ws)) {
                this.clearPendingConnection(ws);
                try {
                    ws.close(WS_CLOSE_INVALID_HELLO, "Invalid hello");
                }
                catch {
                    // ignore close errors
                }
                return;
            }
            const requestInfo = extractRequestInfoFromUnknownWsInbound(parsedPayload);
            if (requestInfo) {
                this.sendToClient(ws, wrapSessionMessage({
                    type: "rpc_error",
                    payload: {
                        requestId: requestInfo.requestId,
                        requestType: requestInfo.requestType,
                        error: "Invalid message",
                        code: "invalid_message",
                    },
                }));
                return;
            }
            this.sendToClient(ws, wrapSessionMessage({
                type: "status",
                payload: {
                    status: "error",
                    message: `Invalid message: ${err.message}`,
                },
            }));
        }
    }
    incrementRuntimeCounter(counter) {
        this.runtimeCounters[counter] += 1;
    }
    incrementCount(map, key) {
        map.set(key, (map.get(key) ?? 0) + 1);
    }
    recordInboundMessageType(type) {
        this.incrementCount(this.inboundMessageCounts, type);
    }
    recordInboundSessionRequestType(type) {
        this.incrementCount(this.inboundSessionRequestCounts, type);
    }
    recordOutboundMessage(message, ws) {
        if (message.type !== "session") {
            this.incrementCount(this.outboundMessageCounts, message.type);
            this.recordBufferedAmount(ws);
            return;
        }
        this.incrementCount(this.outboundMessageCounts, "session_message");
        this.incrementCount(this.outboundSessionMessageCounts, message.message.type);
        if (message.message.type === "agent_stream") {
            this.recordOutboundAgentStreamMessage(message.message.payload);
        }
        this.recordBufferedAmount(ws);
    }
    recordOutboundAgentStreamMessage(payload) {
        const { agentId, event } = payload;
        const eventType = event.type === "timeline" ? `timeline:${event.item.type}` : event.type;
        this.incrementCount(this.outboundAgentStreamCounts, eventType);
        this.incrementCount(this.outboundAgentStreamByAgentCounts, agentId);
    }
    recordOutboundBinaryFrame(ws) {
        this.incrementCount(this.outboundBinaryFrameCounts, "binary");
        this.recordBufferedAmount(ws);
    }
    recordBufferedAmount(ws) {
        if (typeof ws.bufferedAmount !== "number") {
            return;
        }
        this.bufferedAmountSamples.push(ws.bufferedAmount);
    }
    recordRequestLatency(type, durationMs) {
        let latencies = this.requestLatencies.get(type);
        if (!latencies) {
            latencies = [];
            this.requestLatencies.set(type, latencies);
        }
        latencies.push(durationMs);
    }
    getTopCounts(map, limit) {
        return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    }
    computeLatencyStats() {
        const stats = [];
        for (const [type, latencies] of this.requestLatencies) {
            if (latencies.length === 0)
                continue;
            latencies.sort((a, b) => a - b);
            const count = latencies.length;
            const minMs = Math.round(latencies[0]);
            const maxMs = Math.round(latencies[count - 1]);
            const p50Ms = Math.round(latencies[Math.floor(count / 2)]);
            const totalMs = Math.round(latencies.reduce((sum, v) => sum + v, 0));
            stats.push({ type, count, minMs, maxMs, p50Ms, totalMs });
        }
        stats.sort((a, b) => b.totalMs - a.totalMs);
        return stats.slice(0, 15);
    }
    computeBufferedAmountStats() {
        if (this.bufferedAmountSamples.length === 0) {
            return { p95: 0, max: 0 };
        }
        const samples = [...this.bufferedAmountSamples].sort((a, b) => a - b);
        const p95Index = Math.ceil(samples.length * 0.95) - 1;
        return {
            p95: samples[p95Index] ?? 0,
            max: samples[samples.length - 1] ?? 0,
        };
    }
    collectSessionRuntimeMetrics() {
        const uniqueConnections = new Set(this.externalSessionsByKey.values());
        let terminalDirectorySubscriptionCount = 0;
        let terminalSubscriptionCount = 0;
        let inflightRequests = 0;
        let peakInflightRequests = 0;
        for (const connection of uniqueConnections) {
            const sessionMetrics = connection.session.getRuntimeMetrics();
            terminalDirectorySubscriptionCount += sessionMetrics.terminalDirectorySubscriptionCount;
            terminalSubscriptionCount += sessionMetrics.terminalSubscriptionCount;
            inflightRequests += sessionMetrics.inflightRequests;
            peakInflightRequests = Math.max(peakInflightRequests, sessionMetrics.peakInflightRequests);
            connection.session.resetPeakInflight();
        }
        return {
            ...this.checkoutDiffManager.getMetrics(),
            terminalDirectorySubscriptionCount,
            terminalSubscriptionCount,
            inflightRequests,
            peakInflightRequests,
        };
    }
    flushRuntimeMetrics(options) {
        const now = Date.now();
        const windowMs = Math.max(0, now - this.runtimeWindowStartedAt);
        const activeConnections = new Set(this.sessions.values()).size;
        const activeSockets = this.sessions.size;
        const pendingConnections = this.pendingConnections.size;
        const reconnectGraceSessions = [...this.externalSessionsByKey.values()].filter((connection) => connection.sockets.size === 0 && connection.externalDisconnectCleanupTimeout !== null).length;
        const sessionMetrics = this.collectSessionRuntimeMetrics();
        const latencyStats = this.computeLatencyStats();
        const bufferedAmountStats = this.computeBufferedAmountStats();
        const agentSnapshot = this.agentManager.getMetricsSnapshot();
        this.logger.info({
            windowMs,
            final: Boolean(options?.final),
            sessions: {
                activeConnections,
                externalSessionKeys: this.externalSessionsByKey.size,
                reconnectGraceSessions,
            },
            sockets: {
                activeSockets,
                pendingConnections,
            },
            counters: { ...this.runtimeCounters },
            inboundMessageTypesTop: this.getTopCounts(this.inboundMessageCounts, 12),
            inboundSessionRequestTypesTop: this.getTopCounts(this.inboundSessionRequestCounts, 20),
            outboundMessageTypesTop: this.getTopCounts(this.outboundMessageCounts, 12),
            outboundSessionMessageTypesTop: this.getTopCounts(this.outboundSessionMessageCounts, 20),
            outboundAgentStreamTypesTop: this.getTopCounts(this.outboundAgentStreamCounts, 20),
            outboundAgentStreamAgentsTop: this.getTopCounts(this.outboundAgentStreamByAgentCounts, 20),
            outboundBinaryFrameTypesTop: this.getTopCounts(this.outboundBinaryFrameCounts, 12),
            bufferedAmount: bufferedAmountStats,
            runtime: sessionMetrics,
            latency: latencyStats,
            agents: agentSnapshot,
        }, "ws_runtime_metrics");
        for (const counter of Object.keys(this.runtimeCounters)) {
            this.runtimeCounters[counter] = 0;
        }
        this.inboundMessageCounts.clear();
        this.inboundSessionRequestCounts.clear();
        this.outboundMessageCounts.clear();
        this.outboundSessionMessageCounts.clear();
        this.outboundAgentStreamCounts.clear();
        this.outboundAgentStreamByAgentCounts.clear();
        this.outboundBinaryFrameCounts.clear();
        this.bufferedAmountSamples.length = 0;
        this.requestLatencies.clear();
        this.runtimeWindowStartedAt = now;
    }
    getClientActivityState(session) {
        const activity = session.getClientActivity();
        if (!activity) {
            return {
                appVisible: false,
                focusedAgentId: null,
                lastActivityAtMs: null,
            };
        }
        return {
            appVisible: activity.appVisible,
            focusedAgentId: activity.focusedAgentId,
            lastActivityAtMs: activity.lastActivityAt.getTime(),
        };
    }
    async broadcastAgentAttention(params) {
        const clientEntries = [];
        for (const [ws, connection] of this.sessions) {
            clientEntries.push({
                ws,
                state: this.getClientActivityState(connection.session),
            });
        }
        const allStates = clientEntries.map((e) => e.state);
        const nowMs = Date.now();
        const agent = this.agentManager.getAgent(params.agentId);
        const assistantMessage = await this.agentManager.getLastAssistantMessage(params.agentId);
        const notification = buildAgentAttentionNotificationPayload({
            reason: params.reason,
            serverId: this.serverId,
            agentId: params.agentId,
            assistantMessage,
            permissionRequest: agent ? findLatestPermissionRequest(agent.pendingPermissions) : null,
        });
        const plan = computeNotificationPlan({
            allStates,
            agentId: params.agentId,
            reason: params.reason,
            nowMs,
        });
        if (plan.shouldPush) {
            const tokens = this.pushTokenStore.getAllTokens();
            this.logger.info({ tokenCount: tokens.length }, "Sending push notification");
            if (tokens.length > 0) {
                void this.pushService.sendPush(tokens, notification);
            }
        }
        for (const [clientIndex, { ws }] of clientEntries.entries()) {
            const shouldNotify = clientIndex === plan.inAppRecipientIndex;
            const timestamp = new Date().toISOString();
            const message = wrapSessionMessage({
                type: "agent_stream",
                payload: {
                    agentId: params.agentId,
                    event: {
                        type: "attention_required",
                        provider: params.provider,
                        reason: params.reason,
                        timestamp,
                        shouldNotify,
                        notification,
                    },
                    timestamp,
                },
            });
            this.sendToClient(ws, message);
        }
    }
}
function extractSocketRequestMetadata(request) {
    if (!request || typeof request !== "object") {
        return {};
    }
    const record = request;
    const host = typeof record.headers?.host === "string" ? record.headers.host : undefined;
    const origin = typeof record.headers?.origin === "string" ? record.headers.origin : undefined;
    const userAgent = typeof record.headers?.["user-agent"] === "string" ? record.headers["user-agent"] : undefined;
    const remoteAddress = typeof record.socket?.remoteAddress === "string" ? record.socket.remoteAddress : undefined;
    return {
        ...(host ? { host } : {}),
        ...(origin ? { origin } : {}),
        ...(userAgent ? { userAgent } : {}),
        ...(remoteAddress ? { remoteAddress } : {}),
    };
}
function stringifyCloseReason(reason) {
    if (typeof reason === "string") {
        return reason.length > 0 ? reason : null;
    }
    if (Buffer.isBuffer(reason)) {
        const text = reason.toString();
        return text.length > 0 ? text : null;
    }
    if (reason == null) {
        return null;
    }
    const text = String(reason);
    return text.length > 0 ? text : null;
}
function extractRequestInfoFromUnknownWsInbound(payload) {
    if (!payload || typeof payload !== "object") {
        return null;
    }
    const record = payload;
    // Session-wrapped messages
    if (record.type === "session" && record.message && typeof record.message === "object") {
        const msg = record.message;
        if (typeof msg.requestId === "string") {
            return {
                requestId: msg.requestId,
                ...(typeof msg.type === "string" ? { requestType: msg.type } : {}),
            };
        }
    }
    // Non-session messages (future-proof)
    if (typeof record.requestId === "string") {
        return {
            requestId: record.requestId,
            ...(typeof record.type === "string" ? { requestType: record.type } : {}),
        };
    }
    return null;
}
//# sourceMappingURL=websocket-server.js.map