"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOpenerHandlers = registerOpenerHandlers;
const electron_1 = require("electron");
function registerOpenerHandlers() {
    electron_1.ipcMain.handle("paseo:opener:openUrl", async (_event, url) => {
        await electron_1.shell.openExternal(url);
    });
}
//# sourceMappingURL=opener.js.map