type TransportTarget = {
    transportType: "socket" | "pipe";
    transportPath: string;
};
export declare function openLocalTransportSession(target: TransportTarget): Promise<string>;
export declare function sendLocalTransportMessage(input: {
    sessionId: string;
    text?: string;
    binaryBase64?: string;
}): Promise<void>;
export declare function closeLocalTransportSession(sessionId: string): void;
export declare function closeAllTransportSessions(): void;
export {};
//# sourceMappingURL=local-transport.d.ts.map