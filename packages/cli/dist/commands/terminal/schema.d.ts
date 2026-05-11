import type { OutputSchema } from "../../output/index.js";
export interface TerminalRow {
    id: string;
    name: string;
    cwd: string;
}
export interface TerminalKillRow {
    terminalId: string;
    success: boolean;
}
export declare const terminalSchema: OutputSchema<TerminalRow>;
export declare const terminalKillSchema: OutputSchema<TerminalKillRow>;
export declare function toTerminalRow(terminal: {
    id: string;
    name: string;
    cwd?: string;
}, cwd?: string): TerminalRow;
//# sourceMappingURL=schema.d.ts.map