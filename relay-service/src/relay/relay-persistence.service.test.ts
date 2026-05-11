import { describe, expect, test } from "vitest";

import { RelayPersistenceService } from "./relay-persistence.service";
import type { RelayConnectionSnapshot, RelaySessionSnapshot } from "./relay.types";

describe("RelayPersistenceService", () => {
  test("tracks daemon stats in memory for active connections", () => {
    const service = new RelayPersistenceService();

    const session: RelaySessionSnapshot = {
      version: "2",
      serverId: "srv_electron",
      hostname: "MacBook-Pro",
      serverSocketConnected: false,
      controlSocketConnected: true,
      clientSocketCount: 1,
      status: "active",
    };
    const connection: RelayConnectionSnapshot = {
      version: "2",
      serverId: "srv_electron",
      connectionId: "conn_1",
      hostname: "MacBook-Pro",
      clientSocketCount: 1,
      serverDataConnected: true,
      pendingFrameCount: 0,
      status: "active",
    };

    service.syncSession(session);
    service.syncConnection(connection);

    expect(service.getDaemonStats("srv_electron")).toEqual({
      activeConnections: 1,
      totalConnections: 1,
    });
  });

  test("drops closed connections from daemon stats", () => {
    const service = new RelayPersistenceService();

    service.syncConnection({
      version: "2",
      serverId: "srv_electron",
      connectionId: "conn_1",
      hostname: "MacBook-Pro",
      clientSocketCount: 1,
      serverDataConnected: true,
      pendingFrameCount: 0,
      status: "active",
    });
    service.syncConnection({
      version: "2",
      serverId: "srv_electron",
      connectionId: "conn_1",
      hostname: "MacBook-Pro",
      clientSocketCount: 0,
      serverDataConnected: false,
      pendingFrameCount: 0,
      status: "closed",
    });

    expect(service.getDaemonStats("srv_electron")).toEqual({
      activeConnections: 0,
      totalConnections: 0,
    });
  });
});
