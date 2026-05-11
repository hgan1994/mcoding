import { z } from "zod";
export declare const LoopLogEntrySchema: z.ZodObject<{
    seq: z.ZodNumber;
    timestamp: z.ZodString;
    iteration: z.ZodNullable<z.ZodNumber>;
    source: z.ZodEnum<["loop", "worker", "verifier", "verify-check"]>;
    level: z.ZodEnum<["info", "error"]>;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text: string;
    seq: number;
    timestamp: string;
    iteration: number | null;
    source: "loop" | "worker" | "verifier" | "verify-check";
    level: "error" | "info";
}, {
    text: string;
    seq: number;
    timestamp: string;
    iteration: number | null;
    source: "loop" | "worker" | "verifier" | "verify-check";
    level: "error" | "info";
}>;
export declare const LoopVerifyCheckResultSchema: z.ZodObject<{
    command: z.ZodString;
    exitCode: z.ZodNumber;
    passed: z.ZodBoolean;
    stdout: z.ZodString;
    stderr: z.ZodString;
    startedAt: z.ZodString;
    completedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    startedAt: string;
    command: string;
    exitCode: number;
    passed: boolean;
    stdout: string;
    stderr: string;
    completedAt: string;
}, {
    startedAt: string;
    command: string;
    exitCode: number;
    passed: boolean;
    stdout: string;
    stderr: string;
    completedAt: string;
}>;
export declare const LoopVerifyPromptResultSchema: z.ZodObject<{
    passed: z.ZodBoolean;
    reason: z.ZodString;
    verifierAgentId: z.ZodNullable<z.ZodString>;
    startedAt: z.ZodString;
    completedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    startedAt: string;
    passed: boolean;
    completedAt: string;
    verifierAgentId: string | null;
}, {
    reason: string;
    startedAt: string;
    passed: boolean;
    completedAt: string;
    verifierAgentId: string | null;
}>;
export declare const LoopIterationRecordSchema: z.ZodObject<{
    index: z.ZodNumber;
    workerAgentId: z.ZodNullable<z.ZodString>;
    workerStartedAt: z.ZodString;
    workerCompletedAt: z.ZodNullable<z.ZodString>;
    verifierAgentId: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
    workerOutcome: z.ZodNullable<z.ZodEnum<["completed", "failed", "canceled"]>>;
    failureReason: z.ZodNullable<z.ZodString>;
    verifyChecks: z.ZodArray<z.ZodObject<{
        command: z.ZodString;
        exitCode: z.ZodNumber;
        passed: z.ZodBoolean;
        stdout: z.ZodString;
        stderr: z.ZodString;
        startedAt: z.ZodString;
        completedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        startedAt: string;
        command: string;
        exitCode: number;
        passed: boolean;
        stdout: string;
        stderr: string;
        completedAt: string;
    }, {
        startedAt: string;
        command: string;
        exitCode: number;
        passed: boolean;
        stdout: string;
        stderr: string;
        completedAt: string;
    }>, "many">;
    verifyPrompt: z.ZodNullable<z.ZodObject<{
        passed: z.ZodBoolean;
        reason: z.ZodString;
        verifierAgentId: z.ZodNullable<z.ZodString>;
        startedAt: z.ZodString;
        completedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reason: string;
        startedAt: string;
        passed: boolean;
        completedAt: string;
        verifierAgentId: string | null;
    }, {
        reason: string;
        startedAt: string;
        passed: boolean;
        completedAt: string;
        verifierAgentId: string | null;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "running" | "failed" | "succeeded" | "stopped";
    verifierAgentId: string | null;
    index: number;
    workerAgentId: string | null;
    workerStartedAt: string;
    workerCompletedAt: string | null;
    workerOutcome: "completed" | "failed" | "canceled" | null;
    failureReason: string | null;
    verifyChecks: {
        startedAt: string;
        command: string;
        exitCode: number;
        passed: boolean;
        stdout: string;
        stderr: string;
        completedAt: string;
    }[];
    verifyPrompt: {
        reason: string;
        startedAt: string;
        passed: boolean;
        completedAt: string;
        verifierAgentId: string | null;
    } | null;
}, {
    status: "running" | "failed" | "succeeded" | "stopped";
    verifierAgentId: string | null;
    index: number;
    workerAgentId: string | null;
    workerStartedAt: string;
    workerCompletedAt: string | null;
    workerOutcome: "completed" | "failed" | "canceled" | null;
    failureReason: string | null;
    verifyChecks: {
        startedAt: string;
        command: string;
        exitCode: number;
        passed: boolean;
        stdout: string;
        stderr: string;
        completedAt: string;
    }[];
    verifyPrompt: {
        reason: string;
        startedAt: string;
        passed: boolean;
        completedAt: string;
        verifierAgentId: string | null;
    } | null;
}>;
export declare const LoopRecordSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    prompt: z.ZodString;
    cwd: z.ZodString;
    provider: z.ZodString;
    model: z.ZodNullable<z.ZodString>;
    workerProvider: z.ZodNullable<z.ZodString>;
    workerModel: z.ZodNullable<z.ZodString>;
    verifierProvider: z.ZodNullable<z.ZodString>;
    verifierModel: z.ZodNullable<z.ZodString>;
    verifyPrompt: z.ZodNullable<z.ZodString>;
    verifyChecks: z.ZodArray<z.ZodString, "many">;
    archive: z.ZodBoolean;
    sleepMs: z.ZodNumber;
    maxIterations: z.ZodNullable<z.ZodNumber>;
    maxTimeMs: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    startedAt: z.ZodString;
    completedAt: z.ZodNullable<z.ZodString>;
    stopRequestedAt: z.ZodNullable<z.ZodString>;
    iterations: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        workerAgentId: z.ZodNullable<z.ZodString>;
        workerStartedAt: z.ZodString;
        workerCompletedAt: z.ZodNullable<z.ZodString>;
        verifierAgentId: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
        workerOutcome: z.ZodNullable<z.ZodEnum<["completed", "failed", "canceled"]>>;
        failureReason: z.ZodNullable<z.ZodString>;
        verifyChecks: z.ZodArray<z.ZodObject<{
            command: z.ZodString;
            exitCode: z.ZodNumber;
            passed: z.ZodBoolean;
            stdout: z.ZodString;
            stderr: z.ZodString;
            startedAt: z.ZodString;
            completedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            startedAt: string;
            command: string;
            exitCode: number;
            passed: boolean;
            stdout: string;
            stderr: string;
            completedAt: string;
        }, {
            startedAt: string;
            command: string;
            exitCode: number;
            passed: boolean;
            stdout: string;
            stderr: string;
            completedAt: string;
        }>, "many">;
        verifyPrompt: z.ZodNullable<z.ZodObject<{
            passed: z.ZodBoolean;
            reason: z.ZodString;
            verifierAgentId: z.ZodNullable<z.ZodString>;
            startedAt: z.ZodString;
            completedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            reason: string;
            startedAt: string;
            passed: boolean;
            completedAt: string;
            verifierAgentId: string | null;
        }, {
            reason: string;
            startedAt: string;
            passed: boolean;
            completedAt: string;
            verifierAgentId: string | null;
        }>>;
    }, "strip", z.ZodTypeAny, {
        status: "running" | "failed" | "succeeded" | "stopped";
        verifierAgentId: string | null;
        index: number;
        workerAgentId: string | null;
        workerStartedAt: string;
        workerCompletedAt: string | null;
        workerOutcome: "completed" | "failed" | "canceled" | null;
        failureReason: string | null;
        verifyChecks: {
            startedAt: string;
            command: string;
            exitCode: number;
            passed: boolean;
            stdout: string;
            stderr: string;
            completedAt: string;
        }[];
        verifyPrompt: {
            reason: string;
            startedAt: string;
            passed: boolean;
            completedAt: string;
            verifierAgentId: string | null;
        } | null;
    }, {
        status: "running" | "failed" | "succeeded" | "stopped";
        verifierAgentId: string | null;
        index: number;
        workerAgentId: string | null;
        workerStartedAt: string;
        workerCompletedAt: string | null;
        workerOutcome: "completed" | "failed" | "canceled" | null;
        failureReason: string | null;
        verifyChecks: {
            startedAt: string;
            command: string;
            exitCode: number;
            passed: boolean;
            stdout: string;
            stderr: string;
            completedAt: string;
        }[];
        verifyPrompt: {
            reason: string;
            startedAt: string;
            passed: boolean;
            completedAt: string;
            verifierAgentId: string | null;
        } | null;
    }>, "many">;
    logs: z.ZodArray<z.ZodObject<{
        seq: z.ZodNumber;
        timestamp: z.ZodString;
        iteration: z.ZodNullable<z.ZodNumber>;
        source: z.ZodEnum<["loop", "worker", "verifier", "verify-check"]>;
        level: z.ZodEnum<["info", "error"]>;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        text: string;
        seq: number;
        timestamp: string;
        iteration: number | null;
        source: "loop" | "worker" | "verifier" | "verify-check";
        level: "error" | "info";
    }, {
        text: string;
        seq: number;
        timestamp: string;
        iteration: number | null;
        source: "loop" | "worker" | "verifier" | "verify-check";
        level: "error" | "info";
    }>, "many">;
    nextLogSeq: z.ZodNumber;
    activeIteration: z.ZodNullable<z.ZodNumber>;
    activeWorkerAgentId: z.ZodNullable<z.ZodString>;
    activeVerifierAgentId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string | null;
    status: "running" | "failed" | "succeeded" | "stopped";
    cwd: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    provider: string;
    model: string | null;
    startedAt: string;
    prompt: string;
    completedAt: string | null;
    verifyChecks: string[];
    verifyPrompt: string | null;
    workerProvider: string | null;
    workerModel: string | null;
    verifierProvider: string | null;
    verifierModel: string | null;
    archive: boolean;
    sleepMs: number;
    maxIterations: number | null;
    maxTimeMs: number | null;
    stopRequestedAt: string | null;
    iterations: {
        status: "running" | "failed" | "succeeded" | "stopped";
        verifierAgentId: string | null;
        index: number;
        workerAgentId: string | null;
        workerStartedAt: string;
        workerCompletedAt: string | null;
        workerOutcome: "completed" | "failed" | "canceled" | null;
        failureReason: string | null;
        verifyChecks: {
            startedAt: string;
            command: string;
            exitCode: number;
            passed: boolean;
            stdout: string;
            stderr: string;
            completedAt: string;
        }[];
        verifyPrompt: {
            reason: string;
            startedAt: string;
            passed: boolean;
            completedAt: string;
            verifierAgentId: string | null;
        } | null;
    }[];
    logs: {
        text: string;
        seq: number;
        timestamp: string;
        iteration: number | null;
        source: "loop" | "worker" | "verifier" | "verify-check";
        level: "error" | "info";
    }[];
    nextLogSeq: number;
    activeIteration: number | null;
    activeWorkerAgentId: string | null;
    activeVerifierAgentId: string | null;
}, {
    name: string | null;
    status: "running" | "failed" | "succeeded" | "stopped";
    cwd: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    provider: string;
    model: string | null;
    startedAt: string;
    prompt: string;
    completedAt: string | null;
    verifyChecks: string[];
    verifyPrompt: string | null;
    workerProvider: string | null;
    workerModel: string | null;
    verifierProvider: string | null;
    verifierModel: string | null;
    archive: boolean;
    sleepMs: number;
    maxIterations: number | null;
    maxTimeMs: number | null;
    stopRequestedAt: string | null;
    iterations: {
        status: "running" | "failed" | "succeeded" | "stopped";
        verifierAgentId: string | null;
        index: number;
        workerAgentId: string | null;
        workerStartedAt: string;
        workerCompletedAt: string | null;
        workerOutcome: "completed" | "failed" | "canceled" | null;
        failureReason: string | null;
        verifyChecks: {
            startedAt: string;
            command: string;
            exitCode: number;
            passed: boolean;
            stdout: string;
            stderr: string;
            completedAt: string;
        }[];
        verifyPrompt: {
            reason: string;
            startedAt: string;
            passed: boolean;
            completedAt: string;
            verifierAgentId: string | null;
        } | null;
    }[];
    logs: {
        text: string;
        seq: number;
        timestamp: string;
        iteration: number | null;
        source: "loop" | "worker" | "verifier" | "verify-check";
        level: "error" | "info";
    }[];
    nextLogSeq: number;
    activeIteration: number | null;
    activeWorkerAgentId: string | null;
    activeVerifierAgentId: string | null;
}>;
export declare const LoopListItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
    cwd: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    activeIteration: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string | null;
    status: "running" | "failed" | "succeeded" | "stopped";
    cwd: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    activeIteration: number | null;
}, {
    name: string | null;
    status: "running" | "failed" | "succeeded" | "stopped";
    cwd: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    activeIteration: number | null;
}>;
export declare const LoopRunRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/run">;
    requestId: z.ZodString;
    prompt: z.ZodString;
    cwd: z.ZodString;
    provider: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    workerProvider: z.ZodOptional<z.ZodString>;
    workerModel: z.ZodOptional<z.ZodString>;
    verifierProvider: z.ZodOptional<z.ZodString>;
    verifierModel: z.ZodOptional<z.ZodString>;
    verifyPrompt: z.ZodOptional<z.ZodString>;
    verifyChecks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    archive: z.ZodOptional<z.ZodBoolean>;
    name: z.ZodOptional<z.ZodString>;
    sleepMs: z.ZodOptional<z.ZodNumber>;
    maxIterations: z.ZodOptional<z.ZodNumber>;
    maxTimeMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "loop/run";
    cwd: string;
    requestId: string;
    prompt: string;
    name?: string | undefined;
    provider?: string | undefined;
    model?: string | undefined;
    verifyChecks?: string[] | undefined;
    verifyPrompt?: string | undefined;
    workerProvider?: string | undefined;
    workerModel?: string | undefined;
    verifierProvider?: string | undefined;
    verifierModel?: string | undefined;
    archive?: boolean | undefined;
    sleepMs?: number | undefined;
    maxIterations?: number | undefined;
    maxTimeMs?: number | undefined;
}, {
    type: "loop/run";
    cwd: string;
    requestId: string;
    prompt: string;
    name?: string | undefined;
    provider?: string | undefined;
    model?: string | undefined;
    verifyChecks?: string[] | undefined;
    verifyPrompt?: string | undefined;
    workerProvider?: string | undefined;
    workerModel?: string | undefined;
    verifierProvider?: string | undefined;
    verifierModel?: string | undefined;
    archive?: boolean | undefined;
    sleepMs?: number | undefined;
    maxIterations?: number | undefined;
    maxTimeMs?: number | undefined;
}>;
export declare const LoopListRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/list">;
    requestId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "loop/list";
    requestId: string;
}, {
    type: "loop/list";
    requestId: string;
}>;
export declare const LoopInspectRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/inspect">;
    requestId: z.ZodString;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "loop/inspect";
    id: string;
    requestId: string;
}, {
    type: "loop/inspect";
    id: string;
    requestId: string;
}>;
export declare const LoopLogsRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/logs">;
    requestId: z.ZodString;
    id: z.ZodString;
    afterSeq: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "loop/logs";
    id: string;
    requestId: string;
    afterSeq?: number | undefined;
}, {
    type: "loop/logs";
    id: string;
    requestId: string;
    afterSeq?: number | undefined;
}>;
export declare const LoopStopRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/stop">;
    requestId: z.ZodString;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "loop/stop";
    id: string;
    requestId: string;
}, {
    type: "loop/stop";
    id: string;
    requestId: string;
}>;
export declare const LoopRunResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/run/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        loop: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
            prompt: z.ZodString;
            cwd: z.ZodString;
            provider: z.ZodString;
            model: z.ZodNullable<z.ZodString>;
            workerProvider: z.ZodNullable<z.ZodString>;
            workerModel: z.ZodNullable<z.ZodString>;
            verifierProvider: z.ZodNullable<z.ZodString>;
            verifierModel: z.ZodNullable<z.ZodString>;
            verifyPrompt: z.ZodNullable<z.ZodString>;
            verifyChecks: z.ZodArray<z.ZodString, "many">;
            archive: z.ZodBoolean;
            sleepMs: z.ZodNumber;
            maxIterations: z.ZodNullable<z.ZodNumber>;
            maxTimeMs: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            startedAt: z.ZodString;
            completedAt: z.ZodNullable<z.ZodString>;
            stopRequestedAt: z.ZodNullable<z.ZodString>;
            iterations: z.ZodArray<z.ZodObject<{
                index: z.ZodNumber;
                workerAgentId: z.ZodNullable<z.ZodString>;
                workerStartedAt: z.ZodString;
                workerCompletedAt: z.ZodNullable<z.ZodString>;
                verifierAgentId: z.ZodNullable<z.ZodString>;
                status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
                workerOutcome: z.ZodNullable<z.ZodEnum<["completed", "failed", "canceled"]>>;
                failureReason: z.ZodNullable<z.ZodString>;
                verifyChecks: z.ZodArray<z.ZodObject<{
                    command: z.ZodString;
                    exitCode: z.ZodNumber;
                    passed: z.ZodBoolean;
                    stdout: z.ZodString;
                    stderr: z.ZodString;
                    startedAt: z.ZodString;
                    completedAt: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }, {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }>, "many">;
                verifyPrompt: z.ZodNullable<z.ZodObject<{
                    passed: z.ZodBoolean;
                    reason: z.ZodString;
                    verifierAgentId: z.ZodNullable<z.ZodString>;
                    startedAt: z.ZodString;
                    completedAt: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                }, {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                }>>;
            }, "strip", z.ZodTypeAny, {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }, {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }>, "many">;
            logs: z.ZodArray<z.ZodObject<{
                seq: z.ZodNumber;
                timestamp: z.ZodString;
                iteration: z.ZodNullable<z.ZodNumber>;
                source: z.ZodEnum<["loop", "worker", "verifier", "verify-check"]>;
                level: z.ZodEnum<["info", "error"]>;
                text: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }, {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }>, "many">;
            nextLogSeq: z.ZodNumber;
            activeIteration: z.ZodNullable<z.ZodNumber>;
            activeWorkerAgentId: z.ZodNullable<z.ZodString>;
            activeVerifierAgentId: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        }, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    }, {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "loop/run/response";
    payload: {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    };
}, {
    type: "loop/run/response";
    payload: {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    };
}>;
export declare const LoopListResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/list/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        loops: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
            cwd: z.ZodString;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            activeIteration: z.ZodNullable<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            activeIteration: number | null;
        }, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            activeIteration: number | null;
        }>, "many">;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        loops: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            activeIteration: number | null;
        }[];
    }, {
        error: string | null;
        requestId: string;
        loops: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            activeIteration: number | null;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    type: "loop/list/response";
    payload: {
        error: string | null;
        requestId: string;
        loops: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            activeIteration: number | null;
        }[];
    };
}, {
    type: "loop/list/response";
    payload: {
        error: string | null;
        requestId: string;
        loops: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            activeIteration: number | null;
        }[];
    };
}>;
export declare const LoopInspectResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/inspect/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        loop: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
            prompt: z.ZodString;
            cwd: z.ZodString;
            provider: z.ZodString;
            model: z.ZodNullable<z.ZodString>;
            workerProvider: z.ZodNullable<z.ZodString>;
            workerModel: z.ZodNullable<z.ZodString>;
            verifierProvider: z.ZodNullable<z.ZodString>;
            verifierModel: z.ZodNullable<z.ZodString>;
            verifyPrompt: z.ZodNullable<z.ZodString>;
            verifyChecks: z.ZodArray<z.ZodString, "many">;
            archive: z.ZodBoolean;
            sleepMs: z.ZodNumber;
            maxIterations: z.ZodNullable<z.ZodNumber>;
            maxTimeMs: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            startedAt: z.ZodString;
            completedAt: z.ZodNullable<z.ZodString>;
            stopRequestedAt: z.ZodNullable<z.ZodString>;
            iterations: z.ZodArray<z.ZodObject<{
                index: z.ZodNumber;
                workerAgentId: z.ZodNullable<z.ZodString>;
                workerStartedAt: z.ZodString;
                workerCompletedAt: z.ZodNullable<z.ZodString>;
                verifierAgentId: z.ZodNullable<z.ZodString>;
                status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
                workerOutcome: z.ZodNullable<z.ZodEnum<["completed", "failed", "canceled"]>>;
                failureReason: z.ZodNullable<z.ZodString>;
                verifyChecks: z.ZodArray<z.ZodObject<{
                    command: z.ZodString;
                    exitCode: z.ZodNumber;
                    passed: z.ZodBoolean;
                    stdout: z.ZodString;
                    stderr: z.ZodString;
                    startedAt: z.ZodString;
                    completedAt: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }, {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }>, "many">;
                verifyPrompt: z.ZodNullable<z.ZodObject<{
                    passed: z.ZodBoolean;
                    reason: z.ZodString;
                    verifierAgentId: z.ZodNullable<z.ZodString>;
                    startedAt: z.ZodString;
                    completedAt: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                }, {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                }>>;
            }, "strip", z.ZodTypeAny, {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }, {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }>, "many">;
            logs: z.ZodArray<z.ZodObject<{
                seq: z.ZodNumber;
                timestamp: z.ZodString;
                iteration: z.ZodNullable<z.ZodNumber>;
                source: z.ZodEnum<["loop", "worker", "verifier", "verify-check"]>;
                level: z.ZodEnum<["info", "error"]>;
                text: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }, {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }>, "many">;
            nextLogSeq: z.ZodNumber;
            activeIteration: z.ZodNullable<z.ZodNumber>;
            activeWorkerAgentId: z.ZodNullable<z.ZodString>;
            activeVerifierAgentId: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        }, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    }, {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "loop/inspect/response";
    payload: {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    };
}, {
    type: "loop/inspect/response";
    payload: {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    };
}>;
export declare const LoopLogsResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/logs/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        loop: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
            prompt: z.ZodString;
            cwd: z.ZodString;
            provider: z.ZodString;
            model: z.ZodNullable<z.ZodString>;
            workerProvider: z.ZodNullable<z.ZodString>;
            workerModel: z.ZodNullable<z.ZodString>;
            verifierProvider: z.ZodNullable<z.ZodString>;
            verifierModel: z.ZodNullable<z.ZodString>;
            verifyPrompt: z.ZodNullable<z.ZodString>;
            verifyChecks: z.ZodArray<z.ZodString, "many">;
            archive: z.ZodBoolean;
            sleepMs: z.ZodNumber;
            maxIterations: z.ZodNullable<z.ZodNumber>;
            maxTimeMs: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            startedAt: z.ZodString;
            completedAt: z.ZodNullable<z.ZodString>;
            stopRequestedAt: z.ZodNullable<z.ZodString>;
            iterations: z.ZodArray<z.ZodObject<{
                index: z.ZodNumber;
                workerAgentId: z.ZodNullable<z.ZodString>;
                workerStartedAt: z.ZodString;
                workerCompletedAt: z.ZodNullable<z.ZodString>;
                verifierAgentId: z.ZodNullable<z.ZodString>;
                status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
                workerOutcome: z.ZodNullable<z.ZodEnum<["completed", "failed", "canceled"]>>;
                failureReason: z.ZodNullable<z.ZodString>;
                verifyChecks: z.ZodArray<z.ZodObject<{
                    command: z.ZodString;
                    exitCode: z.ZodNumber;
                    passed: z.ZodBoolean;
                    stdout: z.ZodString;
                    stderr: z.ZodString;
                    startedAt: z.ZodString;
                    completedAt: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }, {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }>, "many">;
                verifyPrompt: z.ZodNullable<z.ZodObject<{
                    passed: z.ZodBoolean;
                    reason: z.ZodString;
                    verifierAgentId: z.ZodNullable<z.ZodString>;
                    startedAt: z.ZodString;
                    completedAt: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                }, {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                }>>;
            }, "strip", z.ZodTypeAny, {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }, {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }>, "many">;
            logs: z.ZodArray<z.ZodObject<{
                seq: z.ZodNumber;
                timestamp: z.ZodString;
                iteration: z.ZodNullable<z.ZodNumber>;
                source: z.ZodEnum<["loop", "worker", "verifier", "verify-check"]>;
                level: z.ZodEnum<["info", "error"]>;
                text: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }, {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }>, "many">;
            nextLogSeq: z.ZodNumber;
            activeIteration: z.ZodNullable<z.ZodNumber>;
            activeWorkerAgentId: z.ZodNullable<z.ZodString>;
            activeVerifierAgentId: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        }, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        }>>;
        entries: z.ZodArray<z.ZodObject<{
            seq: z.ZodNumber;
            timestamp: z.ZodString;
            iteration: z.ZodNullable<z.ZodNumber>;
            source: z.ZodEnum<["loop", "worker", "verifier", "verify-check"]>;
            level: z.ZodEnum<["info", "error"]>;
            text: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
            seq: number;
            timestamp: string;
            iteration: number | null;
            source: "loop" | "worker" | "verifier" | "verify-check";
            level: "error" | "info";
        }, {
            text: string;
            seq: number;
            timestamp: string;
            iteration: number | null;
            source: "loop" | "worker" | "verifier" | "verify-check";
            level: "error" | "info";
        }>, "many">;
        nextCursor: z.ZodNumber;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        entries: {
            text: string;
            seq: number;
            timestamp: string;
            iteration: number | null;
            source: "loop" | "worker" | "verifier" | "verify-check";
            level: "error" | "info";
        }[];
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
        nextCursor: number;
    }, {
        error: string | null;
        entries: {
            text: string;
            seq: number;
            timestamp: string;
            iteration: number | null;
            source: "loop" | "worker" | "verifier" | "verify-check";
            level: "error" | "info";
        }[];
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
        nextCursor: number;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "loop/logs/response";
    payload: {
        error: string | null;
        entries: {
            text: string;
            seq: number;
            timestamp: string;
            iteration: number | null;
            source: "loop" | "worker" | "verifier" | "verify-check";
            level: "error" | "info";
        }[];
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
        nextCursor: number;
    };
}, {
    type: "loop/logs/response";
    payload: {
        error: string | null;
        entries: {
            text: string;
            seq: number;
            timestamp: string;
            iteration: number | null;
            source: "loop" | "worker" | "verifier" | "verify-check";
            level: "error" | "info";
        }[];
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
        nextCursor: number;
    };
}>;
export declare const LoopStopResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"loop/stop/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        loop: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
            prompt: z.ZodString;
            cwd: z.ZodString;
            provider: z.ZodString;
            model: z.ZodNullable<z.ZodString>;
            workerProvider: z.ZodNullable<z.ZodString>;
            workerModel: z.ZodNullable<z.ZodString>;
            verifierProvider: z.ZodNullable<z.ZodString>;
            verifierModel: z.ZodNullable<z.ZodString>;
            verifyPrompt: z.ZodNullable<z.ZodString>;
            verifyChecks: z.ZodArray<z.ZodString, "many">;
            archive: z.ZodBoolean;
            sleepMs: z.ZodNumber;
            maxIterations: z.ZodNullable<z.ZodNumber>;
            maxTimeMs: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            startedAt: z.ZodString;
            completedAt: z.ZodNullable<z.ZodString>;
            stopRequestedAt: z.ZodNullable<z.ZodString>;
            iterations: z.ZodArray<z.ZodObject<{
                index: z.ZodNumber;
                workerAgentId: z.ZodNullable<z.ZodString>;
                workerStartedAt: z.ZodString;
                workerCompletedAt: z.ZodNullable<z.ZodString>;
                verifierAgentId: z.ZodNullable<z.ZodString>;
                status: z.ZodEnum<["running", "succeeded", "failed", "stopped"]>;
                workerOutcome: z.ZodNullable<z.ZodEnum<["completed", "failed", "canceled"]>>;
                failureReason: z.ZodNullable<z.ZodString>;
                verifyChecks: z.ZodArray<z.ZodObject<{
                    command: z.ZodString;
                    exitCode: z.ZodNumber;
                    passed: z.ZodBoolean;
                    stdout: z.ZodString;
                    stderr: z.ZodString;
                    startedAt: z.ZodString;
                    completedAt: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }, {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }>, "many">;
                verifyPrompt: z.ZodNullable<z.ZodObject<{
                    passed: z.ZodBoolean;
                    reason: z.ZodString;
                    verifierAgentId: z.ZodNullable<z.ZodString>;
                    startedAt: z.ZodString;
                    completedAt: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                }, {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                }>>;
            }, "strip", z.ZodTypeAny, {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }, {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }>, "many">;
            logs: z.ZodArray<z.ZodObject<{
                seq: z.ZodNumber;
                timestamp: z.ZodString;
                iteration: z.ZodNullable<z.ZodNumber>;
                source: z.ZodEnum<["loop", "worker", "verifier", "verify-check"]>;
                level: z.ZodEnum<["info", "error"]>;
                text: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }, {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }>, "many">;
            nextLogSeq: z.ZodNumber;
            activeIteration: z.ZodNullable<z.ZodNumber>;
            activeWorkerAgentId: z.ZodNullable<z.ZodString>;
            activeVerifierAgentId: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        }, {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    }, {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "loop/stop/response";
    payload: {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    };
}, {
    type: "loop/stop/response";
    payload: {
        error: string | null;
        requestId: string;
        loop: {
            name: string | null;
            status: "running" | "failed" | "succeeded" | "stopped";
            cwd: string;
            id: string;
            createdAt: string;
            updatedAt: string;
            provider: string;
            model: string | null;
            startedAt: string;
            prompt: string;
            completedAt: string | null;
            verifyChecks: string[];
            verifyPrompt: string | null;
            workerProvider: string | null;
            workerModel: string | null;
            verifierProvider: string | null;
            verifierModel: string | null;
            archive: boolean;
            sleepMs: number;
            maxIterations: number | null;
            maxTimeMs: number | null;
            stopRequestedAt: string | null;
            iterations: {
                status: "running" | "failed" | "succeeded" | "stopped";
                verifierAgentId: string | null;
                index: number;
                workerAgentId: string | null;
                workerStartedAt: string;
                workerCompletedAt: string | null;
                workerOutcome: "completed" | "failed" | "canceled" | null;
                failureReason: string | null;
                verifyChecks: {
                    startedAt: string;
                    command: string;
                    exitCode: number;
                    passed: boolean;
                    stdout: string;
                    stderr: string;
                    completedAt: string;
                }[];
                verifyPrompt: {
                    reason: string;
                    startedAt: string;
                    passed: boolean;
                    completedAt: string;
                    verifierAgentId: string | null;
                } | null;
            }[];
            logs: {
                text: string;
                seq: number;
                timestamp: string;
                iteration: number | null;
                source: "loop" | "worker" | "verifier" | "verify-check";
                level: "error" | "info";
            }[];
            nextLogSeq: number;
            activeIteration: number | null;
            activeWorkerAgentId: string | null;
            activeVerifierAgentId: string | null;
        } | null;
    };
}>;
export type LoopLogEntry = z.infer<typeof LoopLogEntrySchema>;
export type LoopVerifyCheckResult = z.infer<typeof LoopVerifyCheckResultSchema>;
export type LoopVerifyPromptResult = z.infer<typeof LoopVerifyPromptResultSchema>;
export type LoopIterationRecord = z.infer<typeof LoopIterationRecordSchema>;
export type LoopRecord = z.infer<typeof LoopRecordSchema>;
export type LoopListItem = z.infer<typeof LoopListItemSchema>;
export type LoopRunRequest = z.infer<typeof LoopRunRequestSchema>;
export type LoopListRequest = z.infer<typeof LoopListRequestSchema>;
export type LoopInspectRequest = z.infer<typeof LoopInspectRequestSchema>;
export type LoopLogsRequest = z.infer<typeof LoopLogsRequestSchema>;
export type LoopStopRequest = z.infer<typeof LoopStopRequestSchema>;
export type LoopRunResponse = z.infer<typeof LoopRunResponseSchema>;
export type LoopListResponse = z.infer<typeof LoopListResponseSchema>;
export type LoopInspectResponse = z.infer<typeof LoopInspectResponseSchema>;
export type LoopLogsResponse = z.infer<typeof LoopLogsResponseSchema>;
export type LoopStopResponse = z.infer<typeof LoopStopResponseSchema>;
//# sourceMappingURL=rpc-schemas.d.ts.map