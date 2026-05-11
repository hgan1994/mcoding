import { z } from "zod";
export declare const ChatCreateRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/create">;
    requestId: z.ZodString;
    name: z.ZodString;
    purpose: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "chat/create";
    requestId: string;
    purpose?: string | undefined;
}, {
    name: string;
    type: "chat/create";
    requestId: string;
    purpose?: string | undefined;
}>;
export declare const ChatListRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/list">;
    requestId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "chat/list";
    requestId: string;
}, {
    type: "chat/list";
    requestId: string;
}>;
export declare const ChatInspectRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/inspect">;
    requestId: z.ZodString;
    room: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "chat/inspect";
    requestId: string;
    room: string;
}, {
    type: "chat/inspect";
    requestId: string;
    room: string;
}>;
export declare const ChatDeleteRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/delete">;
    requestId: z.ZodString;
    room: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "chat/delete";
    requestId: string;
    room: string;
}, {
    type: "chat/delete";
    requestId: string;
    room: string;
}>;
export declare const ChatPostRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/post">;
    requestId: z.ZodString;
    room: z.ZodString;
    body: z.ZodString;
    authorAgentId: z.ZodOptional<z.ZodString>;
    replyToMessageId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "chat/post";
    body: string;
    requestId: string;
    room: string;
    authorAgentId?: string | undefined;
    replyToMessageId?: string | undefined;
}, {
    type: "chat/post";
    body: string;
    requestId: string;
    room: string;
    authorAgentId?: string | undefined;
    replyToMessageId?: string | undefined;
}>;
export declare const ChatReadRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/read">;
    requestId: z.ZodString;
    room: z.ZodString;
    limit: z.ZodOptional<z.ZodNumber>;
    since: z.ZodOptional<z.ZodString>;
    authorAgentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "chat/read";
    requestId: string;
    room: string;
    authorAgentId?: string | undefined;
    limit?: number | undefined;
    since?: string | undefined;
}, {
    type: "chat/read";
    requestId: string;
    room: string;
    authorAgentId?: string | undefined;
    limit?: number | undefined;
    since?: string | undefined;
}>;
export declare const ChatWaitRequestSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/wait">;
    requestId: z.ZodString;
    room: z.ZodString;
    afterMessageId: z.ZodOptional<z.ZodString>;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "chat/wait";
    requestId: string;
    room: string;
    afterMessageId?: string | undefined;
    timeoutMs?: number | undefined;
}, {
    type: "chat/wait";
    requestId: string;
    room: string;
    afterMessageId?: string | undefined;
    timeoutMs?: number | undefined;
}>;
export declare const ChatCreateResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/create/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        room: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            purpose: z.ZodNullable<z.ZodString>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        } & {
            messageCount: z.ZodNumber;
            lastMessageAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }, {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    }, {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "chat/create/response";
    payload: {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    };
}, {
    type: "chat/create/response";
    payload: {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    };
}>;
export declare const ChatListResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/list/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        rooms: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            purpose: z.ZodNullable<z.ZodString>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        } & {
            messageCount: z.ZodNumber;
            lastMessageAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }, {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }>, "many">;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        rooms: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }[];
    }, {
        error: string | null;
        requestId: string;
        rooms: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    type: "chat/list/response";
    payload: {
        error: string | null;
        requestId: string;
        rooms: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }[];
    };
}, {
    type: "chat/list/response";
    payload: {
        error: string | null;
        requestId: string;
        rooms: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }[];
    };
}>;
export declare const ChatInspectResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/inspect/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        room: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            purpose: z.ZodNullable<z.ZodString>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        } & {
            messageCount: z.ZodNumber;
            lastMessageAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }, {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    }, {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "chat/inspect/response";
    payload: {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    };
}, {
    type: "chat/inspect/response";
    payload: {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    };
}>;
export declare const ChatDeleteResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/delete/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        room: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            purpose: z.ZodNullable<z.ZodString>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        } & {
            messageCount: z.ZodNumber;
            lastMessageAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }, {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    }, {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "chat/delete/response";
    payload: {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    };
}, {
    type: "chat/delete/response";
    payload: {
        error: string | null;
        requestId: string;
        room: {
            name: string;
            id: string;
            purpose: string | null;
            createdAt: string;
            updatedAt: string;
            messageCount: number;
            lastMessageAt: string | null;
        } | null;
    };
}>;
export declare const ChatPostResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/post/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        message: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            roomId: z.ZodString;
            authorAgentId: z.ZodString;
            body: z.ZodString;
            replyToMessageId: z.ZodNullable<z.ZodString>;
            mentionAgentIds: z.ZodArray<z.ZodString, "many">;
            createdAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }, {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }>>;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        message: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        } | null;
        requestId: string;
    }, {
        error: string | null;
        message: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        } | null;
        requestId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "chat/post/response";
    payload: {
        error: string | null;
        message: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        } | null;
        requestId: string;
    };
}, {
    type: "chat/post/response";
    payload: {
        error: string | null;
        message: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        } | null;
        requestId: string;
    };
}>;
export declare const ChatReadResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/read/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        messages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            roomId: z.ZodString;
            authorAgentId: z.ZodString;
            body: z.ZodString;
            replyToMessageId: z.ZodNullable<z.ZodString>;
            mentionAgentIds: z.ZodArray<z.ZodString, "many">;
            createdAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }, {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }>, "many">;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        messages: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }[];
    }, {
        error: string | null;
        requestId: string;
        messages: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    type: "chat/read/response";
    payload: {
        error: string | null;
        requestId: string;
        messages: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }[];
    };
}, {
    type: "chat/read/response";
    payload: {
        error: string | null;
        requestId: string;
        messages: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }[];
    };
}>;
export declare const ChatWaitResponseSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat/wait/response">;
    payload: z.ZodObject<{
        requestId: z.ZodString;
        messages: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            roomId: z.ZodString;
            authorAgentId: z.ZodString;
            body: z.ZodString;
            replyToMessageId: z.ZodNullable<z.ZodString>;
            mentionAgentIds: z.ZodArray<z.ZodString, "many">;
            createdAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }, {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }>, "many">;
        timedOut: z.ZodBoolean;
        error: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error: string | null;
        requestId: string;
        messages: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }[];
        timedOut: boolean;
    }, {
        error: string | null;
        requestId: string;
        messages: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }[];
        timedOut: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "chat/wait/response";
    payload: {
        error: string | null;
        requestId: string;
        messages: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }[];
        timedOut: boolean;
    };
}, {
    type: "chat/wait/response";
    payload: {
        error: string | null;
        requestId: string;
        messages: {
            body: string;
            id: string;
            createdAt: string;
            roomId: string;
            authorAgentId: string;
            replyToMessageId: string | null;
            mentionAgentIds: string[];
        }[];
        timedOut: boolean;
    };
}>;
//# sourceMappingURL=chat-rpc-schemas.d.ts.map