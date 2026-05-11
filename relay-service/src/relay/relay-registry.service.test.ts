import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { RelayRegistryService } from "./relay-registry.service";
import type { RelayPeerSocket, RelayFrame } from "./relay.types";

function createPersistenceStub() {
  return {
    syncSession: vi.fn(),
    syncConnection: vi.fn(),
  };
}

function createClusterStub() {
  return {
    syncSessionSnapshot: vi.fn(),
  };
}

function createSocket(id: string) {
  const sent: Array<string | Buffer> = [];
  const closeCalls: Array<{ code?: number; reason?: string }> = [];

  const socket: RelayPeerSocket = {
    id,
    send: (data: RelayFrame) => {
      if (typeof data === "string" || Buffer.isBuffer(data)) {
        sent.push(data);
        return;
      }
      sent.push(Buffer.from(data instanceof Uint8Array ? data : Buffer.from(data)));
    },
    close: (code?: number, reason?: string) => {
      closeCalls.push({ code, reason });
    },
  };

  return { socket, sent, closeCalls };
}

describe("RelayRegistryService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("assigns connection ids to v2 clients and notifies the control socket", () => {
    const persistence = createPersistenceStub();
    const cluster = createClusterStub();
    const service = new RelayRegistryService(persistence as any, cluster as any);

    const control = createSocket("control");
    service.registerSocket({
      socket: control.socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: null,
      hostname: null,
    });

    const client = createSocket("client");
    const context = service.registerSocket({
      socket: client.socket,
      version: "2",
      serverId: "srv_test",
      role: "client",
      connectionId: null,
      hostname: null,
    });

    expect(context.connectionId).toMatch(/^conn_/);
    expect(control.sent).toContainEqual(
      JSON.stringify({ type: "connected", connectionId: context.connectionId }),
    );
  });

  test("persists the daemon hostname on v2 connection snapshots", () => {
    const persistence = createPersistenceStub();
    const cluster = createClusterStub();
    const service = new RelayRegistryService(persistence as any, cluster as any);

    service.registerSocket({
      socket: createSocket("control").socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: null,
      hostname: "MacBook-Pro",
    });

    service.registerSocket({
      socket: createSocket("client").socket,
      version: "2",
      serverId: "srv_test",
      role: "client",
      connectionId: "conn_abc",
      hostname: null,
    });

    expect(persistence.syncConnection).toHaveBeenLastCalledWith(
      expect.objectContaining({
        serverId: "srv_test",
        connectionId: "conn_abc",
        hostname: "MacBook-Pro",
      }),
    );
  });

  test("sends a sync message when the control socket attaches after clients already exist", () => {
    const persistence = createPersistenceStub();
    const cluster = createClusterStub();
    const service = new RelayRegistryService(persistence as any, cluster as any);

    service.registerSocket({
      socket: createSocket("client").socket,
      version: "2",
      serverId: "srv_test",
      role: "client",
      connectionId: "conn_existing",
      hostname: null,
    });

    const control = createSocket("control");
    service.registerSocket({
      socket: control.socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: null,
      hostname: null,
    });

    expect(control.sent).toContainEqual(
      JSON.stringify({ type: "sync", connectionIds: ["conn_existing"] }),
    );
  });

  test("buffers client frames until the server data socket connects, then flushes them", () => {
    const persistence = createPersistenceStub();
    const cluster = createClusterStub();
    const service = new RelayRegistryService(persistence as any, cluster as any);

    const control = createSocket("control");
    service.registerSocket({
      socket: control.socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: null,
      hostname: null,
    });

    const client = createSocket("client");
    const clientContext = service.registerSocket({
      socket: client.socket,
      version: "2",
      serverId: "srv_test",
      role: "client",
      connectionId: "conn_123",
      hostname: null,
    });

    service.handleMessage(clientContext, "hello");

    const serverData = createSocket("server-data");
    service.registerSocket({
      socket: serverData.socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: "conn_123",
      hostname: null,
    });

    expect(serverData.sent).toContain("hello");
  });

  test("responds to control ping messages with pong", () => {
    const persistence = createPersistenceStub();
    const cluster = createClusterStub();
    const service = new RelayRegistryService(persistence as any, cluster as any);

    const control = createSocket("control");
    const controlContext = service.registerSocket({
      socket: control.socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: null,
      hostname: null,
    });

    service.handleMessage(controlContext, JSON.stringify({ type: "ping", ts: 123 }));

    const pongMessage = control.sent.find(
      (message) => typeof message === "string" && JSON.parse(message).type === "pong",
    );
    expect(pongMessage).toBeTypeOf("string");
    expect(JSON.parse(pongMessage as string)).toMatchObject({ type: "pong" });
  });

  test("closes the daemon data socket and notifies control when the last client disconnects", () => {
    const persistence = createPersistenceStub();
    const cluster = createClusterStub();
    const service = new RelayRegistryService(persistence as any, cluster as any);

    const control = createSocket("control");
    service.registerSocket({
      socket: control.socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: null,
      hostname: null,
    });

    const client = createSocket("client");
    const clientContext = service.registerSocket({
      socket: client.socket,
      version: "2",
      serverId: "srv_test",
      role: "client",
      connectionId: "conn_abc",
      hostname: null,
    });

    const serverData = createSocket("server-data");
    service.registerSocket({
      socket: serverData.socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: "conn_abc",
      hostname: null,
    });

    service.handleClose(clientContext);

    expect(serverData.closeCalls).toContainEqual({
      code: 1001,
      reason: "Client disconnected",
    });
    expect(control.sent).toContainEqual(
      JSON.stringify({ type: "disconnected", connectionId: "conn_abc" }),
    );
  });

  test("closes client sockets when the daemon data socket disconnects", () => {
    const persistence = createPersistenceStub();
    const cluster = createClusterStub();
    const service = new RelayRegistryService(persistence as any, cluster as any);

    const client = createSocket("client");
    service.registerSocket({
      socket: client.socket,
      version: "2",
      serverId: "srv_test",
      role: "client",
      connectionId: "conn_abc",
      hostname: null,
    });

    const serverData = createSocket("server-data");
    const serverContext = service.registerSocket({
      socket: serverData.socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: "conn_abc",
      hostname: null,
    });

    service.handleClose(serverContext);

    expect(client.closeCalls).toContainEqual({
      code: 1012,
      reason: "Server disconnected",
    });
  });

  test("nudges and then resets the control socket when a daemon data socket never appears", () => {
    const persistence = createPersistenceStub();
    const cluster = createClusterStub();
    const service = new RelayRegistryService(persistence as any, cluster as any);

    const control = createSocket("control");
    service.registerSocket({
      socket: control.socket,
      version: "2",
      serverId: "srv_test",
      role: "server",
      connectionId: null,
      hostname: null,
    });

    service.registerSocket({
      socket: createSocket("client").socket,
      version: "2",
      serverId: "srv_test",
      role: "client",
      connectionId: "conn_waiting",
      hostname: null,
    });

    vi.advanceTimersByTime(10_000);
    expect(control.sent).toContainEqual(
      JSON.stringify({ type: "sync", connectionIds: ["conn_waiting"] }),
    );

    vi.advanceTimersByTime(5_000);
    expect(control.closeCalls).toContainEqual({
      code: 1011,
      reason: "Control unresponsive",
    });
  });

  test("relays v1 traffic between server and client sockets", () => {
    const persistence = createPersistenceStub();
    const cluster = createClusterStub();
    const service = new RelayRegistryService(persistence as any, cluster as any);

    const server = createSocket("server");
    const serverContext = service.registerSocket({
      socket: server.socket,
      version: "1",
      serverId: "srv_v1",
      role: "server",
      connectionId: null,
      hostname: null,
    });

    const client = createSocket("client");
    service.registerSocket({
      socket: client.socket,
      version: "1",
      serverId: "srv_v1",
      role: "client",
      connectionId: null,
      hostname: null,
    });

    service.handleMessage(serverContext, "legacy-hello");

    expect(client.sent).toContain("legacy-hello");
  });
});
