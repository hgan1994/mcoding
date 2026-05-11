import { connectChatClient, toChatCommandError } from "./shared.js";
import { chatRoomSchema, toChatRoomRow } from "./schema.js";
export async function runDeleteCommand(room, options, _command) {
    const { client } = await connectChatClient(options.host);
    try {
        const payload = await client.deleteChatRoom({ room });
        return {
            type: "single",
            data: toChatRoomRow(payload.room),
            schema: chatRoomSchema,
        };
    }
    catch (err) {
        throw toChatCommandError("CHAT_DELETE_FAILED", "delete chat room", err);
    }
    finally {
        await client.close().catch(() => { });
    }
}
//# sourceMappingURL=delete.js.map