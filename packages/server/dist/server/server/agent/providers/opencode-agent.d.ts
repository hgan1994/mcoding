import { type AssistantMessage as OpenCodeAssistantMessage, type Event as OpenCodeEvent, type FilePartInput as OpenCodeFilePartInput, type OpencodeClient, type TextPartInput as OpenCodeTextPartInput } from "@opencode-ai/sdk/v2/client";
import type { Logger } from "pino";
import type { AgentCapabilityFlags, AgentClient, AgentLaunchContext, AgentMode, AgentModelDefinition, AgentPersistenceHandle, AgentPromptInput, AgentSession, AgentSessionConfig, AgentStreamEvent, AgentUsage, ListModelsOptions, ListModesOptions, ListPersistedAgentsOptions, PersistedAgentDescriptor } from "../agent-sdk-types.js";
import { type ProviderRuntimeSettings } from "../provider-launch-config.js";
type OpenCodeMessageRole = "user" | "assistant";
declare function reconcileOpenCodeSessionClose(params: {
    client: Pick<OpencodeClient, "session">;
    sessionId: string;
    directory: string;
    logger: Logger;
}): Promise<void>;
declare function buildOpenCodeModelLookupKey(providerId: string, modelId: string): string;
declare function parseOpenCodeModelLookupKey(modelId: string | null | undefined): string | undefined;
declare function extractOpenCodeModelContextWindow(model: unknown): number | undefined;
declare function buildOpenCodeModelDefinition(provider: {
    id: string;
    name: string;
}, modelId: string, model: {
    name: string;
    family?: string;
    release_date?: string;
    attachment?: boolean;
    reasoning?: boolean;
    tool_call?: boolean;
    cost?: unknown;
    limit?: {
        context?: number;
        input?: number;
        output?: number;
    };
    variants?: Record<string, unknown>;
}): AgentModelDefinition;
declare function resolveOpenCodeSelectedModelContextWindow(providers: {
    connected?: string[];
    all?: Array<{
        id: string;
        models?: Record<string, unknown>;
    }>;
} | null | undefined, modelId: string | null | undefined): number | undefined;
declare function buildOpenCodeModelContextWindowLookup(providers: {
    connected?: string[];
    all?: Array<{
        id: string;
        models?: Record<string, unknown>;
    }>;
} | null | undefined): Map<string, number>;
declare function resolveOpenCodeModelLookupKeyFromAssistantMessage(info: OpenCodeAssistantMessage): string | undefined;
declare function mergeOpenCodeStepFinishUsage(usage: AgentUsage, part: {
    cost?: unknown;
    tokens?: {
        input?: unknown;
        output?: unknown;
        reasoning?: unknown;
        total?: unknown;
        cache?: {
            read?: unknown;
            write?: unknown;
        };
    };
}): void;
declare function hasNormalizedOpenCodeUsage(usage: AgentUsage): boolean;
declare function buildOpenCodePromptParts(prompt: AgentPromptInput): Array<OpenCodeTextPartInput | OpenCodeFilePartInput>;
export declare const __openCodeInternals: {
    buildOpenCodePromptParts: typeof buildOpenCodePromptParts;
    buildOpenCodeModelContextWindowLookup: typeof buildOpenCodeModelContextWindowLookup;
    buildOpenCodeModelDefinition: typeof buildOpenCodeModelDefinition;
    buildOpenCodeModelLookupKey: typeof buildOpenCodeModelLookupKey;
    extractOpenCodeModelContextWindow: typeof extractOpenCodeModelContextWindow;
    hasNormalizedOpenCodeUsage: typeof hasNormalizedOpenCodeUsage;
    mergeOpenCodeStepFinishUsage: typeof mergeOpenCodeStepFinishUsage;
    parseOpenCodeModelLookupKey: typeof parseOpenCodeModelLookupKey;
    reconcileOpenCodeSessionClose: typeof reconcileOpenCodeSessionClose;
    resolveOpenCodeModelLookupKeyFromAssistantMessage: typeof resolveOpenCodeModelLookupKeyFromAssistantMessage;
    resolveOpenCodeSelectedModelContextWindow: typeof resolveOpenCodeSelectedModelContextWindow;
};
export declare class OpenCodeServerManager {
    private static instance;
    private static exitHandlerRegistered;
    private currentServer;
    private retiredServers;
    private startPromise;
    private forcedRefreshPromise;
    private readonly logger;
    private readonly runtimeSettings?;
    private readonly runtimeSettingsKey;
    private constructor();
    static getInstance(logger: Logger, runtimeSettings?: ProviderRuntimeSettings): OpenCodeServerManager;
    private static registerExitHandler;
    ensureRunning(): Promise<{
        port: number;
        url: string;
    }>;
    acquire(options: {
        force: boolean;
    }): Promise<{
        server: {
            port: number;
            url: string;
        };
        release: () => void;
    }>;
    private getForcedRefreshServer;
    private getCurrentServer;
    private rotateCurrentServer;
    private startServer;
    shutdown(): Promise<void>;
    private cleanupRetiredServers;
    private killServer;
}
export declare class OpenCodeAgentClient implements AgentClient {
    readonly provider: "opencode";
    readonly capabilities: AgentCapabilityFlags;
    private readonly serverManager;
    private readonly logger;
    private readonly runtimeSettings?;
    private readonly modelContextWindows;
    constructor(logger: Logger, runtimeSettings?: ProviderRuntimeSettings);
    createSession(config: AgentSessionConfig, _launchContext?: AgentLaunchContext): Promise<AgentSession>;
    resumeSession(handle: AgentPersistenceHandle, overrides?: Partial<AgentSessionConfig>, _launchContext?: AgentLaunchContext): Promise<AgentSession>;
    listModels(options: ListModelsOptions): Promise<AgentModelDefinition[]>;
    listModes(options: ListModesOptions): Promise<AgentMode[]>;
    listPersistedAgents(_options?: ListPersistedAgentsOptions): Promise<PersistedAgentDescriptor[]>;
    isAvailable(): Promise<boolean>;
    getDiagnostic(): Promise<{
        diagnostic: string;
    }>;
    private assertConfig;
    private populateModelContextWindowCache;
}
export type OpenCodeEventTranslationState = {
    sessionId: string;
    messageRoles: Map<string, OpenCodeMessageRole>;
    accumulatedUsage: AgentUsage;
    streamedPartKeys: Set<string>;
    emittedStructuredMessageIds: Set<string>;
    /** Tracks the type of each part by ID, learned from message.part.updated events. */
    partTypes: Map<string, string>;
    modelContextWindowsByModelKey?: ReadonlyMap<string, number>;
    onAssistantModelContextWindowResolved?: (contextWindowMaxTokens: number) => void;
};
export declare function translateOpenCodeEvent(event: OpenCodeEvent, state: OpenCodeEventTranslationState): AgentStreamEvent[];
export {};
//# sourceMappingURL=opencode-agent.d.ts.map