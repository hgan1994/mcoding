export type AppUpdateCheckResult = {
    hasUpdate: boolean;
    readyToInstall: boolean;
    currentVersion: string;
    latestVersion: string;
    body: string | null;
    date: string | null;
};
export type AppUpdateInstallResult = {
    installed: boolean;
    version: string | null;
    message: string;
};
export type AppReleaseChannel = "stable" | "beta";
export declare function checkForAppUpdate({ currentVersion, releaseChannel, }: {
    currentVersion: string;
    releaseChannel: AppReleaseChannel;
}): Promise<AppUpdateCheckResult>;
export declare function downloadAndInstallUpdate({ currentVersion, releaseChannel, }: {
    currentVersion: string;
    releaseChannel: AppReleaseChannel;
}, onBeforeQuit?: () => Promise<void>): Promise<AppUpdateInstallResult>;
//# sourceMappingURL=auto-updater.d.ts.map