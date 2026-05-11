import type { Command } from "commander";
import type { CommandOptions, ListResult } from "../../output/index.js";
interface StatusRow {
    key: string;
    value: string;
}
export type StatusResult = ListResult<StatusRow>;
export declare function runStatusCommand(options: CommandOptions, _command: Command): Promise<StatusResult>;
export {};
//# sourceMappingURL=status.d.ts.map