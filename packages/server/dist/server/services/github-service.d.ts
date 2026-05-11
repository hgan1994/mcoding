import type { GitHubSearchKind } from "../shared/messages.js";
export declare const GITHUB_POLL_FAST_INTERVAL_MS = 20000;
export declare const GITHUB_POLL_SLOW_INTERVAL_MS = 120000;
export declare const GITHUB_POLL_ERROR_BACKOFF_CAP_MS = 300000;
export interface GitHubCommandRunnerOptions {
    cwd: string;
}
export interface GitHubCommandResult {
    stdout: string;
    stderr: string;
}
export type GitHubCommandRunner = (args: string[], options: GitHubCommandRunnerOptions) => Promise<GitHubCommandResult>;
export interface GitHubPullRequestSummary {
    number: number;
    title: string;
    url: string;
    state: string;
    body: string | null;
    baseRefName: string;
    headRefName: string;
    labels: string[];
    updatedAt: string;
}
export interface GitHubPullRequestCheckoutTarget {
    number: number;
    baseRefName: string;
    headRefName: string;
    headOwnerLogin: string | null;
    headRepositorySshUrl: string | null;
    headRepositoryUrl: string | null;
    isCrossRepository: boolean;
}
export interface GitHubIssueSummary {
    number: number;
    title: string;
    url: string;
    state: string;
    body: string | null;
    labels: string[];
    updatedAt: string;
}
export type PullRequestCheckStatus = "pending" | "success" | "failure" | "cancelled" | "skipped";
export interface PullRequestCheck {
    name: string;
    status: PullRequestCheckStatus;
    url: string | null;
    workflow?: string;
    duration?: string;
}
export type PullRequestChecksStatus = "none" | "pending" | "success" | "failure";
export type PullRequestReviewDecision = "approved" | "changes_requested" | "pending" | null;
export interface GitHubCurrentPullRequestStatus {
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
    checks: PullRequestCheck[];
    checksStatus: PullRequestChecksStatus;
    reviewDecision: PullRequestReviewDecision;
}
export type PullRequestTimelineReviewState = "approved" | "changes_requested" | "commented";
interface PullRequestTimelineItemBase {
    id: string;
    author: string;
    authorUrl: string | null;
    body: string;
    createdAt: number;
    url: string;
}
export type PullRequestTimelineItem = (PullRequestTimelineItemBase & {
    kind: "review";
    reviewState: PullRequestTimelineReviewState;
}) | (PullRequestTimelineItemBase & {
    kind: "comment";
});
export type GitHubPullRequestTimelineErrorKind = "not_found" | "forbidden" | "unknown";
export interface GitHubPullRequestTimelineError {
    kind: GitHubPullRequestTimelineErrorKind;
    message: string;
}
export interface GitHubPullRequestTimeline {
    prNumber: number;
    repoOwner: string;
    repoName: string;
    items: PullRequestTimelineItem[];
    truncated: boolean;
    error: GitHubPullRequestTimelineError | null;
}
export interface GitHubPullRequestCreateResult {
    url: string;
    number: number;
}
export type GitHubReadOptions = {
    force?: false;
    reason?: string;
} | {
    force: true;
    reason: string;
};
export type ListGitHubPullRequestsOptions = {
    cwd: string;
    query?: string;
    limit?: number;
} & GitHubReadOptions;
export type ListGitHubIssuesOptions = {
    cwd: string;
    query?: string;
    limit?: number;
} & GitHubReadOptions;
export type GetGitHubPullRequestOptions = {
    cwd: string;
    number: number;
} & GitHubReadOptions;
export type GetGitHubPullRequestTimelineOptions = {
    cwd: string;
    prNumber: number;
    repoOwner: string;
    repoName: string;
} & GitHubReadOptions;
export interface GitHubSearchResult {
    items: Array<{
        kind: "issue" | "pr";
        number: number;
        title: string;
        url: string;
        state: string;
        body: string | null;
        labels: string[];
        baseRefName?: string | null;
        headRefName?: string | null;
        updatedAt?: string;
    }>;
    githubFeaturesEnabled: boolean;
}
export type SearchGitHubIssuesAndPrsOptions = {
    cwd: string;
    query: string;
    limit?: number;
    kinds?: GitHubSearchKind[];
} & GitHubReadOptions;
export interface CreateGitHubPullRequestOptions {
    cwd: string;
    repo: string;
    title: string;
    head: string;
    base: string;
    body?: string;
}
export interface GitHubService {
    listPullRequests(options: ListGitHubPullRequestsOptions): Promise<GitHubPullRequestSummary[]>;
    listIssues(options: ListGitHubIssuesOptions): Promise<GitHubIssueSummary[]>;
    getPullRequest(options: GetGitHubPullRequestOptions): Promise<GitHubPullRequestSummary>;
    getPullRequestHeadRef(options: GetGitHubPullRequestOptions): Promise<string>;
    getPullRequestCheckoutTarget?(options: GetGitHubPullRequestOptions): Promise<GitHubPullRequestCheckoutTarget>;
    getCurrentPullRequestStatus(options: {
        cwd: string;
        headRef: string;
    } & GitHubReadOptions): Promise<GitHubCurrentPullRequestStatus | null>;
    getPullRequestTimeline(options: GetGitHubPullRequestTimelineOptions): Promise<GitHubPullRequestTimeline>;
    searchIssuesAndPrs(options: SearchGitHubIssuesAndPrsOptions): Promise<GitHubSearchResult>;
    createPullRequest(options: CreateGitHubPullRequestOptions): Promise<GitHubPullRequestCreateResult>;
    isAuthenticated(options: {
        cwd: string;
    } & GitHubReadOptions): Promise<boolean>;
    retainCurrentPullRequestStatusPoll?(options: {
        cwd: string;
        headRef: string;
        onStatus?: (status: GitHubCurrentPullRequestStatus | null) => void;
        onError?: (error: unknown) => void;
    }): {
        unsubscribe: () => void;
    };
    invalidate(options: {
        cwd: string;
    }): void;
    dispose?(): void;
}
export declare class GitHubCliMissingError extends Error {
    readonly kind = "missing-cli";
    constructor();
}
export declare class GitHubAuthenticationError extends Error {
    readonly kind = "auth-failure";
    readonly stderr: string;
    constructor(params: {
        stderr: string;
    });
}
export declare class GitHubCommandError extends Error {
    readonly kind = "command-error";
    readonly args: string[];
    readonly cwd: string;
    readonly exitCode: number | null;
    readonly stderr: string;
    constructor(params: {
        args: string[];
        cwd: string;
        exitCode: number | null;
        stderr: string;
    });
}
interface CreateGitHubServiceOptions {
    ttlMs?: number;
    runner?: GitHubCommandRunner;
    resolveGhPath?: () => Promise<string | null>;
    now?: () => number;
}
export declare function createGitHubService(options?: CreateGitHubServiceOptions): GitHubService;
export declare function computeGithubNextInterval(status: GitHubCurrentPullRequestStatus | null, consecutiveErrors: number): number;
export declare function parseStatusCheckRollup(value: unknown): PullRequestCheck[];
export interface GitHubRepoRemoteUrlResolver {
    resolveRepoRemoteUrl(cwd: string, options?: GitHubReadOptions): Promise<string | null>;
}
export declare function resolveGitHubRepo(cwd: string, options: {
    workspaceGitService: GitHubRepoRemoteUrlResolver;
    readOptions?: GitHubReadOptions;
}): Promise<string | null>;
export {};
//# sourceMappingURL=github-service.d.ts.map