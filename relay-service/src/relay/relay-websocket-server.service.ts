import { randomUUID } from "node:crypto";
import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";

import { Injectable, Logger, Inject } from "@nestjs/common";
import { WebSocketServer, type RawData, type WebSocket } from "ws";

import { normalizeIncomingFrame, parseRelayUpgradeRequest } from "./relay.protocol";
import { RelayClusterService } from "./relay-cluster.service";
import { RelayRegistryService } from "./relay-registry.service";
import type { RelayPeerSocket, RelaySocketContext } from "./relay.types";

@Injectable()
export class RelayWebSocketServerService {
  private readonly logger = new Logger(RelayWebSocketServerService.name);
  private readonly webSocketServer = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
  });
  private attached = false;

  constructor(
    @Inject(RelayRegistryService) private readonly relayRegistryService: RelayRegistryService,
    @Inject(RelayClusterService) private readonly relayClusterService: RelayClusterService,
  ) {}

  attach(httpServer: HttpServer): void {
    if (this.attached) {
      return;
    }
    this.attached = true;

    httpServer.on("upgrade", (request, socket, head) => {
      void this.handleUpgrade(request, socket, head);
    });
  }

  private async handleUpgrade(
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ): Promise<void> {
    const requestUrl = request.url ?? "/";
    if (!requestUrl.startsWith("/ws")) {
      return;
    }

    let parsedRequest: ReturnType<typeof parseRelayUpgradeRequest>;
    try {
      parsedRequest = parseRelayUpgradeRequest(request);
    } catch (error) {
      this.rejectUpgrade(socket, 400, error instanceof Error ? error.message : "Bad request");
      return;
    }

    try {
      const ownership = await this.relayClusterService.ensureSessionOwnership(
        parsedRequest.version,
        parsedRequest.serverId,
      );
      if (!ownership.accepted) {
        this.rejectUpgrade(
          socket,
          409,
          `Sticky session mismatch for ${parsedRequest.serverId}; owned by ${ownership.ownerInstanceId ?? "unknown"}`,
        );
        return;
      }
    } catch (error) {
      this.logger.error(
        `Failed to verify sticky ownership for ${parsedRequest.serverId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.rejectUpgrade(socket, 503, "Relay cluster coordination unavailable");
      return;
    }

    this.webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      this.handleAcceptedSocket(webSocket, request, parsedRequest);
    });
  }

  private handleAcceptedSocket(
    webSocket: WebSocket,
    request: IncomingMessage,
    parsedRequest: ReturnType<typeof parseRelayUpgradeRequest>,
  ): void {
    const relaySocket = this.createRelayPeerSocket(webSocket);
    const context = this.relayRegistryService.registerSocket({
      socket: relaySocket,
      version: parsedRequest.version,
      serverId: parsedRequest.serverId,
      role: parsedRequest.role,
      connectionId: parsedRequest.connectionId,
      hostname: parsedRequest.hostname,
    });

    this.logger.log(
      `Accepted relay websocket ${context.version}:${context.role} serverId=${context.serverId} connectionId=${context.connectionId ?? "-"} remote=${request.socket.remoteAddress ?? "-"}`,
    );

    webSocket.on("message", (data: RawData, isBinary: boolean) => {
      const frame = normalizeIncomingFrame(this.normalizeRawData(data), isBinary);
      this.relayRegistryService.handleMessage(context, frame);
    });

    webSocket.on("close", () => {
      this.relayRegistryService.handleClose(context);
    });

    webSocket.on("error", (error) => {
      this.logger.warn(
        `Relay websocket error serverId=${context.serverId} connectionId=${context.connectionId ?? "-"}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }

  private createRelayPeerSocket(webSocket: WebSocket): RelayPeerSocket {
    return {
      id: randomUUID(),
      send: (data) => {
        webSocket.send(data);
      },
      close: (code?: number, reason?: string) => {
        webSocket.close(code, reason);
      },
    };
  }

  private normalizeRawData(data: RawData): Buffer {
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

  private rejectUpgrade(socket: Duplex, statusCode: number, message: string): void {
    socket.write(
      `HTTP/1.1 ${statusCode} Bad Request\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`,
    );
    socket.destroy();
  }
}
