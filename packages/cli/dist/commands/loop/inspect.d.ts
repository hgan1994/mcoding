import { Command } from "commander";
import type { CommandOptions, ListResult } from "../../output/index.js";
interface InspectRow {
    key: string;
    value: string;
}
export interface LoopInspectOptions extends CommandOptions {
}
export declare function addLoopInspectOptions(command: Command): Command;
export type LoopInspectResult = ListResult<InspectRow>;
export declare function runLoopInspectCommand(id: string, options: LoopInspectOptions, _command: Command): Promise<LoopInspectResult>;
export {};
//# sourceMappingURL=inspect.d.ts.map