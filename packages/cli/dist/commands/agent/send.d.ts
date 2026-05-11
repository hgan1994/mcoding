import { type Command } from "commander";
import type { CommandOptions, SingleResult, OutputSchema } from "../../output/index.js";
/** Result type for agent send command */
export interface AgentSendResult {
    agentId: string;
    status: "sent" | "completed" | "timeout" | "permission" | "error";
    message: string;
}
/** Schema for agent send output */
export declare const agentSendSchema: OutputSchema<AgentSendResult>;
export interface AgentSendOptions extends CommandOptions {
    wait?: boolean;
    image?: string[];
    prompt?: string;
    promptFile?: string;
}
export declare function addSendOptions(cmd: Command): Command;
export declare function runSendCommand(agentIdArg: string, prompt: string | undefined, options: AgentSendOptions, _command: Command): Promise<SingleResult<AgentSendResult>>;
//# sourceMappingURL=send.d.ts.map