import type { Command } from "commander";
import type { CommandOptions, ListResult, OutputSchema } from "../../output/index.js";
/** Permission response item for display */
export interface PermissionResponseItem {
    requestId: string;
    agentId: string;
    agentShortId: string;
    name: string;
    result: string;
}
/** Schema for permit allow/deny output */
export declare const permitResponseSchema: OutputSchema<PermissionResponseItem>;
export type PermitAllowResult = ListResult<PermissionResponseItem>;
export interface PermitAllowOptions extends CommandOptions {
    all?: boolean;
    input?: string;
    host?: string;
}
export declare function runAllowCommand(agentIdOrPrefix: string, reqId: string | undefined, options: PermitAllowOptions, _command: Command): Promise<PermitAllowResult>;
//# sourceMappingURL=allow.d.ts.map