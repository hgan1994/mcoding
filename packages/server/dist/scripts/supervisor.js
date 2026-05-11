import { fork, spawn } from "child_process";
function describeExit(code, signal) {
    return signal ?? (typeof code === "number" ? `code ${code}` : "unknown");
}
function parseLifecycleMessage(msg) {
    if (typeof msg !== "object" || msg === null || !("type" in msg)) {
        return null;
    }
    const type = msg.type;
    if (type === "paseo:shutdown") {
        return { type: "paseo:shutdown" };
    }
    if (type === "paseo:ready") {
        const listen = msg.listen;
        if (typeof listen !== "string" || listen.trim().length === 0) {
            return null;
        }
        return { type: "paseo:ready", listen };
    }
    if (type === "paseo:restart") {
        const reason = msg.reason;
        return {
            type: "paseo:restart",
            ...(typeof reason === "string" && reason.trim().length > 0 ? { reason } : {}),
        };
    }
    return null;
}
export function runSupervisor(options) {
    const restartOnCrash = options.restartOnCrash ?? false;
    const workerArgs = options.workerArgs ?? process.argv.slice(2);
    const workerEnv = options.workerEnv ?? process.env;
    const workerExecArgv = options.workerExecArgv ?? ["--import", "tsx"];
    const resolveWorkerSpawnSpec = options.resolveWorkerSpawnSpec;
    let child = null;
    let restarting = false;
    let shuttingDown = false;
    let exiting = false;
    const log = (message) => {
        process.stderr.write(`[${options.name}] ${message}\n`);
    };
    const exitSupervisor = (code) => {
        if (exiting) {
            return;
        }
        exiting = true;
        Promise.resolve(options.onSupervisorExit?.())
            .catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            log(`Supervisor exit cleanup failed: ${message}`);
        })
            .finally(() => {
            process.exit(code);
        });
    };
    const spawnWorker = () => {
        let workerEntry;
        try {
            // Resolve at spawn time so restarts pick up current filesystem state.
            workerEntry = options.resolveWorkerEntry();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            log(`Failed to resolve worker entry: ${message}`);
            exitSupervisor(1);
            return;
        }
        const spawnSpec = resolveWorkerSpawnSpec?.(workerEntry) ?? null;
        if (spawnSpec) {
            child = spawn(spawnSpec.command, spawnSpec.args, {
                stdio: ["inherit", "inherit", "inherit", "ipc"],
                env: spawnSpec.env ?? workerEnv,
            });
        }
        else {
            child = fork(workerEntry, workerArgs, {
                stdio: "inherit",
                env: workerEnv,
                execArgv: workerExecArgv,
            });
        }
        child.on("message", (msg) => {
            const lifecycleMessage = parseLifecycleMessage(msg);
            if (!lifecycleMessage) {
                return;
            }
            if (lifecycleMessage.type === "paseo:ready") {
                Promise.resolve(options.onWorkerReady?.({ listen: lifecycleMessage.listen })).catch((error) => {
                    const message = error instanceof Error ? error.message : String(error);
                    log(`Worker ready callback failed: ${message}`);
                });
                return;
            }
            if (lifecycleMessage.type === "paseo:shutdown") {
                requestShutdown("Shutdown requested by worker");
                return;
            }
            requestRestart("Restart requested by worker");
        });
        child.on("exit", (code, signal) => {
            const exitDescriptor = describeExit(code, signal);
            if (shuttingDown) {
                log(`Worker exited (${exitDescriptor}). Supervisor shutting down.`);
                exitSupervisor(0);
                return;
            }
            const crashed = restartOnCrash &&
                ((code !== 0 && code !== null) || (signal !== null && signal === "SIGKILL"));
            if (restarting || crashed) {
                restarting = false;
                log(`Worker exited (${exitDescriptor}). Restarting worker...`);
                spawnWorker();
                return;
            }
            log(`Worker exited (${exitDescriptor}). Supervisor exiting.`);
            exitSupervisor(typeof code === "number" ? code : 0);
        });
    };
    const requestRestart = (reason) => {
        if (!child || restarting || shuttingDown) {
            return;
        }
        restarting = true;
        log(`${reason}. Stopping worker for restart...`);
        child.kill("SIGTERM");
    };
    const requestShutdown = (reason) => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        restarting = false;
        log(`${reason}. Stopping worker...`);
        if (!child) {
            exitSupervisor(0);
            return;
        }
        child.kill("SIGTERM");
    };
    const forwardSignal = (signal) => {
        requestShutdown(`Received ${signal}`);
    };
    process.on("SIGINT", () => forwardSignal("SIGINT"));
    process.on("SIGTERM", () => forwardSignal("SIGTERM"));
    process.stdout.write(`[${options.name}] ${options.startupMessage}\n`);
    spawnWorker();
}
//# sourceMappingURL=supervisor.js.map