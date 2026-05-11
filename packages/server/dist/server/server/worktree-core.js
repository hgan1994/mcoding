import { v4 as uuidv4 } from "uuid";
import { createWorktree, resolveExistingWorktreeForSlug, slugify, validateBranchSlug, } from "../utils/worktree.js";
import { resolveWorktreeCreationIntent, } from "./resolve-worktree-creation-intent.js";
export async function createWorktreeCore(input, deps) {
    const repoRoot = await resolveWorktreeRepoRoot(input, deps.workspaceGitService);
    const requestedSlug = input.worktreeSlug ? slugify(input.worktreeSlug) : undefined;
    const intent = await resolveWorktreeCreationIntent({ ...input, worktreeSlug: requestedSlug }, repoRoot, {
        ...deps,
        resolveDefaultBranch: (root) => resolveDefaultBranch(root, deps),
    });
    let normalizedSlug;
    switch (intent.kind) {
        case "branch-off": {
            normalizedSlug = validateWorktreeSlug(requestedSlug ?? slugify(intent.newBranchName));
            break;
        }
        case "checkout-branch": {
            normalizedSlug = validateWorktreeSlug(requestedSlug ?? slugify(intent.branchName));
            break;
        }
        case "checkout-github-pr": {
            normalizedSlug = validateWorktreeSlug(requestedSlug ?? slugify(intent.localBranchName ?? intent.headRef));
            break;
        }
    }
    const existingWorktree = await resolveExistingWorktreeForSlug({
        slug: normalizedSlug,
        repoRoot,
        paseoHome: input.paseoHome,
    });
    if (existingWorktree) {
        return { worktree: existingWorktree, intent, repoRoot, created: false };
    }
    return {
        worktree: await createWorktree({
            cwd: repoRoot,
            worktreeSlug: normalizedSlug,
            source: intent,
            runSetup: input.runSetup ?? true,
            paseoHome: input.paseoHome,
        }),
        intent,
        repoRoot,
        created: true,
    };
}
export function createWorktreeCoreDeps(github) {
    return {
        github,
        generateBranchName: (seed) => slugify(seed ?? uuidv4()),
    };
}
async function resolveDefaultBranch(repoRoot, deps) {
    const baseBranch = deps.resolveDefaultBranch
        ? await deps.resolveDefaultBranch(repoRoot)
        : await deps.workspaceGitService?.resolveDefaultBranch(repoRoot);
    if (!baseBranch) {
        throw new Error("Unable to resolve repository default branch");
    }
    return baseBranch;
}
export async function resolveWorktreeRepoRoot(input, workspaceGitService) {
    if (!workspaceGitService) {
        throw new Error("Create worktree requires WorkspaceGitService");
    }
    return workspaceGitService.resolveRepoRoot(input.cwd);
}
function validateWorktreeSlug(slug) {
    const validation = validateBranchSlug(slug);
    if (!validation.valid) {
        throw new Error(`Invalid worktree name: ${validation.error}`);
    }
    return slug;
}
//# sourceMappingURL=worktree-core.js.map