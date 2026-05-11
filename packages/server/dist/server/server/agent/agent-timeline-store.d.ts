import type { AgentTimelineItem } from "./agent-sdk-types.js";
import type { AgentTimelineFetchOptions, AgentTimelineFetchResult, AgentTimelineRow } from "./agent-timeline-store-types.js";
export type SeedAgentTimelineOptions = {
    items?: readonly AgentTimelineItem[];
    rows?: readonly AgentTimelineRow[];
    epoch?: string;
    nextSeq?: number;
    timestamp?: string;
};
export declare class InMemoryAgentTimelineStore {
    private readonly states;
    has(agentId: string): boolean;
    initialize(agentId: string, options?: SeedAgentTimelineOptions): void;
    delete(agentId: string): void;
    getItems(agentId: string): AgentTimelineItem[];
    getRows(agentId: string): AgentTimelineRow[];
    getEpoch(agentId: string): string;
    fetch(agentId: string, options?: AgentTimelineFetchOptions): AgentTimelineFetchResult;
    append(agentId: string, item: AgentTimelineItem, options?: {
        timestamp?: string;
    }): AgentTimelineRow;
    getLastItem(agentId: string): AgentTimelineItem | null;
    getLastAssistantMessage(agentId: string): string | null;
    getCanonicalUserMessagesById(agentId: string): Map<string, string>;
    hasCommittedUserMessage(agentId: string, options: {
        messageId: string;
        text: string;
    }): boolean;
    private requireState;
    private buildRowsFromItems;
}
//# sourceMappingURL=agent-timeline-store.d.ts.map