import type { SessionOutboundMessage, WorkspaceScriptPayload } from "../shared/messages.js";
import type { ScriptHealthEntry, ScriptHealthState } from "./script-health-monitor.js";
import type { ScriptRouteStore } from "./script-proxy.js";
import type { WorkspaceScriptRuntimeStore } from "./workspace-script-runtime-store.js";
type SessionEmitter = {
    emit(message: SessionOutboundMessage): void;
};
type BuildWorkspaceScriptPayloadsOptions = {
    workspaceId: string;
    workspaceDirectory: string;
    routeStore: ScriptRouteStore;
    runtimeStore: WorkspaceScriptRuntimeStore;
    daemonPort: number | null;
    gitMetadata?: {
        projectSlug: string;
        currentBranch: string | null;
    };
    resolveHealth?: (hostname: string) => ScriptHealthState | null;
};
export declare function buildWorkspaceScriptPayloads(options: BuildWorkspaceScriptPayloadsOptions): WorkspaceScriptPayload[];
export declare function createScriptStatusEmitter({ sessions, routeStore, runtimeStore, daemonPort, resolveWorkspaceDirectory, }: {
    sessions: () => SessionEmitter[];
    routeStore: ScriptRouteStore;
    runtimeStore: WorkspaceScriptRuntimeStore;
    daemonPort: number | null | (() => number | null);
    resolveWorkspaceDirectory: (workspaceId: string) => string | null | Promise<string | null>;
}): (workspaceId: string, scripts: ScriptHealthEntry[]) => void;
export {};
//# sourceMappingURL=script-status-projection.d.ts.map