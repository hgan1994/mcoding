import { z } from "zod";
export declare const ScheduleCreateRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/create">;
    requestId: z.ZodString;
    prompt: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
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
        type: z.ZodLiteral<"self">;
        agentId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        agentId: string;
        type: "self";
    }, {
        agentId: string;
        type: "self";
    }>, z.ZodObject<{
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
    maxRuns: z.ZodOptional<z.ZodNumber>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "schedule/create";
    requestId: string;
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
        type: "self";
    } | {
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
    name?: string | undefined;
    expiresAt?: string | undefined;
    maxRuns?: number | undefined;
}, {
    type: "schedule/create";
    requestId: string;
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
        type: "self";
    } | {
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
    name?: string | undefined;
    expiresAt?: string | undefined;
    maxRuns?: number | undefined;
}>;
export declare const ScheduleListRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/list">;
    requestId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "schedule/list";
    requestId: string;
}, {
    type: "schedule/list";
    requestId: string;
}>;
export declare const ScheduleInspectRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/inspect">;
    requestId: z.ZodString;
    scheduleId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "schedule/inspect";
    requestId: string;
    scheduleId: string;
}, {
    type: "schedule/inspect";
    requestId: string;
    scheduleId: string;
}>;
export declare const ScheduleLogsRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/logs">;
    requestId: z.ZodString;
    scheduleId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "schedule/logs";
    requestId: string;
    scheduleId: string;
}, {
    type: "schedule/logs";
    requestId: string;
    scheduleId: string;
}>;
export declare const SchedulePauseRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/pause">;
    requestId: z.ZodString;
    scheduleId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "schedule/pause";
    requestId: string;
    scheduleId: string;
}, {
    type: "schedule/pause";
    requestId: string;
    scheduleId: string;
}>;
export declare const ScheduleResumeRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/resume">;
    requestId: z.ZodString;
    scheduleId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "schedule/resume";
    requestId: string;
    scheduleId: string;
}, {
    type: "schedule/resume";
    requestId: string;
    scheduleId: string;
}>;
export declare const ScheduleDeleteRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/delete">;
    requestId: z.ZodString;
    scheduleId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "schedule/delete";
    requestId: string;
    scheduleId: string;
}, {
    type: "schedule/delete";
    requestId: string;
    scheduleId: string;
}>;
export declare const ScheduleCreateResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/create/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        schedule: z.ZodNullable<z.ZodObject<Omit<{
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
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    }, {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "schedule/create/response";
    payload: {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    };
}, {
    type: "schedule/create/response";
    payload: {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    };
}>;
export declare const ScheduleListResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/list/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        schedules: z.ZodArray<z.ZodObject<Omit<{
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
        }>, "many">;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        schedules: {
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
        }[];
    }, {
        error: string | null;
        requestId: string;
        schedules: {
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
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    type: "schedule/list/response";
    payload: {
        error: string | null;
        requestId: string;
        schedules: {
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
        }[];
    };
}, {
    type: "schedule/list/response";
    payload: {
        error: string | null;
        requestId: string;
        schedules: {
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
        }[];
    };
}>;
export declare const ScheduleInspectResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/inspect/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        schedule: z.ZodNullable<z.ZodObject<{
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
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    }, {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "schedule/inspect/response";
    payload: {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    };
}, {
    type: "schedule/inspect/response";
    payload: {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    };
}>;
export declare const ScheduleLogsResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/logs/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
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
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
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
        error: string | null;
        requestId: string;
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
}, "strip", z.ZodTypeAny, {
    type: "schedule/logs/response";
    payload: {
        error: string | null;
        requestId: string;
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
    };
}, {
    type: "schedule/logs/response";
    payload: {
        error: string | null;
        requestId: string;
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
    };
}>;
export declare const SchedulePauseResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/pause/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        schedule: z.ZodNullable<z.ZodObject<Omit<{
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
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    }, {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "schedule/pause/response";
    payload: {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    };
}, {
    type: "schedule/pause/response";
    payload: {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    };
}>;
export declare const ScheduleResumeResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/resume/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        schedule: z.ZodNullable<z.ZodObject<Omit<{
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
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    }, {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "schedule/resume/response";
    payload: {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    };
}, {
    type: "schedule/resume/response";
    payload: {
        error: string | null;
        requestId: string;
        schedule: {
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
        } | null;
    };
}>;
export declare const ScheduleDeleteResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"schedule/delete/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        scheduleId: z.ZodString;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        scheduleId: string;
    }, {
        error: string | null;
        requestId: string;
        scheduleId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "schedule/delete/response";
    payload: {
        error: string | null;
        requestId: string;
        scheduleId: string;
    };
}, {
    type: "schedule/delete/response";
    payload: {
        error: string | null;
        requestId: string;
        scheduleId: string;
    };
}>;
//# sourceMappingURL=rpc-schemas.d.ts.map