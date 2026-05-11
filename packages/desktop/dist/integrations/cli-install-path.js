"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCliInstallSourcePath = resolveCliInstallSourcePath;
function resolveCliInstallSourcePath(input) {
    if (input.platform === "win32") {
        return input.shimPath;
    }
    if (!input.isPackaged) {
        return input.shimPath;
    }
    if (input.platform === "linux") {
        const appImagePath = input.appImagePath?.trim();
        if (appImagePath) {
            return appImagePath;
        }
    }
    return input.executablePath;
}
//# sourceMappingURL=cli-install-path.js.map