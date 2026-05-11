import type { Logger } from "pino";
import type { AgentSessionConfig } from "./agent/agent-sdk-types.js";
import { type AgentAttachment, type GitSetupOptions, type SessionInboundMessage, type SessionOutboundMessage, type WorkspaceSetupSnapshot, type WorkspaceDescriptorPayload } from "./messages.js";
import type { PersistedWorkspaceRecord } from "./workspace-registry.js";
import type { WorkspaceGitService } from "./workspace-git-service.js";
import type { TerminalManager } from "../terminal/terminal-manager.js";
import type { ScriptRouteStore } from "./script-proxy.js";
import type { WorkspaceScriptRuntimeStore } from "./workspace-script-runtime-store.js";
import type { GitHubService } from "../services/github-service.js";
import type { CheckoutExistingBranchResult } from "../utils/checkout-git.js";
import { type WorktreeConfig } from "../utils/worktree.js";
import type { CreatePaseoWorktreeInput, CreatePaseoWorktreeResult } from "./paseo-worktree-service.js";
import { type ArchivePaseoWorktreeDependencies } from "./paseo-worktree-archive-service.js";
export interface NormalizedGitOptions {
    baseBranch?: string;
    createNewBranch: boolean;
    newBranchName?: string;
    createWorktree: boolean;
    worktreeSlug?: string;
    requestedWorktreeSlug?: string;
    refName?: string;
    action?: "branch-off" | "checkout";
    githubPrNumber?: number;
}
type EmitSessionMessage = (message: SessionOutboundMessage) => void;
type BuildAgentSessionConfigDependencies = {
    paseoHome?: string;
    sessionLogger: Logger;
    workspaceGitService?: WorkspaceGitService;
    createPaseoWorktree: (input: CreatePaseoWorktreeInput, options?: {
        resolveDefaultBranch?: (repoRoot: string) => Promise<string>;
    }) => Promise<CreatePaseoWorktreeResult>;
    checkoutExistingBranch: (cwd: string, branch: string) => Promise<CheckoutExistingBranchResult>;
    createBranchFromBase: (params: {
        cwd: string;
        baseBranch: string;
        newBranchName: string;
    }) => Promise<void>;
    github?: Pick<GitHubService, "invalidate">;
};
type CreatePaseoWorktreeInBackgroundDependencies = {
    paseoHome?: string;
    emitWorkspaceUpdateForCwd: (cwd: string, options?: {
        dedupeGitState?: boolean;
    }) => Promise<void>;
    cacheWorkspaceSetupSnapshot: (workspaceId: string, snapshot: WorkspaceSetupSnapshot) => void;
    emit: EmitSessionMessage;
    sessionLogger: Logger;
    terminalManager: TerminalManager | null;
    archiveWorkspaceRecord: (workspaceId: string) => Promise<void>;
    scriptRouteStore: ScriptRouteStore | null;
    scriptRuntimeStore: WorkspaceScriptRuntimeStore | null;
    getDaemonTcpPort: (() => number | null) | null;
    getDaemonTcpHost: (() => string | null) | null;
    onScriptsChanged: ((workspaceId: string, workspaceDirectory: string) => void) | null;
};
type HandleWorkspaceSetupStatusRequestDependencies = {
    emit: EmitSessionMessage;
    workspaceSetupSnapshots: ReadonlyMap<string, WorkspaceSetupSnapshot>;
};
type HandleCreatePaseoWorktreeRequestDependencies = {
    paseoHome?: string;
    describeWorkspaceRecord: (result: CreatePaseoWorktreeResult) => Promise<WorkspaceDescriptorPayload>;
    emit: EmitSessionMessage;
    createPaseoWorktree: (input: CreatePaseoWorktreeInput) => Promise<CreatePaseoWorktreeResult>;
    warmWorkspaceGitData: (workspace: PersistedWorkspaceRecord) => Promise<void>;
    sessionLogger: Logger;
    runWorktreeSetupInBackground: (options: {
        requestCwd: string;
        repoRoot: string;
        workspaceId: string;
        worktree: WorktreeConfig;
        shouldBootstrap: boolean;
        slug: string;
        worktreePath: string;
    }) => Promise<void>;
};
export declare function buildAgentSessionConfig(dependencies: BuildAgentSessionConfigDependencies, config: AgentSessionConfig, gitOptions?: GitSetupOptions, legacyWorktreeName?: string, attachments?: AgentAttachment[]): Promise<{
    sessionConfig: AgentSessionConfig;
    worktreeBootstrap?: {
        worktree: WorktreeConfig;
        shouldBootstrap: boolean;
    };
}>;
export declare function normalizeGitOptions(gitOptions?: GitSetupOptions, legacyWorktreeName?: string): NormalizedGitOptions | null;
export declare function assertSafeGitRef(ref: string, label: string): void;
export declare function resolveGitCreateBaseBranch(cwd: string, workspaceGitService?: WorkspaceGitService, _paseoHome?: string): Promise<string>;
export declare function handlePaseoWorktreeListRequest(dependencies: {
    emit: EmitSessionMessage;
    paseoHome?: string;
    workspaceGitService: WorkspaceGitService;
}, msg: Extract<SessionInboundMessage, {
    type: "paseo_worktree_list_request";
}>): Promise<void>;
export declare function handlePaseoWorktreeArchiveRequest(dependencies: Omit<ArchivePaseoWorktreeDependencies, "emitWorkspaceUpdatesForCwds" | "workspaceGitService"> & {
    emit: EmitSessionMessage;
    workspaceGitService: Pick<WorkspaceGitService, "getSnapshot" | "listWorktrees">;
    emitWorkspaceUpdatesForCwds: (cwds: Iterable<string>) => Promise<void>;
}, msg: Extract<SessionInboundMessage, {
    type: "paseo_worktree_archive_request";
}>): Promise<void>;
export declare function handleCreatePaseoWorktreeRequest(dependencies: HandleCreatePaseoWorktreeRequestDependencies, request: Extract<SessionInboundMessage, {
    type: "create_paseo_worktree_request";
}>): Promise<void>;
export declare function handleWorkspaceSetupStatusRequest(dependencies: HandleWorkspaceSetupStatusRequestDependencies, request: Extract<SessionInboundMessage, {
    type: "workspace_setup_status_request";
}>): Promise<void>;
export declare function runWorktreeSetupInBackground(dependencies: CreatePaseoWorktreeInBackgroundDependencies, options: {
    requestCwd: string;
    repoRoot: string;
    workspaceId: string;
    worktree: WorktreeConfig;
    shouldBootstrap: boolean;
    slug: string;
    worktreePath: string;
}): Promise<void>;
export {};
//# sourceMappingURL=worktree-session.d.ts.map