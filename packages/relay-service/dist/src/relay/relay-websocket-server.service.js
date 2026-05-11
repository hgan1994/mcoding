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
var RelayWebSocketServerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayWebSocketServerService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const ws_1 = require("ws");
const relay_protocol_1 = require("./relay.protocol");
const relay_cluster_service_1 = require("./relay-cluster.service");
const relay_registry_service_1 = require("./relay-registry.service");
let RelayWebSocketServerService = RelayWebSocketServerService_1 = class RelayWebSocketServerService {
    constructor(relayRegistryService, relayClusterService) {
        this.relayRegistryService = relayRegistryService;
        this.relayClusterService = relayClusterService;
        this.logger = new common_1.Logger(RelayWebSocketServerService_1.name);
        this.webSocketServer = new ws_1.WebSocketServer({
            noServer: true,
            perMessageDeflate: false,
        });
        this.attached = false;
    }
    attach(httpServer) {
        if (this.attached) {
            return;
        }
        this.attached = true;
        httpServer.on("upgrade", (request, socket, head) => {
            void this.handleUpgrade(request, socket, head);
        });
    }
    async handleUpgrade(request, socket, head) {
        const requestUrl = request.url ?? "/";
        if (!requestUrl.startsWith("/ws")) {
            return;
        }
        let parsedRequest;
        try {
            parsedRequest = (0, relay_protocol_1.parseRelayUpgradeRequest)(request);
        }
        catch (error) {
            this.rejectUpgrade(socket, 400, error instanceof Error ? error.message : "Bad request");
            return;
        }
        try {
            const ownership = await this.relayClusterService.ensureSessionOwnership(parsedRequest.version, parsedRequest.serverId);
            if (!ownership.accepted) {
                this.rejectUpgrade(socket, 409, `Sticky session mismatch for ${parsedRequest.serverId}; owned by ${ownership.ownerInstanceId ?? "unknown"}`);
                return;
            }
        }
        catch (error) {
            this.logger.error(`Failed to verify sticky ownership for ${parsedRequest.serverId}: ${error instanceof Error ? error.message : String(error)}`);
            this.rejectUpgrade(socket, 503, "Relay cluster coordination unavailable");
            return;
        }
        this.webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
            this.handleAcceptedSocket(webSocket, request, parsedRequest);
        });
    }
    handleAcceptedSocket(webSocket, request, parsedRequest) {
        const relaySocket = this.createRelayPeerSocket(webSocket);
        const context = this.relayRegistryService.registerSocket({
            socket: relaySocket,
            version: parsedRequest.version,
            serverId: parsedRequest.serverId,
            role: parsedRequest.role,
            connectionId: parsedRequest.connectionId,
        });
        this.logger.log(`Accepted relay websocket ${context.version}:${context.role} serverId=${context.serverId} connectionId=${context.connectionId ?? "-"} remote=${request.socket.remoteAddress ?? "-"}`);
        webSocket.on("message", (data, isBinary) => {
            const frame = (0, relay_protocol_1.normalizeIncomingFrame)(this.normalizeRawData(data), isBinary);
            this.relayRegistryService.handleMessage(context, frame);
        });
        webSocket.on("close", () => {
            this.relayRegistryService.handleClose(context);
        });
        webSocket.on("error", (error) => {
            this.logger.warn(`Relay websocket error serverId=${context.serverId} connectionId=${context.connectionId ?? "-"}: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    createRelayPeerSocket(webSocket) {
        return {
            id: (0, node_crypto_1.randomUUID)(),
            send: (data) => {
                webSocket.send(data);
            },
            close: (code, reason) => {
                webSocket.close(code, reason);
            },
        };
    }
    normalizeRawData(data) {
        if (Buffer.isBuffer(data)) {
            return data;
        }
        if (Array.isArray(data)) {
            return Buffer.concat(data);
        }
        if (typeof data === "string") {
            return Buffer.from(data, "utf8");
        }
        return Buffer.from(data);
    }
    rejectUpgrade(socket, statusCode, message) {
        socket.write(`HTTP/1.1 ${statusCode} Bad Request\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`);
        socket.destroy();
    }
};
exports.RelayWebSocketServerService = RelayWebSocketServerService;
exports.RelayWebSocketServerService = RelayWebSocketServerService = RelayWebSocketServerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [relay_registry_service_1.RelayRegistryService,
        relay_cluster_service_1.RelayClusterService])
], RelayWebSocketServerService);
//# sourceMappingURL=relay-websocket-server.service.js.map