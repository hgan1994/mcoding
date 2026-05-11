import type { AgentFeature, AgentFeatureToggle } from "../agent-sdk-types.js";
export declare const CODEX_FAST_MODE_FEATURE: Omit<AgentFeatureToggle, "value">;
export declare const CODEX_PLAN_MODE_FEATURE: Omit<AgentFeatureToggle, "value">;
export declare function codexModelSupportsFastMode(modelId: string | null | undefined): boolean;
export declare function buildCodexFeatures(input: {
    modelId: string | null | undefined;
    fastModeEnabled: boolean;
    planModeEnabled: boolean;
    planModeAvailable?: boolean;
}): AgentFeature[];
//# sourceMappingURL=codex-feature-definitions.d.ts.map