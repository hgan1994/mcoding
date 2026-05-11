import type { Logger } from "pino";
import { type PersistedProjectRecord, type PersistedWorkspaceRecord, type ProjectRegistry, type WorkspaceRegistry } from "./workspace-registry.js";
type RegistryRecord = PersistedProjectRecord | PersistedWorkspaceRecord;
declare class FileBackedRegistry<TRecord extends RegistryRecord> {
    private readonly filePath;
    private readonly logger;
    private readonly schema;
    private readonly getId;
    private loaded;
    private readonly cache;
    private persistQueue;
    constructor(options: {
        filePath: string;
        logger: Logger;
        schema: (record: unknown) => TRecord;
        getId: (record: TRecord) => string;
        component: string;
    });
    initialize(): Promise<void>;
    existsOnDisk(): Promise<boolean>;
    list(): Promise<TRecord[]>;
    get(id: string): Promise<TRecord | null>;
    upsert(record: TRecord): Promise<void>;
    archive(id: string, archivedAt: string): Promise<void>;
    remove(id: string): Promise<void>;
    private load;
    private persist;
    private enqueuePersist;
}
export declare class FileBackedProjectRegistry extends FileBackedRegistry<PersistedProjectRecord> implements ProjectRegistry {
    constructor(filePath: string, logger: Logger);
}
export declare class FileBackedWorkspaceRegistry extends FileBackedRegistry<PersistedWorkspaceRecord> implements WorkspaceRegistry {
    constructor(filePath: string, logger: Logger);
}
export {};
//# sourceMappingURL=workspace-registry.test-helpers.d.ts.map