import type { AgentModelDefinition } from "../../agent-sdk-types.js";
export declare function getClaudeModels(): AgentModelDefinition[];
/**
 * Normalize a runtime model string (from SDK init message) to a known model ID.
 * Handles the `[1m]` suffix that the SDK appends for 1M context sessions.
 */
export declare function normalizeClaudeRuntimeModelId(value: string | null | undefined): string | null;
//# sourceMappingURL=claude-models.d.ts.map