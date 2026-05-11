import type { ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
import type { Logger } from "pino";

import type {
  AgentCapabilityFlags,
  AgentClient,
  AgentLaunchContext,
  AgentMode,
  AgentModelDefinition,
  AgentPermissionRequest,
  AgentPermissionResponse,
  AgentPermissionResult,
  AgentPersistenceHandle,
  AgentPromptInput,
  AgentRunOptions,
  AgentRunResult,
  AgentRuntimeInfo,
  AgentSession,
  AgentSessionConfig,
  AgentStreamEvent,
  AgentTimelineItem,
  AgentUsage,
  ListModesOptions,
  ListModelsOptions,
  ListPersistedAgentsOptions,
  PersistedAgentDescriptor,
  ToolCallDetail,
  ToolCallTimelineItem,
} from "../agent-sdk-types.js";
import {
  createProviderEnvSpec,
  isProviderCommandAvailable,
  resolveProviderCommandPrefix,
  type ProviderRuntimeSettings,
} from "../provider-launch-config.js";
import { getAgentProviderDefinition } from "../provider-manifest.js";
import { renderPromptAttachmentAsText } from "../prompt-attachments.js";
import { findExecutable } from "../../../utils/executable.js";
import { spawnProcess } from "../../../utils/spawn.js";
import {
  formatConfiguredCommand,
  formatDiagnosticStatus,
  formatProviderDiagnostic,
  formatProviderDiagnosticError,
  resolveBinaryVersion,
  toDiagnosticErrorMessage,
} from "./diagnostic-utils.js";

export const CURSOR_PROVIDER_ID = "cursor";
export const CURSOR_DEFAULT_MODEL_ID = "auto";

const CURSOR_BINARY_COMMAND = process.env.CURSOR_AGENT_COMMAND ?? "cursor-agent";
const CURSOR_DEFAULT_MODE_ID = "default";
const CURSOR_FULL_ACCESS_MODE_ID = "full-access";

const CURSOR_CAPABILITIES: AgentCapabilityFlags = {
  supportsStreaming: true,
  supportsSessionPersistence: true,
  supportsDynamicModes: false,
  supportsMcpServers: false,
  supportsReasoningStream: true,
  supportsToolInvocations: true,
};

const CURSOR_MODELS: AgentModelDefinition[] = [
  {
    provider: CURSOR_PROVIDER_ID,
    id: CURSOR_DEFAULT_MODEL_ID,
    label: "Cursor Auto",
    description: "Use Cursor Agent's configured/default model.",
    isDefault: true,
  },
];

interface CursorAgentClientOptions {
  logger?: Logger;
  runtimeSettings?: ProviderRuntimeSettings;
}

export interface BuildCursorAgentArgsOptions {
  prefixArgs?: string[];
  prompt: string;
  modeId?: string | null;
  model?: string | null;
  resumeSessionId?: string | null;
}

export interface CursorStreamTranslation {
  sessionId?: string;
  finalText?: string;
  usage?: AgentUsage;
  timelineItems: AgentTimelineItem[];
}

interface ActiveCursorTurn {
  turnId: string;
  child: ChildProcess | null;
  completed: Promise<AgentRunResult>;
  resolve: (result: AgentRunResult) => void;
  timeline: AgentTimelineItem[];
  assistantTextParts: string[];
  finalText: string | null;
  usage?: AgentUsage;
  stderr: string;
  settled: boolean;
  started: boolean;
}

export function buildCursorAgentArgs(options: BuildCursorAgentArgsOptions): string[] {
  const args = [...(options.prefixArgs ?? []), "-p", "--output-format", "stream-json"];
  if (options.modeId === CURSOR_FULL_ACCESS_MODE_ID) {
    args.push("--force");
  }
  if (options.model && options.model !== CURSOR_DEFAULT_MODEL_ID) {
    args.push("--model", options.model);
  }
  if (options.resumeSessionId) {
    args.push(`--resume=${options.resumeSessionId}`);
  }
  args.push(options.prompt);
  return args;
}

export function translateCursorStreamEvent(raw: unknown): CursorStreamTranslation {
  const event = asRecord(raw);
  if (!event) {
    return { timelineItems: [] };
  }

  const eventType = lower(readString(event, ["type", "event", "kind"]));
  const subtype = lower(readString(event, ["subtype", "status"]));
  const timelineItems: AgentTimelineItem[] = [];

  const contentSource = readRecord(event, ["message", "data"]) ?? event;
  const content = readUnknown(contentSource, ["content", "delta", "text"]);
  const contentItems = Array.isArray(content) ? content : undefined;

  if (contentItems) {
    timelineItems.push(...translateContentItems(contentItems));
  } else if (eventType === "assistant" || readString(contentSource, ["role"]) === "assistant") {
    const text = extractTextValue(content);
    if (text) {
      timelineItems.push({ type: "assistant_message", text });
    }
  }

  if (isToolEvent(eventType, subtype, event)) {
    const toolItem = translateToolEvent(event, eventType, subtype);
    if (toolItem) {
      timelineItems.push(toolItem);
    }
  }

  if (isReasoningEvent(eventType, subtype)) {
    const text = extractTextValue(
      readUnknown(event, ["reasoning", "thinking", "text", "content", "message"]),
    );
    if (text) {
      timelineItems.push({ type: "reasoning", text });
    }
  }

  if (isErrorEvent(eventType, subtype)) {
    const message =
      extractTextValue(readUnknown(event, ["error", "message", "diagnostic"])) ??
      "Cursor Agent reported an error";
    timelineItems.push({ type: "error", message });
  }

  const finalText =
    eventType === "result" || eventType === "completed" || subtype === "success"
      ? extractTextValue(readUnknown(event, ["result", "final", "output", "response", "text"]))
      : undefined;

  return {
    sessionId: extractSessionId(event),
    finalText,
    usage: extractUsage(event) ?? extractUsage(contentSource),
    timelineItems,
  };
}

export class CursorAgentClient implements AgentClient {
  readonly provider = CURSOR_PROVIDER_ID;
  readonly capabilities = CURSOR_CAPABILITIES;

  private readonly logger?: Logger;
  private readonly runtimeSettings?: ProviderRuntimeSettings;

  constructor(options: CursorAgentClientOptions = {}) {
    this.logger = options.logger;
    this.runtimeSettings = options.runtimeSettings;
  }

  async createSession(
    config: AgentSessionConfig,
    launchContext?: AgentLaunchContext,
  ): Promise<AgentSession> {
    if (config.provider !== CURSOR_PROVIDER_ID) {
      throw new Error(`CursorAgentClient received config for provider '${config.provider}'`);
    }

    return new CursorAgentSession({
      config,
      sessionId: randomUUID(),
      logger: this.logger,
      runtimeSettings: this.runtimeSettings,
      launchContext,
    });
  }

  async resumeSession(
    handle: AgentPersistenceHandle,
    overrides?: Partial<AgentSessionConfig>,
    launchContext?: AgentLaunchContext,
  ): Promise<AgentSession> {
    const metadata = (handle.metadata ?? {}) as Partial<AgentSessionConfig>;
    const cwd = String(metadata.cwd ?? overrides?.cwd ?? process.cwd());
    return new CursorAgentSession({
      config: {
        ...metadata,
        ...overrides,
        provider: CURSOR_PROVIDER_ID,
        cwd,
      },
      sessionId: handle.sessionId,
      nativeSessionId: handle.nativeHandle ?? handle.sessionId,
      logger: this.logger,
      runtimeSettings: this.runtimeSettings,
      launchContext,
    });
  }

  async listModels(_options: ListModelsOptions): Promise<AgentModelDefinition[]> {
    return CURSOR_MODELS;
  }

  async listModes(_options: ListModesOptions): Promise<AgentMode[]> {
    return getAgentProviderDefinition(CURSOR_PROVIDER_ID).modes;
  }

  async listPersistedAgents(
    _options?: ListPersistedAgentsOptions,
  ): Promise<PersistedAgentDescriptor[]> {
    return [];
  }

  async isAvailable(): Promise<boolean> {
    return isProviderCommandAvailable(this.runtimeSettings?.command, () => CURSOR_BINARY_COMMAND);
  }

  async getDiagnostic(): Promise<{ diagnostic: string }> {
    try {
      const prefix = await resolveProviderCommandPrefix(
        this.runtimeSettings?.command,
        () => CURSOR_BINARY_COMMAND,
      );
      const executable = await findExecutable(prefix.command);
      const available = executable !== null;
      const version = executable ? await resolveBinaryVersion(executable) : "unresolved";
      return {
        diagnostic: formatProviderDiagnostic("Cursor Agent", [
          {
            label: "Command",
            value: formatConfiguredCommand([CURSOR_BINARY_COMMAND], this.runtimeSettings),
          },
          { label: "Status", value: formatDiagnosticStatus(available) },
          { label: "Resolved binary", value: executable ?? "not found" },
          { label: "Version", value: version },
        ]),
      };
    } catch (error) {
      return { diagnostic: formatProviderDiagnosticError("Cursor Agent", error) };
    }
  }
}

export class CursorAgentSession implements AgentSession {
  readonly provider = CURSOR_PROVIDER_ID;
  readonly capabilities = CURSOR_CAPABILITIES;
  readonly features = [];
  readonly id: string;

  private readonly config: AgentSessionConfig;
  private readonly listeners = new Set<(event: AgentStreamEvent) => void>();
  private readonly history: AgentStreamEvent[] = [];
  private readonly logger?: Logger;
  private readonly runtimeSettings?: ProviderRuntimeSettings;
  private readonly launchContext?: AgentLaunchContext;
  private activeTurn: ActiveCursorTurn | null = null;
  private readonly turnCompletions = new Map<string, Promise<AgentRunResult>>();
  private currentMode: string | null;
  private modelId: string | null;
  private nativeSessionId: string | null;
  private emittedThreadStarted = false;

  constructor(options: {
    config: AgentSessionConfig;
    sessionId: string;
    nativeSessionId?: string | null;
    logger?: Logger;
    runtimeSettings?: ProviderRuntimeSettings;
    launchContext?: AgentLaunchContext;
  }) {
    this.config = options.config;
    this.id = options.sessionId;
    this.nativeSessionId = options.nativeSessionId ?? null;
    this.logger = options.logger;
    this.runtimeSettings = options.runtimeSettings;
    this.launchContext = options.launchContext;
    this.currentMode = options.config.modeId ?? CURSOR_DEFAULT_MODE_ID;
    this.modelId = options.config.model ?? CURSOR_DEFAULT_MODEL_ID;
  }

  async run(prompt: AgentPromptInput, options?: AgentRunOptions): Promise<AgentRunResult> {
    const { turnId } = await this.startTurn(prompt, options);
    const completed = this.turnCompletions.get(turnId);
    if (!completed) {
      throw new Error("Cursor Agent turn did not start");
    }
    return completed;
  }

  async startTurn(
    prompt: AgentPromptInput,
    options?: AgentRunOptions,
  ): Promise<{ turnId: string }> {
    if (this.activeTurn) {
      throw new Error("Cursor Agent already has an active turn");
    }

    const turnId = randomUUID();
    let resolve!: (result: AgentRunResult) => void;
    const completed = new Promise<AgentRunResult>((promiseResolve) => {
      resolve = promiseResolve;
    });
    const turn: ActiveCursorTurn = {
      turnId,
      child: null,
      completed,
      resolve,
      timeline: [],
      assistantTextParts: [],
      finalText: null,
      stderr: "",
      settled: false,
      started: false,
    };
    this.activeTurn = turn;
    this.turnCompletions.set(turnId, completed);

    try {
      const prefix = await resolveProviderCommandPrefix(
        this.runtimeSettings?.command,
        () => CURSOR_BINARY_COMMAND,
      );
      const promptText = buildPromptText(prompt, this.config.systemPrompt);
      const resumeSessionId =
        options?.resumeFrom?.nativeHandle ?? options?.resumeFrom?.sessionId ?? this.nativeSessionId;
      const args = buildCursorAgentArgs({
        prefixArgs: prefix.args,
        prompt: promptText,
        modeId: this.currentMode,
        model: this.modelId,
        resumeSessionId,
      });
      const child = spawnProcess(prefix.command, args, {
        cwd: this.config.cwd,
        stdio: ["ignore", "pipe", "pipe"],
        ...createProviderEnvSpec({
          runtimeSettings: this.runtimeSettings,
          overlays: [this.launchContext?.env],
        }),
      });
      turn.child = child;
      this.attachProcess(turn, child);
    } catch (error) {
      this.failTurn(turn, error);
    }

    return { turnId };
  }

  subscribe(callback: (event: AgentStreamEvent) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async *streamHistory(): AsyncGenerator<AgentStreamEvent> {
    for (const event of this.history) {
      yield event;
    }
  }

  async getRuntimeInfo(): Promise<AgentRuntimeInfo> {
    return {
      provider: CURSOR_PROVIDER_ID,
      sessionId: this.nativeSessionId ?? this.id,
      model: this.modelId,
      modeId: this.currentMode,
    };
  }

  async getAvailableModes(): Promise<AgentMode[]> {
    return getAgentProviderDefinition(CURSOR_PROVIDER_ID).modes;
  }

  async getCurrentMode(): Promise<string | null> {
    return this.currentMode;
  }

  async setMode(modeId: string): Promise<void> {
    const modes = await this.getAvailableModes();
    if (!modes.some((mode) => mode.id === modeId)) {
      throw new Error(`Unknown Cursor Agent mode: ${modeId}`);
    }
    this.currentMode = modeId;
  }

  getPendingPermissions(): AgentPermissionRequest[] {
    return [];
  }

  async respondToPermission(
    _requestId: string,
    _response: AgentPermissionResponse,
  ): Promise<AgentPermissionResult | void> {
    return undefined;
  }

  describePersistence(): AgentPersistenceHandle | null {
    const sessionId = this.nativeSessionId ?? this.id;
    return {
      provider: CURSOR_PROVIDER_ID,
      sessionId,
      nativeHandle: this.nativeSessionId ?? undefined,
      metadata: {
        provider: CURSOR_PROVIDER_ID,
        cwd: this.config.cwd,
        title: this.config.title ?? null,
        model: this.modelId,
        modeId: this.currentMode,
        systemPrompt: this.config.systemPrompt,
      },
    };
  }

  async interrupt(): Promise<void> {
    const turn = this.activeTurn;
    if (!turn) {
      return;
    }

    turn.child?.kill();
    this.settleTurn(turn, "canceled", "Interrupted");
  }

  async close(): Promise<void> {
    await this.interrupt();
    this.listeners.clear();
  }

  async setModel(modelId: string | null): Promise<void> {
    this.modelId = modelId ?? CURSOR_DEFAULT_MODEL_ID;
  }

  private attachProcess(turn: ActiveCursorTurn, child: ChildProcess): void {
    child.once("spawn", () => {
      if (this.activeTurn !== turn || turn.settled) {
        return;
      }
      turn.started = true;
      this.emit({
        type: "turn_started",
        provider: CURSOR_PROVIDER_ID,
        turnId: turn.turnId,
      });
    });

    child.stdout?.setEncoding("utf8");
    if (child.stdout) {
      const lines = createInterface({ input: child.stdout });
      lines.on("line", (line) => this.handleStdoutLine(turn, line));
      child.once("close", () => lines.close());
    }

    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      turn.stderr += chunk;
    });

    child.once("error", (error) => {
      this.failTurn(turn, error);
    });
    child.once("close", (exitCode, signal) => {
      if (turn.settled) {
        return;
      }
      if (exitCode === 0) {
        this.settleTurn(turn, "completed");
        return;
      }
      const suffix = signal ? `signal ${signal}` : `exit code ${exitCode ?? "unknown"}`;
      const message = turn.stderr.trim() || `Cursor Agent exited with ${suffix}.`;
      this.failTurn(turn, message);
    });
  }

  private handleStdoutLine(turn: ActiveCursorTurn, line: string): void {
    if (this.activeTurn !== turn || turn.settled) {
      return;
    }
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      this.emitTimeline(turn, {
        type: "assistant_message",
        text: `${line}\n`,
      });
      turn.assistantTextParts.push(`${line}\n`);
      return;
    }

    const translated = translateCursorStreamEvent(parsed);
    if (translated.sessionId) {
      this.updateNativeSessionId(translated.sessionId);
    }
    if (translated.usage) {
      turn.usage = translated.usage;
      this.emit({
        type: "usage_updated",
        provider: CURSOR_PROVIDER_ID,
        turnId: turn.turnId,
        usage: translated.usage,
      });
    }
    if (translated.finalText) {
      turn.finalText = translated.finalText;
    }

    for (const item of translated.timelineItems) {
      this.emitTimeline(turn, item);
      if (item.type === "assistant_message") {
        turn.assistantTextParts.push(item.text);
      }
    }
  }

  private updateNativeSessionId(sessionId: string): void {
    if (this.nativeSessionId === sessionId && this.emittedThreadStarted) {
      return;
    }
    this.nativeSessionId = sessionId;
    if (!this.emittedThreadStarted) {
      this.emittedThreadStarted = true;
      this.emit({
        type: "thread_started",
        provider: CURSOR_PROVIDER_ID,
        sessionId,
      });
    }
  }

  private failTurn(turn: ActiveCursorTurn, error: unknown): void {
    const message = toDiagnosticErrorMessage(error);
    this.emitTimeline(turn, { type: "error", message });
    this.settleTurn(turn, "failed", message);
  }

  private settleTurn(
    turn: ActiveCursorTurn,
    status: "completed" | "failed" | "canceled",
    message?: string,
  ): void {
    if (turn.settled) {
      return;
    }
    turn.settled = true;
    if (this.activeTurn === turn) {
      this.activeTurn = null;
    }

    const sessionId = this.nativeSessionId ?? this.id;
    const finalText = turn.finalText ?? turn.assistantTextParts.join("");
    if (status === "completed") {
      this.emit({
        type: "turn_completed",
        provider: CURSOR_PROVIDER_ID,
        turnId: turn.turnId,
        usage: turn.usage,
      });
      turn.resolve({
        sessionId,
        finalText,
        usage: turn.usage,
        timeline: turn.timeline,
        canceled: false,
      });
      return;
    }

    if (status === "canceled") {
      this.emit({
        type: "turn_canceled",
        provider: CURSOR_PROVIDER_ID,
        turnId: turn.turnId,
        reason: message ?? "Interrupted",
      });
      turn.resolve({
        sessionId,
        finalText,
        usage: turn.usage,
        timeline: turn.timeline,
        canceled: true,
      });
      return;
    }

    this.emit({
      type: "turn_failed",
      provider: CURSOR_PROVIDER_ID,
      turnId: turn.turnId,
      error: message ?? "Cursor Agent failed",
    });
    turn.resolve({
      sessionId,
      finalText,
      usage: turn.usage,
      timeline: turn.timeline,
      canceled: false,
    });
  }

  private emitTimeline(turn: ActiveCursorTurn, item: AgentTimelineItem): void {
    turn.timeline.push(item);
    this.emit({
      type: "timeline",
      provider: CURSOR_PROVIDER_ID,
      turnId: turn.turnId,
      item,
    });
  }

  private emit(event: AgentStreamEvent): void {
    this.history.push(event);
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger?.warn({ err: error }, "Cursor Agent listener failed");
      }
    }
  }
}

function buildPromptText(prompt: AgentPromptInput, systemPrompt?: string): string {
  const promptText = promptToText(prompt);
  const system = systemPrompt?.trim();
  if (!system) {
    return promptText;
  }
  return [`System instructions:`, system, "", "User prompt:", promptText].join("\n");
}

function promptToText(prompt: AgentPromptInput): string {
  if (typeof prompt === "string") {
    return prompt;
  }

  return prompt
    .map((block) => {
      if (block.type === "text") {
        return block.text;
      }
      if (block.type === "image") {
        return `[Image attachment: ${block.mimeType}]`;
      }
      return renderPromptAttachmentAsText(block);
    })
    .filter((part) => part.trim().length > 0)
    .join("\n\n");
}

function translateContentItems(items: unknown[]): AgentTimelineItem[] {
  const timelineItems: AgentTimelineItem[] = [];
  for (const item of items) {
    const record = asRecord(item);
    if (!record) {
      const text = extractTextValue(item);
      if (text) {
        timelineItems.push({ type: "assistant_message", text });
      }
      continue;
    }

    const type = lower(readString(record, ["type", "kind"]));
    if (type === "text" || type === "output_text") {
      const text = extractTextValue(readUnknown(record, ["text", "content"]));
      if (text) {
        timelineItems.push({ type: "assistant_message", text });
      }
      continue;
    }

    if (type === "thinking" || type === "reasoning") {
      const text = extractTextValue(readUnknown(record, ["thinking", "reasoning", "text"]));
      if (text) {
        timelineItems.push({ type: "reasoning", text });
      }
      continue;
    }

    if (type === "tool_use" || type === "tool_call") {
      timelineItems.push(
        buildToolCallItem({
          callId: readString(record, ["id", "call_id", "tool_call_id"]) ?? randomUUID(),
          name: readString(record, ["name", "tool_name", "toolName"]) ?? "tool",
          status: "running",
          input: readUnknown(record, ["input", "args", "arguments"]),
          output: null,
        }),
      );
      continue;
    }

    if (type === "tool_result") {
      const isError = readBoolean(record, ["is_error", "isError"]) ?? false;
      timelineItems.push(
        buildToolCallItem({
          callId:
            readString(record, ["tool_use_id", "toolUseId", "tool_call_id", "id"]) ?? randomUUID(),
          name: readString(record, ["name", "tool_name", "toolName"]) ?? "tool_result",
          status: isError ? "failed" : "completed",
          input: null,
          output: readUnknown(record, ["content", "output", "result"]),
          error: isError
            ? (extractTextValue(readUnknown(record, ["content", "output", "error"])) ??
              "Tool call failed")
            : null,
        }),
      );
    }
  }
  return timelineItems;
}

function translateToolEvent(
  event: Record<string, unknown>,
  eventType: string,
  subtype: string,
): ToolCallTimelineItem | null {
  const source = readRecord(event, ["data", "tool", "tool_call"]) ?? event;
  const name =
    readString(source, ["name", "tool_name", "toolName", "command"]) ??
    readString(event, ["name", "tool_name", "toolName"]) ??
    "tool";
  const status = normalizeToolStatus(
    readString(source, ["status", "state"]) ?? (subtype || eventType),
  );
  return buildToolCallItem({
    callId:
      readString(source, ["id", "call_id", "tool_call_id", "toolUseId"]) ??
      readString(event, ["id", "call_id", "tool_call_id", "toolUseId"]) ??
      randomUUID(),
    name,
    status,
    input:
      readUnknown(source, ["input", "args", "arguments", "params"]) ??
      readUnknown(event, ["input", "args", "arguments", "params"]),
    output:
      readUnknown(source, ["output", "result", "content"]) ??
      readUnknown(event, ["output", "result", "content"]),
    error: status === "failed" ? extractTextValue(readUnknown(source, ["error", "message"])) : null,
  });
}

function buildToolCallItem(options: {
  callId: string;
  name: string;
  status: ToolCallTimelineItem["status"];
  input: unknown;
  output: unknown;
  error?: unknown;
}): ToolCallTimelineItem {
  const detail = mapToolDetail(options.name, options.input, options.output);
  if (options.status === "failed") {
    return {
      type: "tool_call",
      callId: options.callId,
      name: options.name,
      status: "failed",
      detail,
      error: options.error ?? "Tool call failed",
    };
  }

  return {
    type: "tool_call",
    callId: options.callId,
    name: options.name,
    status: options.status,
    detail,
    error: null,
  };
}

function mapToolDetail(name: string, input: unknown, output: unknown): ToolCallDetail {
  const lowerName = name.toLowerCase();
  const inputRecord = asRecord(input);
  const outputRecord = asRecord(output);
  const command =
    readString(inputRecord, ["command", "cmd", "bash", "script"]) ??
    (lowerName === "bash" || lowerName.includes("shell") ? stringifyCompact(input) : undefined);
  if (command) {
    return {
      type: "shell",
      command,
      cwd: readString(inputRecord, ["cwd", "directory"]),
      output: stringifyCompact(output),
      exitCode: readNumber(outputRecord, ["exit_code", "exitCode", "code"]),
    };
  }

  const filePath = readString(inputRecord, [
    "file_path",
    "filePath",
    "path",
    "target_file",
    "targetFile",
  ]);
  if (filePath && lowerName.includes("read")) {
    return {
      type: "read",
      filePath,
      content: stringifyCompact(output),
      offset: readNumber(inputRecord, ["offset"]),
      limit: readNumber(inputRecord, ["limit"]),
    };
  }
  if (filePath && (lowerName.includes("edit") || lowerName.includes("patch"))) {
    return {
      type: "edit",
      filePath,
      oldString: readString(inputRecord, ["old_string", "oldString"]),
      newString: readString(inputRecord, ["new_string", "newString"]),
      unifiedDiff:
        readString(inputRecord, ["diff", "unifiedDiff"]) ??
        readString(outputRecord, ["diff", "unifiedDiff"]),
    };
  }
  if (filePath && lowerName.includes("write")) {
    return {
      type: "write",
      filePath,
      content: readString(inputRecord, ["content"]) ?? stringifyCompact(output),
    };
  }

  const query = readString(inputRecord, ["query", "pattern", "regex"]);
  if (query || lowerName.includes("search") || lowerName.includes("grep")) {
    return {
      type: "search",
      query: query ?? stringifyCompact(input) ?? name,
      toolName: lowerName.includes("grep") ? "grep" : "search",
      content: stringifyCompact(output),
    };
  }

  return {
    type: "unknown",
    input: input ?? null,
    output: output ?? null,
  };
}

function normalizeToolStatus(value: string): ToolCallTimelineItem["status"] {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("rejected")
  ) {
    return "failed";
  }
  if (normalized.includes("cancel")) {
    return "canceled";
  }
  if (
    normalized.includes("complete") ||
    normalized.includes("success") ||
    normalized.includes("result")
  ) {
    return "completed";
  }
  return "running";
}

function extractSessionId(event: Record<string, unknown>): string | undefined {
  const direct = readString(event, [
    "session_id",
    "sessionId",
    "chat_id",
    "chatId",
    "conversation_id",
    "conversationId",
  ]);
  if (direct) {
    return direct;
  }
  const nested = readRecord(event, ["message", "data", "thread"]);
  return nested ? extractSessionId(nested) : undefined;
}

function extractUsage(source: Record<string, unknown>): AgentUsage | undefined {
  const usage = readRecord(source, ["usage", "token_usage", "tokenUsage"]);
  const record = usage ?? source;
  const inputTokens = readNumber(record, ["input_tokens", "inputTokens", "prompt_tokens"]);
  const cachedInputTokens = readNumber(record, [
    "cached_input_tokens",
    "cachedInputTokens",
    "cache_read_input_tokens",
  ]);
  const outputTokens = readNumber(record, ["output_tokens", "outputTokens", "completion_tokens"]);
  const totalCostUsd = readNumber(record, ["total_cost_usd", "totalCostUsd", "cost_usd"]);
  if (
    inputTokens === undefined &&
    cachedInputTokens === undefined &&
    outputTokens === undefined &&
    totalCostUsd === undefined
  ) {
    return undefined;
  }
  return { inputTokens, cachedInputTokens, outputTokens, totalCostUsd };
}

function isToolEvent(eventType: string, subtype: string, event: Record<string, unknown>): boolean {
  if (eventType.includes("tool") || subtype.includes("tool")) {
    return true;
  }
  return (
    readUnknown(event, ["tool_name", "toolName", "tool_call", "toolCall"]) !== undefined ||
    (readString(event, ["name"]) !== undefined && readUnknown(event, ["input"]) !== undefined)
  );
}

function isReasoningEvent(eventType: string, subtype: string): boolean {
  return (
    eventType.includes("thinking") || eventType.includes("reasoning") || subtype === "thinking"
  );
}

function isErrorEvent(eventType: string, subtype: string): boolean {
  return eventType.includes("error") || subtype === "error" || subtype === "failed";
}

function extractTextValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => extractTextValue(entry))
      .filter((entry): entry is string => Boolean(entry));
    return parts.length > 0 ? parts.join("") : undefined;
  }
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }
  return (
    extractTextValue(readUnknown(record, ["text", "content", "delta", "message", "result"])) ??
    extractTextValue(readUnknown(record, ["thinking", "reasoning"]))
  );
}

function readUnknown(record: Record<string, unknown> | null | undefined, keys: string[]): unknown {
  if (!record) {
    return undefined;
  }
  for (const key of keys) {
    if (record[key] !== undefined) {
      return record[key];
    }
  }
  return undefined;
}

function readRecord(
  record: Record<string, unknown> | null | undefined,
  keys: string[],
): Record<string, unknown> | null {
  return asRecord(readUnknown(record, keys));
}

function readString(
  record: Record<string, unknown> | null | undefined,
  keys: string[],
): string | undefined {
  const value = readUnknown(record, keys);
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function readNumber(
  record: Record<string, unknown> | null | undefined,
  keys: string[],
): number | undefined {
  const value = readUnknown(record, keys);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readBoolean(
  record: Record<string, unknown> | null | undefined,
  keys: string[],
): boolean | undefined {
  const value = readUnknown(record, keys);
  return typeof value === "boolean" ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function lower(value: string | undefined): string {
  return value?.toLowerCase() ?? "";
}

function stringifyCompact(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
