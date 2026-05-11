export interface WorktreeConfig {
    branchName: string;
    worktreePath: string;
}
export type WorktreeRuntimeEnv = {
    PASEO_SOURCE_CHECKOUT_PATH: string;
    PASEO_ROOT_PATH: string;
    PASEO_WORKTREE_PATH: string;
    PASEO_BRANCH_NAME: string;
    PASEO_WORKTREE_PORT: string;
};
export type WorktreeSetupCommandResult = {
    command: string;
    cwd: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
};
export type WorktreeSetupCommandProgressEvent = {
    type: "command_started";
    index: number;
    total: number;
    command: string;
    cwd: string;
} | {
    type: "output";
    index: number;
    total: number;
    command: string;
    cwd: string;
    stream: "stdout" | "stderr";
    chunk: string;
} | {
    type: "command_completed";
    index: number;
    total: number;
    command: string;
    cwd: string;
    exitCode: number | null;
    durationMs: number;
    stdout: string;
    stderr: string;
};
export interface WorktreeTerminalConfig {
    name?: string;
    command: string;
}
export interface PlainScriptConfig {
    type?: undefined;
    command: string;
    port?: undefined;
}
export interface ServiceScriptConfig {
    type: "service";
    command: string;
    port?: number;
}
export type ScriptConfig = PlainScriptConfig | ServiceScriptConfig;
export declare function isServiceScript(config: ScriptConfig): config is ServiceScriptConfig;
export declare class WorktreeSetupError extends Error {
    readonly results: WorktreeSetupCommandResult[];
    constructor(message: string, results: WorktreeSetupCommandResult[]);
}
export type WorktreeTeardownCommandResult = WorktreeSetupCommandResult;
export declare class WorktreeTeardownError extends Error {
    readonly results: WorktreeTeardownCommandResult[];
    constructor(message: string, results: WorktreeTeardownCommandResult[]);
}
export interface PaseoWorktreeInfo {
    path: string;
    createdAt: string;
    branchName?: string;
    head?: string;
}
export type PaseoWorktreeOwnership = {
    allowed: boolean;
    repoRoot?: string;
    worktreeRoot?: string;
    worktreePath?: string;
};
export type WorktreeSource = {
    kind: "branch-off";
    baseBranch: string;
    newBranchName: string;
} | {
    kind: "checkout-branch";
    branchName: string;
} | {
    kind: "checkout-github-pr";
    githubPrNumber: number;
    headRef: string;
    baseRefName: string;
    localBranchName?: string;
    pushRemoteUrl?: string;
};
export interface CreateWorktreeOptions {
    cwd: string;
    worktreeSlug: string;
    source: WorktreeSource;
    runSetup: boolean;
    paseoHome?: string;
}
interface ResolveExistingWorktreeForSlugOptions {
    slug: string;
    repoRoot: string;
    paseoHome?: string;
}
export declare class BranchAlreadyCheckedOutError extends Error {
    readonly branchName: string;
    constructor(branchName: string);
}
export declare class UnknownBranchError extends Error {
    readonly branchName: string;
    readonly cwd: string;
    constructor(params: {
        branchName: string;
        cwd: string;
    });
}
export declare function getWorktreeSetupCommands(repoRoot: string): string[];
export declare function getWorktreeTeardownCommands(repoRoot: string): string[];
export declare function getWorktreeTerminalSpecs(repoRoot: string): WorktreeTerminalConfig[];
export declare function getScriptConfigs(repoRoot: string): Map<string, ScriptConfig>;
export declare function processCarriageReturns(text: string): string;
export declare function runWorktreeSetupCommands(options: {
    worktreePath: string;
    branchName: string;
    cleanupOnFailure: boolean;
    repoRootPath?: string;
    runtimeEnv?: WorktreeRuntimeEnv;
    onEvent?: (event: WorktreeSetupCommandProgressEvent) => void;
}): Promise<WorktreeSetupCommandResult[]>;
export declare function resolveWorktreeRuntimeEnv(options: {
    worktreePath: string;
    branchName?: string;
    repoRootPath?: string;
}): Promise<WorktreeRuntimeEnv>;
export declare function runWorktreeTeardownCommands(options: {
    worktreePath: string;
    branchName?: string;
    repoRootPath?: string;
}): Promise<WorktreeTeardownCommandResult[]>;
/**
 * Get the git common directory (shared across worktrees) for a given cwd.
 * This is where refs, objects, etc. are stored.
 */
export declare function getGitCommonDir(cwd: string): Promise<string>;
/**
 * Validate that a string is a valid git branch name slug
 * Must be lowercase, alphanumeric, hyphens only
 */
export declare function validateBranchSlug(slug: string): {
    valid: boolean;
    error?: string;
};
/**
 * Convert string to kebab-case for branch names
 */
export declare function slugify(input: string): string;
export declare function deriveWorktreeProjectHash(cwd: string): Promise<string>;
export declare function getPaseoWorktreesRoot(cwd: string, paseoHome?: string): Promise<string>;
export declare function computeWorktreePath(cwd: string, slug: string, paseoHome?: string): Promise<string>;
export declare function isPaseoOwnedWorktreeCwd(cwd: string, options?: {
    paseoHome?: string;
}): Promise<PaseoWorktreeOwnership>;
export declare function listPaseoWorktrees({ cwd, paseoHome, }: {
    cwd: string;
    paseoHome?: string;
}): Promise<PaseoWorktreeInfo[]>;
export declare function resolveExistingWorktreeForSlug({ slug, repoRoot, paseoHome, }: ResolveExistingWorktreeForSlugOptions): Promise<WorktreeConfig | null>;
export declare function resolvePaseoWorktreeRootForCwd(cwd: string, options?: {
    paseoHome?: string;
}): Promise<{
    repoRoot: string;
    worktreeRoot: string;
    worktreePath: string;
} | null>;
export declare function deletePaseoWorktree({ cwd, worktreePath, worktreeSlug, worktreesRoot, paseoHome, }: {
    cwd: string | null;
    worktreePath?: string;
    worktreeSlug?: string;
    worktreesRoot?: string;
    paseoHome?: string;
}): Promise<void>;
/**
 * Create a git worktree with proper naming conventions
 */
export declare const createWorktree: ({ cwd, source, worktreeSlug, runSetup, paseoHome, }: CreateWorktreeOptions) => Promise<WorktreeConfig>;
export {};
//# sourceMappingURL=worktree.d.ts.map