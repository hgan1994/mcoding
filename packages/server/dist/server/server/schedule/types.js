import { z } from "zod";
import { AgentProviderSchema } from "../agent/provider-manifest.js";
export const ScheduleStatusSchema = z.enum(["active", "paused", "completed"]);
export const ScheduleCadenceSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("every"),
        everyMs: z.number().int().positive(),
    }),
    z.object({
        type: z.literal("cron"),
        expression: z.string().trim().min(1),
    }),
]);
export const ScheduleTargetSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("agent"),
        agentId: z.string().uuid(),
    }),
    z.object({
        type: z.literal("new-agent"),
        config: z.object({
            provider: AgentProviderSchema,
            cwd: z.string().trim().min(1),
            modeId: z.string().trim().min(1).optional(),
            model: z.string().trim().min(1).optional(),
            thinkingOptionId: z.string().trim().min(1).optional(),
            title: z.string().trim().min(1).nullable().optional(),
            approvalPolicy: z.string().trim().min(1).optional(),
            sandboxMode: z.string().trim().min(1).optional(),
            networkAccess: z.boolean().optional(),
            webSearch: z.boolean().optional(),
            extra: z
                .object({
                codex: z.record(z.unknown()).optional(),
                claude: z.record(z.unknown()).optional(),
            })
                .partial()
                .optional(),
            systemPrompt: z.string().optional(),
            mcpServers: z.record(z.unknown()).optional(),
        }),
    }),
]);
export const ScheduleRunSchema = z.object({
    id: z.string(),
    scheduledFor: z.string(),
    startedAt: z.string(),
    endedAt: z.string().nullable(),
    status: z.enum(["running", "succeeded", "failed"]),
    agentId: z.string().uuid().nullable(),
    output: z.string().nullable(),
    error: z.string().nullable(),
});
export const StoredScheduleSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    prompt: z.string().min(1),
    cadence: ScheduleCadenceSchema,
    target: ScheduleTargetSchema,
    status: ScheduleStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    nextRunAt: z.string().nullable(),
    lastRunAt: z.string().nullable(),
    pausedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    maxRuns: z.number().int().positive().nullable(),
    runs: z.array(ScheduleRunSchema),
});
export const ScheduleSummarySchema = StoredScheduleSchema.omit({
    runs: true,
});
//# sourceMappingURL=types.js.map