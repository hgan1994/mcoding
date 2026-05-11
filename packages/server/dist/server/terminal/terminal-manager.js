import { createTerminal } from "./terminal.js";
import { resolve, sep, win32, posix } from "node:path";
export function createTerminalManager() {
    const terminalsByCwd = new Map();
    const terminalsById = new Map();
    const terminalExitUnsubscribeById = new Map();
    const terminalTitleUnsubscribeById = new Map();
    const terminalsChangedListeners = new Set();
    const defaultEnvByRootCwd = new Map();
    function assertAbsolutePath(cwd) {
        if (!posix.isAbsolute(cwd) && !win32.isAbsolute(cwd)) {
            throw new Error("cwd must be absolute path");
        }
    }
    function removeSessionById(id, options) {
        const session = terminalsById.get(id);
        if (!session) {
            return;
        }
        const unsubscribeExit = terminalExitUnsubscribeById.get(id);
        if (unsubscribeExit) {
            unsubscribeExit();
            terminalExitUnsubscribeById.delete(id);
        }
        const unsubscribeTitle = terminalTitleUnsubscribeById.get(id);
        if (unsubscribeTitle) {
            unsubscribeTitle();
            terminalTitleUnsubscribeById.delete(id);
        }
        terminalsById.delete(id);
        const terminals = terminalsByCwd.get(session.cwd);
        if (terminals) {
            const index = terminals.findIndex((terminal) => terminal.id === id);
            if (index !== -1) {
                terminals.splice(index, 1);
            }
            if (terminals.length === 0) {
                terminalsByCwd.delete(session.cwd);
            }
        }
        if (options.kill) {
            session.kill();
        }
        emitTerminalsChanged({ cwd: session.cwd });
    }
    function resolveDefaultEnvForCwd(cwd) {
        const normalizedCwd = resolve(cwd);
        let bestMatchRoot = null;
        for (const rootCwd of defaultEnvByRootCwd.keys()) {
            const matches = normalizedCwd === rootCwd || normalizedCwd.startsWith(`${rootCwd}${sep}`);
            if (!matches) {
                continue;
            }
            if (!bestMatchRoot || rootCwd.length > bestMatchRoot.length) {
                bestMatchRoot = rootCwd;
            }
        }
        return bestMatchRoot ? defaultEnvByRootCwd.get(bestMatchRoot) : undefined;
    }
    function registerSession(session) {
        terminalsById.set(session.id, session);
        const unsubscribeExit = session.onExit(() => {
            removeSessionById(session.id, { kill: false });
        });
        const unsubscribeTitle = session.onTitleChange(() => {
            emitTerminalsChanged({ cwd: session.cwd });
        });
        terminalExitUnsubscribeById.set(session.id, unsubscribeExit);
        terminalTitleUnsubscribeById.set(session.id, unsubscribeTitle);
        return session;
    }
    function toTerminalListItem(input) {
        return {
            id: input.session.id,
            name: input.session.name,
            cwd: input.session.cwd,
            title: input.session.getTitle(),
        };
    }
    function emitTerminalsChanged(input) {
        if (terminalsChangedListeners.size === 0) {
            return;
        }
        const terminals = (terminalsByCwd.get(input.cwd) ?? []).map((session) => toTerminalListItem({ session }));
        const event = {
            cwd: input.cwd,
            terminals,
        };
        for (const listener of terminalsChangedListeners) {
            try {
                listener(event);
            }
            catch {
                // no-op
            }
        }
    }
    return {
        async getTerminals(cwd) {
            assertAbsolutePath(cwd);
            return terminalsByCwd.get(cwd) ?? [];
        },
        async createTerminal(options) {
            assertAbsolutePath(options.cwd);
            const terminals = terminalsByCwd.get(options.cwd) ?? [];
            const defaultName = `Terminal ${terminals.length + 1}`;
            const inheritedEnv = resolveDefaultEnvForCwd(options.cwd);
            const mergedEnv = inheritedEnv || options.env
                ? { ...(inheritedEnv ?? {}), ...(options.env ?? {}) }
                : undefined;
            const session = registerSession(await createTerminal({
                ...(options.id ? { id: options.id } : {}),
                cwd: options.cwd,
                name: options.name ?? defaultName,
                ...(options.title ? { title: options.title } : {}),
                ...(options.command ? { command: options.command } : {}),
                ...(options.args ? { args: options.args } : {}),
                ...(mergedEnv ? { env: mergedEnv } : {}),
            }));
            terminals.push(session);
            terminalsByCwd.set(options.cwd, terminals);
            emitTerminalsChanged({ cwd: options.cwd });
            return session;
        },
        registerCwdEnv(options) {
            assertAbsolutePath(options.cwd);
            defaultEnvByRootCwd.set(resolve(options.cwd), { ...options.env });
        },
        getTerminal(id) {
            return terminalsById.get(id);
        },
        killTerminal(id) {
            removeSessionById(id, { kill: true });
        },
        async killTerminalAndWait(id, options) {
            const session = terminalsById.get(id);
            if (!session) {
                return;
            }
            try {
                await session.killAndWait(options);
            }
            finally {
                removeSessionById(id, { kill: false });
            }
        },
        listDirectories() {
            return Array.from(terminalsByCwd.keys());
        },
        killAll() {
            for (const id of Array.from(terminalsById.keys())) {
                removeSessionById(id, { kill: true });
            }
        },
        subscribeTerminalsChanged(listener) {
            terminalsChangedListeners.add(listener);
            return () => {
                terminalsChangedListeners.delete(listener);
            };
        },
    };
}
//# sourceMappingURL=terminal-manager.js.map