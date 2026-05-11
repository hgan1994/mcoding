import type { Logger } from "pino";
import { ACPAgentClient } from "./acp-agent.js";
type GenericACPAgentClientOptions = {
    logger: Logger;
    command: string[];
    env?: Record<string, string>;
};
export declare class GenericACPAgentClient extends ACPAgentClient {
    private readonly command;
    constructor(options: GenericACPAgentClientOptions);
    protected resolveLaunchCommand(): Promise<{
        command: string;
        args: string[];
    }>;
    isAvailable(): Promise<boolean>;
}
export {};
//# sourceMappingURL=generic-acp-agent.d.ts.map