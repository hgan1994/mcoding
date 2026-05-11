import type { Command } from "commander";
import type { CommandOptions, SingleResult } from "../../output/index.js";
interface RestartResult {
    action: "restarted";
    home: string;
    pid: string;
    message: string;
}
export type RestartCommandResult = SingleResult<RestartResult>;
export declare function runRestartCommand(options: CommandOptions, _command: Command): Promise<RestartCommandResult>;
export {};
//# sourceMappingURL=restart.d.ts.map