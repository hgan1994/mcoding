import type { Command } from "commander";
import type { CommandOptions, ListResult } from "../../output/index.js";
import { type PermissionResponseItem } from "./allow.js";
export type PermitDenyResult = ListResult<PermissionResponseItem>;
export interface PermitDenyOptions extends CommandOptions {
    all?: boolean;
    message?: string;
    interrupt?: boolean;
    host?: string;
}
export declare function runDenyCommand(agentIdOrPrefix: string, reqId: string | undefined, options: PermitDenyOptions, _command: Command): Promise<PermitDenyResult>;
//# sourceMappingURL=deny.d.ts.map