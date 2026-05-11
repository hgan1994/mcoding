import { Injectable } from "@nestjs/common";

import type { RelayConnectionSnapshot, RelaySessionSnapshot } from "./relay.types";

@Injectable()
export class RelayPersistenceService {
  private readonly sessions = new Map<string, RelaySessionSnapshot>();
  private readonly connections = new Map<string, RelayConnectionSnapshot>();

  syncSession(snapshot: RelaySessionSnapshot): void {
    this.sessions.set(this.getSessionKey(snapshot.version, snapshot.serverId), snapshot);

    if (snapshot.status === "closed") {
      for (const [key, connection] of this.connections.entries()) {
        if (connection.version === "2" && connection.serverId === snapshot.serverId) {
          this.connections.delete(key);
        }
      }
    }
  }

  syncConnection(snapshot: RelayConnectionSnapshot): void {
    const key = this.getConnectionKey(snapshot.serverId, snapshot.connectionId);
    if (snapshot.status === "closed") {
      this.connections.delete(key);
      return;
    }
    this.connections.set(key, snapshot);
  }

  getDaemonStats(serverId: string): { activeConnections: number; totalConnections: number } {
    const matches = [...this.connections.values()].filter(
      (connection) => connection.serverId === serverId,
    );
    return {
      activeConnections: matches.filter((connection) => connection.status === "active").length,
      totalConnections: matches.length,
    };
  }

  private getSessionKey(version: RelaySessionSnapshot["version"], serverId: string): string {
    return `${version}:${serverId}`;
  }

  private getConnectionKey(serverId: string, connectionId: string): string {
    return `${serverId}:${connectionId}`;
  }
}
