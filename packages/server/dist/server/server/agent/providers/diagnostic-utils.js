import { execCommand } from "../../../utils/spawn.js";
export function formatProviderDiagnostic(providerName, entries) {
    return [providerName, ...entries.map((entry) => `  ${entry.label}: ${entry.value}`)].join("\n");
}
export function formatProviderDiagnosticError(providerName, error) {
    return formatProviderDiagnostic(providerName, [
        {
            label: "Error",
            value: error instanceof Error ? error.message : String(error),
        },
    ]);
}
export function formatAvailabilityStatus(available) {
    return available ? "Available" : "Unavailable";
}
export function formatDiagnosticStatus(available, error) {
    if (error) {
        return `Error (${error.source} failed: ${toDiagnosticErrorMessage(error.cause)})`;
    }
    return formatAvailabilityStatus(available);
}
export function toDiagnosticErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    if (typeof error === "string" && error.trim().length > 0) {
        return error;
    }
    return "Unknown error";
}
export async function resolveBinaryVersion(binaryPath) {
    try {
        const { stdout } = await execCommand(binaryPath, ["--version"], { timeout: 5000 });
        return stdout.trim() || "unknown";
    }
    catch {
        return "unknown";
    }
}
export function formatConfiguredCommand(defaultArgv, runtimeSettings) {
    const command = runtimeSettings?.command;
    if (!command || command.mode === "default") {
        return `${defaultArgv.join(" ")} (default)`;
    }
    if (command.mode === "append") {
        return [defaultArgv[0], ...(command.args ?? []), ...defaultArgv.slice(1)].join(" ");
    }
    return command.argv.join(" ");
}
//# sourceMappingURL=diagnostic-utils.js.map