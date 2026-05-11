import type pino from "pino";
import type { StoredAgentRecord } from "../agent/agent-storage.js";
import type { ManagedAgent } from "../agent/agent-manager.js";
export interface ChatMentionNotificationInput {
    room: string;
    authorAgentId: string;
    body: string;
    mentionAgentIds: string[];
}
export interface NotifyChatMentionsInput extends ChatMentionNotificationInput {
    logger: pino.Logger;
    listStoredAgents: () => Promise<StoredAgentRecord[]>;
    listLiveAgents: () => ManagedAgent[];
    resolveAgentIdentifier: (identifier: string) => Promise<{
        ok: true;
        agentId: string;
    } | {
        ok: false;
        error: string;
    }>;
    sendAgentMessage: (agentId: string, text: string) => Promise<void>;
}
export declare function notifyChatMentions(input: NotifyChatMentionsInput): Promise<void>;
export declare function resolveChatMentionTargetAgentIds(input: {
    authorAgentId: string;
    mentionAgentIds: string[];
    storedAgents: StoredAgentRecord[];
    liveAgents: ManagedAgent[];
}): string[];
export declare function buildChatMentionNotification(input: ChatMentionNotificationInput): string;
//# sourceMappingURL=chat-mentions.d.ts.map