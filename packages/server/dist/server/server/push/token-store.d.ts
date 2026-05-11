import type pino from "pino";
/**
 * Store for Expo push tokens.
 *
 * Tokens are persisted to disk so pushes still work after daemon restarts.
 */
export declare class PushTokenStore {
    private readonly logger;
    private tokens;
    private readonly filePath;
    constructor(logger: pino.Logger, filePath: string);
    addToken(token: string): void;
    removeToken(token: string): void;
    getAllTokens(): string[];
    private loadFromDisk;
    private persist;
}
//# sourceMappingURL=token-store.d.ts.map