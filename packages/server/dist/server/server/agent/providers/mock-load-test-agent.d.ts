import type { Logger } from "pino";
import type { AgentCapabilityFlags, AgentClient, AgentFeature, AgentLaunchContext, AgentMode, AgentModelDefinition, AgentPersistenceHandle, AgentPermissionRequest, AgentPermissionResponse, AgentPermissionResult, AgentPromptInput, AgentProvider, AgentRunOptions, AgentRunResult, AgentRuntimeInfo, AgentSession, AgentSessionConfig, AgentStreamEvent, ListModesOptions, ListModelsOptions, ListPersistedAgentsOptions, PersistedAgentDescriptor } from "../agent-sdk-types.js";
export declare const MOCK_LOAD_TEST_PROVIDER_ID = "mock";
export declare const MOCK_LOAD_TEST_DEFAULT_MODEL_ID = "five-minute-stream";
export declare class MockLoadTestAgentClient implements AgentClient {
    private readonly logger?;
    readonly provider: AgentProvider;
    readonly capabilities: AgentCapabilityFlags;
    constructor(logger?: Logger | undefined);
    createSession(config: AgentSessionConfig, _launchContext?: AgentLaunchContext): Promise<AgentSession>;
    resumeSession(handle: AgentPersistenceHandle, overrides?: Partial<AgentSessionConfig>, _launchContext?: AgentLaunchContext): Promise<AgentSession>;
    listModels(_options: ListModelsOptions): Promise<AgentModelDefinition[]>;
    listModes(_options: ListModesOptions): Promise<AgentMode[]>;
    listPersistedAgents(_options?: ListPersistedAgentsOptions): Promise<PersistedAgentDescriptor[]>;
    isAvailable(): Promise<boolean>;
    getDiagnostic(): Promise<{
        diagnostic: string;
    }>;
}
export declare class MockLoadTestAgentSession implements AgentSession {
    readonly provider: AgentProvider;
    readonly capabilities: AgentCapabilityFlags;
    readonly features: AgentFeature[];
    readonly id: string;
    private readonly listeners;
    private readonly history;
    private readonly logger?;
    private activeTurn;
    private modeId;
    private modelId;
    constructor(options: {
        config: AgentSessionConfig;
        sessionId: string;
        logger?: Logger;
    });
    run(prompt: AgentPromptInput, options?: AgentRunOptions): Promise<AgentRunResult>;
    startTurn(prompt: AgentPromptInput, _options?: AgentRunOptions): Promise<{
        turnId: string;
    }>;
    subscribe(callback: (event: AgentStreamEvent) => void): () => void;
    streamHistory(): AsyncGenerator<AgentStreamEvent>;
    getRuntimeInfo(): Promise<AgentRuntimeInfo>;
    getAvailableModes(): Promise<AgentMode[]>;
    getCurrentMode(): Promise<string | null>;
    setMode(modeId: string): Promise<void>;
    getPendingPermissions(): AgentPermissionRequest[];
    respondToPermission(_requestId: string, _response: AgentPermissionResponse): Promise<AgentPermissionResult | void>;
    describePersistence(): AgentPersistenceHandle | null;
    interrupt(): Promise<void>;
    close(): Promise<void>;
    setModel(modelId: string | null): Promise<void>;
    private schedule;
    private scheduleLargePayloadTurn;
    private scheduleStressTurn;
    private emitStressTurn;
    private emitLargePayloadTurn;
    private tick;
    private emitIteration;
    private finishTurn;
    private emitTimeline;
    private emit;
    private clearTurnTimer;
}
//# sourceMappingURL=mock-load-test-agent.d.ts.map