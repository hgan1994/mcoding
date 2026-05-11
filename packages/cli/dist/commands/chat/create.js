import { connectChatClient, toChatCommandError } from "./shared.js";
import { chatRoomSchema, toChatRoomRow } from "./schema.js";
export async function runCreateCommand(name, options, _command) {
    const { client } = await connectChatClient(options.host);
    try {
        const payload = await client.createChatRoom({
            name,
            purpose: options.purpose,
        });
        return {
            type: "single",
            data: toChatRoomRow(payload.room),
            schema: chatRoomSchema,
        };
    }
    catch (err) {
        throw toChatCommandError("CHAT_CREATE_FAILED", "create chat room", err);
    }
    finally {
        await client.close().catch(() => { });
    }
}
//# sourceMappingURL=create.js.map