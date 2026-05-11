"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBadgeCount = readBadgeCount;
exports.readWindowTheme = readWindowTheme;
exports.resolveSystemWindowTheme = resolveSystemWindowTheme;
exports.getWindowBackgroundColor = getWindowBackgroundColor;
exports.createWindowControlsOverlayState = createWindowControlsOverlayState;
exports.getTitleBarOverlayOptions = getTitleBarOverlayOptions;
exports.getMainWindowChromeOptions = getMainWindowChromeOptions;
exports.readWindowControlsOverlayUpdate = readWindowControlsOverlayUpdate;
exports.resolveRuntimeTitleBarOverlayOptions = resolveRuntimeTitleBarOverlayOptions;
exports.applyWindowControlsOverlayUpdate = applyWindowControlsOverlayUpdate;
exports.registerWindowManager = registerWindowManager;
exports.setupWindowResizeEvents = setupWindowResizeEvents;
exports.setupDefaultContextMenu = setupDefaultContextMenu;
exports.setupDragDropPrevention = setupDragDropPrevention;
const electron_1 = require("electron");
function readBadgeCount(input) {
    if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 0) {
        return 0;
    }
    return input;
}
function readWindowTheme(input) {
    if (input === "light" || input === "dark") {
        return input;
    }
    return null;
}
function resolveSystemWindowTheme() {
    return electron_1.nativeTheme.shouldUseDarkColors ? "dark" : "light";
}
function getWindowBackgroundColor(theme) {
    return theme === "dark" ? "#181B1A" : "#ffffff";
}
function createWindowControlsOverlayState(theme) {
    const overlay = getTitleBarOverlayOptions(theme);
    return {
        height: overlay.height ?? 29,
        backgroundColor: overlay.color,
        foregroundColor: overlay.symbolColor,
    };
}
function getTitleBarOverlayOptions(theme) {
    if (theme === "dark") {
        return { color: "#181B1A", symbolColor: "#e4e4e7", height: 29 };
    }
    return { color: "#ffffff", symbolColor: "#09090b", height: 29 };
}
function getMainWindowChromeOptions(input) {
    if (input.platform === "darwin") {
        return {
            titleBarStyle: "hidden",
            titleBarOverlay: true,
            trafficLightPosition: { x: 16, y: 14 },
        };
    }
    return {
        titleBarStyle: "hidden",
        frame: false,
        titleBarOverlay: getTitleBarOverlayOptions(input.theme),
        autoHideMenuBar: true,
    };
}
function readFiniteOverlayHeight(input) {
    if (typeof input !== "number" || !Number.isFinite(input)) {
        return null;
    }
    const rounded = Math.round(input);
    return rounded >= 1 ? rounded : null;
}
function readOverlayColor(input) {
    if (typeof input !== "string") {
        return null;
    }
    return input;
}
function readWindowControlsOverlayUpdate(input) {
    if (!input || typeof input !== "object") {
        return null;
    }
    const candidate = input;
    const height = readFiniteOverlayHeight(candidate.height);
    const backgroundColor = readOverlayColor(candidate.backgroundColor);
    const foregroundColor = readOverlayColor(candidate.foregroundColor);
    if (height === null && backgroundColor === null && foregroundColor === null) {
        return null;
    }
    return {
        ...(height !== null ? { height } : {}),
        ...(backgroundColor !== null ? { backgroundColor } : {}),
        ...(foregroundColor !== null ? { foregroundColor } : {}),
    };
}
function resolveRuntimeTitleBarOverlayOptions(state) {
    return {
        color: state.backgroundColor?.trim() === "" ? undefined : state.backgroundColor,
        symbolColor: state.foregroundColor?.trim() === "" ? undefined : state.foregroundColor,
        height: Math.max(0, state.height - 1),
    };
}
function applyWindowControlsOverlayUpdate(input) {
    const next = {
        height: input.update.height ?? input.current.height,
        backgroundColor: input.update.backgroundColor ?? input.current.backgroundColor,
        foregroundColor: input.update.foregroundColor ?? input.current.foregroundColor,
    };
    input.win.setTitleBarOverlay(resolveRuntimeTitleBarOverlayOptions(next));
    return next;
}
function registerWindowManager() {
    const overlayStateByWindow = new WeakMap();
    electron_1.ipcMain.handle("paseo:window:toggleMaximize", (event) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win)
            return;
        if (win.isMaximized()) {
            win.unmaximize();
        }
        else {
            win.maximize();
        }
    });
    electron_1.ipcMain.handle("paseo:window:isFullscreen", (event) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        return win?.isFullScreen() ?? false;
    });
    electron_1.ipcMain.handle("paseo:window:setBadgeCount", (_event, count) => {
        if (process.platform === "darwin" || process.platform === "linux") {
            const badgeCount = readBadgeCount(count);
            try {
                electron_1.app.setBadgeCount(badgeCount);
            }
            catch (error) {
                console.warn("[window-manager] Failed to update badge count", {
                    count,
                    badgeCount,
                    error,
                });
            }
        }
    });
    electron_1.ipcMain.handle("paseo:window:updateWindowControls", (event, update) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win) {
            return;
        }
        const nextUpdate = readWindowControlsOverlayUpdate(update);
        if (!nextUpdate) {
            return;
        }
        if (nextUpdate.backgroundColor) {
            win.setBackgroundColor(nextUpdate.backgroundColor);
        }
        if (process.platform === "darwin") {
            return;
        }
        const current = overlayStateByWindow.get(win) ?? createWindowControlsOverlayState(resolveSystemWindowTheme());
        const nextState = applyWindowControlsOverlayUpdate({
            win,
            current,
            update: nextUpdate,
        });
        overlayStateByWindow.set(win, nextState);
    });
}
function setupWindowResizeEvents(win) {
    win.on("resize", () => {
        win.webContents.send("paseo:window:resized", {});
    });
    win.on("enter-full-screen", () => {
        win.webContents.send("paseo:window:resized", {});
    });
    win.on("leave-full-screen", () => {
        win.webContents.send("paseo:window:resized", {});
    });
}
function setupDefaultContextMenu(win) {
    win.webContents.on("context-menu", (_event, params) => {
        const menu = electron_1.Menu.buildFromTemplate([
            { role: "copy", enabled: params.selectionText.length > 0 },
            { role: "paste" },
            { type: "separator" },
            { role: "selectAll" },
        ]);
        menu.popup({ window: win });
    });
}
/**
 * Prevent Electron from navigating to files dragged onto the window.
 * The renderer handles drag-drop via standard HTML5 APIs instead.
 */
function setupDragDropPrevention(win) {
    win.webContents.on("will-navigate", (event, url) => {
        // Allow normal navigation (e.g. dev server hot-reload) but block file:// URLs
        // that result from dropping files onto the window.
        if (url.startsWith("file://")) {
            event.preventDefault();
        }
    });
}
//# sourceMappingURL=window-manager.js.map