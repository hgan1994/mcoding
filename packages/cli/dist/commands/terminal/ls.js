import { connectTerminalClient, toTerminalCommandError, } from "./shared.js";
import { terminalSchema, toTerminalRow } from "./schema.js";
export async function runLsCommand(options, _command) {
    const { client } = await connectTerminalClient(options.host);
    const cwd = options.all ? undefined : (options.cwd ?? process.cwd());
    try {
        const payload = cwd === undefined ? await client.listTerminals() : await client.listTerminals(cwd);
        return {
            type: "list",
            data: payload.terminals.map((terminal) => toTerminalRow(terminal, payload.cwd ?? cwd)),
            schema: terminalSchema,
        };
    }
    catch (err) {
        throw toTerminalCommandError("TERMINAL_LIST_FAILED", "list terminals", err);
    }
    finally {
        await client.close().catch(() => { });
    }
}
//# sourceMappingURL=ls.js.map