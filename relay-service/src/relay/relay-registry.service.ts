import { Injectable, Logger, Inject } from "@nestjs/common";

import {
  createRelayConnectionId,
  normalizeFrameForSend,
  parseControlMessage,
} from "./relay.protocol";
import { RelayClusterService } from "./relay-cluster.service";
import type {
  ControlMessage,
  RelayConnectionSnapshot,
  RelayFrame,
  RelayPeerSocket,
  RelayProtocolVersion,
  RelaySessionSnapshot,
  RelaySocketContext,
} from "./relay.types";
import { RelayPersistenceService } from "./relay-persistence.service";

const MAX_PENDING_FRAMES = 200;
const CONTROL_NUDGE_DELAY_MS = 10_000;
const CONTROL_RESET_DELAY_MS = 5_000;

type RelayV1SessionState = {
  hostname: string | null;
  serverSocket: RelayPeerSocket | null;
  clientSocket: RelayPeerSocket | null;
};

type RelayV2ConnectionState = {
  connectionId: string;
  clientSockets: Map<string, RelayPeerSocket>;
  serverDataSocket: RelayPeerSocket | null;
  pendingFrames: RelayFrame[];
  nudgeTimer: NodeJS.Timeout | null;
  resetTimer: NodeJS.Timeout | null;
};

type RelayV2SessionState = {
  hostname: string | null;
  controlSocket: RelayPeerSocket | null;
  connections: Map<string, RelayV2ConnectionState>;
};

type RegisterRelaySocketInput = {
  socket: RelayPeerSocket;
  version: RelayProtocolVersion;
  serverId: string;
  role: "server" | "client";
  connectionId: string | null;
  hostname: string | null;
};

@Injectable()
export class RelayRegistryService {
  private readonly logger = new Logger(RelayRegistryService.name);
  private readonly v1Sessions = new Map<string, RelayV1SessionState>();
  private readonly v2Sessions = new Map<string, RelayV2SessionState>();

  constructor(
    @Inject(RelayPersistenceService) private readonly relayPersistenceService: RelayPersistenceService,
    @Inject(RelayClusterService) private readonly relayClusterService: RelayClusterService,
  ) {}

  registerSocket(input: RegisterRelaySocketInput): RelaySocketContext {
    return input.version === "1" ? this.registerV1Socket(input) : this.registerV2Socket(input);
  }

  handleMessage(context: RelaySocketContext, frame: RelayFrame): void {
    if (context.version === "1") {
      this.handleV1Message(context, frame);
      return;
    }

    if (!context.connectionId) {
      const controlMessage = parseControlMessage(frame);
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
        this.publishConnectionSnapshot(context.serverId, connection, session.hostname);
        return;
      }

      this.sendSafely(connection.serverDataSocket, frame);
      return;
    }

    for (const clientSocket of connection.clientSockets.values()) {
      this.sendSafely(clientSocket, frame);
    }
  }

  handleClose(context: RelaySocketContext): void {
    if (context.version === "1") {
      this.handleV1Close(context);
      return;
    }

    this.handleV2Close(context);
  }

  private registerV1Socket(input: RegisterRelaySocketInput): RelaySocketContext {
    const session = this.getOrCreateV1Session(input.serverId);
    if (input.role === "server") {
      if (session.serverSocket && session.serverSocket.id !== input.socket.id) {
        session.serverSocket.close(1008, "Replaced by new connection");
      }
      session.serverSocket = input.socket;
      if (input.hostname) session.hostname = input.hostname;
    } else {
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
      hostname: session.hostname,
      createdAt: Date.now(),
    };
  }

  private registerV2Socket(input: RegisterRelaySocketInput): RelaySocketContext {
    const session = this.getOrCreateV2Session(input.serverId);
    const resolvedConnectionId =
      input.role === "client" && !input.connectionId
        ? createRelayConnectionId()
        : input.connectionId;

    const isServerControl = input.role === "server" && !resolvedConnectionId;
    const isServerData = input.role === "server" && !!resolvedConnectionId;

    if (isServerControl) {
      if (session.controlSocket && session.controlSocket.id !== input.socket.id) {
        session.controlSocket.close(1008, "Replaced by new connection");
      }
      session.controlSocket = input.socket;
      if (input.hostname) session.hostname = input.hostname;
      for (const connection of session.connections.values()) {
        this.publishConnectionSnapshot(input.serverId, connection, session.hostname);
      }
    } else {
      const connection = this.getOrCreateV2Connection(session, resolvedConnectionId!);

      if (isServerData) {
        if (connection.serverDataSocket && connection.serverDataSocket.id !== input.socket.id) {
          connection.serverDataSocket.close(1008, "Replaced by new connection");
        }
        connection.serverDataSocket = input.socket;
        if (input.hostname) session.hostname = input.hostname;
        this.clearControlTimers(connection);
        this.flushPendingFrames(connection);
      } else {
        connection.clientSockets.set(input.socket.id, input.socket);
        this.notifyControl(session, { type: "connected", connectionId: connection.connectionId });
        this.scheduleControlNudge(session, connection);
      }

      this.publishConnectionSnapshot(input.serverId, connection, session.hostname);
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
      hostname: session.hostname,
      createdAt: Date.now(),
    };
  }

  private handleV1Message(context: RelaySocketContext, frame: RelayFrame): void {
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

  private handleV1Close(context: RelaySocketContext): void {
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

  private handleV2Close(context: RelaySocketContext): void {
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
        this.publishConnectionSnapshot(
          context.serverId,
          {
            ...connection,
            clientSockets: new Map<string, RelayPeerSocket>(),
            serverDataSocket: null,
            pendingFrames: [],
          },
          session.hostname,
        );
      } else {
        this.publishConnectionSnapshot(context.serverId, connection, session.hostname);
      }
    } else if (connection.serverDataSocket?.id === context.socketId) {
      connection.serverDataSocket = null;
      for (const clientSocket of connection.clientSockets.values()) {
        clientSocket.close(1012, "Server disconnected");
      }
      if (connection.clientSockets.size === 0) {
        this.clearControlTimers(connection);
        session.connections.delete(connection.connectionId);
      }
      this.publishConnectionSnapshot(context.serverId, connection, session.hostname);
    }

    this.publishSessionSnapshot(context.serverId, "2", session);
    if (!session.controlSocket && session.connections.size === 0) {
      this.v2Sessions.delete(context.serverId);
    }
  }

  private getOrCreateV1Session(serverId: string): RelayV1SessionState {
    const existing = this.v1Sessions.get(serverId);
    if (existing) {
      return existing;
    }

    const created: RelayV1SessionState = {
      hostname: null,
      serverSocket: null,
      clientSocket: null,
    };
    this.v1Sessions.set(serverId, created);
    return created;
  }

  private getOrCreateV2Session(serverId: string): RelayV2SessionState {
    const existing = this.v2Sessions.get(serverId);
    if (existing) {
      return existing;
    }

    const created: RelayV2SessionState = {
      hostname: null,
      controlSocket: null,
      connections: new Map<string, RelayV2ConnectionState>(),
    };
    this.v2Sessions.set(serverId, created);
    return created;
  }

  private getOrCreateV2Connection(
    session: RelayV2SessionState,
    connectionId: string,
  ): RelayV2ConnectionState {
    const existing = session.connections.get(connectionId);
    if (existing) {
      return existing;
    }

    const created: RelayV2ConnectionState = {
      connectionId,
      clientSockets: new Map<string, RelayPeerSocket>(),
      serverDataSocket: null,
      pendingFrames: [],
      nudgeTimer: null,
      resetTimer: null,
    };
    session.connections.set(connectionId, created);
    return created;
  }

  private scheduleControlNudge(
    session: RelayV2SessionState,
    connection: RelayV2ConnectionState,
  ): void {
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

  private clearControlTimers(connection: RelayV2ConnectionState): void {
    if (connection.nudgeTimer) {
      clearTimeout(connection.nudgeTimer);
      connection.nudgeTimer = null;
    }
    if (connection.resetTimer) {
      clearTimeout(connection.resetTimer);
      connection.resetTimer = null;
    }
  }

  private flushPendingFrames(connection: RelayV2ConnectionState): void {
    if (!connection.serverDataSocket || connection.pendingFrames.length === 0) {
      return;
    }

    const frames = [...connection.pendingFrames];
    connection.pendingFrames = [];
    for (let index = 0; index < frames.length; index += 1) {
      const frame = frames[index]!;
      try {
        connection.serverDataSocket.send(normalizeFrameForSend(frame));
      } catch (error) {
        this.logger.warn(
          `Failed to flush buffered frame for ${connection.connectionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        connection.pendingFrames = frames.slice(index);
        break;
      }
    }
  }

  private bufferFrame(connection: RelayV2ConnectionState, frame: RelayFrame): void {
    connection.pendingFrames.push(frame);
    if (connection.pendingFrames.length > MAX_PENDING_FRAMES) {
      connection.pendingFrames.splice(0, connection.pendingFrames.length - MAX_PENDING_FRAMES);
    }
  }

  private notifyControl(session: RelayV2SessionState, message: ControlMessage): void {
    if (!session.controlSocket) {
      return;
    }

    this.sendSafely(session.controlSocket, JSON.stringify(message));
  }

  private listConnectedConnectionIds(session: RelayV2SessionState): string[] {
    return Array.from(session.connections.values())
      .filter((connection) => connection.clientSockets.size > 0)
      .map((connection) => connection.connectionId);
  }

  private publishSessionSnapshot(
    serverId: string,
    version: RelayProtocolVersion,
    session: RelayV1SessionState | RelayV2SessionState,
  ): void {
    const snapshot: RelaySessionSnapshot =
      version === "1"
        ? {
            version,
            serverId,
            hostname: (session as RelayV1SessionState).hostname,
            serverSocketConnected: Boolean((session as RelayV1SessionState).serverSocket),
            controlSocketConnected: false,
            clientSocketCount: (session as RelayV1SessionState).clientSocket ? 1 : 0,
            status:
              (session as RelayV1SessionState).serverSocket ||
              (session as RelayV1SessionState).clientSocket
                ? "active"
                : "closed",
          }
        : {
            version,
            serverId,
            hostname: (session as RelayV2SessionState).hostname,
            serverSocketConnected: false,
            controlSocketConnected: Boolean((session as RelayV2SessionState).controlSocket),
            clientSocketCount: Array.from(
              (session as RelayV2SessionState).connections.values(),
            ).reduce((count, connection) => count + connection.clientSockets.size, 0),
            status:
              Boolean((session as RelayV2SessionState).controlSocket) ||
              (session as RelayV2SessionState).connections.size > 0
                ? "active"
                : "closed",
          };

    this.relayPersistenceService.syncSession(snapshot);
    this.relayClusterService.syncSessionSnapshot(snapshot);
  }

  private publishConnectionSnapshot(
    serverId: string,
    connection: RelayV2ConnectionState,
    hostname: string | null,
  ): void {
    const snapshot: RelayConnectionSnapshot = {
      version: "2",
      serverId,
      connectionId: connection.connectionId,
      hostname,
      clientSocketCount: connection.clientSockets.size,
      serverDataConnected: Boolean(connection.serverDataSocket),
      pendingFrameCount: connection.pendingFrames.length,
      status:
        connection.clientSockets.size > 0 || Boolean(connection.serverDataSocket)
          ? "active"
          : "closed",
    };

    this.relayPersistenceService.syncConnection(snapshot);
  }

  private sendSafely(socket: RelayPeerSocket, frame: RelayFrame): void {
    try {
      socket.send(normalizeFrameForSend(frame));
    } catch (error) {
      this.logger.warn(
        `Failed to relay frame on socket ${socket.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
