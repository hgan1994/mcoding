import { attachAgentNamesToMessages, connectChatClient, parseTimeoutMs, toChatCommandError, } from "./shared.js";
import { chatMessageSchema, toChatMessageRow } from "./schema.js";
export async function runWaitCommand(room, options, _command) {
    const { client } = await connectChatClient(options.host);
    try {
        const latest = await client.readChatMessages({
            room,
            limit: 1,
        });
        const afterMessageId = latest.messages[0]?.id;
        const payload = await client.waitForChatMessages({
            room,
            afterMessageId,
            timeoutMs: parseTimeoutMs(options.timeout),
        });
        const messages = await attachAgentNamesToMessages(client, payload.messages.map(toChatMessageRow));
        return {
            type: "list",
            data: messages,
            schema: chatMessageSchema,
        };
    }
    catch (err) {
        throw toChatCommandError("CHAT_WAIT_FAILED", "wait for chat messages", err);
    }
    finally {
        await client.close().catch(() => { });
    }
}
//# sourceMappingURL=wait.js.map