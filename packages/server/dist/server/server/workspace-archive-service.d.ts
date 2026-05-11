import type { PersistedWorkspaceRecord, ProjectRegistry, WorkspaceRegistry } from "./workspace-registry.js";
export declare function archivePersistedWorkspaceRecord(input: {
    workspaceId: string;
    workspaceRegistry: Pick<WorkspaceRegistry, "get" | "list" | "archive">;
    projectRegistry: Pick<ProjectRegistry, "archive">;
    archivedAt?: string;
}): Promise<PersistedWorkspaceRecord | null>;
//# sourceMappingURL=workspace-archive-service.d.ts.map