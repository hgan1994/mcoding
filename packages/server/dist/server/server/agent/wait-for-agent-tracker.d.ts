import type { Logger } from "pino";
export type WaitForAgentCanceler = (agentId: string, reason?: string) => boolean;
/**
 * Tracks long-running wait_for_agent tool calls so they can be cancelled
 * explicitly (e.g., when a voice barge-in aborts the current turn).
 */
export declare class WaitForAgentTracker {
    private waiters;
    private logger;
    constructor(logger: Logger);
    register(agentId: string, cancel: (reason?: string) => void): () => void;
    cancel(agentId: string, reason?: string): boolean;
    cancelAll(reason?: string): number;
}
//# sourceMappingURL=wait-for-agent-tracker.d.ts.map