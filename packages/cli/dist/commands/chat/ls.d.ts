import type { Command } from "commander";
import type { ListResult } from "../../output/index.js";
import { type ChatCommandOptions } from "./shared.js";
import { type ChatRoomRow } from "./schema.js";
export declare function runLsCommand(options: ChatCommandOptions, _command: Command): Promise<ListResult<ChatRoomRow>>;
//# sourceMappingURL=ls.d.ts.map