export function buildStringCommandShellInvocation(options) {
    const platform = options.platform ?? process.platform;
    if (platform === "win32") {
        return {
            shell: "powershell",
            args: [
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                options.command,
            ],
        };
    }
    return {
        shell: "/bin/bash",
        args: ["-lc", options.command],
    };
}
//# sourceMappingURL=string-command-shell.js.map