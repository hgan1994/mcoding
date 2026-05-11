import type { AgentPromptInput, AgentRunOptions, AgentSession, AgentStreamEvent } from "../../agent-sdk-types.js";
export declare function streamSession(session: Pick<AgentSession, "startTurn" | "subscribe">, prompt: AgentPromptInput, options?: AgentRunOptions): AsyncGenerator<AgentStreamEvent>;
//# sourceMappingURL=session-stream-adapter.d.ts.map