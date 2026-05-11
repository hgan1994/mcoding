export declare class RelaySessionEntity {
    id: string;
    version: "1" | "2";
    serverId: string;
    status: "active" | "closed";
    serverSocketConnected: boolean;
    controlSocketConnected: boolean;
    clientSocketCount: number;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class RelayConnectionEntity {
    id: string;
    version: "1" | "2";
    serverId: string;
    connectionId: string;
    status: "active" | "closed";
    clientSocketCount: number;
    serverDataConnected: boolean;
    pendingFrameCount: number;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
