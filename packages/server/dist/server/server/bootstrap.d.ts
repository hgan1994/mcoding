import type { Logger } from "pino";
export type ListenTarget = {
    type: "tcp";
    host: string;
    port: number;
} | {
    type: "socket";
    path: string;
} | {
    type: "pipe";
    path: string;
};
export declare function parseListenString(listen: string): ListenTarget;
import type { OpenAiSpeechProviderConfig } from "./speech/providers/openai/config.js";
import type { LocalSpeechProviderConfig } from "./speech/providers/local/config.js";
import type { RequestedSpeechProviders } from "./speech/speech-types.js";
import { AgentManager } from "./agent/agent-manager.js";
import { AgentStorage } from "./agent/agent-storage.js";
import { type TerminalManager } from "../terminal/terminal-manager.js";
import type { AgentClient, AgentProvider } from "./agent/agent-sdk-types.js";
import type { AgentProviderRuntimeSettingsMap, ProviderOverride } from "./agent/provider-launch-config.js";
import { ScriptRouteStore } from "./script-proxy.js";
import { WorkspaceScriptRuntimeStore } from "./workspace-script-runtime-store.js";
import { type HostnamesConfig } from "./hostnames.js";
export type PaseoOpenAIConfig = OpenAiSpeechProviderConfig;
export type PaseoLocalSpeechConfig = LocalSpeechProviderConfig;
export type PaseoSpeechConfig = {
    providers: RequestedSpeechProviders;
    local?: PaseoLocalSpeechConfig;
};
export type DaemonLifecycleIntent = {
    type: "shutdown";
    clientId: string;
    requestId: string;
} | {
    type: "restart";
    clientId: string;
    requestId: string;
    reason?: string;
};
export type PaseoDaemonConfig = {
    listen: string;
    paseoHome: string;
    corsAllowedOrigins: string[];
    allowedHosts?: HostnamesConfig;
    hostnames?: HostnamesConfig;
    mcpEnabled?: boolean;
    mcpInjectIntoAgents?: boolean;
    staticDir: string;
    mcpDebug: boolean;
    isDev?: boolean;
    agentClients: Partial<Record<AgentProvider, AgentClient>>;
    agentStoragePath: string;
    relayEnabled?: boolean;
    relayEndpoint?: string;
    relayPublicEndpoint?: string;
    appBaseUrl?: string;
    openai?: PaseoOpenAIConfig;
    speech?: PaseoSpeechConfig;
    voiceLlmProvider?: AgentProvider | null;
    voiceLlmProviderExplicit?: boolean;
    voiceLlmModel?: string | null;
    dictationFinalTimeoutMs?: number;
    downloadTokenTtlMs?: number;
    agentProviderSettings?: AgentProviderRuntimeSettingsMap;
    providerOverrides?: Record<string, ProviderOverride>;
    onLifecycleIntent?: (intent: DaemonLifecycleIntent) => void;
};
export interface PaseoDaemon {
    config: PaseoDaemonConfig;
    agentManager: AgentManager;
    agentStorage: AgentStorage;
    terminalManager: TerminalManager;
    scriptRouteStore: ScriptRouteStore;
    scriptRuntimeStore: WorkspaceScriptRuntimeStore;
    start(): Promise<void>;
    stop(): Promise<void>;
    getListenTarget(): ListenTarget | null;
}
export declare function createPaseoDaemon(config: PaseoDaemonConfig, rootLogger: Logger): Promise<PaseoDaemon>;
//# sourceMappingURL=bootstrap.d.ts.map