import { Command } from "commander";
import type { CommandOptions } from "../../output/index.js";
export interface LoopLogsOptions extends CommandOptions {
    pollInterval?: string;
}
export declare function addLoopLogsOptions(command: Command): Command;
export declare function runLoopLogsCommand(id: string, options: LoopLogsOptions, _command: Command): Promise<void>;
//# sourceMappingURL=logs.d.ts.map