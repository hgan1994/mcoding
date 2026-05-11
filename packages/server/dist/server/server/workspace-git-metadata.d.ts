export type WorkspaceGitMetadata = {
    projectKind: "git" | "directory";
    projectDisplayName: string;
    workspaceDisplayName: string;
    gitRemote: string | null;
    isWorktree: boolean;
    projectSlug: string;
    repoRoot: string | null;
    currentBranch: string | null;
    remoteUrl: string | null;
};
export declare function parseGitHubRepoFromRemote(remoteUrl: string): string | null;
export declare function parseGitHubRepoNameFromRemote(remoteUrl: string): string | null;
export declare function deriveProjectSlug(cwd: string, remoteUrl?: string | null): string;
export declare function buildWorkspaceGitMetadataFromSnapshot(input: {
    cwd: string;
    directoryName: string;
    isGit: boolean;
    repoRoot: string | null;
    mainRepoRoot: string | null;
    currentBranch: string | null;
    remoteUrl: string | null;
}): WorkspaceGitMetadata;
//# sourceMappingURL=workspace-git-metadata.d.ts.map