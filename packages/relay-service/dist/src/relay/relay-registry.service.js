"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RelayRegistryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayRegistryService = void 0;
const common_1 = require("@nestjs/common");
const relay_protocol_1 = require("./relay.protocol");
const relay_cluster_service_1 = require("./relay-cluster.service");
const relay_persistence_service_1 = require("./relay-persistence.service");
const MAX_PENDING_FRAMES = 200;
const CONTROL_NUDGE_DELAY_MS = 10000;
const CONTROL_RESET_DELAY_MS = 5000;
let RelayRegistryService = RelayRegistryService_1 = class RelayRegistryService {
    constructor(relayPersistenceService, relayClusterService) {
        this.relayPersistenceService = relayPersistenceService;
        this.relayClusterService = relayClusterService;
        this.logger = new common_1.Logger(RelayRegistryService_1.name);
        this.v1Sessions = new Map();
        this.v2Sessions = new Map();
    }
    registerSocket(input) {
        return input.version === "1" ? this.registerV1Socket(input) : this.registerV2Socket(input);
    }
    handleMessage(context, frame) {
        if (context.version === "1") {
            this.handleV1Message(context, frame);
            return;
        }
        if (!context.connectionId) {
            const controlMessage = (0, relay_protocol_1.parseControlMessage)(frame);
            if (controlMessage?.type === "ping") {
                const session = this.v2Sessions.get(context.serverId);
                session?.controlSocket?.send(JSON.stringify({ type: "pong", ts: Date.now() }));
            }
            return;
        }
        const session = this.v2Sessions.get(context.serverId);
        const connection = session?.connections.get(context.connectionId);
        if (!session || !connection) {
            return;
        }
        if (context.role === "client") {
            if (!connection.serverDataSocket) {
                this.bufferFrame(connection, frame);
                this.publishConnectionSnapshot(context.serverId, connection);
                return;
            }
            this.sendSafely(connection.serverDataSocket, frame);
            return;
        }
        for (const clientSocket of connection.clientSockets.values()) {
            this.sendSafely(clientSocket, frame);
        }
    }
    handleClose(context) {
        if (context.version === "1") {
            this.handleV1Close(context);
            return;
        }
        this.handleV2Close(context);
    }
    registerV1Socket(input) {
        const session = this.getOrCreateV1Session(input.serverId);
        if (input.role === "server") {
            if (session.serverSocket && session.serverSocket.id !== input.socket.id) {
                session.serverSocket.close(1008, "Replaced by new connection");
            }
            session.serverSocket = input.socket;
        }
        else {
            if (session.clientSocket && session.clientSocket.id !== input.socket.id) {
                session.clientSocket.close(1008, "Replaced by new connection");
            }
            session.clientSocket = input.socket;
        }
        this.publishSessionSnapshot(input.serverId, "1", session);
        return {
            socketId: input.socket.id,
            version: "1",
            serverId: input.serverId,
            role: input.role,
            connectionId: null,
            createdAt: Date.now(),
        };
    }
    registerV2Socket(input) {
        const session = this.getOrCreateV2Session(input.serverId);
        const resolvedConnectionId = input.role === "client" && !input.connectionId
            ? (0, relay_protocol_1.createRelayConnectionId)()
            : input.connectionId;
        const isServerControl = input.role === "server" && !resolvedConnectionId;
        const isServerData = input.role === "server" && !!resolvedConnectionId;
        if (isServerControl) {
            if (session.controlSocket && session.controlSocket.id !== input.socket.id) {
                session.controlSocket.close(1008, "Replaced by new connection");
            }
            session.controlSocket = input.socket;
        }
        else {
            const connection = this.getOrCreateV2Connection(session, resolvedConnectionId);
            if (isServerData) {
                if (connection.serverDataSocket && connection.serverDataSocket.id !== input.socket.id) {
                    connection.serverDataSocket.close(1008, "Replaced by new connection");
                }
                connection.serverDataSocket = input.socket;
                this.clearControlTimers(connection);
                this.flushPendingFrames(connection);
            }
            else {
                connection.clientSockets.set(input.socket.id, input.socket);
                this.notifyControl(session, { type: "connected", connectionId: connection.connectionId });
                this.scheduleControlNudge(session, connection);
            }
            this.publishConnectionSnapshot(input.serverId, connection);
        }
        if (isServerControl) {
            this.notifyControl(session, {
                type: "sync",
                connectionIds: this.listConnectedConnectionIds(session),
            });
        }
        this.publishSessionSnapshot(input.serverId, "2", session);
        return {
            socketId: input.socket.id,
            version: "2",
            serverId: input.serverId,
            role: input.role,
            connectionId: resolvedConnectionId,
            createdAt: Date.now(),
        };
    }
    handleV1Message(context, frame) {
        const session = this.v1Sessions.get(context.serverId);
        if (!session) {
            return;
        }
        const target = context.role === "server" ? session.clientSocket : session.serverSocket;
        if (!target) {
            return;
        }
        this.sendSafely(target, frame);
    }
    handleV1Close(context) {
        const session = this.v1Sessions.get(context.serverId);
        if (!session) {
            return;
        }
        if (context.role === "server" && session.serverSocket?.id === context.socketId) {
            session.serverSocket = null;
        }
        if (context.role === "client" && session.clientSocket?.id === context.socketId) {
            session.clientSocket = null;
        }
        this.publishSessionSnapshot(context.serverId, "1", session);
        if (!session.serverSocket && !session.clientSocket) {
            this.v1Sessions.delete(context.serverId);
        }
    }
    handleV2Close(context) {
        const session = this.v2Sessions.get(context.serverId);
        if (!session) {
            return;
        }
        if (!context.connectionId) {
            if (session.controlSocket?.id === context.socketId) {
                session.controlSocket = null;
                this.publishSessionSnapshot(context.serverId, "2", session);
            }
            if (!session.controlSocket && session.connections.size === 0) {
                this.v2Sessions.delete(context.serverId);
            }
            return;
        }
        const connection = session.connections.get(context.connectionId);
        if (!connection) {
            return;
        }
        if (context.role === "client") {
            connection.clientSockets.delete(context.socketId);
            if (connection.clientSockets.size === 0) {
                this.clearControlTimers(connection);
                connection.pendingFrames = [];
                if (connection.serverDataSocket) {
                    connection.serverDataSocket.close(1001, "Client disconnected");
                    connection.serverDataSocket = null;
                }
                session.connections.delete(connection.connectionId);
                this.notifyControl(session, {
                    type: "disconnected",
                    connectionId: connection.connectionId,
                });
                this.publishConnectionSnapshot(context.serverId, {
                    ...connection,
                    clientSockets: new Map(),
                    serverDataSocket: null,
                    pendingFrames: [],
                });
            }
            else {
                this.publishConnectionSnapshot(context.serverId, connection);
            }
        }
        else if (connection.serverDataSocket?.id === context.socketId) {
            connection.serverDataSocket = null;
            for (const clientSocket of connection.clientSockets.values()) {
                clientSocket.close(1012, "Server disconnected");
            }
            if (connection.clientSockets.size === 0) {
                this.clearControlTimers(connection);
                session.connections.delete(connection.connectionId);
            }
            this.publishConnectionSnapshot(context.serverId, connection);
        }
        this.publishSessionSnapshot(context.serverId, "2", session);
        if (!session.controlSocket && session.connections.size === 0) {
            this.v2Sessions.delete(context.serverId);
        }
    }
    getOrCreateV1Session(serverId) {
        const existing = this.v1Sessions.get(serverId);
        if (existing) {
            return existing;
        }
        const created = {
            serverSocket: null,
            clientSocket: null,
        };
        this.v1Sessions.set(serverId, created);
        return created;
    }
    getOrCreateV2Session(serverId) {
        const existing = this.v2Sessions.get(serverId);
        if (existing) {
            return existing;
        }
        const created = {
            controlSocket: null,
            connections: new Map(),
        };
        this.v2Sessions.set(serverId, created);
        return created;
    }
    getOrCreateV2Connection(session, connectionId) {
        const existing = session.connections.get(connectionId);
        if (existing) {
            return existing;
        }
        const created = {
            connectionId,
            clientSockets: new Map(),
            serverDataSocket: null,
            pendingFrames: [],
            nudgeTimer: null,
            resetTimer: null,
        };
        session.connections.set(connectionId, created);
        return created;
    }
    scheduleControlNudge(session, connection) {
        this.clearControlTimers(connection);
        if (connection.serverDataSocket) {
            return;
        }
        connection.nudgeTimer = setTimeout(() => {
            if (connection.clientSockets.size === 0 || connection.serverDataSocket) {
                return;
            }
            this.notifyControl(session, {
                type: "sync",
                connectionIds: this.listConnectedConnectionIds(session),
            });
            connection.resetTimer = setTimeout(() => {
                if (connection.clientSockets.size === 0 || connection.serverDataSocket) {
                    return;
                }
                session.controlSocket?.close(1011, "Control unresponsive");
            }, CONTROL_RESET_DELAY_MS);
        }, CONTROL_NUDGE_DELAY_MS);
    }
    clearControlTimers(connection) {
        if (connection.nudgeTimer) {
            clearTimeout(connection.nudgeTimer);
            connection.nudgeTimer = null;
        }
        if (connection.resetTimer) {
            clearTimeout(connection.resetTimer);
            connection.resetTimer = null;
        }
    }
    flushPendingFrames(connection) {
        if (!connection.serverDataSocket || connection.pendingFrames.length === 0) {
            return;
        }
        const frames = [...connection.pendingFrames];
        connection.pendingFrames = [];
        for (let index = 0; index < frames.length; index += 1) {
            const frame = frames[index];
            try {
                connection.serverDataSocket.send((0, relay_protocol_1.normalizeFrameForSend)(frame));
            }
            catch (error) {
                this.logger.warn(`Failed to flush buffered frame for ${connection.connectionId}: ${error instanceof Error ? error.message : String(error)}`);
                connection.pendingFrames = frames.slice(index);
                break;
            }
        }
    }
    bufferFrame(connection, frame) {
        connection.pendingFrames.push(frame);
        if (connection.pendingFrames.length > MAX_PENDING_FRAMES) {
            connection.pendingFrames.splice(0, connection.pendingFrames.length - MAX_PENDING_FRAMES);
        }
    }
    notifyControl(session, message) {
        if (!session.controlSocket) {
            return;
        }
        this.sendSafely(session.controlSocket, JSON.stringify(message));
    }
    listConnectedConnectionIds(session) {
        return Array.from(session.connections.values())
            .filter((connection) => connection.clientSockets.size > 0)
            .map((connection) => connection.connectionId);
    }
    publishSessionSnapshot(serverId, version, session) {
        const snapshot = version === "1"
            ? {
                version,
                serverId,
                serverSocketConnected: Boolean(session.serverSocket),
                controlSocketConnected: false,
                clientSocketCount: session.clientSocket ? 1 : 0,
                status: session.serverSocket ||
                    session.clientSocket
                    ? "active"
                    : "closed",
            }
            : {
                version,
                serverId,
                serverSocketConnected: false,
                controlSocketConnected: Boolean(session.controlSocket),
                clientSocketCount: Array.from(session.connections.values()).reduce((count, connection) => count + connection.clientSockets.size, 0),
                status: Boolean(session.controlSocket) ||
                    session.connections.size > 0
                    ? "active"
                    : "closed",
            };
        this.relayPersistenceService.syncSession(snapshot);
        this.relayClusterService.syncSessionSnapshot(snapshot);
    }
    publishConnectionSnapshot(serverId, connection) {
        const snapshot = {
            version: "2",
            serverId,
            connectionId: connection.connectionId,
            clientSocketCount: connection.clientSockets.size,
            serverDataConnected: Boolean(connection.serverDataSocket),
            pendingFrameCount: connection.pendingFrames.length,
            status: connection.clientSockets.size > 0 || Boolean(connection.serverDataSocket)
                ? "active"
                : "closed",
        };
        this.relayPersistenceService.syncConnection(snapshot);
    }
    sendSafely(socket, frame) {
        try {
            socket.send((0, relay_protocol_1.normalizeFrameForSend)(frame));
        }
        catch (error) {
            this.logger.warn(`Failed to relay frame on socket ${socket.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
exports.RelayRegistryService = RelayRegistryService;
exports.RelayRegistryService = RelayRegistryService = RelayRegistryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [relay_persistence_service_1.RelayPersistenceService,
        relay_cluster_service_1.RelayClusterService])
], RelayRegistryService);
//# sourceMappingURL=relay-registry.service.js.map