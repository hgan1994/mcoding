import type { Command } from "commander";
import { connectToDaemon } from "../../utils/client.js";
import type { CommandOptions, ListResult, OutputSchema } from "../../output/index.js";
type FetchAgentsOptions = NonNullable<Parameters<Awaited<ReturnType<typeof connectToDaemon>>["fetchAgents"]>[0]>;
export declare function addLsOptions(cmd: Command): Command;
/** Agent list item for display */
export interface AgentListItem {
    id: string;
    shortId: string;
    name: string;
    provider: string;
    thinking: string;
    status: string;
    cwd: string;
    created: string;
}
/** Schema for agent ls output */
export declare const agentLsSchema: OutputSchema<AgentListItem>;
export type AgentLsResult = ListResult<AgentListItem>;
export interface AgentLsOptions extends CommandOptions {
    /** -a: Include archived agents */
    all?: boolean;
    /** Legacy flag retained for CLI compatibility */
    global?: boolean;
    /** Filter by specific status */
    status?: string;
    /** Filter by specific cwd */
    cwd?: string;
    /** Filter by labels (key=value format) */
    label?: string[];
    /** Filter by thinking option ID */
    thinking?: string;
}
export declare function buildAgentLsFetchOptions(options: Pick<AgentLsOptions, "all" | "label" | "thinking">): FetchAgentsOptions;
/**
 * Agent ls command semantics:
 * - `paseo agent ls`    → active non-archived agents
 * - `paseo agent ls -a` → include archived agents
 */
export declare function runLsCommand(options: AgentLsOptions, _command: Command): Promise<AgentLsResult>;
export {};
//# sourceMappingURL=ls.d.ts.map