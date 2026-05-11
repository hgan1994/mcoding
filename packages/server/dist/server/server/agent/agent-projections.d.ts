import type { AgentListItemPayload, AgentSnapshotPayload } from "../messages.js";
import type { StoredAgentRecord } from "./agent-storage.js";
import type { AgentRuntimeInfo } from "./agent-sdk-types.js";
import type { ManagedAgent } from "./agent-manager.js";
import type { Logger } from "pino";
import { buildProviderRegistry } from "./provider-registry.js";
export type { ManagedAgent };
type ProjectionOptions = {
    title?: string | null;
    createdAt?: string;
    internal?: boolean;
};
export declare function resolveEffectiveThinkingOptionId(options: {
    runtimeInfo?: AgentRuntimeInfo | null;
    configuredThinkingOptionId?: string | null;
}): string | null;
export declare function toStoredAgentRecord(agent: ManagedAgent, options?: ProjectionOptions): StoredAgentRecord;
export declare function toAgentPayload(agent: ManagedAgent, options?: ProjectionOptions): AgentSnapshotPayload;
export declare function buildStoredAgentPayload(record: StoredAgentRecord, providerRegistry: ReturnType<typeof buildProviderRegistry>, logger: Logger): AgentSnapshotPayload;
export declare function toAgentListItemPayload(agent: AgentSnapshotPayload): AgentListItemPayload;
export declare function resolveStoredAgentPayloadUpdatedAt(record: StoredAgentRecord): string;
//# sourceMappingURL=agent-projections.d.ts.map