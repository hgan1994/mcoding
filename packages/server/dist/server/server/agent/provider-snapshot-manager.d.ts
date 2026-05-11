import type { Logger } from "pino";
import type { AgentProvider, ProviderSnapshotEntry } from "./agent-sdk-types.js";
import type { ProviderDefinition } from "./provider-registry.js";
type ProviderSnapshotChangeListener = (entries: ProviderSnapshotEntry[], cwd: string) => void;
type ProviderSnapshotManagerOptions = {
    ttlMs?: number;
    refreshTimeoutMs?: number;
    now?: () => number;
};
type ProviderSnapshotRefreshOptions = {
    cwd: string;
    providers?: AgentProvider[];
};
export declare class ProviderSnapshotManager {
    private readonly providerRegistry;
    private readonly logger;
    private readonly snapshots;
    private readonly lastCheckedAts;
    private readonly providerLoads;
    private readonly events;
    private destroyed;
    private readonly ttlMs;
    private readonly refreshTimeoutMs;
    private readonly now;
    constructor(providerRegistry: Record<AgentProvider, ProviderDefinition>, logger: Logger, options?: ProviderSnapshotManagerOptions);
    getSnapshot(_cwd?: string): ProviderSnapshotEntry[];
    refreshSnapshotForCwd(options: ProviderSnapshotRefreshOptions): Promise<void>;
    refreshSettingsSnapshot(options?: Omit<ProviderSnapshotRefreshOptions, "cwd">): Promise<void>;
    warmUpSnapshotForCwd(options: ProviderSnapshotRefreshOptions): Promise<void>;
    refresh(options: ProviderSnapshotRefreshOptions): Promise<void>;
    on(event: "change", listener: ProviderSnapshotChangeListener): this;
    off(event: "change", listener: ProviderSnapshotChangeListener): this;
    destroy(): void;
    private createLoadingEntries;
    private warmUp;
    private refreshProviders;
    private loadProviders;
    private loadProvider;
    private refreshProvider;
    private getProviderLoad;
    private setProviderLoad;
    private isCurrentProviderLoad;
    private emitChange;
    private shouldRevalidate;
    private getOrCreateSnapshot;
    private resetSnapshotToLoading;
    private getProviderIds;
    private resolveRefreshProviders;
}
export declare function resolveSnapshotCwd(cwd?: string | null): string;
export {};
//# sourceMappingURL=provider-snapshot-manager.d.ts.map