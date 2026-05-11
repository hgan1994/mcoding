import type { Command } from "commander";
import type { SingleResult } from "../../output/index.js";
import { type ScheduleCommandOptions, type ScheduleRow } from "./shared.js";
export interface ScheduleCreateOptions extends ScheduleCommandOptions {
    every?: string;
    cron?: string;
    name?: string;
    target?: string;
    provider?: string;
    maxRuns?: string;
    expiresIn?: string;
}
export declare function runCreateCommand(prompt: string, options: ScheduleCreateOptions, _command: Command): Promise<SingleResult<ScheduleRow>>;
//# sourceMappingURL=create.d.ts.map