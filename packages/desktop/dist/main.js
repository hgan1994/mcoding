"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = __importDefault(require("electron-log/main"));
main_1.default.transports.console.level = "info";
main_1.default.initialize({ spyRendererConsole: true });
const login_shell_env_js_1 = require("./login-shell-env.js");
(0, login_shell_env_js_1.inheritLoginShellEnv)();
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const node_fs_1 = require("node:fs");
const node_child_process_1 = require("node:child_process");
const electron_1 = require("electron");
const daemon_manager_js_1 = require("./daemon/daemon-manager.js");
const runtime_paths_js_1 = require("./daemon/runtime-paths.js");
const local_transport_js_1 = require("./daemon/local-transport.js");
const window_manager_js_1 = require("./window/window-manager.js");
const dialogs_js_1 = require("./features/dialogs.js");
const notifications_js_1 = require("./features/notifications.js");
const opener_js_1 = require("./features/opener.js");
const menu_js_1 = require("./features/menu.js");
const open_project_routing_js_1 = require("./open-project-routing.js");
const DEV_SERVER_URL = process.env.EXPO_DEV_URL ?? "http://localhost:8081";
const APP_SCHEME = "paseo";
const OPEN_PROJECT_EVENT = "paseo:event:open-project";
electron_1.app.setName("Paseo");
// In dev mode, detect git worktrees and isolate each instance so multiple
// Electron windows can run side-by-side (separate userData = separate lock).
let devWorktreeName = null;
if (!electron_1.app.isPackaged) {
    try {
        const topLevel = (0, node_child_process_1.execFileSync)("git", ["rev-parse", "--show-toplevel"], {
            encoding: "utf-8",
            timeout: 3000,
        }).trim();
        devWorktreeName = node_path_1.default.basename(topLevel);
        // Main checkout (e.g. "paseo") gets default userData — only worktrees diverge.
        const commonDir = node_path_1.default.resolve(topLevel, (0, node_child_process_1.execFileSync)("git", ["rev-parse", "--git-common-dir"], {
            cwd: topLevel,
            encoding: "utf-8",
            timeout: 3000,
        }).trim());
        const isWorktree = node_path_1.default.resolve(topLevel, ".git") !== commonDir;
        if (isWorktree) {
            electron_1.app.setPath("userData", node_path_1.default.join(electron_1.app.getPath("appData"), `Paseo-${devWorktreeName}`));
            main_1.default.info("[worktree] isolated userData for worktree:", devWorktreeName);
        }
        else {
            devWorktreeName = null;
        }
    }
    catch {
        devWorktreeName = null;
    }
}
// Allow users to pass Chromium flags via PASEO_ELECTRON_FLAGS for debugging
// rendering issues (e.g. "--disable-gpu --ozone-platform=x11").
// Must run before app.whenReady().
const electronFlags = process.env.PASEO_ELECTRON_FLAGS?.trim();
if (electronFlags) {
    for (const token of electronFlags.split(/\s+/)) {
        const [key, ...rest] = token.replace(/^--/, "").split("=");
        electron_1.app.commandLine.appendSwitch(key, rest.join("=") || undefined);
    }
    main_1.default.info("[electron-flags]", electronFlags);
}
let pendingOpenProjectPath = (0, open_project_routing_js_1.parseOpenProjectPathFromArgv)({
    argv: process.argv,
    isDefaultApp: process.defaultApp,
});
main_1.default.info("[open-project] argv:", process.argv);
main_1.default.info("[open-project] isDefaultApp:", process.defaultApp);
main_1.default.info("[open-project] pendingOpenProjectPath:", pendingOpenProjectPath);
// The renderer pulls the pending path on mount via IPC — this avoids
// a race where the push event arrives before React registers its listener.
electron_1.ipcMain.handle("paseo:get-pending-open-project", () => {
    main_1.default.info("[open-project] renderer requested pending path:", pendingOpenProjectPath);
    const result = pendingOpenProjectPath;
    pendingOpenProjectPath = null;
    return result;
});
electron_1.protocol.registerSchemesAsPrivileged([
    { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------
function getPreloadPath() {
    return node_path_1.default.join(__dirname, "preload.js");
}
function getAppDistDir() {
    if (electron_1.app.isPackaged) {
        return node_path_1.default.join(process.resourcesPath, "app-dist");
    }
    return node_path_1.default.resolve(__dirname, "../../app/dist");
}
function getWindowIconPath() {
    const candidates = electron_1.app.isPackaged
        ? process.platform === "win32"
            ? [node_path_1.default.join(process.resourcesPath, "icon.ico"), node_path_1.default.join(process.resourcesPath, "icon.png")]
            : [node_path_1.default.join(process.resourcesPath, "icon.png")]
        : process.platform === "darwin"
            ? [node_path_1.default.resolve(__dirname, "../assets/icon.png")]
            : process.platform === "win32"
                ? [
                    node_path_1.default.resolve(__dirname, "../assets/icon.ico"),
                    node_path_1.default.resolve(__dirname, "../assets/icon.png"),
                ]
                : [node_path_1.default.resolve(__dirname, "../assets/icon.png")];
    return candidates.find((candidate) => (0, node_fs_1.existsSync)(candidate)) ?? null;
}
function applyAppIcon() {
    if (process.platform !== "darwin") {
        return;
    }
    const iconPath = node_path_1.default.resolve(__dirname, "../assets/icon.png");
    if (!(0, node_fs_1.existsSync)(iconPath)) {
        return;
    }
    const icon = electron_1.nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
        return;
    }
    electron_1.app.dock?.setIcon(icon);
}
async function createMainWindow() {
    const iconPath = getWindowIconPath();
    const systemTheme = (0, window_manager_js_1.resolveSystemWindowTheme)();
    const title = devWorktreeName ? `Paseo (${devWorktreeName})` : "Paseo";
    const mainWindow = new electron_1.BrowserWindow({
        title,
        width: 1200,
        height: 800,
        show: false,
        backgroundColor: (0, window_manager_js_1.getWindowBackgroundColor)(systemTheme),
        ...(iconPath ? { icon: iconPath } : {}),
        ...(0, window_manager_js_1.getMainWindowChromeOptions)({
            platform: process.platform,
            theme: systemTheme,
        }),
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (devWorktreeName) {
        electron_1.app.dock?.setBadge(devWorktreeName);
    }
    (0, window_manager_js_1.setupWindowResizeEvents)(mainWindow);
    (0, window_manager_js_1.setupDefaultContextMenu)(mainWindow);
    (0, window_manager_js_1.setupDragDropPrevention)(mainWindow);
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });
    if (!electron_1.app.isPackaged) {
        const { loadReactDevTools } = await import("./features/react-devtools.js");
        await loadReactDevTools();
        await mainWindow.loadURL(DEV_SERVER_URL);
        mainWindow.webContents.openDevTools({ mode: "detach" });
        return;
    }
    await mainWindow.loadURL(`${APP_SCHEME}://app/`);
}
function sendOpenProjectEvent(win, projectPath) {
    const send = () => {
        main_1.default.info("[open-project] sending event to renderer:", projectPath);
        win.webContents.send(OPEN_PROJECT_EVENT, { path: projectPath });
    };
    if (win.webContents.isLoadingMainFrame()) {
        main_1.default.info("[open-project] waiting for did-finish-load before sending event");
        win.webContents.once("did-finish-load", send);
        return;
    }
    send();
}
// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
function setupSingleInstanceLock() {
    const gotLock = electron_1.app.requestSingleInstanceLock();
    if (!gotLock) {
        electron_1.app.quit();
        return false;
    }
    electron_1.app.on("second-instance", (_event, commandLine) => {
        main_1.default.info("[open-project] second-instance commandLine:", commandLine);
        const openProjectPath = (0, open_project_routing_js_1.parseOpenProjectPathFromArgv)({
            argv: commandLine,
            isDefaultApp: false,
        });
        main_1.default.info("[open-project] second-instance openProjectPath:", openProjectPath);
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        if (win) {
            win.show();
            if (win.isMinimized())
                win.restore();
            win.focus();
            if (openProjectPath) {
                sendOpenProjectEvent(win, openProjectPath);
            }
        }
    });
    return true;
}
async function runCliPassthroughIfRequested() {
    const cliArgs = (0, runtime_paths_js_1.parseCliPassthroughArgsFromArgv)(process.argv);
    if (!cliArgs) {
        return false;
    }
    try {
        const exitCode = (0, runtime_paths_js_1.runCliPassthroughCommand)(cliArgs);
        process.exit(exitCode);
    }
    catch (error) {
        const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
        process.stderr.write(`${message}\n`);
        process.exit(1);
    }
    return true;
}
async function bootstrap() {
    if (!pendingOpenProjectPath && (await runCliPassthroughIfRequested())) {
        return;
    }
    if (!setupSingleInstanceLock()) {
        return;
    }
    await electron_1.app.whenReady();
    const appDistDir = getAppDistDir();
    electron_1.protocol.handle(APP_SCHEME, (request) => {
        const { pathname, search, hash } = new URL(request.url);
        const decodedPath = decodeURIComponent(pathname);
        // Chromium can occasionally request the exported entrypoint directly.
        // Canonicalize it back to the route URL so Expo Router sees `/`, not `/index.html`.
        if (decodedPath.endsWith("/index.html")) {
            const normalizedPath = decodedPath.slice(0, -"/index.html".length) || "/";
            return Response.redirect(`${APP_SCHEME}://app${normalizedPath}${search}${hash}`, 307);
        }
        const filePath = node_path_1.default.join(appDistDir, decodedPath);
        const relativePath = node_path_1.default.relative(appDistDir, filePath);
        if (relativePath.startsWith("..") || node_path_1.default.isAbsolute(relativePath)) {
            return new Response("Not found", { status: 404 });
        }
        // SPA fallback: serve index.html for routes without a file extension
        if (!relativePath || !node_path_1.default.extname(relativePath)) {
            return electron_1.net.fetch((0, node_url_1.pathToFileURL)(node_path_1.default.join(appDistDir, "index.html")).toString());
        }
        return electron_1.net.fetch((0, node_url_1.pathToFileURL)(filePath).toString());
    });
    applyAppIcon();
    (0, menu_js_1.setupApplicationMenu)();
    (0, notifications_js_1.ensureNotificationCenterRegistration)();
    (0, daemon_manager_js_1.registerDaemonManager)();
    (0, window_manager_js_1.registerWindowManager)();
    (0, dialogs_js_1.registerDialogHandlers)();
    (0, notifications_js_1.registerNotificationHandlers)();
    (0, opener_js_1.registerOpenerHandlers)();
    await createMainWindow();
    electron_1.app.on("activate", async () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            await createMainWindow();
        }
    });
}
void bootstrap().catch((error) => {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
});
electron_1.app.on("before-quit", () => {
    (0, local_transport_js_1.closeAllTransportSessions)();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=main.js.map