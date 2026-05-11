import { DaemonClient } from "@getpaseo/server";
export interface ConnectOptions {
    host?: string;
    timeout?: number;
}
type DaemonTarget = {
    type: "tcp";
    url: string;
} | {
    type: "ipc";
    url: string;
    socketPath: string;
};
/**
 * Get the daemon host from environment or options
 */
export declare function getDaemonHost(options?: ConnectOptions): string;
export declare function normalizeDaemonHost(raw: string): string | null;
export declare function resolveDefaultDaemonHost(env?: NodeJS.ProcessEnv): string;
export declare function resolveDefaultDaemonHosts(env?: NodeJS.ProcessEnv): string[];
export declare function resolveDaemonTarget(host: string): DaemonTarget;
/**
 * Create and connect a daemon client
 * Returns the connected client or throws if connection fails
 */
export declare function connectToDaemon(options?: ConnectOptions): Promise<DaemonClient>;
/**
 * Try to connect to the daemon, returns null if connection fails
 */
export declare function tryConnectToDaemon(options?: ConnectOptions): Promise<DaemonClient | null>;
/** Minimal agent type for ID resolution */
interface AgentLike {
    id: string;
    title?: string | null;
}
/**
 * Resolve an agent ID from a partial ID or name.
 * Supports:
 * - Full ID match
 * - Prefix match (first N characters)
 * - Title/name match (case-insensitive)
 *
 * Returns the full agent ID if found, null otherwise.
 */
export declare function resolveAgentId(idOrName: string, agents: AgentLike[]): string | null;
export {};
//# sourceMappingURL=client.d.ts.map