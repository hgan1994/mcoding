import { watch } from "node:fs";
import { readdir } from "node:fs/promises";
import type pino from "pino";
import { type BranchCheckoutResolution, type BranchSuggestion, type CheckoutDiffCompare, type CheckoutDiffResult, getCheckoutDiff, getCheckoutShortstat, getCheckoutStatus, getPullRequestStatus, listBranchSuggestions, resolveRepositoryDefaultBranch, resolveBranchCheckout } from "../utils/checkout-git.js";
import { type GitHubService } from "../services/github-service.js";
import { runGitCommand } from "../utils/run-git-command.js";
import { listPaseoWorktrees, type PaseoWorktreeInfo } from "../utils/worktree.js";
import { type WorkspaceGitMetadata } from "./workspace-git-metadata.js";
export declare const WORKSPACE_GIT_SELF_HEAL_INTERVAL_MS = 60000;
export type WorkspaceGitRuntimeSnapshot = {
    cwd: string;
    git: {
        isGit: boolean;
        repoRoot: string | null;
        mainRepoRoot: string | null;
        currentBranch: string | null;
        remoteUrl: string | null;
        isPaseoOwnedWorktree: boolean;
        isDirty: boolean | null;
        baseRef: string | null;
        aheadBehind: {
            ahead: number;
            behind: number;
        } | null;
        aheadOfOrigin: number | null;
        behindOfOrigin: number | null;
        hasRemote: boolean;
        diffStat: {
            additions: number;
            deletions: number;
        } | null;
    };
    github: {
        featuresEnabled: boolean;
        pullRequest: {
            number?: number;
            repoOwner?: string;
            repoName?: string;
            url: string;
            title: string;
            state: string;
            baseRefName: string;
            headRefName: string;
            isMerged: boolean;
            isDraft?: boolean;
            checks?: Array<{
                name: string;
                status: "success" | "failure" | "pending" | "skipped" | "cancelled";
                url: string | null;
                workflow?: string;
                duration?: string;
            }>;
            checksStatus?: "none" | "pending" | "success" | "failure";
            reviewDecision?: "approved" | "changes_requested" | "pending" | null;
        } | null;
        error: {
            message: string;
        } | null;
    };
};
export interface WorkspaceGitService {
    subscribe(params: {
        cwd: string;
    }, listener: WorkspaceGitListener): Promise<{
        initial: WorkspaceGitRuntimeSnapshot;
        unsubscribe: () => void;
    }>;
    peekSnapshot(cwd: string): WorkspaceGitRuntimeSnapshot | null;
    getSnapshot(cwd: string, options?: WorkspaceGitSnapshotOptions): Promise<WorkspaceGitRuntimeSnapshot>;
    getCheckoutDiff(cwd: string, options: CheckoutDiffCompare, readOptions?: WorkspaceGitReadOptions): Promise<CheckoutDiffResult>;
    validateBranchRef(cwd: string, ref: string, options?: WorkspaceGitReadOptions): Promise<WorkspaceGitBranchValidationResult>;
    hasLocalBranch(cwd: string, branch: string, options?: WorkspaceGitReadOptions): Promise<boolean>;
    suggestBranchesForCwd(cwd: string, options?: WorkspaceGitBranchSuggestionsOptions, readOptions?: WorkspaceGitReadOptions): Promise<WorkspaceGitBranchSuggestion[]>;
    listStashes(cwd: string, options?: WorkspaceGitStashListOptions, readOptions?: WorkspaceGitReadOptions): Promise<WorkspaceGitStashEntry[]>;
    listWorktrees(cwdOrRepoRoot: string, options?: WorkspaceGitReadOptions): Promise<WorkspaceGitWorktreeInfo[]>;
    getWorkspaceGitMetadata(cwd: string, options?: WorkspaceGitReadOptions & {
        directoryName?: string;
    }): Promise<WorkspaceGitMetadata>;
    resolveRepoRoot(cwd: string, options?: WorkspaceGitReadOptions): Promise<string>;
    resolveDefaultBranch(cwdOrRepoRoot: string, options?: WorkspaceGitReadOptions): Promise<string>;
    resolveRepoRemoteUrl(cwd: string, options?: WorkspaceGitReadOptions): Promise<string | null>;
    refresh(cwd: string, options?: {
        priority?: "normal" | "high";
    }): Promise<void>;
    requestWorkingTreeWatch(cwd: string, onChange: () => void): Promise<{
        repoRoot: string | null;
        unsubscribe: () => void;
    }>;
    scheduleRefreshForCwd(cwd: string): void;
    dispose(): void;
}
export type WorkspaceGitListener = (snapshot: WorkspaceGitRuntimeSnapshot) => void;
export type WorkspaceGitReadOptions = {
    force?: false;
    reason?: string;
} | {
    force: true;
    reason: string;
};
export interface WorkspaceGitBranchSuggestionsOptions {
    query?: string;
    limit?: number;
}
export interface WorkspaceGitStashListOptions {
    paseoOnly?: boolean;
}
export interface WorkspaceGitStashEntry {
    index: number;
    message: string;
    branch: string | null;
    isPaseo: boolean;
}
export type WorkspaceGitBranchValidationResult = BranchCheckoutResolution;
export type WorkspaceGitBranchSuggestion = BranchSuggestion;
export type WorkspaceGitWorktreeInfo = PaseoWorktreeInfo;
export type WorkspaceGitSnapshotOptions = {
    force?: false;
    includeGitHub?: boolean;
    reason?: string;
} | {
    force: true;
    includeGitHub?: boolean;
    reason: string;
};
interface WorkspaceGitServiceDependencies {
    watch: typeof watch;
    readdir: typeof readdir;
    getCheckoutStatus: typeof getCheckoutStatus;
    getCheckoutShortstat: typeof getCheckoutShortstat;
    getCheckoutDiff: typeof getCheckoutDiff;
    getPullRequestStatus: typeof getPullRequestStatus;
    resolveBranchCheckout: typeof resolveBranchCheckout;
    resolveRepositoryDefaultBranch: typeof resolveRepositoryDefaultBranch;
    listBranchSuggestions: typeof listBranchSuggestions;
    listPaseoWorktrees: typeof listPaseoWorktrees;
    github: GitHubService;
    resolveAbsoluteGitDir: (cwd: string) => Promise<string | null>;
    hasOriginRemote: (cwd: string) => Promise<boolean>;
    runGitFetch: (cwd: string) => Promise<void>;
    runGitCommand: typeof runGitCommand;
    now: () => Date;
}
interface WorkspaceGitServiceOptions {
    logger: pino.Logger;
    paseoHome: string;
    deps?: Partial<WorkspaceGitServiceDependencies>;
}
export declare class WorkspaceGitServiceImpl implements WorkspaceGitService {
    private readonly logger;
    private readonly paseoHome;
    private readonly deps;
    private readonly workspaceTargets;
    private readonly repoTargets;
    private readonly workspaceTargetSetups;
    private readonly workingTreeWatchTargets;
    private readonly workingTreeWatchSetups;
    private readonly branchValidationCache;
    private readonly localBranchCache;
    private readonly branchSuggestionsCache;
    private readonly stashListCache;
    private readonly worktreeListCache;
    private readonly defaultBranchCache;
    private readonly checkoutDiffCache;
    constructor(options: WorkspaceGitServiceOptions);
    subscribe(params: {
        cwd: string;
    }, listener: WorkspaceGitListener): Promise<{
        initial: WorkspaceGitRuntimeSnapshot;
        unsubscribe: () => void;
    }>;
    getSnapshot(cwd: string, options?: WorkspaceGitSnapshotOptions): Promise<WorkspaceGitRuntimeSnapshot>;
    peekSnapshot(cwd: string): WorkspaceGitRuntimeSnapshot | null;
    getCheckoutDiff(cwd: string, options: CheckoutDiffCompare, readOptions?: WorkspaceGitReadOptions): Promise<CheckoutDiffResult>;
    private normalizeCheckoutDiffOptions;
    private buildCheckoutDiffCacheKey;
    validateBranchRef(cwd: string, ref: string, options?: WorkspaceGitReadOptions): Promise<WorkspaceGitBranchValidationResult>;
    hasLocalBranch(cwd: string, branch: string, options?: WorkspaceGitReadOptions): Promise<boolean>;
    suggestBranchesForCwd(cwd: string, options?: WorkspaceGitBranchSuggestionsOptions, readOptions?: WorkspaceGitReadOptions): Promise<WorkspaceGitBranchSuggestion[]>;
    listStashes(cwd: string, options?: WorkspaceGitStashListOptions, readOptions?: WorkspaceGitReadOptions): Promise<WorkspaceGitStashEntry[]>;
    listWorktrees(cwdOrRepoRoot: string, options?: WorkspaceGitReadOptions): Promise<WorkspaceGitWorktreeInfo[]>;
    resolveRepoRoot(cwd: string, options?: WorkspaceGitReadOptions): Promise<string>;
    resolveDefaultBranch(cwdOrRepoRoot: string, options?: WorkspaceGitReadOptions): Promise<string>;
    getWorkspaceGitMetadata(cwd: string, options?: WorkspaceGitReadOptions & {
        directoryName?: string;
    }): Promise<WorkspaceGitMetadata>;
    resolveRepoRemoteUrl(cwd: string, options?: WorkspaceGitReadOptions): Promise<string | null>;
    refresh(cwd: string, _options?: {
        priority?: "normal" | "high";
    }): Promise<void>;
    requestWorkingTreeWatch(cwd: string, onChange: () => void): Promise<{
        repoRoot: string | null;
        unsubscribe: () => void;
    }>;
    scheduleRefreshForCwd(cwd: string): void;
    dispose(): void;
    private ensureWorkspaceTarget;
    private readAuxiliaryCache;
    private ensureAuxiliaryCacheEntry;
    private ensureWorkingTreeWatchTarget;
    private createWorkspaceTarget;
    private createWorkingTreeWatchTarget;
    private resolveCheckoutWatchRoot;
    private resolveWorkspaceGitRefsRoot;
    private startWorkspaceWatchers;
    private ensureRepoTarget;
    private scheduleWorkspaceRefresh;
    private startWorkspaceSubscriptionTimers;
    private updateGitHubPollForTarget;
    private stopGitHubPollForTarget;
    private addWorkingTreeWatcher;
    private ensureLinuxRepoTreeWatchers;
    private refreshLinuxRepoTreeWatchers;
    private listLinuxWatchDirectories;
    private refreshWorkspaceTarget;
    private requestWorkspaceSnapshot;
    private normalizeRefreshRequest;
    private isSnapshotWarm;
    private shouldThrottleNonForcedRefresh;
    private mergeQueuedRefresh;
    private runWorkspaceRefreshLoop;
    private refreshSnapshot;
    private rememberSnapshot;
    private runRepoFetch;
    private removeWorkspaceListener;
    private removeWorkspaceTarget;
    private removeWorkingTreeWatchListener;
    private closeWorkspaceTarget;
    private closeWorkingTreeWatchTarget;
    private closeRepoTarget;
}
export {};
//# sourceMappingURL=workspace-git-service.d.ts.map