import { z } from "zod";
export declare const ScheduleStatusSchema: z.ZodEnum<["active", "paused", "completed"]>;
export type ScheduleStatus = z.infer<typeof ScheduleStatusSchema>;
export declare const ScheduleCadenceSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"every">;
    everyMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "every";
    everyMs: number;
}, {
    type: "every";
    everyMs: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"cron">;
    expression: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "cron";
    expression: string;
}, {
    type: "cron";
    expression: string;
}>]>;
export type ScheduleCadence = z.infer<typeof ScheduleCadenceSchema>;
export declare const ScheduleTargetSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"agent">;
    agentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agentId: string;
    type: "agent";
}, {
    agentId: string;
    type: "agent";
}>, z.ZodObject<{
    type: z.ZodLiteral<"new-agent">;
    config: z.ZodObject<{
        provider: z.ZodString;
        cwd: z.ZodString;
        modeId: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        thinkingOptionId: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        approvalPolicy: z.ZodOptional<z.ZodString>;
        sandboxMode: z.ZodOptional<z.ZodString>;
        networkAccess: z.ZodOptional<z.ZodBoolean>;
        webSearch: z.ZodOptional<z.ZodBoolean>;
        extra: z.ZodOptional<z.ZodObject<{
            codex: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            claude: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        }, "strip", z.ZodTypeAny, {
            claude?: Record<string, unknown> | undefined;
            codex?: Record<string, unknown> | undefined;
        }, {
            claude?: Record<string, unknown> | undefined;
            codex?: Record<string, unknown> | undefined;
        }>>;
        systemPrompt: z.ZodOptional<z.ZodString>;
        mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        cwd: string;
        provider: string;
        title?: string | null | undefined;
        modeId?: string | undefined;
        model?: string | undefined;
        thinkingOptionId?: string | undefined;
        approvalPolicy?: string | undefined;
        sandboxMode?: string | undefined;
        networkAccess?: boolean | undefined;
        webSearch?: boolean | undefined;
        extra?: {
            claude?: Record<string, unknown> | undefined;
            codex?: Record<string, unknown> | undefined;
        } | undefined;
        systemPrompt?: string | undefined;
        mcpServers?: Record<string, unknown> | undefined;
    }, {
        cwd: string;
        provider: string;
        title?: string | null | undefined;
        modeId?: string | undefined;
        model?: string | undefined;
        thinkingOptionId?: string | undefined;
        approvalPolicy?: string | undefined;
        sandboxMode?: string | undefined;
        networkAccess?: boolean | undefined;
        webSearch?: boolean | undefined;
        extra?: {
            claude?: Record<string, unknown> | undefined;
            codex?: Record<string, unknown> | undefined;
        } | undefined;
        systemPrompt?: string | undefined;
        mcpServers?: Record<string, unknown> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "new-agent";
    config: {
        cwd: string;
        provider: string;
        title?: string | null | undefined;
        modeId?: string | undefined;
        model?: string | undefined;
        thinkingOptionId?: string | undefined;
        approvalPolicy?: string | undefined;
        sandboxMode?: string | undefined;
        networkAccess?: boolean | undefined;
        webSearch?: boolean | undefined;
        extra?: {
            claude?: Record<string, unknown> | undefined;
            codex?: Record<string, unknown> | undefined;
        } | undefined;
        systemPrompt?: string | undefined;
        mcpServers?: Record<string, unknown> | undefined;
    };
}, {
    type: "new-agent";
    config: {
        cwd: string;
        provider: string;
        title?: string | null | undefined;
        modeId?: string | undefined;
        model?: string | undefined;
        thinkingOptionId?: string | undefined;
        approvalPolicy?: string | undefined;
        sandboxMode?: string | undefined;
        networkAccess?: boolean | undefined;
        webSearch?: boolean | undefined;
        extra?: {
            claude?: Record<string, unknown> | undefined;
            codex?: Record<string, unknown> | undefined;
        } | undefined;
        systemPrompt?: string | undefined;
        mcpServers?: Record<string, unknown> | undefined;
    };
}>]>;
export type ScheduleTarget = z.infer<typeof ScheduleTargetSchema>;
export declare const ScheduleRunSchema: z.ZodObject<{
    id: z.ZodString;
    scheduledFor: z.ZodString;
    startedAt: z.ZodString;
    endedAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["running", "succeeded", "failed"]>;
    agentId: z.ZodNullable<z.ZodString>;
    output: z.ZodNullable<z.ZodString>;
    error: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error: string | null;
    agentId: string | null;
    status: "running" | "failed" | "succeeded";
    id: string;
    scheduledFor: string;
    startedAt: string;
    endedAt: string | null;
    output: string | null;
}, {
    error: string | null;
    agentId: string | null;
    status: "running" | "failed" | "succeeded";
    id: string;
    scheduledFor: string;
    startedAt: string;
    endedAt: string | null;
    output: string | null;
}>;
export type ScheduleRun = z.infer<typeof ScheduleRunSchema>;
export declare const StoredScheduleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    prompt: z.ZodString;
    cadence: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"every">;
        everyMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "every";
        everyMs: number;
    }, {
        type: "every";
        everyMs: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"cron">;
        expression: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "cron";
        expression: string;
    }, {
        type: "cron";
        expression: string;
    }>]>;
    target: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"agent">;
        agentId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        agentId: string;
        type: "agent";
    }, {
        agentId: string;
        type: "agent";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"new-agent">;
        config: z.ZodObject<{
            provider: z.ZodString;
            cwd: z.ZodString;
            modeId: z.ZodOptional<z.ZodString>;
            model: z.ZodOptional<z.ZodString>;
            thinkingOptionId: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            approvalPolicy: z.ZodOptional<z.ZodString>;
            sandboxMode: z.ZodOptional<z.ZodString>;
            networkAccess: z.ZodOptional<z.ZodBoolean>;
            webSearch: z.ZodOptional<z.ZodBoolean>;
            extra: z.ZodOptional<z.ZodObject<{
                codex: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
                claude: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            }, "strip", z.ZodTypeAny, {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            }, {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            }>>;
            systemPrompt: z.ZodOptional<z.ZodString>;
            mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        }, {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "new-agent";
        config: {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        };
    }, {
        type: "new-agent";
        config: {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        };
    }>]>;
    status: z.ZodEnum<["active", "paused", "completed"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    nextRunAt: z.ZodNullable<z.ZodString>;
    lastRunAt: z.ZodNullable<z.ZodString>;
    pausedAt: z.ZodNullable<z.ZodString>;
    expiresAt: z.ZodNullable<z.ZodString>;
    maxRuns: z.ZodNullable<z.ZodNumber>;
    runs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        scheduledFor: z.ZodString;
        startedAt: z.ZodString;
        endedAt: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<["running", "succeeded", "failed"]>;
        agentId: z.ZodNullable<z.ZodString>;
        output: z.ZodNullable<z.ZodString>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        agentId: string | null;
        status: "running" | "failed" | "succeeded";
        id: string;
        scheduledFor: string;
        startedAt: string;
        endedAt: string | null;
        output: string | null;
    }, {
        error: string | null;
        agentId: string | null;
        status: "running" | "failed" | "succeeded";
        id: string;
        scheduledFor: string;
        startedAt: string;
        endedAt: string | null;
        output: string | null;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string | null;
    status: "completed" | "active" | "paused";
    id: string;
    createdAt: string;
    updatedAt: string;
    prompt: string;
    cadence: {
        type: "every";
        everyMs: number;
    } | {
        type: "cron";
        expression: string;
    };
    target: {
        agentId: string;
        type: "agent";
    } | {
        type: "new-agent";
        config: {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        };
    };
    nextRunAt: string | null;
    lastRunAt: string | null;
    pausedAt: string | null;
    expiresAt: string | null;
    maxRuns: number | null;
    runs: {
        error: string | null;
        agentId: string | null;
        status: "running" | "failed" | "succeeded";
        id: string;
        scheduledFor: string;
        startedAt: string;
        endedAt: string | null;
        output: string | null;
    }[];
}, {
    name: string | null;
    status: "completed" | "active" | "paused";
    id: string;
    createdAt: string;
    updatedAt: string;
    prompt: string;
    cadence: {
        type: "every";
        everyMs: number;
    } | {
        type: "cron";
        expression: string;
    };
    target: {
        agentId: string;
        type: "agent";
    } | {
        type: "new-agent";
        config: {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        };
    };
    nextRunAt: string | null;
    lastRunAt: string | null;
    pausedAt: string | null;
    expiresAt: string | null;
    maxRuns: number | null;
    runs: {
        error: string | null;
        agentId: string | null;
        status: "running" | "failed" | "succeeded";
        id: string;
        scheduledFor: string;
        startedAt: string;
        endedAt: string | null;
        output: string | null;
    }[];
}>;
export type StoredSchedule = z.infer<typeof StoredScheduleSchema>;
export declare const ScheduleSummarySchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    prompt: z.ZodString;
    cadence: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"every">;
        everyMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "every";
        everyMs: number;
    }, {
        type: "every";
        everyMs: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"cron">;
        expression: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "cron";
        expression: string;
    }, {
        type: "cron";
        expression: string;
    }>]>;
    target: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"agent">;
        agentId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        agentId: string;
        type: "agent";
    }, {
        agentId: string;
        type: "agent";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"new-agent">;
        config: z.ZodObject<{
            provider: z.ZodString;
            cwd: z.ZodString;
            modeId: z.ZodOptional<z.ZodString>;
            model: z.ZodOptional<z.ZodString>;
            thinkingOptionId: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            approvalPolicy: z.ZodOptional<z.ZodString>;
            sandboxMode: z.ZodOptional<z.ZodString>;
            networkAccess: z.ZodOptional<z.ZodBoolean>;
            webSearch: z.ZodOptional<z.ZodBoolean>;
            extra: z.ZodOptional<z.ZodObject<{
                codex: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
                claude: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
            }, "strip", z.ZodTypeAny, {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            }, {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            }>>;
            systemPrompt: z.ZodOptional<z.ZodString>;
            mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        }, {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "new-agent";
        config: {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        };
    }, {
        type: "new-agent";
        config: {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        };
    }>]>;
    status: z.ZodEnum<["active", "paused", "completed"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    nextRunAt: z.ZodNullable<z.ZodString>;
    lastRunAt: z.ZodNullable<z.ZodString>;
    pausedAt: z.ZodNullable<z.ZodString>;
    expiresAt: z.ZodNullable<z.ZodString>;
    maxRuns: z.ZodNullable<z.ZodNumber>;
    runs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        scheduledFor: z.ZodString;
        startedAt: z.ZodString;
        endedAt: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<["running", "succeeded", "failed"]>;
        agentId: z.ZodNullable<z.ZodString>;
        output: z.ZodNullable<z.ZodString>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        agentId: string | null;
        status: "running" | "failed" | "succeeded";
        id: string;
        scheduledFor: string;
        startedAt: string;
        endedAt: string | null;
        output: string | null;
    }, {
        error: string | null;
        agentId: string | null;
        status: "running" | "failed" | "succeeded";
        id: string;
        scheduledFor: string;
        startedAt: string;
        endedAt: string | null;
        output: string | null;
    }>, "many">;
}, "runs">, "strip", z.ZodTypeAny, {
    name: string | null;
    status: "completed" | "active" | "paused";
    id: string;
    createdAt: string;
    updatedAt: string;
    prompt: string;
    cadence: {
        type: "every";
        everyMs: number;
    } | {
        type: "cron";
        expression: string;
    };
    target: {
        agentId: string;
        type: "agent";
    } | {
        type: "new-agent";
        config: {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        };
    };
    nextRunAt: string | null;
    lastRunAt: string | null;
    pausedAt: string | null;
    expiresAt: string | null;
    maxRuns: number | null;
}, {
    name: string | null;
    status: "completed" | "active" | "paused";
    id: string;
    createdAt: string;
    updatedAt: string;
    prompt: string;
    cadence: {
        type: "every";
        everyMs: number;
    } | {
        type: "cron";
        expression: string;
    };
    target: {
        agentId: string;
        type: "agent";
    } | {
        type: "new-agent";
        config: {
            cwd: string;
            provider: string;
            title?: string | null | undefined;
            modeId?: string | undefined;
            model?: string | undefined;
            thinkingOptionId?: string | undefined;
            approvalPolicy?: string | undefined;
            sandboxMode?: string | undefined;
            networkAccess?: boolean | undefined;
            webSearch?: boolean | undefined;
            extra?: {
                claude?: Record<string, unknown> | undefined;
                codex?: Record<string, unknown> | undefined;
            } | undefined;
            systemPrompt?: string | undefined;
            mcpServers?: Record<string, unknown> | undefined;
        };
    };
    nextRunAt: string | null;
    lastRunAt: string | null;
    pausedAt: string | null;
    expiresAt: string | null;
    maxRuns: number | null;
}>;
export type ScheduleSummary = z.infer<typeof ScheduleSummarySchema>;
export interface CreateScheduleInput {
    name?: string | null;
    prompt: string;
    cadence: ScheduleCadence;
    target: ScheduleTarget;
    maxRuns?: number | null;
    expiresAt?: string | null;
}
export interface ScheduleExecutionResult {
    agentId: string | null;
    output: string | null;
}
//# sourceMappingURL=types.d.ts.map