import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { createTestLogger } from "../../../test-utils/test-logger.js";
import type { AgentStreamEvent, AgentTimelineItem } from "../agent-sdk-types.js";
import {
  CURSOR_DEFAULT_MODEL_ID,
  CursorAgentClient,
  buildCursorAgentArgs,
  translateCursorStreamEvent,
} from "./cursor-agent.js";

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

describe("CursorAgentClient", () => {
  test("lists the default Cursor Auto model", async () => {
    const client = new CursorAgentClient();

    await expect(client.listModels({ cwd: process.cwd(), force: false })).resolves.toEqual([
      {
        provider: "cursor",
        id: CURSOR_DEFAULT_MODEL_ID,
        label: "Cursor Auto",
        description: "Use Cursor Agent's configured/default model.",
        isDefault: true,
      },
    ]);
  });

  test("builds headless CLI args with model, resume, and full-access force mode", () => {
    expect(
      buildCursorAgentArgs({
        prefixArgs: ["shim.js"],
        prompt: "hello",
        modeId: "full-access",
        model: "gpt-test",
        resumeSessionId: "cursor-session-1",
      }),
    ).toEqual([
      "shim.js",
      "-p",
      "--output-format",
      "stream-json",
      "--force",
      "--model",
      "gpt-test",
      "--resume=cursor-session-1",
      "hello",
    ]);
  });

  test("translates Claude-style Cursor JSONL events into Paseo timeline items", () => {
    const translated = translateCursorStreamEvent({
      type: "assistant",
      message: {
        usage: {
          input_tokens: 12,
          output_tokens: 4,
        },
        content: [
          { type: "thinking", thinking: "Checking files." },
          { type: "text", text: "Hello from Cursor." },
          {
            type: "tool_use",
            id: "tool-1",
            name: "bash",
            input: { command: "pwd", cwd: "/tmp/project" },
          },
        ],
      },
    });

    expect(translated.usage).toMatchObject({
      inputTokens: 12,
      outputTokens: 4,
    });
    expect(translated.timelineItems).toEqual([
      { type: "reasoning", text: "Checking files." },
      { type: "assistant_message", text: "Hello from Cursor." },
      {
        type: "tool_call",
        callId: "tool-1",
        name: "bash",
        status: "running",
        error: null,
        detail: {
          type: "shell",
          command: "pwd",
          cwd: "/tmp/project",
          output: undefined,
          exitCode: undefined,
        },
      },
    ]);
  });

  test("runs a fake cursor-agent process and streams timeline events", async () => {
    const root = await makeTempDir("paseo-cursor-agent-");
    const scriptPath = join(root, "fake-cursor-agent.cjs");
    const argsPath = join(root, "args.json");
    await writeFile(
      scriptPath,
      `
const fs = require("node:fs");
fs.writeFileSync(process.env.CURSOR_ARGS_CAPTURE, JSON.stringify(process.argv.slice(2)));
console.log(JSON.stringify({ type: "system", subtype: "init", session_id: "cursor-session-1" }));
console.log(JSON.stringify({
  type: "assistant",
  message: {
    content: [
      { type: "thinking", thinking: "Plan first." },
      { type: "text", text: "Hello from Cursor." },
      { type: "tool_use", id: "tool-1", name: "bash", input: { command: "pwd" } }
    ],
    usage: { input_tokens: 3, output_tokens: 5 }
  }
}));
console.log(JSON.stringify({
  type: "tool_call",
  id: "tool-1",
  name: "bash",
  status: "completed",
  input: { command: "pwd" },
  output: "/tmp/project\\n",
  exit_code: 0
}));
console.log(JSON.stringify({ type: "result", result: "Hello from Cursor.", session_id: "cursor-session-1" }));
`,
      "utf8",
    );

    const client = new CursorAgentClient({
      logger: createTestLogger(),
      runtimeSettings: {
        command: {
          mode: "replace",
          argv: [process.execPath, scriptPath],
        },
        env: {
          CURSOR_ARGS_CAPTURE: argsPath,
        },
      },
    });
    const session = await client.createSession({
      provider: "cursor",
      cwd: root,
      modeId: "full-access",
      model: "gpt-test",
    });
    const events: AgentStreamEvent[] = [];
    session.subscribe((event) => events.push(event));

    const result = await session.run("Please respond.");
    const args = JSON.parse(await readFile(argsPath, "utf8")) as string[];

    expect(args).toEqual([
      "-p",
      "--output-format",
      "stream-json",
      "--force",
      "--model",
      "gpt-test",
      "Please respond.",
    ]);
    expect(result).toMatchObject({
      sessionId: "cursor-session-1",
      finalText: "Hello from Cursor.",
      canceled: false,
    });
    expect(session.describePersistence()).toMatchObject({
      provider: "cursor",
      sessionId: "cursor-session-1",
      nativeHandle: "cursor-session-1",
      metadata: {
        cwd: root,
        model: "gpt-test",
        modeId: "full-access",
      },
    });

    const timelineItems = events.flatMap((event): AgentTimelineItem[] =>
      event.type === "timeline" ? [event.item] : [],
    );
    expect(events.map((event) => event.type)).toContain("thread_started");
    expect(events.at(-1)).toMatchObject({ type: "turn_completed", provider: "cursor" });
    expect(timelineItems).toEqual(
      expect.arrayContaining([
        { type: "reasoning", text: "Plan first." },
        { type: "assistant_message", text: "Hello from Cursor." },
        expect.objectContaining({
          type: "tool_call",
          callId: "tool-1",
          name: "bash",
          status: "completed",
        }),
      ]),
    );
  });
});
