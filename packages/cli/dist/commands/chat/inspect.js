import { connectChatClient, toChatCommandError } from "./shared.js";
import { chatRoomSchema, toChatRoomRow } from "./schema.js";
export async function runInspectCommand(room, options, _command) {
    const { client } = await connectChatClient(options.host);
    try {
        const payload = await client.inspectChatRoom({ room });
        return {
            type: "single",
            data: toChatRoomRow(payload.room),
            schema: chatRoomSchema,
        };
    }
    catch (err) {
        throw toChatCommandError("CHAT_INSPECT_FAILED", "inspect chat room", err);
    }
    finally {
        await client.close().catch(() => { });
    }
}
//# sourceMappingURL=inspect.js.map