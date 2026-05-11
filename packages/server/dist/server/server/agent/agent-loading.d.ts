import type { Logger } from "pino";
import type { AgentProvider } from "./agent-sdk-types.js";
import type { AgentManager, ManagedAgent } from "./agent-manager.js";
import type { AgentStorage } from "./agent-storage.js";
export interface EnsureAgentLoadedDeps {
    agentManager: AgentManager;
    agentStorage: AgentStorage;
    validProviders?: Iterable<AgentProvider>;
    logger: Logger;
}
export declare function ensureAgentLoaded(agentId: string, deps: EnsureAgentLoadedDeps): Promise<ManagedAgent>;
//# sourceMappingURL=agent-loading.d.ts.map