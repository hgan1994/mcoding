const JSON_OPTION_DESCRIPTION = "Output in JSON format";
const DAEMON_HOST_OPTION_DESCRIPTION = "Daemon host target (default: local socket/pipe, then localhost:6767)";
export function collectMultiple(value, previous) {
    return previous.concat([value]);
}
export function addJsonOption(command) {
    command.option("--json", JSON_OPTION_DESCRIPTION);
    return command;
}
export function addDaemonHostOption(command) {
    command.option("--host <host>", DAEMON_HOST_OPTION_DESCRIPTION);
    return command;
}
export function addJsonAndDaemonHostOptions(command) {
    return addDaemonHostOption(addJsonOption(command));
}
//# sourceMappingURL=command-options.js.map