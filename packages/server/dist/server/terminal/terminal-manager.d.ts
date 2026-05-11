import { type TerminalSession } from "./terminal.js";
export interface TerminalListItem {
    id: string;
    name: string;
    cwd: string;
    title?: string;
}
export interface TerminalsChangedEvent {
    cwd: string;
    terminals: TerminalListItem[];
}
export type TerminalsChangedListener = (input: TerminalsChangedEvent) => void;
export interface TerminalManager {
    getTerminals(cwd: string): Promise<TerminalSession[]>;
    createTerminal(options: {
        id?: string;
        cwd: string;
        name?: string;
        title?: string;
        env?: Record<string, string>;
        command?: string;
        args?: string[];
    }): Promise<TerminalSession>;
    registerCwdEnv(options: {
        cwd: string;
        env: Record<string, string>;
    }): void;
    getTerminal(id: string): TerminalSession | undefined;
    killTerminal(id: string): void;
    killTerminalAndWait(id: string, options?: {
        gracefulTimeoutMs?: number;
        forceTimeoutMs?: number;
    }): Promise<void>;
    listDirectories(): string[];
    killAll(): void;
    subscribeTerminalsChanged(listener: TerminalsChangedListener): () => void;
}
export declare function createTerminalManager(): TerminalManager;
//# sourceMappingURL=terminal-manager.d.ts.map