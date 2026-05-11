import { Command } from "commander";
import type { CommandOptions } from "../../output/index.js";
import type { DaemonClient, AgentTimelineItem } from "@getpaseo/server";
export declare function addLogsOptions(cmd: Command): Command;
export interface AgentLogsOptions extends CommandOptions {
    follow?: boolean;
    tail?: string;
    filter?: string;
    since?: string;
}
export type AgentLogsResult = void;
export declare const NO_ACTIVITY_MESSAGE = "No activity to display.";
export declare function fetchAgentTimelineItems(client: DaemonClient, agentId: string): Promise<AgentTimelineItem[]>;
export declare function formatAgentActivityTranscript(timelineItems: AgentTimelineItem[], tailCount?: number): string;
export declare function runLogsCommand(id: string, options: AgentLogsOptions, _command: Command): Promise<AgentLogsResult>;
//# sourceMappingURL=logs.d.ts.map