import { z } from "zod";
import { isSpeakToolName } from "../../tool-name-normalization.js";
import { deriveClaudeToolDetail } from "./tool-call-detail-parser.js";
const ClaudeToolCallStatusSchema = z.enum(["running", "completed", "failed", "canceled"]);
const ClaudeRawToolCallSchema = z
    .object({
    callId: z.string().optional().nullable(),
    name: z.string().min(1),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    error: z.unknown().nullable().optional(),
    status: ClaudeToolCallStatusSchema,
})
    .passthrough();
const ClaudeToolCallPass1Schema = ClaudeRawToolCallSchema.transform((raw) => ({
    callId: typeof raw.callId === "string" && raw.callId.trim().length > 0 ? raw.callId : null,
    name: raw.name.trim(),
    input: raw.input ?? null,
    output: raw.output ?? null,
    metadata: raw.metadata,
    error: raw.error ?? null,
    status: raw.status,
}));
const ClaudeShellToolNameSchema = z.union([
    z.literal("Bash"),
    z.literal("bash"),
    z.literal("shell"),
    z.literal("exec_command"),
]);
const ClaudeReadToolNameSchema = z.union([
    z.literal("Read"),
    z.literal("read"),
    z.literal("read_file"),
    z.literal("view_file"),
]);
const ClaudeWriteToolNameSchema = z.union([
    z.literal("Write"),
    z.literal("write"),
    z.literal("write_file"),
    z.literal("create_file"),
]);
const ClaudeEditToolNameSchema = z.union([
    z.literal("Edit"),
    z.literal("MultiEdit"),
    z.literal("multi_edit"),
    z.literal("edit"),
    z.literal("apply_patch"),
    z.literal("apply_diff"),
    z.literal("str_replace_editor"),
]);
const ClaudeSearchToolNameSchema = z.union([
    z.literal("WebSearch"),
    z.literal("web_search"),
    z.literal("search"),
    z.literal("Grep"),
    z.literal("grep"),
    z.literal("Glob"),
    z.literal("glob"),
]);
const ClaudeFetchToolNameSchema = z.union([
    z.literal("WebFetch"),
    z.literal("web_fetch"),
    z.literal("WebFetchTool"),
    z.literal("web_fetch_tool"),
    z.literal("webfetch"),
]);
const ClaudeSpeakToolNameSchema = z
    .string()
    .min(1)
    .refine((name) => isSpeakToolName(name.trim()));
const ClaudeToolKindSchema = z.enum([
    "shell",
    "read",
    "write",
    "edit",
    "search",
    "fetch",
    "speak",
    "unknown",
]);
const ClaudeToolCallPass2BaseSchema = z.object({
    callId: z.string().min(1),
    name: z.string().min(1),
    input: z.unknown().nullable(),
    output: z.unknown().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    error: z.unknown().nullable(),
    status: ClaudeToolCallStatusSchema,
    toolKind: ClaudeToolKindSchema,
});
const ClaudeToolCallPass2InputSchema = ClaudeToolCallPass2BaseSchema.omit({
    toolKind: true,
});
const ClaudeToolCallPass2EnvelopeSchema = z.union([
    ClaudeToolCallPass2InputSchema.extend({
        name: ClaudeShellToolNameSchema,
    }).transform((normalized) => ({
        ...normalized,
        name: normalized.name.trim(),
        toolKind: "shell",
    })),
    ClaudeToolCallPass2InputSchema.extend({
        name: ClaudeReadToolNameSchema,
    }).transform((normalized) => ({
        ...normalized,
        name: normalized.name.trim(),
        toolKind: "read",
    })),
    ClaudeToolCallPass2InputSchema.extend({
        name: ClaudeWriteToolNameSchema,
    }).transform((normalized) => ({
        ...normalized,
        name: normalized.name.trim(),
        toolKind: "write",
    })),
    ClaudeToolCallPass2InputSchema.extend({
        name: ClaudeEditToolNameSchema,
    }).transform((normalized) => ({
        ...normalized,
        name: normalized.name.trim(),
        toolKind: "edit",
    })),
    ClaudeToolCallPass2InputSchema.extend({
        name: ClaudeSearchToolNameSchema,
    }).transform((normalized) => ({
        ...normalized,
        name: normalized.name.trim(),
        toolKind: "search",
    })),
    ClaudeToolCallPass2InputSchema.extend({
        name: ClaudeFetchToolNameSchema,
    }).transform((normalized) => ({
        ...normalized,
        name: normalized.name.trim(),
        toolKind: "fetch",
    })),
    ClaudeToolCallPass2InputSchema.extend({
        name: ClaudeSpeakToolNameSchema,
    }).transform((normalized) => ({
        ...normalized,
        name: "speak",
        toolKind: "speak",
    })),
    ClaudeToolCallPass2InputSchema.transform((normalized) => ({
        ...normalized,
        name: normalized.name.trim(),
        toolKind: "unknown",
    })),
]);
const ClaudeToolCallPass2Schema = z.discriminatedUnion("toolKind", [
    ClaudeToolCallPass2BaseSchema.extend({
        toolKind: z.literal("shell"),
        name: ClaudeShellToolNameSchema,
    }),
    ClaudeToolCallPass2BaseSchema.extend({
        toolKind: z.literal("read"),
        name: ClaudeReadToolNameSchema,
    }),
    ClaudeToolCallPass2BaseSchema.extend({
        toolKind: z.literal("write"),
        name: ClaudeWriteToolNameSchema,
    }),
    ClaudeToolCallPass2BaseSchema.extend({
        toolKind: z.literal("edit"),
        name: ClaudeEditToolNameSchema,
    }),
    ClaudeToolCallPass2BaseSchema.extend({
        toolKind: z.literal("search"),
        name: ClaudeSearchToolNameSchema,
    }),
    ClaudeToolCallPass2BaseSchema.extend({
        toolKind: z.literal("fetch"),
        name: ClaudeFetchToolNameSchema,
    }),
    ClaudeToolCallPass2BaseSchema.extend({
        toolKind: z.literal("speak"),
        name: z.literal("speak"),
    }),
    ClaudeToolCallPass2BaseSchema.extend({
        toolKind: z.literal("unknown"),
    }),
]);
function toToolCallTimelineItem(normalized) {
    const name = normalized.toolKind === "speak" ? "speak" : normalized.name;
    const detailName = normalized.toolKind === "shell"
        ? "shell"
        : normalized.toolKind === "read"
            ? "read_file"
            : normalized.toolKind === "write"
                ? "write_file"
                : normalized.toolKind === "edit"
                    ? "apply_patch"
                    : normalized.toolKind === "search" || normalized.toolKind === "fetch"
                        ? normalized.name
                        : normalized.toolKind === "speak"
                            ? "speak"
                            : normalized.name;
    const detail = deriveClaudeToolDetail(detailName, normalized.input, normalized.output);
    if (normalized.status === "failed") {
        return {
            type: "tool_call",
            callId: normalized.callId,
            name,
            detail,
            status: "failed",
            error: normalized.error ?? { message: "Tool call failed" },
            ...(normalized.metadata ? { metadata: normalized.metadata } : {}),
        };
    }
    return {
        type: "tool_call",
        callId: normalized.callId,
        name,
        detail,
        status: normalized.status,
        error: null,
        ...(normalized.metadata ? { metadata: normalized.metadata } : {}),
    };
}
function mapClaudeToolCall(params, status, error) {
    const pass1 = ClaudeToolCallPass1Schema.safeParse({
        ...params,
        status,
        error,
    });
    if (!pass1.success) {
        return null;
    }
    const pass2Envelope = ClaudeToolCallPass2EnvelopeSchema.safeParse(pass1.data);
    if (!pass2Envelope.success) {
        return null;
    }
    const pass2 = ClaudeToolCallPass2Schema.safeParse(pass2Envelope.data);
    if (!pass2.success) {
        return null;
    }
    return toToolCallTimelineItem(pass2.data);
}
export function mapClaudeRunningToolCall(params) {
    return mapClaudeToolCall(params, "running", null);
}
export function mapClaudeCompletedToolCall(params) {
    return mapClaudeToolCall(params, "completed", null);
}
export function mapClaudeFailedToolCall(params) {
    return mapClaudeToolCall(params, "failed", params.error);
}
export function mapClaudeCanceledToolCall(params) {
    return mapClaudeToolCall(params, "canceled", null);
}
//# sourceMappingURL=tool-call-mapper.js.map