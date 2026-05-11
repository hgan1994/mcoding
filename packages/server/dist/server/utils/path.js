import os from "os";
/**
 * Expand tilde in path to home directory
 */
export function expandTilde(path) {
    if (path.startsWith("~/")) {
        const homeDir = process.env.HOME || os.homedir();
        return path.replace("~", homeDir);
    }
    if (path === "~") {
        return process.env.HOME || os.homedir();
    }
    return path;
}
//# sourceMappingURL=path.js.map