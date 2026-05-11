import { resolve } from "node:path";
import { parseGitRevParsePath } from "../utils/git-rev-parse-path.js";
export function normalizeWorkspaceId(cwd) {
    const trimmed = cwd.trim();
    if (!trimmed) {
        return cwd;
    }
    return resolve(trimmed);
}
export function deriveWorkspaceId(cwd, checkout) {
    const worktreeRoot = checkout.worktreeRoot ? parseGitRevParsePath(checkout.worktreeRoot) : null;
    return worktreeRoot ?? normalizeWorkspaceId(cwd);
}
function deriveRemoteProjectKey(remoteUrl) {
    if (!remoteUrl) {
        return null;
    }
    const trimmed = remoteUrl.trim();
    if (!trimmed) {
        return null;
    }
    let host = null;
    let remotePath = null;
    const scpLike = trimmed.match(/^[^@]+@([^:]+):(.+)$/);
    if (scpLike) {
        host = scpLike[1] ?? null;
        remotePath = scpLike[2] ?? null;
    }
    else if (trimmed.includes("://")) {
        try {
            const parsed = new URL(trimmed);
            host = parsed.hostname || null;
            remotePath = parsed.pathname ? parsed.pathname.replace(/^\/+/, "") : null;
        }
        catch {
            return null;
        }
    }
    if (!host || !remotePath) {
        return null;
    }
    let cleanedPath = remotePath.trim().replace(/^\/+/, "").replace(/\/+$/, "");
    if (cleanedPath.endsWith(".git")) {
        cleanedPath = cleanedPath.slice(0, -4);
    }
    if (!cleanedPath.includes("/")) {
        return null;
    }
    const cleanedHost = host.toLowerCase();
    if (cleanedHost === "github.com") {
        return `remote:github.com/${cleanedPath}`;
    }
    return `remote:${cleanedHost}/${cleanedPath}`;
}
export function deriveProjectGroupingKey(options) {
    const remoteKey = deriveRemoteProjectKey(options.remoteUrl);
    if (remoteKey) {
        return remoteKey;
    }
    const mainRepoRoot = options.mainRepoRoot?.trim();
    if (options.isPaseoOwnedWorktree && mainRepoRoot) {
        return mainRepoRoot;
    }
    return options.cwd;
}
export function deriveProjectGroupingName(projectKey) {
    const githubRemotePrefix = "remote:github.com/";
    if (projectKey.startsWith(githubRemotePrefix)) {
        return projectKey.slice(githubRemotePrefix.length) || projectKey;
    }
    const segments = projectKey.split(/[\\/]/).filter(Boolean);
    return segments[segments.length - 1] || projectKey;
}
function deriveWorkspaceDirectoryName(cwd) {
    const normalized = cwd.replace(/\\/g, "/");
    const segments = normalized.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? cwd;
}
export function deriveWorkspaceDisplayName(input) {
    const branch = input.checkout.currentBranch?.trim() ?? null;
    if (branch && branch.toUpperCase() !== "HEAD") {
        return branch;
    }
    return deriveWorkspaceDirectoryName(input.cwd);
}
export function deriveProjectRootPath(input) {
    if (input.checkout.isGit && input.checkout.isPaseoOwnedWorktree) {
        return input.checkout.mainRepoRoot;
    }
    return input.cwd;
}
export function deriveProjectKind(checkout) {
    return checkout.isGit ? "git" : "non_git";
}
export function deriveWorkspaceKind(checkout) {
    if (!checkout.isGit) {
        return "directory";
    }
    return checkout.isPaseoOwnedWorktree ? "worktree" : "local_checkout";
}
export function checkoutLiteFromGitSnapshot(cwd, git) {
    if (!git.isGit) {
        return {
            cwd,
            isGit: false,
            currentBranch: null,
            remoteUrl: null,
            worktreeRoot: null,
            isPaseoOwnedWorktree: false,
            mainRepoRoot: null,
        };
    }
    if (git.isPaseoOwnedWorktree && git.mainRepoRoot) {
        return {
            cwd,
            isGit: true,
            currentBranch: git.currentBranch,
            remoteUrl: git.remoteUrl,
            worktreeRoot: git.repoRoot ?? cwd,
            isPaseoOwnedWorktree: true,
            mainRepoRoot: git.mainRepoRoot,
        };
    }
    return {
        cwd,
        isGit: true,
        currentBranch: git.currentBranch,
        remoteUrl: git.remoteUrl,
        worktreeRoot: git.repoRoot ?? cwd,
        isPaseoOwnedWorktree: false,
        mainRepoRoot: null,
    };
}
export async function detectStaleWorkspaces(input) {
    const staleWorkspaceIds = new Set();
    for (const workspace of input.activeWorkspaces) {
        const dirExists = await input.checkDirectoryExists(workspace.cwd);
        if (!dirExists) {
            staleWorkspaceIds.add(workspace.workspaceId);
        }
    }
    return staleWorkspaceIds;
}
export async function buildProjectPlacementForCwd(input) {
    const normalizedCwd = normalizeWorkspaceId(input.cwd);
    const checkout = await input.workspaceGitService
        .getSnapshot(normalizedCwd)
        .then((snapshot) => checkoutLiteFromGitSnapshot(normalizedCwd, snapshot.git))
        .catch(() => ({
        cwd: normalizedCwd,
        isGit: false,
        currentBranch: null,
        remoteUrl: null,
        worktreeRoot: null,
        isPaseoOwnedWorktree: false,
        mainRepoRoot: null,
    }));
    const projectKey = deriveProjectGroupingKey({
        cwd: checkout.worktreeRoot ?? normalizedCwd,
        remoteUrl: checkout.remoteUrl,
        isPaseoOwnedWorktree: checkout.isPaseoOwnedWorktree,
        mainRepoRoot: checkout.mainRepoRoot,
    });
    return {
        projectKey,
        projectName: deriveProjectGroupingName(projectKey),
        checkout,
    };
}
//# sourceMappingURL=workspace-registry-model.js.map