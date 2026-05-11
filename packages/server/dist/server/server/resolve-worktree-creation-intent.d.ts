import type { GitHubService } from "../services/github-service.js";
import type { AgentAttachment } from "./messages.js";
import type { WorktreeSource } from "../utils/worktree.js";
export type WorktreeCreationIntent = WorktreeSource;
export interface ResolveWorktreeCreationIntentInput {
    worktreeSlug?: string;
    refName?: string;
    action?: "branch-off" | "checkout";
    githubPrNumber?: number;
    attachments?: AgentAttachment[];
}
export interface ResolveWorktreeCreationIntentDeps {
    github: GitHubService;
    resolveDefaultBranch: (repoRoot: string) => Promise<string>;
    generateBranchName: (seed: string | undefined) => string;
}
export declare class MissingCheckoutTargetError extends Error {
    readonly action = "checkout";
    constructor();
}
export declare class ConflictingGitHubPullRequestIntentError extends Error {
    readonly explicitGitHubPrNumber: number;
    readonly attachmentGitHubPrNumber: number;
    constructor(params: {
        explicitGitHubPrNumber: number;
        attachmentGitHubPrNumber: number;
    });
}
export declare function resolveWorktreeCreationIntent(input: ResolveWorktreeCreationIntentInput, repoRoot: string, deps: ResolveWorktreeCreationIntentDeps): Promise<WorktreeCreationIntent>;
//# sourceMappingURL=resolve-worktree-creation-intent.d.ts.map