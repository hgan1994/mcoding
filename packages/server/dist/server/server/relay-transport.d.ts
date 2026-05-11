import type pino from "pino";
import { type KeyPair } from "@getpaseo/relay/e2ee";
import type { ExternalSocketMetadata } from "./websocket-server.js";
type RelayTransportOptions = {
    logger: pino.Logger;
    attachSocket: (ws: RelaySocketLike, metadata?: ExternalSocketMetadata) => Promise<void>;
    relayEndpoint: string;
    serverId: string;
    daemonKeyPair?: KeyPair;
};
export type RelayTransportController = {
    stop: () => Promise<void>;
};
type RelaySocketLike = {
    readyState: number;
    send: (data: string | Uint8Array | ArrayBuffer) => void;
    close: (code?: number, reason?: string) => void;
    on: (event: "message" | "close" | "error", listener: (...args: any[]) => void) => void;
    once: (event: "close" | "error", listener: (...args: any[]) => void) => void;
};
export declare function startRelayTransport({ logger, attachSocket, relayEndpoint, serverId, daemonKeyPair, }: RelayTransportOptions): RelayTransportController;
export {};
//# sourceMappingURL=relay-transport.d.ts.map