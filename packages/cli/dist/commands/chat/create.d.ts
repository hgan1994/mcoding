import type { Command } from "commander";
import type { SingleResult } from "../../output/index.js";
import { type ChatCommandOptions } from "./shared.js";
import { type ChatRoomRow } from "./schema.js";
export interface ChatCreateOptions extends ChatCommandOptions {
    purpose?: string;
}
export declare function runCreateCommand(name: string, options: ChatCreateOptions, _command: Command): Promise<SingleResult<ChatRoomRow>>;
//# sourceMappingURL=create.d.ts.map