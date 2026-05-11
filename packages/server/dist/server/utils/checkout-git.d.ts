import type { ParsedDiffFile } from "../server/utils/diff-highlighter.js";
import { type GitHubRepoRemoteUrlResolver, type GitHubService } from "../services/github-service.js";
interface CheckoutReadCacheOptions {
    force?: boolean;
    reason?: string;
}
export declare function __resetPullRequestStatusCacheForTests(): void;
export declare function __setPullRequestStatusCacheTtlForTests(ttlMs: number): void;
export declare function __resetCheckoutShortstatCacheForTests(): void;
export declare function __setCheckoutShortstatCacheTtlForTests(ttlMs: number): void;
export interface BranchSuggestion {
    name: string;
    committerDate: number;
    hasLocal: boolean;
    hasRemote: boolean;
}
export declare function listBranchSuggestions(cwd: string, options?: {
    query?: string;
    limit?: number;
}): Promise<BranchSuggestion[]>;
export interface LocalBranchCheckoutResolution {
    kind: "local";
    name: string;
}
export interface RemoteOnlyBranchCheckoutResolution {
    kind: "remote-only";
    name: string;
    remoteRef: string;
}
export interface NotFoundBranchCheckoutResolution {
    kind: "not-found";
}
export type BranchCheckoutResolution = LocalBranchCheckoutResolution | RemoteOnlyBranchCheckoutResolution | NotFoundBranchCheckoutResolution;
export declare function resolveBranchCheckout(cwd: string, name: string): Promise<BranchCheckoutResolution>;
export type BranchCheckoutSource = "local" | "remote";
export interface CheckoutExistingBranchResult {
    source: BranchCheckoutSource;
}
export interface CheckoutResolvedBranchInput {
    cwd: string;
    resolution: BranchCheckoutResolution;
    requestedBranch?: string;
}
export declare function checkoutResolvedBranch(input: CheckoutResolvedBranchInput): Promise<CheckoutExistingBranchResult>;
export declare class NotGitRepoError extends Error {
    readonly cwd: string;
    readonly code = "NOT_GIT_REPO";
    constructor(cwd: string);
}
export declare class MergeConflictError extends Error {
    readonly baseRef: string;
    readonly currentBranch: string;
    readonly conflictFiles: string[];
    constructor(options: {
        baseRef: string;
        currentBranch: string;
        conflictFiles: string[];
    });
}
export declare class MergeFromBaseConflictError extends Error {
    readonly baseRef: string;
    readonly currentBranch: string;
    readonly conflictFiles: string[];
    constructor(options: {
        baseRef: string;
        currentBranch: string;
        conflictFiles: string[];
    });
}
export interface AheadBehind {
    ahead: number;
    behind: number;
}
export interface CheckoutStatus {
    isGit: false;
}
export type CheckoutStatusGitNonPaseo = {
    isGit: true;
    repoRoot: string;
    currentBranch: string | null;
    isDirty: boolean;
    baseRef: string | null;
    aheadBehind: AheadBehind | null;
    aheadOfOrigin: number | null;
    behindOfOrigin: number | null;
    hasRemote: boolean;
    remoteUrl: string | null;
    isPaseoOwnedWorktree: false;
};
export type CheckoutStatusGitPaseo = {
    isGit: true;
    repoRoot: string;
    mainRepoRoot: string;
    currentBranch: string | null;
    isDirty: boolean;
    baseRef: string;
    aheadBehind: AheadBehind | null;
    aheadOfOrigin: number | null;
    behindOfOrigin: number | null;
    hasRemote: boolean;
    remoteUrl: string | null;
    isPaseoOwnedWorktree: true;
};
export type CheckoutStatusGit = CheckoutStatusGitNonPaseo | CheckoutStatusGitPaseo;
export type CheckoutStatusResult = CheckoutStatus | CheckoutStatusGit;
export interface CheckoutDiffResult {
    diff: string;
    structured?: ParsedDiffFile[];
}
export interface CheckoutDiffCompare {
    mode: "uncommitted" | "base";
    baseRef?: string;
    ignoreWhitespace?: boolean;
    includeStructured?: boolean;
}
export interface MergeToBaseOptions {
    baseRef?: string;
    mode?: "merge" | "squash";
    commitMessage?: string;
}
export interface MergeFromBaseOptions {
    baseRef?: string;
    requireCleanTarget?: boolean;
}
export type CheckoutContext = {
    paseoHome?: string;
};
export declare function getCurrentBranch(cwd: string): Promise<string | null>;
export declare function getMainRepoRoot(cwd: string): Promise<string>;
export type GitWorktreeEntry = {
    path: string;
    branchRef?: string;
    isBare?: boolean;
};
/** Check whether a path contains a `.paseo/worktrees/` segment (both `/` and `\`). */
export declare function isPaseoWorktreePath(p: string): boolean;
/** True when `child` is strictly inside `parent` (handles both `/` and `\`). */
export declare function isDescendantPath(child: string, parent: string): boolean;
export declare function parseWorktreeList(output: string): GitWorktreeEntry[];
export declare function renameCurrentBranch(cwd: string, newName: string): Promise<{
    previousBranch: string | null;
    currentBranch: string | null;
}>;
export declare function getOriginRemoteUrl(cwd: string): Promise<string | null>;
export declare function hasOriginRemote(cwd: string): Promise<boolean>;
export declare function resolveAbsoluteGitDir(cwd: string): Promise<string | null>;
export declare function resolveRepositoryDefaultBranch(repoRoot: string): Promise<string | null>;
export declare function getCheckoutStatus(cwd: string, context?: CheckoutContext): Promise<CheckoutStatusResult>;
export interface CheckoutShortstat {
    additions: number;
    deletions: number;
}
export declare function getCheckoutShortstat(cwd: string, context?: CheckoutContext, options?: CheckoutReadCacheOptions): Promise<CheckoutShortstat | null>;
export declare function getCachedCheckoutShortstat(cwd: string): CheckoutShortstat | null | undefined;
export declare function warmCheckoutShortstatInBackground(cwd: string, context?: CheckoutContext, onComplete?: () => void): void;
export declare function getCheckoutDiff(cwd: string, compare: CheckoutDiffCompare, context?: CheckoutContext): Promise<CheckoutDiffResult>;
export declare function commitChanges(cwd: string, options: {
    message: string;
    addAll?: boolean;
}): Promise<void>;
export declare function commitAll(cwd: string, message: string): Promise<void>;
export declare function mergeToBase(cwd: string, options?: MergeToBaseOptions, context?: CheckoutContext): Promise<string>;
export declare function mergeFromBase(cwd: string, options?: MergeFromBaseOptions, context?: CheckoutContext): Promise<void>;
export declare function pullCurrentBranch(cwd: string, github?: GitHubService): Promise<void>;
export declare function pushCurrentBranch(cwd: string, github?: GitHubService): Promise<void>;
export interface CreatePullRequestOptions {
    title: string;
    body?: string;
    base?: string;
    head?: string;
    draft?: boolean;
}
export interface PullRequestStatus {
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
    checks?: PullRequestCheck[];
    checksStatus?: ChecksStatus;
    reviewDecision?: ReviewDecision;
}
export interface PullRequestStatusResult {
    status: PullRequestStatus | null;
    githubFeaturesEnabled: boolean;
}
export type PullRequestCheck = {
    name: string;
    status: "success" | "failure" | "pending" | "skipped" | "cancelled";
    url: string | null;
    workflow?: string;
    duration?: string;
};
export type ChecksStatus = "none" | "pending" | "success" | "failure";
export type ReviewDecision = "approved" | "changes_requested" | "pending" | null;
export declare function createPullRequest(cwd: string, options: CreatePullRequestOptions, github: GitHubService | undefined, workspaceGitService: GitHubRepoRemoteUrlResolver): Promise<{
    url: string;
    number: number;
}>;
export declare function getPullRequestStatus(cwd: string, github?: GitHubService, options?: CheckoutReadCacheOptions): Promise<PullRequestStatusResult>;
export {};
//# sourceMappingURL=checkout-git.d.ts.map