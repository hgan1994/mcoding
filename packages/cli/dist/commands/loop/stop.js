import { connectToDaemon, getDaemonHost } from "../../utils/client.js";
export const loopStopSchema = {
    idField: "id",
    columns: [
        { header: "LOOP ID", field: "id", width: 10 },
        { header: "STATUS", field: "status", width: 10 },
        { header: "ITER", field: "activeIteration", width: 8 },
    ],
};
export function addLoopStopOptions(command) {
    return command.description("Stop a running loop").argument("<id>", "Loop ID");
}
function toRow(loop) {
    return {
        id: loop.id,
        status: loop.status,
        activeIteration: loop.activeIteration === null ? "-" : String(loop.activeIteration),
    };
}
export async function runLoopStopCommand(id, options, _command) {
    const host = getDaemonHost({ host: options.host });
    let client;
    try {
        client = (await connectToDaemon({
            host: options.host,
        }));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw {
            code: "DAEMON_NOT_RUNNING",
            message: `Cannot connect to daemon at ${host}: ${message}`,
            details: "Start the daemon with: paseo daemon start",
        };
    }
    try {
        const payload = await client.loopStop(id);
        await client.close();
        if (payload.error || !payload.loop) {
            throw new Error(payload.error ?? `Loop not found: ${id}`);
        }
        return {
            type: "single",
            data: toRow(payload.loop),
            schema: loopStopSchema,
        };
    }
    catch (error) {
        await client.close().catch(() => { });
        throw {
            code: "LOOP_STOP_FAILED",
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
//# sourceMappingURL=stop.js.map