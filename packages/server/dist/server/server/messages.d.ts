import type { ManagedAgent } from "./agent/agent-manager.js";
import type { AgentStreamEvent } from "./agent/agent-sdk-types.js";
import type { AgentSnapshotPayload, AgentStreamEventPayload } from "../shared/messages.js";
export * from "../shared/messages.js";
export declare function serializeAgentSnapshot(agent: ManagedAgent, options?: {
    title?: string | null;
}): AgentSnapshotPayload;
export declare function serializeAgentStreamEvent(event: AgentStreamEvent): AgentStreamEventPayload | null;
//# sourceMappingURL=messages.d.ts.map