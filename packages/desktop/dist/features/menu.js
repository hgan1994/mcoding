"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupApplicationMenu = setupApplicationMenu;
const electron_1 = require("electron");
function withBrowserWindow(callback) {
    return (_item, baseWin) => {
        const win = baseWin instanceof electron_1.BrowserWindow ? baseWin : electron_1.BrowserWindow.getFocusedWindow();
        if (win)
            callback(win);
    };
}
function setupApplicationMenu() {
    const isMac = process.platform === "darwin";
    const template = [
        ...(isMac
            ? [
                {
                    label: electron_1.app.name,
                    submenu: [
                        { role: "about" },
                        { type: "separator" },
                        { role: "services" },
                        { type: "separator" },
                        { role: "hide" },
                        { role: "hideOthers" },
                        { role: "unhide" },
                        { type: "separator" },
                        { role: "quit" },
                    ],
                },
            ]
            : []),
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "selectAll" },
            ],
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Zoom In",
                    accelerator: "CmdOrCtrl+=",
                    click: withBrowserWindow((win) => {
                        win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5);
                    }),
                },
                {
                    label: "Zoom Out",
                    accelerator: "CmdOrCtrl+-",
                    click: withBrowserWindow((win) => {
                        win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5);
                    }),
                },
                {
                    label: "Actual Size",
                    accelerator: "CmdOrCtrl+0",
                    click: withBrowserWindow((win) => {
                        win.webContents.setZoomLevel(0);
                    }),
                },
                { type: "separator" },
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "zoom" },
                ...(isMac
                    ? [{ type: "separator" }, { role: "front" }]
                    : [{ role: "close" }]),
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
    electron_1.ipcMain.handle("paseo:menu:showContextMenu", (event, input) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win) {
            return;
        }
        if (input?.kind !== "terminal") {
            return;
        }
        const menu = electron_1.Menu.buildFromTemplate([
            {
                label: "Copy",
                role: "copy",
                enabled: input.hasSelection === true,
            },
            {
                label: "Paste",
                role: "paste",
            },
            {
                type: "separator",
            },
            {
                label: "Select All",
                role: "selectAll",
            },
        ]);
        menu.popup({ window: win });
    });
}
//# sourceMappingURL=menu.js.map