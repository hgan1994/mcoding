"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForAppUpdate = checkForAppUpdate;
exports.downloadAndInstallUpdate = downloadAndInstallUpdate;
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let cachedUpdateInfo = null;
let downloadedUpdateVersion = null;
let downloading = false;
let autoUpdaterConfigured = false;
let configuredReleaseChannel = null;
// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
function configureAutoUpdater(releaseChannel) {
    // Download updates in the background and only prompt once they are ready to install.
    electron_updater_1.autoUpdater.autoDownload = true;
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
    // Suppress built-in dialogs; the renderer handles UI.
    electron_updater_1.autoUpdater.autoRunAppAfterInstall = true;
    electron_updater_1.autoUpdater.allowPrerelease = releaseChannel === "beta";
    electron_updater_1.autoUpdater.channel = releaseChannel === "beta" ? "beta" : "latest";
    electron_updater_1.autoUpdater.allowDowngrade = false;
    if (configuredReleaseChannel !== releaseChannel) {
        cachedUpdateInfo = null;
        downloadedUpdateVersion = null;
        downloading = false;
        configuredReleaseChannel = releaseChannel;
    }
    if (autoUpdaterConfigured) {
        return;
    }
    autoUpdaterConfigured = true;
    electron_updater_1.autoUpdater.on("update-available", (info) => {
        cachedUpdateInfo = info;
        downloadedUpdateVersion = null;
        downloading = true;
    });
    electron_updater_1.autoUpdater.on("update-downloaded", (info) => {
        cachedUpdateInfo = info;
        downloadedUpdateVersion = info.version;
        downloading = false;
    });
    electron_updater_1.autoUpdater.on("update-not-available", () => {
        cachedUpdateInfo = null;
        downloadedUpdateVersion = null;
        downloading = false;
    });
    electron_updater_1.autoUpdater.on("error", (error) => {
        downloading = false;
        console.error("[auto-updater] Updater event failed:", error);
    });
}
function isReadyToInstallVersion(version) {
    return downloadedUpdateVersion === version;
}
function buildCheckResult(input) {
    const { currentVersion, hasUpdate, readyToInstall, info } = input;
    return {
        hasUpdate,
        readyToInstall,
        currentVersion,
        latestVersion: info?.version ?? currentVersion,
        body: typeof info?.releaseNotes === "string" ? info.releaseNotes : null,
        date: typeof info?.releaseDate === "string" ? info.releaseDate : null,
    };
}
function scheduleQuitAndInstall(onBeforeQuit) {
    // Use a short delay to allow the renderer to receive the response.
    setTimeout(async () => {
        try {
            if (onBeforeQuit)
                await onBeforeQuit();
            electron_updater_1.autoUpdater.quitAndInstall(/* isSilent */ false, /* isForceRunAfter */ true);
        }
        catch (error) {
            console.error("[auto-updater] quitAndInstall failed:", error);
        }
    }, 1500);
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
async function checkForAppUpdate({ currentVersion, releaseChannel, }) {
    if (!electron_1.app.isPackaged) {
        return buildCheckResult({
            currentVersion,
            hasUpdate: false,
            readyToInstall: false,
        });
    }
    configureAutoUpdater(releaseChannel);
    const cachedVersion = cachedUpdateInfo?.version ?? null;
    if (cachedVersion && cachedVersion !== currentVersion) {
        return buildCheckResult({
            currentVersion,
            hasUpdate: true,
            readyToInstall: isReadyToInstallVersion(cachedVersion),
            info: cachedUpdateInfo,
        });
    }
    try {
        const result = await electron_updater_1.autoUpdater.checkForUpdates();
        if (!result || !result.updateInfo) {
            return buildCheckResult({
                currentVersion,
                hasUpdate: false,
                readyToInstall: false,
            });
        }
        const info = result.updateInfo;
        const latestVersion = info.version;
        const hasUpdate = latestVersion !== currentVersion;
        if (hasUpdate) {
            cachedUpdateInfo = info;
            downloading = !isReadyToInstallVersion(latestVersion);
            return buildCheckResult({
                currentVersion,
                hasUpdate: true,
                readyToInstall: isReadyToInstallVersion(latestVersion),
                info,
            });
        }
        cachedUpdateInfo = null;
        downloadedUpdateVersion = null;
        downloading = false;
        return buildCheckResult({
            currentVersion,
            hasUpdate: false,
            readyToInstall: false,
        });
    }
    catch (error) {
        console.error("[auto-updater] Failed to check for updates:", error);
        return buildCheckResult({
            currentVersion,
            hasUpdate: false,
            readyToInstall: false,
        });
    }
}
async function downloadAndInstallUpdate({ currentVersion, releaseChannel, }, onBeforeQuit) {
    if (!electron_1.app.isPackaged) {
        return {
            installed: false,
            version: currentVersion,
            message: "Auto-update is not available in development mode.",
        };
    }
    if (!cachedUpdateInfo) {
        return {
            installed: false,
            version: currentVersion,
            message: "No update available. Check for updates first.",
        };
    }
    configureAutoUpdater(releaseChannel);
    const readyVersion = cachedUpdateInfo.version;
    if (isReadyToInstallVersion(readyVersion)) {
        scheduleQuitAndInstall(onBeforeQuit);
        return {
            installed: true,
            version: readyVersion,
            message: "Update downloaded. The app will restart shortly.",
        };
    }
    if (downloading) {
        return {
            installed: false,
            version: currentVersion,
            message: "Update is still being prepared. Try again in a moment.",
        };
    }
    downloading = true;
    try {
        await electron_updater_1.autoUpdater.downloadUpdate();
        downloadedUpdateVersion = readyVersion;
        downloading = false;
        scheduleQuitAndInstall(onBeforeQuit);
        return {
            installed: true,
            version: readyVersion,
            message: "Update downloaded. The app will restart shortly.",
        };
    }
    catch (error) {
        downloading = false;
        const message = error instanceof Error ? error.message : String(error);
        console.error("[auto-updater] Failed to download/install update:", message);
        return {
            installed: false,
            version: currentVersion,
            message: `Update failed: ${message}`,
        };
    }
}
//# sourceMappingURL=auto-updater.js.map