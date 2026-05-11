import type { AgentTimelineItem, DaemonClient } from "@getpaseo/server";
type FetchProjectedTimelineItemsInput = {
    client: DaemonClient;
    agentId: string;
};
export declare function fetchProjectedTimelineItems(input: FetchProjectedTimelineItemsInput): Promise<AgentTimelineItem[]>;
export {};
//# sourceMappingURL=timeline.d.ts.map