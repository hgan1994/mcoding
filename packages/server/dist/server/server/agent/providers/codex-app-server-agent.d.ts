import type { AgentCapabilityFlags, AgentClient, AgentFeature, AgentLaunchContext, AgentMode, AgentModelDefinition, AgentPermissionRequest, AgentPermissionResponse, AgentPermissionResult, AgentPromptInput, AgentRunOptions, AgentRunResult, AgentRuntimeInfo, AgentSession, AgentSessionConfig, AgentSlashCommand, AgentStreamEvent, AgentTimelineItem, ToolCallTimelineItem, AgentUsage, ListModelsOptions, ListPersistedAgentsOptions, PersistedAgentDescriptor } from "../agent-sdk-types.js";
import type { Logger } from "pino";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { type ProviderRuntimeSettings } from "../provider-launch-config.js";
import { codexModelSupportsFastMode } from "./codex-feature-definitions.js";
import type { WorkspaceGitService } from "../../workspace-git-service.js";
declare const CODEX_PROVIDER: "codex";
type CodexAppServerAgentDeps = {
    workspaceGitService?: Pick<WorkspaceGitService, "resolveRepoRoot">;
};
declare function normalizeCodexOutputSchema(schema: unknown): Record<string, unknown>;
declare function listCodexSkills(cwd: string, workspaceGitService?: Pick<WorkspaceGitService, "resolveRepoRoot">): Promise<AgentSlashCommand[]>;
type RequestHandler = (params: unknown) => Promise<unknown> | unknown;
type NotificationHandler = (method: string, params: unknown) => void;
declare class CodexAppServerClient {
    private readonly child;
    private readonly logger;
    private readonly rl;
    private readonly pending;
    private readonly requestHandlers;
    private notificationHandler;
    private nextId;
    private disposed;
    private stderrBuffer;
    private readonly exitPromise;
    private resolveExitPromise;
    constructor(child: ChildProcessWithoutNullStreams, logger: Logger);
    setNotificationHandler(handler: NotificationHandler): void;
    setRequestHandler(method: string, handler: RequestHandler): void;
    request(method: string, params?: unknown, timeoutMs?: number): Promise<unknown>;
    notify(method: string, params?: unknown): void;
    private writeJsonRpcResponse;
    dispose(): Promise<void>;
    private waitForExit;
    private handleLine;
}
declare function toAgentUsage(tokenUsage: unknown): AgentUsage | undefined;
declare function planStepsToMarkdown(steps: Array<{
    step: string;
    status: string;
}>): string;
declare function mapCodexPlanToToolCall(params: {
    callId: string;
    text: string;
}): ToolCallTimelineItem | null;
type CodexQuestionOption = {
    label: string;
    description?: string;
};
type CodexQuestionPrompt = {
    id: string;
    header: string;
    question: string;
    options: CodexQuestionOption[];
    multiSelect?: boolean;
    isOther?: boolean;
    isSecret?: boolean;
};
declare function normalizeCodexQuestionPrompts(raw: unknown): CodexQuestionPrompt[];
declare function formatCodexQuestionPrompts(questions: CodexQuestionPrompt[]): string;
declare function mapCodexQuestionRequestToToolCall(params: {
    callId: string;
    questions: CodexQuestionPrompt[];
    status: ToolCallTimelineItem["status"];
    answers?: Record<string, string[]>;
    error?: unknown;
}): ToolCallTimelineItem;
declare function mapCodexPatchNotificationToToolCall(params: {
    callId?: string | null;
    changes: unknown;
    cwd?: string | null;
    stdout?: string | null;
    stderr?: string | null;
    success?: boolean | null;
    running: boolean;
}): ToolCallTimelineItem | null;
declare function threadItemToTimeline(item: any, options?: {
    includeUserMessage?: boolean;
    cwd?: string | null;
}): AgentTimelineItem | null;
export declare function codexAppServerTurnInputFromPrompt(prompt: AgentPromptInput, logger: Logger): Promise<unknown[]>;
declare function buildCodexAppServerEnv(runtimeSettings?: ProviderRuntimeSettings, launchEnv?: Record<string, string>): Record<string, string | undefined>;
declare class CodexAppServerAgentSession implements AgentSession {
    private readonly resumeHandle;
    private readonly spawnAppServer;
    private readonly deps;
    readonly provider: "codex";
    readonly capabilities: AgentCapabilityFlags;
    private readonly logger;
    private readonly config;
    private currentMode;
    private currentThreadId;
    private currentTurnId;
    private client;
    private readonly subscribers;
    private nextTurnOrdinal;
    private activeForegroundTurnId;
    private cachedRuntimeInfo;
    private serviceTier;
    private planModeEnabled;
    private historyPending;
    private persistedHistory;
    private pendingPermissions;
    private pendingPermissionHandlers;
    private resolvedPermissionRequests;
    private pendingAgentMessages;
    private pendingReasoning;
    private pendingCommandOutputDeltas;
    private pendingFileChangeOutputDeltas;
    private terminalCommandByProcessId;
    private pendingUnlabeledTerminalInteractions;
    private emittedTerminalInteractionKeys;
    private emittedExecCommandStartedCallIds;
    private emittedExecCommandCompletedCallIds;
    private emittedItemStartedIds;
    private emittedItemCompletedIds;
    private warnedUnknownNotificationMethods;
    private warnedInvalidNotificationPayloads;
    private warnedIncompleteEditToolCallIds;
    private latestUsage;
    private latestPlanResult;
    private connected;
    private collaborationModes;
    private resolvedCollaborationMode;
    private cachedSkills;
    constructor(config: AgentSessionConfig, resumeHandle: {
        sessionId: string;
        metadata?: Record<string, unknown>;
    } | null, logger: Logger, spawnAppServer: () => Promise<ChildProcessWithoutNullStreams>, deps?: CodexAppServerAgentDeps);
    get id(): string | null;
    get features(): AgentFeature[];
    connect(): Promise<void>;
    private loadCollaborationModes;
    private loadSkills;
    private findCollaborationMode;
    private hasPlanCollaborationMode;
    private resolveCollaborationMode;
    private refreshResolvedCollaborationMode;
    private applyFeatureValue;
    private rememberPlanResult;
    private emitSyntheticPlanApprovalRequest;
    /**
     * Prepare the session for plan implementation by disabling plan mode
     * and returning the implementation prompt. The caller is responsible for
     * starting the turn through the normal streamAgent path.
     */
    private preparePlanImplementation;
    private registerRequestHandlers;
    private loadPersistedHistory;
    private ensureThreadLoaded;
    private parseSlashCommandInput;
    private resolveSlashCommandInvocation;
    private buildCommandPromptInput;
    run(prompt: AgentPromptInput, options?: AgentRunOptions): Promise<AgentRunResult>;
    startTurn(prompt: AgentPromptInput, options?: AgentRunOptions): Promise<{
        turnId: string;
    }>;
    subscribe(callback: (event: AgentStreamEvent) => void): () => void;
    streamHistory(): AsyncGenerator<AgentStreamEvent>;
    getRuntimeInfo(): Promise<AgentRuntimeInfo>;
    getAvailableModes(): Promise<AgentMode[]>;
    getCurrentMode(): Promise<string | null>;
    setMode(modeId: string): Promise<void>;
    setModel(modelId: string | null): Promise<void>;
    setThinkingOption(thinkingOptionId: string | null): Promise<void>;
    setFeature(featureId: string, value: unknown): Promise<void>;
    getPendingPermissions(): AgentPermissionRequest[];
    respondToPermission(requestId: string, response: AgentPermissionResponse): Promise<AgentPermissionResult | void>;
    describePersistence(): {
        provider: typeof CODEX_PROVIDER;
        sessionId: string;
        nativeHandle: string;
        metadata: Record<string, unknown>;
    } | null;
    interrupt(): Promise<void>;
    close(): Promise<void>;
    listCommands(): Promise<AgentSlashCommand[]>;
    private ensureThread;
    private buildCodexInnerConfig;
    private buildUserInput;
    private emitEvent;
    private notifySubscribers;
    private createTurnId;
    private handleNotification;
    private warnUnknownNotificationMethod;
    private warnInvalidNotificationPayload;
    private appendOutputDeltaChunk;
    private consumeOutputDelta;
    private rememberTerminalProcessForCommand;
    private shouldEmitTerminalInteractionKey;
    private warnOnIncompleteEditToolCall;
    private handleCommandApprovalRequest;
    private handleFileChangeApprovalRequest;
    private handleToolApprovalRequest;
}
export declare class CodexAppServerAgentClient implements AgentClient {
    private readonly logger;
    private readonly runtimeSettings?;
    private readonly deps;
    readonly provider: "codex";
    readonly capabilities: AgentCapabilityFlags;
    constructor(logger: Logger, runtimeSettings?: ProviderRuntimeSettings | undefined, deps?: CodexAppServerAgentDeps);
    private spawnAppServer;
    createSession(config: AgentSessionConfig, launchContext?: AgentLaunchContext): Promise<AgentSession>;
    resumeSession(handle: {
        sessionId: string;
        metadata?: Record<string, unknown>;
    }, overrides?: Partial<AgentSessionConfig>, launchContext?: AgentLaunchContext): Promise<AgentSession>;
    listPersistedAgents(options?: ListPersistedAgentsOptions): Promise<PersistedAgentDescriptor[]>;
    listModels(_options: ListModelsOptions): Promise<AgentModelDefinition[]>;
    isAvailable(): Promise<boolean>;
    getDiagnostic(): Promise<{
        diagnostic: string;
    }>;
}
export declare const __codexAppServerInternals: {
    buildCodexAppServerEnv: typeof buildCodexAppServerEnv;
    CodexAppServerClient: typeof CodexAppServerClient;
    codexModelSupportsFastMode: typeof codexModelSupportsFastMode;
    CodexAppServerAgentSession: typeof CodexAppServerAgentSession;
    formatCodexQuestionPrompts: typeof formatCodexQuestionPrompts;
    mapCodexQuestionRequestToToolCall: typeof mapCodexQuestionRequestToToolCall;
    mapCodexPatchNotificationToToolCall: typeof mapCodexPatchNotificationToToolCall;
    planStepsToMarkdown: typeof planStepsToMarkdown;
    mapCodexPlanToToolCall: typeof mapCodexPlanToToolCall;
    listCodexSkills: typeof listCodexSkills;
    normalizeCodexOutputSchema: typeof normalizeCodexOutputSchema;
    normalizeCodexQuestionPrompts: typeof normalizeCodexQuestionPrompts;
    toAgentUsage: typeof toAgentUsage;
    threadItemToTimeline: typeof threadItemToTimeline;
};
export {};
//# sourceMappingURL=codex-app-server-agent.d.ts.map