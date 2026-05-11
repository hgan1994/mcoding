import type { Command } from "commander";
import type { ListResult } from "../../output/index.js";
import { type ChatCommandOptions } from "./shared.js";
import { type ChatMessageRow } from "./schema.js";
export interface ChatReadOptions extends ChatCommandOptions {
    limit?: string;
    since?: string;
    agent?: string;
}
export declare function runReadCommand(room: string, options: ChatReadOptions, _command: Command): Promise<ListResult<ChatMessageRow>>;
//# sourceMappingURL=read.d.ts.map