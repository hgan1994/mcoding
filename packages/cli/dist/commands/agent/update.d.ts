import type { Command } from "commander";
import type { CommandOptions, SingleResult, OutputSchema } from "../../output/index.js";
/** Result type for agent update command */
export interface AgentUpdateResult {
    agentId: string;
    name: string | null;
    labels: string;
}
/** Schema for update command output */
export declare const updateSchema: OutputSchema<AgentUpdateResult>;
export interface AgentUpdateOptions extends CommandOptions {
    name?: string;
    label?: string[];
    host?: string;
}
export type AgentUpdateCommandResult = SingleResult<AgentUpdateResult>;
export declare function runUpdateCommand(agentIdArg: string, options: AgentUpdateOptions, _command: Command): Promise<AgentUpdateCommandResult>;
//# sourceMappingURL=update.d.ts.map