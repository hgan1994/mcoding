import { type AgentSnapshotPayload, type SessionInboundMessage, type SessionOutboundMessage, type EditorTargetDescriptorPayload, type EditorTargetId, type WorkspaceSetupSnapshot } from "./messages.js";
import type { TerminalManager } from "../terminal/terminal-manager.js";
import { type TerminalStreamFrame } from "../shared/terminal-stream-protocol.js";
import type { SpeechToTextProvider, TextToSpeechProvider } from "./speech/speech-provider.js";
import type { TurnDetectionProvider } from "./speech/turn-detection-provider.js";
import type { VoiceCallerContext, VoiceSpeakHandler } from "./voice-types.js";
import type { ScriptHealthState } from "./script-health-monitor.js";
import type { WorkspaceScriptRuntimeStore } from "./workspace-script-runtime-store.js";
import type { DaemonConfigStore } from "./daemon-config-store.js";
import type { WorkspaceGitRuntimeSnapshot, WorkspaceGitService } from "./workspace-git-service.js";
import type { AgentProviderRuntimeSettingsMap, ProviderOverride } from "./agent/provider-launch-config.js";
import { AgentManager } from "./agent/agent-manager.js";
import { ProviderSnapshotManager } from "./agent/provider-snapshot-manager.js";
import type { AgentStorage } from "./agent/agent-storage.js";
import { type PersistedWorkspaceRecord, type ProjectRegistry, type WorkspaceRegistry } from "./workspace-registry.js";
import { DownloadTokenStore } from "./file-download/token-store.js";
import { PushTokenStore } from "./push/token-store.js";
import type { ScriptRouteStore } from "./script-proxy.js";
import { CheckoutDiffManager } from "./checkout-diff-manager.js";
import { type Resolvable } from "./speech/provider-resolver.js";
import type { SpeechReadinessSnapshot } from "./speech/speech-runtime.js";
import type pino from "pino";
import { FileBackedChatService } from "./chat/chat-service.js";
import { LoopService } from "./loop-service.js";
import { ScheduleService } from "./schedule/service.js";
import { type GitHubService } from "../services/github-service.js";
export declare function resolveCreateAgentTitles(options: {
    configTitle?: string | null;
    initialPrompt?: string | null;
}): {
    explicitTitle: string | null;
    provisionalTitle: string | null;
};
export declare function resolveWaitForFinishError(options: {
    status: "permission" | "error" | "idle";
    final: AgentSnapshotPayload | null;
}): string | null;
export type SessionRuntimeMetrics = {
    terminalDirectorySubscriptionCount: number;
    terminalSubscriptionCount: number;
    inflightRequests: number;
    peakInflightRequests: number;
};
type AgentMcpTransportFactory = () => Promise<unknown>;
export type SessionOptions = {
    clientId: string;
    appVersion?: string | null;
    onMessage: (msg: SessionOutboundMessage) => void;
    onBinaryMessage?: (frame: Uint8Array) => void;
    onLifecycleIntent?: (intent: SessionLifecycleIntent) => void;
    logger: pino.Logger;
    downloadTokenStore: DownloadTokenStore;
    pushTokenStore: PushTokenStore;
    paseoHome: string;
    agentManager: AgentManager;
    agentStorage: AgentStorage;
    projectRegistry: ProjectRegistry;
    workspaceRegistry: WorkspaceRegistry;
    chatService: FileBackedChatService;
    scheduleService: ScheduleService;
    loopService: LoopService;
    checkoutDiffManager: CheckoutDiffManager;
    github?: GitHubService;
    createAgentMcpTransport?: AgentMcpTransportFactory;
    workspaceGitService: WorkspaceGitService;
    daemonConfigStore: DaemonConfigStore;
    mcpBaseUrl?: string | null;
    stt: Resolvable<SpeechToTextProvider | null>;
    tts: Resolvable<TextToSpeechProvider | null>;
    terminalManager: TerminalManager | null;
    providerSnapshotManager?: ProviderSnapshotManager;
    scriptRouteStore?: ScriptRouteStore;
    scriptRuntimeStore?: WorkspaceScriptRuntimeStore;
    workspaceSetupSnapshots?: Map<string, WorkspaceSetupSnapshot>;
    onBranchChanged?: (workspaceId: string, oldBranch: string | null, newBranch: string | null) => void;
    getDaemonTcpPort?: () => number | null;
    getDaemonTcpHost?: () => string | null;
    resolveScriptHealth?: (hostname: string) => ScriptHealthState | null;
    voice?: {
        turnDetection?: Resolvable<TurnDetectionProvider | null>;
    };
    voiceBridge?: {
        registerVoiceSpeakHandler?: (agentId: string, handler: VoiceSpeakHandler) => void;
        unregisterVoiceSpeakHandler?: (agentId: string) => void;
        registerVoiceCallerContext?: (agentId: string, context: VoiceCallerContext) => void;
        unregisterVoiceCallerContext?: (agentId: string) => void;
    };
    dictation?: {
        finalTimeoutMs?: number;
        stt?: Resolvable<SpeechToTextProvider | null>;
        getSpeechReadiness?: () => SpeechReadinessSnapshot;
    };
    agentProviderRuntimeSettings?: AgentProviderRuntimeSettingsMap;
    providerOverrides?: Record<string, ProviderOverride>;
    isDev?: boolean;
};
export type SessionLifecycleIntent = {
    type: "shutdown";
    clientId: string;
    requestId: string;
} | {
    type: "restart";
    clientId: string;
    requestId: string;
    reason?: string;
};
type CheckoutPrStatusPayload = Extract<SessionOutboundMessage, {
    type: "checkout_pr_status_response";
}>["payload"];
type CheckoutPrStatusPayloadStatus = NonNullable<CheckoutPrStatusPayload["status"]>;
/**
 * Session represents a single connected client session.
 * It owns all state management, orchestration logic, and message processing.
 * Session has no knowledge of WebSockets - it only emits and receives messages.
 */
export declare class Session {
    private readonly clientId;
    private appVersion;
    private readonly sessionId;
    private readonly onMessage;
    private readonly onBinaryMessage;
    private readonly onLifecycleIntent;
    private readonly sessionLogger;
    private readonly paseoHome;
    private abortController;
    private processingPhase;
    private isVoiceMode;
    private speechInProgress;
    private pendingVoiceSpeechStartAt;
    private pendingVoiceSpeechTimer;
    private readonly dictationStreamManager;
    private readonly resolveVoiceTurnDetection;
    private voiceTurnController;
    private voiceInputChunkCount;
    private voiceInputBytes;
    private voiceInputWindowStartedAt;
    private pendingAudioSegments;
    private bufferTimeout;
    private audioBuffer;
    private readonly ttsDebugStreams;
    private readonly ttsManager;
    private readonly sttManager;
    private agentMcpClient;
    private agentTools;
    private agentManager;
    private readonly agentStorage;
    private readonly projectRegistry;
    private readonly workspaceRegistry;
    private readonly chatService;
    private readonly scheduleService;
    private readonly loopService;
    private readonly checkoutDiffManager;
    private readonly github;
    private readonly workspaceGitService;
    private readonly daemonConfigStore;
    private readonly mcpBaseUrl;
    private readonly downloadTokenStore;
    private readonly pushTokenStore;
    private readonly providerRegistry;
    private unsubscribeAgentEvents;
    private agentUpdatesSubscription;
    private workspaceUpdatesSubscription;
    private clientActivity;
    private readonly MOBILE_BACKGROUND_STREAM_GRACE_MS;
    private readonly terminalManager;
    private readonly providerSnapshotManager;
    private unsubscribeProviderSnapshotEvents;
    private readonly scriptRouteStore;
    private readonly scriptRuntimeStore;
    private readonly onBranchChanged?;
    private readonly getDaemonTcpPort;
    private readonly getDaemonTcpHost;
    private readonly resolveScriptHealth;
    private readonly subscribedTerminalDirectories;
    private unsubscribeTerminalsChanged;
    private terminalExitSubscriptions;
    private readonly activeTerminalStreams;
    private readonly terminalIdToSlot;
    private nextTerminalSlot;
    private inflightRequests;
    private peakInflightRequests;
    private readonly availableEditorTargetsCache;
    private readonly getMemoizedAvailableEditorTargets;
    private readonly checkoutDiffSubscriptions;
    private readonly workspaceGitWatchTargets;
    private readonly workspaceSetupSnapshots;
    private readonly workspaceGitFetchSubscriptions;
    private readonly workspaceGitSubscriptions;
    private readonly registerVoiceSpeakHandler?;
    private readonly unregisterVoiceSpeakHandler?;
    private readonly registerVoiceCallerContext?;
    private readonly unregisterVoiceCallerContext?;
    private readonly getSpeechReadiness?;
    private readonly agentProviderRuntimeSettings;
    private readonly providerOverrides;
    private readonly isDev;
    private voiceModeAgentId;
    private voiceModeBaseConfig;
    constructor(options: SessionOptions);
    updateAppVersion(appVersion: string | null): void;
    primeWorkspaceGitWatchFingerprintForWorkspace(workspace: PersistedWorkspaceRecord): Promise<void>;
    emitWorkspaceUpdateForWorkspaceId(workspaceId: string): Promise<void>;
    archiveWorkspaceRecordForExternalMutation(workspaceId: string): Promise<void>;
    emitWorkspaceUpdatesForExternalCwds(cwds: Iterable<string>): Promise<void>;
    warmWorkspaceGitDataForWorkspace(workspace: PersistedWorkspaceRecord): Promise<void>;
    /**
     * Get the client's current activity state
     */
    getClientActivity(): {
        deviceType: "web" | "mobile";
        focusedAgentId: string | null;
        lastActivityAt: Date;
        appVisible: boolean;
        appVisibilityChangedAt: Date;
    } | null;
    getRuntimeMetrics(): SessionRuntimeMetrics;
    emitServerMessage(message: SessionOutboundMessage): void;
    /**
     * Send initial state to client after connection
     */
    sendInitialState(): Promise<void>;
    /**
     * Normalize a user prompt (with optional image metadata) for AgentManager
     */
    private buildAgentPrompt;
    /**
     * Interrupt the agent's active run so the next prompt starts a fresh turn.
     * Returns once the manager confirms the stream has been cancelled.
     */
    private interruptAgentIfRunning;
    private hasActiveAgentRun;
    /**
     * Start streaming an agent run and forward results via the websocket broadcast
     */
    private startAgentStream;
    private handleAgentRunError;
    /**
     * Initialize Agent MCP client for this session using the daemon's HTTP MCP endpoint.
     */
    private initializeAgentMcp;
    /**
     * Subscribe to AgentManager events and forward them to the client
     */
    private subscribeToAgentEvents;
    private buildAgentPayload;
    private buildStoredAgentPayload;
    private isProviderVisibleToClient;
    private filterEditorsForClient;
    private matchesAgentFilter;
    private getAgentUpdateTargetId;
    private bufferOrEmitAgentUpdate;
    private flushBootstrappedAgentUpdates;
    private findWorkspaceByDirectory;
    private resolveWorkspaceDirectory;
    private buildProjectPlacementForWorkspace;
    private buildProjectPlacementForCwd;
    private forwardAgentUpdate;
    /**
     * Main entry point for processing session messages
     */
    handleMessage(msg: SessionInboundMessage): Promise<void>;
    resetPeakInflight(): void;
    handleBinaryFrame(frame: TerminalStreamFrame): void;
    private handleRestartServerRequest;
    private handleShutdownServerRequest;
    private emitLifecycleIntent;
    private handleDeleteAgentRequest;
    private handleArchiveAgentRequest;
    private archiveStoredAgentForClose;
    private archiveAgentForClose;
    private handleCloseItemsRequest;
    private unarchiveAgentByHandle;
    private handleUpdateAgentRequest;
    private toVoiceFeatureUnavailableContext;
    private resolveModeReadinessState;
    private getVoiceFeatureUnavailableResponseMetadata;
    private resolveVoiceFeatureUnavailableContext;
    /**
     * Handle voice mode toggle
     */
    private handleSetVoiceMode;
    private parseVoiceTargetAgentId;
    private enableVoiceModeForAgent;
    private disableVoiceModeForActiveAgent;
    private handleDictationManagerMessage;
    private startVoiceTurnController;
    private stopVoiceTurnController;
    private clearPendingVoiceSpeechStart;
    private handleProvisionalVoiceSpeechStarted;
    private handleVoiceSpeechStopped;
    /**
     * Handle text message to agent (with optional image attachments)
     */
    private handleSendAgentMessage;
    /**
     * Handle create agent request
     */
    private handleCreateAgentRequest;
    private handleResumeAgentRequest;
    private handleRefreshAgentRequest;
    private handleCancelAgentRequest;
    private buildAgentSessionConfig;
    private handleListProviderModelsRequest;
    private handleListProviderModesRequest;
    private getProviderSnapshotEntryForRead;
    private buildDraftAgentSessionConfig;
    private handleListProviderFeaturesRequest;
    private handleListAvailableProvidersRequest;
    private handleGetProvidersSnapshotRequest;
    private handleRefreshProvidersSnapshotRequest;
    private handleProviderDiagnosticRequest;
    private assertSafeGitRef;
    private isPathWithinRoot;
    private generateCommitMessage;
    private generatePullRequestText;
    private ensureCleanWorkingTree;
    private isWorkingTreeDirty;
    private checkoutExistingBranch;
    private createBranchFromBase;
    private doesLocalBranchExist;
    private notifyGitMutation;
    /**
     * Handle set agent mode request
     */
    private handleSetAgentModeRequest;
    private handleSetAgentModelRequest;
    private handleSetAgentFeatureRequest;
    private handleSetAgentThinkingRequest;
    /**
     * Handle clearing agent attention flag
     */
    private handleClearAgentAttention;
    /**
     * Handle client heartbeat for activity tracking
     */
    private handleClientHeartbeat;
    /**
     * Handle push token registration
     */
    private handleRegisterPushToken;
    /**
     * Handle list commands request for an agent
     */
    private handleListCommandsRequest;
    /**
     * Handle agent permission response from user
     */
    private handleAgentPermissionResponse;
    private handleCheckoutStatusRequest;
    private handleValidateBranchRequest;
    private handleBranchSuggestionsRequest;
    private handleGitHubSearchRequest;
    private handleDirectorySuggestionsRequest;
    private closeWorkspaceGitWatchTarget;
    private removeWorkspaceGitWatchTarget;
    private removeWorkspaceGitSubscription;
    private workspaceGitDescriptorFingerprint;
    private shouldSkipWorkspaceGitWatchUpdate;
    private rememberWorkspaceGitWatchFingerprint;
    private primeWorkspaceGitWatchFingerprints;
    private syncWorkspaceGitWatchTarget;
    private handleSubscribeCheckoutDiffRequest;
    private handleUnsubscribeCheckoutDiffRequest;
    private buildCheckoutStatusPayloadFromSnapshot;
    private buildCheckoutPrStatusPayloadFromSnapshot;
    private emitCheckoutStatusUpdate;
    private handleCheckoutSwitchBranchRequest;
    private static readonly PASEO_STASH_PREFIX;
    private handleStashSaveRequest;
    private handleStashPopRequest;
    private handleStashListRequest;
    private handleCheckoutCommitRequest;
    private handleCheckoutMergeRequest;
    private handleCheckoutMergeFromBaseRequest;
    private handleCheckoutPullRequest;
    private handleCheckoutPushRequest;
    private handleCheckoutPrCreateRequest;
    private handleCheckoutPrStatusRequest;
    private handlePullRequestTimelineRequest;
    private handlePaseoWorktreeListRequest;
    private handlePaseoWorktreeArchiveRequest;
    /**
     * Handle read-only file explorer requests scoped to a workspace cwd
     */
    private handleFileExplorerRequest;
    /**
     * Handle project icon request for a given cwd
     */
    private handleProjectIconRequest;
    /**
     * Handle file download token request scoped to a workspace cwd
     */
    private handleFileDownloadTokenRequest;
    /**
     * Build the current agent list payload (live + persisted), optionally filtered by labels.
     */
    private listAgentPayloads;
    private resolveAgentIdentifier;
    private getAgentPayloadById;
    private normalizeFetchAgentsSort;
    private getStatusPriority;
    private getFetchAgentsSortValue;
    private getFetchAgentsSortValueFromAgent;
    private compareSortValues;
    private compareFetchAgentsAgents;
    private encodeFetchAgentsCursor;
    private decodeFetchAgentsCursor;
    private compareAgentWithCursor;
    private buildActiveProjectPlacementsByWorkspaceCwd;
    private listFetchAgentsEntries;
    private readonly workspaceStatePriority;
    private deriveWorkspaceStateBucket;
    private describeWorkspaceRecord;
    private buildWorkspaceGitRuntimePayload;
    private buildWorkspaceGitHubRuntimePayload;
    private describeWorkspaceRecordWithGitData;
    private describeCreatedWorktreeWorkspace;
    private buildWorkspaceDescriptor;
    private buildWorkspaceDescriptorMap;
    private resolveRegisteredWorkspaceIdForCwd;
    private listWorkspaceDescriptors;
    private normalizeFetchWorkspacesSort;
    private getFetchWorkspacesSortValue;
    private compareFetchWorkspacesEntries;
    private encodeFetchWorkspacesCursor;
    private decodeFetchWorkspacesCursor;
    private compareWorkspaceWithCursor;
    private matchesWorkspaceFilter;
    private listFetchWorkspacesEntries;
    private bufferOrEmitWorkspaceUpdate;
    private flushBootstrappedWorkspaceUpdates;
    private findOrCreateWorkspaceForDirectory;
    private ensureWorkspaceRecordUnarchived;
    private createPaseoWorktree;
    private archiveWorkspaceRecord;
    private reconcileAndEmitWorkspaceUpdates;
    private reconcileActiveWorkspaceRecords;
    private emitWorkspaceUpdatesForWorkspaceIds;
    private emitWorkspaceUpdateForCwd;
    private emitWorkspaceUpdatesForCwds;
    private handleFetchAgents;
    private handleFetchAgentHistory;
    private handleFetchWorkspacesRequest;
    private handleOpenProjectRequest;
    private buildWorkspaceScriptPayloadSnapshot;
    private resolveWorkspaceScriptGitMetadata;
    private emitWorkspaceScriptStatusUpdate;
    resolveAvailableEditorTargets(): Promise<EditorTargetDescriptorPayload[]>;
    getAvailableEditorTargets(): Promise<{
        id: string;
        label: string;
    }[]>;
    openEditorTarget(options: {
        editorId: EditorTargetId;
        path: string;
    }): Promise<void>;
    private handleStartWorkspaceScriptRequest;
    private handleListAvailableEditorsRequest;
    private handleOpenInEditorRequest;
    private handleCreatePaseoWorktreeRequest;
    private runWorktreeSetupInBackground;
    private handleWorkspaceSetupStatusRequest;
    private handleArchiveWorkspaceRequest;
    private handleFetchAgent;
    private handleFetchAgentTimelineRequest;
    private handleSendAgentMessageRequest;
    private handleWaitForFinish;
    /**
     * Handle audio chunk for buffering and transcription
     */
    private handleAudioChunk;
    private finalizeBufferedAudio;
    private processCompletedAudio;
    private flushPendingAudioSegments;
    /**
     * Process audio through STT and then LLM
     */
    private processAudio;
    private handleTranscriptionResultPayload;
    private registerVoiceBridgeForAgent;
    /**
     * Handle abort request from client
     */
    private handleAbort;
    /**
     * Handle audio playback confirmation from client
     */
    private handleAudioPlayed;
    /**
     * Mark speech detection start and abort any active playback/agent run.
     */
    private handleVoiceSpeechStart;
    /**
     * Clear speech-in-progress flag once the user turn has completed
     */
    private clearSpeechInProgress;
    /**
     * Create new AbortController, aborting the previous one
     */
    private createAbortController;
    /**
     * Set the processing phase
     */
    private setPhase;
    /**
     * Set timeout to process buffered audio segments
     */
    private setBufferTimeout;
    /**
     * Clear buffer timeout
     */
    private clearBufferTimeout;
    /**
     * Emit a message to the client
     */
    private emit;
    private emitBinary;
    /**
     * Clean up session resources
     */
    cleanup(): Promise<void>;
    private ensureTerminalExitSubscription;
    private handleTerminalExited;
    private emitChatRpcError;
    private handleChatCreateRequest;
    private handleChatListRequest;
    private handleChatInspectRequest;
    private handleChatDeleteRequest;
    private handleChatPostRequest;
    private handleChatReadRequest;
    private handleChatWaitRequest;
    private toScheduleSummary;
    private emitScheduleRpcError;
    private handleScheduleCreateRequest;
    private handleScheduleListRequest;
    private handleScheduleInspectRequest;
    private handleScheduleLogsRequest;
    private handleSchedulePauseRequest;
    private handleScheduleResumeRequest;
    private handleScheduleDeleteRequest;
    private emitLoopRpcError;
    private handleLoopRunRequest;
    private handleLoopListRequest;
    private handleLoopInspectRequest;
    private handleLoopLogsRequest;
    private handleLoopStopRequest;
    private emitTerminalsChangedSnapshot;
    private filterStandaloneTerminals;
    private toTerminalInfo;
    private handleTerminalsChanged;
    private handleSubscribeTerminalsRequest;
    private handleUnsubscribeTerminalsRequest;
    private emitInitialTerminalsChangedSnapshot;
    private handleListTerminalsRequest;
    private getAllTerminalSessions;
    private handleCreateTerminalRequest;
    private handleSubscribeTerminalRequest;
    private handleUnsubscribeTerminalRequest;
    private handleTerminalInput;
    private killTrackedTerminal;
    private killTerminalsUnderPath;
    private handleKillTerminalRequest;
    private killTerminalForClose;
    private handleCaptureTerminalRequest;
    private bindActiveTerminalStream;
    private trySendTerminalSnapshot;
    private allocateTerminalSlot;
    private detachTerminalStream;
    private disposeTerminalSubscriptions;
}
export declare function normalizeCheckoutPrStatusPayload(status: WorkspaceGitRuntimeSnapshot["github"]["pullRequest"]): CheckoutPrStatusPayloadStatus | null;
export {};
//# sourceMappingURL=session.d.ts.map