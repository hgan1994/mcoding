import { connectToDaemon, getDaemonHost } from "../../utils/client.js";
export function addLoopLogsOptions(command) {
    return command
        .description("Stream loop logs")
        .argument("<id>", "Loop ID")
        .option("--poll-interval <ms>", "Polling interval in milliseconds", "1000");
}
function parsePollInterval(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw {
            code: "INVALID_POLL_INTERVAL",
            message: "--poll-interval must be a positive integer",
        };
    }
    return parsed;
}
function renderLogEntry(entry) {
    const prefix = [
        entry.timestamp,
        entry.source,
        entry.iteration === null ? null : `iteration=${entry.iteration}`,
        entry.level === "error" ? "ERROR" : null,
    ]
        .filter(Boolean)
        .join(" ");
    return `${prefix}\n${entry.text}`;
}
export async function runLoopLogsCommand(id, options, _command) {
    const host = getDaemonHost({ host: options.host });
    const pollInterval = parsePollInterval(options.pollInterval ?? "1000");
    let client;
    try {
        client = (await connectToDaemon({
            host: options.host,
        }));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: Cannot connect to daemon at ${host}: ${message}`);
        console.error("Start the daemon with: paseo daemon start");
        process.exit(1);
    }
    let cursor = 0;
    try {
        for (;;) {
            const payload = await client.loopLogs(id, cursor);
            if (payload.error || !payload.loop) {
                throw new Error(payload.error ?? `Loop not found: ${id}`);
            }
            cursor = payload.nextCursor;
            for (const entry of payload.entries) {
                console.log(renderLogEntry(entry));
            }
            if (payload.loop.status !== "running") {
                await client.close();
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
    }
    catch (error) {
        await client.close().catch(() => { });
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: Failed to stream loop logs: ${message}`);
        process.exit(1);
    }
}
//# sourceMappingURL=logs.js.map