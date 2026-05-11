import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { posix, win32 } from "node:path";
import { findExecutable, quoteWindowsArgument, quoteWindowsCommand } from "../utils/executable.js";
const EDITOR_TARGETS = [
    { id: "cursor", label: "Cursor", command: "cursor" },
    { id: "vscode", label: "VS Code", command: "code" },
    { id: "webstorm", label: "WebStorm", command: "webstorm" },
    { id: "zed", label: "Zed", command: "zed" },
    { id: "finder", label: "Finder", command: "open", platforms: ["darwin"] },
    { id: "explorer", label: "Explorer", command: "explorer", platforms: ["win32"] },
    {
        id: "file-manager",
        label: "File Manager",
        command: "xdg-open",
        excludedPlatforms: ["darwin", "win32"],
    },
];
function isAbsolutePath(value) {
    return posix.isAbsolute(value) || win32.isAbsolute(value);
}
function isTargetSupportedOnPlatform(target, platform) {
    if (target.platforms && !target.platforms.includes(platform)) {
        return false;
    }
    if (target.excludedPlatforms?.includes(platform)) {
        return false;
    }
    return true;
}
function resolveEditorTargetDefinition(editorId) {
    const target = EDITOR_TARGETS.find((entry) => entry.id === editorId);
    if (!target) {
        throw new Error(`Unknown editor target: ${editorId}`);
    }
    return target;
}
export async function listAvailableEditorTargets(dependencies = {}) {
    const platform = dependencies.platform ?? process.platform;
    const findExecutableFn = dependencies.findExecutable ?? findExecutable;
    const results = [];
    for (const target of EDITOR_TARGETS) {
        if (!isTargetSupportedOnPlatform(target, platform)) {
            continue;
        }
        const executable = await findExecutableFn(target.command);
        if (!executable) {
            continue;
        }
        results.push({
            id: target.id,
            label: target.label,
        });
    }
    return results;
}
async function resolveEditorLaunch(input) {
    const target = resolveEditorTargetDefinition(input.editorId);
    if (!isTargetSupportedOnPlatform(target, input.platform)) {
        throw new Error(`Editor target unavailable: ${target.label}`);
    }
    const executable = await input.findExecutableFn(target.command);
    if (!executable) {
        throw new Error(`Editor target unavailable: ${target.label}`);
    }
    return {
        command: executable,
        args: [input.path],
    };
}
export async function openInEditorTarget(input, dependencies = {}) {
    const platform = dependencies.platform ?? process.platform;
    const pathToOpen = input.path.trim();
    const existsSyncFn = dependencies.existsSync ?? existsSync;
    const findExecutableFn = dependencies.findExecutable ?? findExecutable;
    const spawnFn = dependencies.spawn ?? spawn;
    if (!pathToOpen || !isAbsolutePath(pathToOpen)) {
        throw new Error("Editor target path must be an absolute local path");
    }
    if (!existsSyncFn(pathToOpen)) {
        throw new Error(`Path does not exist: ${pathToOpen}`);
    }
    const launch = await resolveEditorLaunch({
        editorId: input.editorId,
        path: pathToOpen,
        platform,
        findExecutableFn,
    });
    const command = platform === "win32" ? quoteWindowsCommand(launch.command) : launch.command;
    const args = platform === "win32"
        ? launch.args.map((argument) => quoteWindowsArgument(argument))
        : launch.args;
    await new Promise((resolve, reject) => {
        let child;
        try {
            child = spawnFn(command, args, {
                detached: true,
                shell: platform === "win32",
                stdio: "ignore",
            });
        }
        catch (error) {
            reject(error);
            return;
        }
        child.once("error", reject);
        child.once("spawn", () => {
            child.unref();
            resolve();
        });
    });
}
//# sourceMappingURL=editor-targets.js.map