import type { Command } from "commander";
import type { CommandOptions, SingleResult, OutputSchema } from "../../output/index.js";
/** Result type for worktree archive command */
export interface WorktreeArchiveResult {
    name: string;
    status: "archived";
    removedAgents: string[];
}
/** Schema for archive command output */
export declare const archiveSchema: OutputSchema<WorktreeArchiveResult>;
export interface WorktreeArchiveOptions extends CommandOptions {
    host?: string;
}
export type WorktreeArchiveCommandResult = SingleResult<WorktreeArchiveResult>;
export declare function runArchiveCommand(nameArg: string, options: WorktreeArchiveOptions, _command: Command): Promise<WorktreeArchiveCommandResult>;
//# sourceMappingURL=archive.d.ts.map