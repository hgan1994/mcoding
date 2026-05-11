export type AgentAttentionReason = "finished" | "error" | "permission";
export type AgentAttentionNotificationData = {
    serverId: string;
    agentId: string;
    reason: AgentAttentionReason;
};
export type AgentAttentionNotificationPayload = {
    title: string;
    body: string;
    data: AgentAttentionNotificationData;
};
type BuildAgentAttentionNotificationPayloadInput = {
    reason: AgentAttentionReason;
    serverId: string;
    agentId: string;
    assistantMessage?: string | null;
    permissionRequest?: NotificationPermissionRequest | null;
};
export type NotificationPermissionRequest = {
    id: string;
    provider: string;
    name: string;
    kind: "tool" | "plan" | "question" | "mode" | "other";
    title?: string;
    description?: string;
    input?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
};
export type AssistantTimelineItem = {
    type: "assistant_message";
    text: string;
} | {
    type: string;
    text?: string;
};
export declare function findLatestAssistantMessageFromTimeline(timeline: readonly AssistantTimelineItem[]): string | null;
export declare function findLatestPermissionRequest(pendingPermissions: ReadonlyMap<string, NotificationPermissionRequest>): NotificationPermissionRequest | null;
export declare function buildAgentAttentionNotificationPayload(input: BuildAgentAttentionNotificationPayloadInput): AgentAttentionNotificationPayload;
export {};
//# sourceMappingURL=agent-attention-notification.d.ts.map