import { z } from "zod";
import type { Logger } from "pino";
import type { ManagedAgent } from "./agent-manager.js";
import type { AgentSessionConfig } from "./agent-sdk-types.js";
declare const STORED_AGENT_SCHEMA: z.ZodObject<{
    id: z.ZodString;
    provider: z.ZodString;
    cwd: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    lastActivityAt: z.ZodOptional<z.ZodString>;
    lastUserMessageAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    labels: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    lastStatus: z.ZodDefault<z.ZodEnum<["initializing", "idle", "running", "error", "closed"]>>;
    lastModeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    config: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        modeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        thinkingOptionId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        featureValues: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        extra: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        systemPrompt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        mcpServers: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    }, "strip", z.ZodTypeAny, {
        title?: string | null | undefined;
        modeId?: string | null | undefined;
        model?: string | null | undefined;
        thinkingOptionId?: string | null | undefined;
        extra?: Record<string, any> | null | undefined;
        systemPrompt?: string | null | undefined;
        mcpServers?: Record<string, any> | null | undefined;
        featureValues?: Record<string, unknown> | null | undefined;
    }, {
        title?: string | null | undefined;
        modeId?: string | null | undefined;
        model?: string | null | undefined;
        thinkingOptionId?: string | null | undefined;
        extra?: Record<string, any> | null | undefined;
        systemPrompt?: string | null | undefined;
        mcpServers?: Record<string, any> | null | undefined;
        featureValues?: Record<string, unknown> | null | undefined;
    }>>>;
    runtimeInfo: z.ZodOptional<z.ZodObject<{
        provider: z.ZodString;
        sessionId: z.ZodNullable<z.ZodString>;
        model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        thinkingOptionId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        modeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        extra: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        sessionId: string | null;
        modeId?: string | null | undefined;
        model?: string | null | undefined;
        thinkingOptionId?: string | null | undefined;
        extra?: Record<string, unknown> | undefined;
    }, {
        provider: string;
        sessionId: string | null;
        modeId?: string | null | undefined;
        model?: string | null | undefined;
        thinkingOptionId?: string | null | undefined;
        extra?: Record<string, unknown> | undefined;
    }>>;
    features: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"toggle">;
        id: z.ZodString;
        label: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tooltip: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        value: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        value: boolean;
        type: "toggle";
        id: string;
        label: string;
        description?: string | undefined;
        icon?: string | undefined;
        tooltip?: string | undefined;
    }, {
        value: boolean;
        type: "toggle";
        id: string;
        label: string;
        description?: string | undefined;
        icon?: string | undefined;
        tooltip?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"select">;
        id: z.ZodString;
        label: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tooltip: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        value: z.ZodNullable<z.ZodString>;
        options: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            isDefault: z.ZodOptional<z.ZodBoolean>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
            isDefault?: boolean | undefined;
        }, {
            id: string;
            label: string;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
            isDefault?: boolean | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        value: string | null;
        options: {
            id: string;
            label: string;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
            isDefault?: boolean | undefined;
        }[];
        type: "select";
        id: string;
        label: string;
        description?: string | undefined;
        icon?: string | undefined;
        tooltip?: string | undefined;
    }, {
        value: string | null;
        options: {
            id: string;
            label: string;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
            isDefault?: boolean | undefined;
        }[];
        type: "select";
        id: string;
        label: string;
        description?: string | undefined;
        icon?: string | undefined;
        tooltip?: string | undefined;
    }>]>, "many">>;
    persistence: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        provider: z.ZodString;
        sessionId: z.ZodString;
        nativeHandle: z.ZodOptional<z.ZodAny>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        sessionId: string;
        metadata?: Record<string, any> | undefined;
        nativeHandle?: any;
    }, {
        provider: string;
        sessionId: string;
        metadata?: Record<string, any> | undefined;
        nativeHandle?: any;
    }>>>;
    lastError: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    requiresAttention: z.ZodOptional<z.ZodBoolean>;
    attentionReason: z.ZodOptional<z.ZodNullable<z.ZodEnum<["finished", "error", "permission"]>>>;
    attentionTimestamp: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    internal: z.ZodOptional<z.ZodBoolean>;
    archivedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    cwd: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    provider: string;
    labels: Record<string, string>;
    lastStatus: "error" | "initializing" | "idle" | "running" | "closed";
    title?: string | null | undefined;
    config?: {
        title?: string | null | undefined;
        modeId?: string | null | undefined;
        model?: string | null | undefined;
        thinkingOptionId?: string | null | undefined;
        extra?: Record<string, any> | null | undefined;
        systemPrompt?: string | null | undefined;
        mcpServers?: Record<string, any> | null | undefined;
        featureValues?: Record<string, unknown> | null | undefined;
    } | null | undefined;
    features?: ({
        value: boolean;
        type: "toggle";
        id: string;
        label: string;
        description?: string | undefined;
        icon?: string | undefined;
        tooltip?: string | undefined;
    } | {
        value: string | null;
        options: {
            id: string;
            label: string;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
            isDefault?: boolean | undefined;
        }[];
        type: "select";
        id: string;
        label: string;
        description?: string | undefined;
        icon?: string | undefined;
        tooltip?: string | undefined;
    })[] | undefined;
    lastUserMessageAt?: string | null | undefined;
    persistence?: {
        provider: string;
        sessionId: string;
        metadata?: Record<string, any> | undefined;
        nativeHandle?: any;
    } | null | undefined;
    runtimeInfo?: {
        provider: string;
        sessionId: string | null;
        modeId?: string | null | undefined;
        model?: string | null | undefined;
        thinkingOptionId?: string | null | undefined;
        extra?: Record<string, unknown> | undefined;
    } | undefined;
    lastError?: string | null | undefined;
    requiresAttention?: boolean | undefined;
    attentionReason?: "finished" | "error" | "permission" | null | undefined;
    attentionTimestamp?: string | null | undefined;
    archivedAt?: string | null | undefined;
    lastActivityAt?: string | undefined;
    internal?: boolean | undefined;
    lastModeId?: string | null | undefined;
}, {
    cwd: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    provider: string;
    title?: string | null | undefined;
    config?: {
        title?: string | null | undefined;
        modeId?: string | null | undefined;
        model?: string | null | undefined;
        thinkingOptionId?: string | null | undefined;
        extra?: Record<string, any> | null | undefined;
        systemPrompt?: string | null | undefined;
        mcpServers?: Record<string, any> | null | undefined;
        featureValues?: Record<string, unknown> | null | undefined;
    } | null | undefined;
    features?: ({
        value: boolean;
        type: "toggle";
        id: string;
        label: string;
        description?: string | undefined;
        icon?: string | undefined;
        tooltip?: string | undefined;
    } | {
        value: string | null;
        options: {
            id: string;
            label: string;
            description?: string | undefined;
            metadata?: Record<string, unknown> | undefined;
            isDefault?: boolean | undefined;
        }[];
        type: "select";
        id: string;
        label: string;
        description?: string | undefined;
        icon?: string | undefined;
        tooltip?: string | undefined;
    })[] | undefined;
    lastUserMessageAt?: string | null | undefined;
    persistence?: {
        provider: string;
        sessionId: string;
        metadata?: Record<string, any> | undefined;
        nativeHandle?: any;
    } | null | undefined;
    runtimeInfo?: {
        provider: string;
        sessionId: string | null;
        modeId?: string | null | undefined;
        model?: string | null | undefined;
        thinkingOptionId?: string | null | undefined;
        extra?: Record<string, unknown> | undefined;
    } | undefined;
    lastError?: string | null | undefined;
    labels?: Record<string, string> | undefined;
    requiresAttention?: boolean | undefined;
    attentionReason?: "finished" | "error" | "permission" | null | undefined;
    attentionTimestamp?: string | null | undefined;
    archivedAt?: string | null | undefined;
    lastActivityAt?: string | undefined;
    internal?: boolean | undefined;
    lastStatus?: "error" | "initializing" | "idle" | "running" | "closed" | undefined;
    lastModeId?: string | null | undefined;
}>;
export type SerializableAgentConfig = Pick<AgentSessionConfig, "title" | "modeId" | "model" | "thinkingOptionId" | "featureValues" | "extra" | "systemPrompt" | "mcpServers">;
export type StoredAgentRecord = z.infer<typeof STORED_AGENT_SCHEMA>;
export declare function parseStoredAgentRecord(value: unknown): StoredAgentRecord;
export declare class AgentStorage {
    private cache;
    private pathById;
    private pathsById;
    private pendingWrites;
    private deleting;
    private loaded;
    private baseDir;
    private loadPromise;
    private logger;
    constructor(baseDir: string, logger: Logger);
    initialize(): Promise<void>;
    list(): Promise<StoredAgentRecord[]>;
    get(agentId: string): Promise<StoredAgentRecord | null>;
    upsert(record: StoredAgentRecord): Promise<void>;
    beginDelete(agentId: string): void;
    remove(agentId: string): Promise<void>;
    applySnapshot(agent: ManagedAgent, workspaceIdOrOptions?: string | {
        title?: string | null;
        internal?: boolean;
    }, options?: {
        title?: string | null;
        internal?: boolean;
    }): Promise<void>;
    setTitle(agentId: string, title: string): Promise<void>;
    flush(): Promise<void>;
    private load;
    private doLoad;
    private scanDisk;
    private readRecordFile;
    private buildRecordPath;
    private addIndexedPath;
    private removeIndexedPath;
    private waitForPendingWrite;
}
export {};
//# sourceMappingURL=agent-storage.d.ts.map