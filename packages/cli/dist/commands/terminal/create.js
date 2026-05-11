import { connectTerminalClient, toTerminalCommandError, } from "./shared.js";
import { terminalSchema, toTerminalRow } from "./schema.js";
export async function runCreateCommand(options, _command) {
    const { client } = await connectTerminalClient(options.host);
    const cwd = options.cwd ?? process.cwd();
    try {
        const payload = await client.createTerminal(cwd, options.name);
        if (!payload.terminal) {
            const error = {
                code: "TERMINAL_CREATE_FAILED",
                message: payload.error ?? "Failed to create terminal",
            };
            throw error;
        }
        return {
            type: "single",
            data: toTerminalRow(payload.terminal),
            schema: terminalSchema,
        };
    }
    catch (err) {
        throw toTerminalCommandError("TERMINAL_CREATE_FAILED", "create terminal", err);
    }
    finally {
        await client.close().catch(() => { });
    }
}
//# sourceMappingURL=create.js.map