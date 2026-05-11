import { query, type AgentDefinition, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { Logger } from "pino";
import type { AgentCapabilityFlags, AgentClient, AgentLaunchContext, AgentModelDefinition, AgentPersistenceHandle, AgentSession, AgentSessionConfig, AgentTimelineItem, ListModelsOptions, ListPersistedAgentsOptions, PersistedAgentDescriptor } from "../agent-sdk-types.js";
import { type ProviderRuntimeSettings } from "../provider-launch-config.js";
type EventIdentifiers = {
    taskId: string | null;
    parentMessageId: string | null;
    messageId: string | null;
};
export type ClaudeContentChunk = {
    type: string;
    [key: string]: any;
};
type ClaudeAgentClientOptions = {
    defaults?: {
        agents?: Record<string, AgentDefinition>;
    };
    logger: Logger;
    runtimeSettings?: ProviderRuntimeSettings;
    queryFactory?: typeof query;
};
export declare function extractUserMessageText(content: unknown): string | null;
export declare function readEventIdentifiers(message: SDKMessage): EventIdentifiers;
export declare class ClaudeAgentClient implements AgentClient {
    readonly provider: "claude";
    readonly capabilities: AgentCapabilityFlags;
    private readonly defaults?;
    private readonly logger;
    private readonly runtimeSettings?;
    private readonly queryFactory;
    constructor(options: ClaudeAgentClientOptions);
    createSession(config: AgentSessionConfig, launchContext?: AgentLaunchContext): Promise<AgentSession>;
    resumeSession(handle: AgentPersistenceHandle, overrides?: Partial<AgentSessionConfig>, launchContext?: AgentLaunchContext): Promise<AgentSession>;
    listModels(_options: ListModelsOptions): Promise<AgentModelDefinition[]>;
    listPersistedAgents(options?: ListPersistedAgentsOptions): Promise<PersistedAgentDescriptor[]>;
    isAvailable(): Promise<boolean>;
    getDiagnostic(): Promise<{
        diagnostic: string;
    }>;
    private assertConfig;
}
export declare function convertClaudeHistoryEntry(entry: any, mapBlocks: (content: string | ClaudeContentChunk[]) => AgentTimelineItem[]): AgentTimelineItem[];
export {};
//# sourceMappingURL=claude-agent.d.ts.map