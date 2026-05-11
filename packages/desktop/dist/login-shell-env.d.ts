/**
 * On macOS/Linux, Electron inherits a minimal environment when launched from
 * Finder/Dock. Spawn the user's login shell and capture its full environment
 * via Node's JSON.stringify(process.env), so the daemon and all child processes
 * see the same tools and variables as a normal terminal session.
 *
 * Approach borrowed from VS Code (src/vs/platform/shell/node/shellEnv.ts).
 */
export declare function inheritLoginShellEnv(): void;
//# sourceMappingURL=login-shell-env.d.ts.map