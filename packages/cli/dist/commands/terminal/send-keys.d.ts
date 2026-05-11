import type { Command } from "commander";
import { type TerminalCommandOptions } from "./shared.js";
export interface TerminalSendKeysOptions extends TerminalCommandOptions {
    literal?: boolean;
}
export declare function runSendKeysCommand(terminalId: string, keys: string[], _options: TerminalSendKeysOptions, command: Command): Promise<void>;
//# sourceMappingURL=send-keys.d.ts.map