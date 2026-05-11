import type { PaseoDaemonConfig } from "./bootstrap.js";
import { type HostnamesConfig } from "./hostnames.js";
export type CliConfigOverrides = Partial<{
    listen: string;
    relayEnabled: boolean;
    mcpEnabled: boolean;
    mcpInjectIntoAgents: boolean;
    hostnames: HostnamesConfig;
}>;
export declare function loadConfig(paseoHome: string, options?: {
    env?: NodeJS.ProcessEnv;
    cli?: CliConfigOverrides;
}): PaseoDaemonConfig;
//# sourceMappingURL=config.d.ts.map