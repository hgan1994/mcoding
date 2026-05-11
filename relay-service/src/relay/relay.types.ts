export type RelayProtocolVersion = "1" | "2";
export type RelayRole = "server" | "client";

export type RelayFrame = string | Buffer | ArrayBuffer | Uint8Array;

export type ControlMessage =
  | { type: "sync"; connectionIds: string[] }
  | { type: "connected"; connectionId: string }
  | { type: "disconnected"; connectionId: string }
  | { type: "ping"; ts?: number }
  | { type: "pong"; ts?: number };

export type RelayPeerSocket = {
  id: string;
  send: (data: RelayFrame) => void;
  close: (code?: number, reason?: string) => void;
};

export type RelaySocketContext = {
  socketId: string;
  version: RelayProtocolVersion;
  serverId: string;
  role: RelayRole;
  connectionId: string | null;
  hostname: string | null;
  createdAt: number;
};

export type RelaySessionSnapshot = {
  version: RelayProtocolVersion;
  serverId: string;
  hostname: string | null;
  serverSocketConnected: boolean;
  controlSocketConnected: boolean;
  clientSocketCount: number;
  status: "active" | "closed";
};

export type RelayConnectionSnapshot = {
  version: "2";
  serverId: string;
  connectionId: string;
  hostname: string | null;
  clientSocketCount: number;
  serverDataConnected: boolean;
  pendingFrameCount: number;
  status: "active" | "closed";
};
