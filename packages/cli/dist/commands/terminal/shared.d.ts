import { connectToDaemon } from "../../utils/client.js";
import type { CommandError, CommandOptions } from "../../output/index.js";
export interface TerminalCommandOptions extends CommandOptions {
    host?: string;
}
export declare function connectTerminalClient(host?: string): Promise<{
    client: import("@getpaseo/server").DaemonClient;
    daemonHost: string;
}>;
export declare function toTerminalCommandError(code: string, action: string, err: unknown): CommandError;
export declare function resolveTerminalId(client: Awaited<ReturnType<typeof connectToDaemon>>, idOrName: string): Promise<string | null>;
//# sourceMappingURL=shared.d.ts.map