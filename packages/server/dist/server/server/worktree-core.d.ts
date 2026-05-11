import type { GitHubService } from "../services/github-service.js";
import { type WorktreeConfig } from "../utils/worktree.js";
import { type ResolveWorktreeCreationIntentInput, type WorktreeCreationIntent } from "./resolve-worktree-creation-intent.js";
import type { WorkspaceGitService } from "./workspace-git-service.js";
export interface CreateWorktreeCoreInput extends ResolveWorktreeCreationIntentInput {
    cwd: string;
    paseoHome?: string;
    runSetup?: boolean;
}
export interface CreateWorktreeCoreDeps {
    github: GitHubService;
    workspaceGitService?: Pick<WorkspaceGitService, "resolveRepoRoot" | "resolveDefaultBranch">;
    resolveDefaultBranch?: (repoRoot: string) => Promise<string>;
    generateBranchName: (seed: string | undefined) => string;
}
export interface CreateWorktreeCoreResult {
    worktree: WorktreeConfig;
    intent: WorktreeCreationIntent;
    repoRoot: string;
    created: boolean;
}
export declare function createWorktreeCore(input: CreateWorktreeCoreInput, deps: CreateWorktreeCoreDeps): Promise<CreateWorktreeCoreResult>;
export declare function createWorktreeCoreDeps(github: GitHubService): CreateWorktreeCoreDeps;
export declare function resolveWorktreeRepoRoot(input: Pick<CreateWorktreeCoreInput, "cwd" | "paseoHome">, workspaceGitService?: Pick<WorkspaceGitService, "resolveRepoRoot">): Promise<string>;
//# sourceMappingURL=worktree-core.d.ts.map