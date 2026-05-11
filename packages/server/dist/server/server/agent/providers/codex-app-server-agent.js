import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { z } from "zod";
import { loadCodexPersistedTimeline } from "./codex-rollout-timeline.js";
import { renderPromptAttachmentAsText } from "../prompt-attachments.js";
import { mapCodexRolloutToolCall, mapCodexToolCallFromThreadItem, } from "./codex/tool-call-mapper.js";
import { applyProviderEnv, resolveProviderCommandPrefix, } from "../provider-launch-config.js";
import { findExecutable, isCommandAvailable } from "../../../utils/executable.js";
import { spawnProcess } from "../../../utils/spawn.js";
import { extractCodexTerminalSessionId, nonEmptyString } from "./tool-call-mapper-utils.js";
import { buildCodexFeatures, codexModelSupportsFastMode } from "./codex-feature-definitions.js";
import { formatDiagnosticStatus, formatProviderDiagnostic, formatProviderDiagnosticError, resolveBinaryVersion, toDiagnosticErrorMessage, } from "./diagnostic-utils.js";
const DEFAULT_TIMEOUT_MS = 14 * 24 * 60 * 60 * 1000;
const TURN_START_TIMEOUT_MS = 90 * 1000;
const INTERRUPT_TIMEOUT_MS = 2000;
const APP_SERVER_GRACEFUL_SHUTDOWN_TIMEOUT_MS = 2000;
const APP_SERVER_FORCE_SHUTDOWN_TIMEOUT_MS = 1000;
const CODEX_PROVIDER = "codex";
const CODEX_IMAGE_ATTACHMENT_DIR = "paseo-attachments";
const CODEX_PLAN_IMPLEMENTATION_PROMPT_PREFIX = "The user approved the plan. Implement it now. Do not restate or revise the plan unless blocked.";
const CODEX_APP_SERVER_CAPABILITIES = {
    supportsStreaming: true,
    supportsSessionPersistence: true,
    supportsDynamicModes: false,
    supportsMcpServers: true,
    supportsReasoningStream: true,
    supportsToolInvocations: true,
};
const CODEX_MODES = [
    {
        id: "auto",
        label: "Default Permissions",
        description: "Edit files and run commands with Codex's default approval flow.",
    },
    {
        id: "full-access",
        label: "Full Access",
        description: "Edit files, run commands, and access the network without additional prompts.",
    },
];
const DEFAULT_CODEX_MODE_ID = "auto";
const MODE_PRESETS = {
    "read-only": {
        approvalPolicy: "on-request",
        sandbox: "read-only",
    },
    auto: {
        approvalPolicy: "on-request",
        sandbox: "workspace-write",
    },
    "full-access": {
        approvalPolicy: "never",
        sandbox: "danger-full-access",
        networkAccess: true,
    },
};
function validateCodexMode(modeId) {
    if (!(modeId in MODE_PRESETS)) {
        const validModes = Object.keys(MODE_PRESETS).join(", ");
        throw new Error(`Invalid Codex mode "${modeId}". Valid modes are: ${validModes}`);
    }
}
function normalizeCodexThinkingOptionId(thinkingOptionId) {
    if (typeof thinkingOptionId !== "string") {
        return undefined;
    }
    const normalized = thinkingOptionId.trim();
    if (!normalized || normalized === "default") {
        return undefined;
    }
    return normalized;
}
function normalizeCodexModelId(modelId) {
    if (typeof modelId !== "string") {
        return undefined;
    }
    const normalized = modelId.trim();
    if (!normalized) {
        return undefined;
    }
    return normalized;
}
function normalizeCodexModelLabel(displayName) {
    return displayName.replace(/\bgpt\b/gi, "GPT");
}
function isSchemaRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isObjectSchemaNode(schema) {
    const type = schema.type;
    return (isSchemaRecord(schema.properties) ||
        type === "object" ||
        (Array.isArray(type) && type.includes("object")));
}
function normalizeCodexOutputSchemaNode(schema, path) {
    if (Array.isArray(schema)) {
        return schema.map((entry, index) => normalizeCodexOutputSchemaNode(entry, `${path}[${index}]`));
    }
    if (!isSchemaRecord(schema)) {
        return schema;
    }
    const normalized = {};
    for (const [key, value] of Object.entries(schema)) {
        normalized[key] = normalizeCodexOutputSchemaNode(value, `${path}.${key}`);
    }
    if (!isObjectSchemaNode(normalized)) {
        return normalized;
    }
    if (normalized.additionalProperties === undefined) {
        normalized.additionalProperties = false;
    }
    else if (normalized.additionalProperties !== false) {
        throw new Error(`Codex structured outputs require ${path} to set additionalProperties to false for object schemas.`);
    }
    const properties = isSchemaRecord(normalized.properties) ? normalized.properties : null;
    if (!properties) {
        return normalized;
    }
    const propertyKeys = Object.keys(properties);
    const existingRequired = Array.isArray(normalized.required)
        ? normalized.required.filter((entry) => typeof entry === "string")
        : [];
    normalized.required = Array.from(new Set([...existingRequired, ...propertyKeys]));
    return normalized;
}
function normalizeCodexOutputSchema(schema) {
    if (!isSchemaRecord(schema)) {
        throw new Error("Codex structured outputs require a JSON object schema.");
    }
    const normalized = normalizeCodexOutputSchemaNode(schema, "$");
    if (!isSchemaRecord(normalized) || !isObjectSchemaNode(normalized)) {
        throw new Error("Codex structured outputs require a root object schema.");
    }
    return normalized;
}
function mergeCodexConfiguredDefaults(primary, fallback) {
    return {
        model: primary.model ?? fallback.model,
        thinkingOptionId: primary.thinkingOptionId ?? fallback.thinkingOptionId,
    };
}
async function resolveCodexBinary() {
    const found = await findExecutable("codex");
    if (found) {
        return found;
    }
    throw new Error("Codex binary not found. Install the Codex CLI (https://github.com/openai/codex) and ensure it is available in your shell PATH.");
}
async function resolveCodexLaunchPrefix(runtimeSettings) {
    return resolveProviderCommandPrefix(runtimeSettings?.command, resolveCodexBinary);
}
function resolveCodexHomeDir() {
    return process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
}
function tokenizeCommandArgs(args) {
    const tokens = [];
    let current = "";
    let quote = null;
    for (let i = 0; i < args.length; i += 1) {
        const ch = args[i];
        if (quote) {
            if (ch === quote) {
                quote = null;
                continue;
            }
            if (ch === "\\" && i + 1 < args.length) {
                const next = args[i + 1];
                if (next === quote || next === "\\" || next === "n" || next === "t") {
                    i += 1;
                    current += next === "n" ? "\n" : next === "t" ? "\t" : next;
                    continue;
                }
            }
            current += ch;
            continue;
        }
        if (ch === "'" || ch === '"') {
            quote = ch;
            continue;
        }
        if (/\s/.test(ch)) {
            if (current) {
                tokens.push(current);
                current = "";
            }
            continue;
        }
        current += ch;
    }
    if (current) {
        tokens.push(current);
    }
    return tokens;
}
function parseFrontMatter(markdown) {
    const lines = markdown.split("\n");
    if (lines[0]?.trim() !== "---") {
        return { frontMatter: {}, body: markdown };
    }
    let end = -1;
    for (let i = 1; i < lines.length; i += 1) {
        if (lines[i]?.trim() === "---") {
            end = i;
            break;
        }
    }
    if (end === -1) {
        return { frontMatter: {}, body: markdown };
    }
    const metaLines = lines.slice(1, end);
    const body = lines.slice(end + 1).join("\n");
    const frontMatter = {};
    for (const line of metaLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        const idx = trimmed.indexOf(":");
        if (idx <= 0) {
            continue;
        }
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        value = value.replace(/^['"]/, "").replace(/['"]$/, "");
        if (key && value) {
            frontMatter[key] = value;
        }
    }
    return { frontMatter, body };
}
async function listCodexCustomPrompts() {
    const codexHome = resolveCodexHomeDir();
    const promptsDir = path.join(codexHome, "prompts");
    let entries;
    try {
        entries = await fs.readdir(promptsDir, { withFileTypes: true });
    }
    catch {
        return [];
    }
    const commands = [];
    for (const entry of entries) {
        if (!entry.isFile()) {
            continue;
        }
        if (!entry.name.endsWith(".md")) {
            continue;
        }
        const name = entry.name.slice(0, -".md".length);
        if (!name) {
            continue;
        }
        const fullPath = path.join(promptsDir, entry.name);
        let content;
        try {
            content = await fs.readFile(fullPath, "utf8");
        }
        catch {
            continue;
        }
        const parsed = parseFrontMatter(content);
        const description = parsed.frontMatter["description"] ?? "Custom prompt";
        const argumentHint = parsed.frontMatter["argument-hint"] ?? parsed.frontMatter["argument_hint"] ?? "";
        commands.push({
            name: `prompts:${name}`,
            description,
            argumentHint,
        });
    }
    return commands.sort((a, b) => a.name.localeCompare(b.name));
}
async function listCodexSkills(cwd, workspaceGitService) {
    const candidates = [];
    candidates.push(path.join(cwd, ".codex", "skills"));
    const repoRoot = workspaceGitService
        ? await workspaceGitService.resolveRepoRoot(cwd).catch(() => null)
        : null;
    if (repoRoot) {
        candidates.push(path.join(path.dirname(cwd), ".codex", "skills"));
        candidates.push(path.join(repoRoot, ".codex", "skills"));
    }
    candidates.push(path.join(resolveCodexHomeDir(), "skills"));
    const commandsByName = new Map();
    for (const dir of candidates) {
        let entries;
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            if (!entry.isDirectory() && !entry.isSymbolicLink()) {
                continue;
            }
            const skillDir = path.join(dir, entry.name);
            const skillPath = path.join(skillDir, "SKILL.md");
            let content;
            try {
                content = await fs.readFile(skillPath, "utf8");
            }
            catch {
                continue;
            }
            const { frontMatter } = parseFrontMatter(content);
            const name = frontMatter["name"];
            const description = frontMatter["description"];
            if (!name || !description) {
                continue;
            }
            if (!commandsByName.has(name)) {
                commandsByName.set(name, {
                    name,
                    description,
                    argumentHint: "",
                });
            }
        }
    }
    return Array.from(commandsByName.values()).sort((a, b) => a.name.localeCompare(b.name));
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function expandCodexCustomPrompt(template, args) {
    const trimmedArgs = args ? args.trim() : "";
    const tokens = trimmedArgs ? tokenizeCommandArgs(trimmedArgs) : [];
    const named = {};
    const positional = [];
    for (const token of tokens) {
        const idx = token.indexOf("=");
        if (idx > 0) {
            const key = token.slice(0, idx);
            const value = token.slice(idx + 1);
            if (key) {
                named[key] = value;
                continue;
            }
        }
        positional.push(token);
    }
    const dollarPlaceholder = "__CODEX_DOLLAR_PLACEHOLDER__";
    let out = template.split("$$").join(dollarPlaceholder);
    out = out.split("$ARGUMENTS").join(trimmedArgs);
    for (let i = 1; i <= 9; i += 1) {
        const value = positional[i - 1] ?? "";
        out = out.split(`$${i}`).join(value);
    }
    const namedKeys = Object.keys(named).sort((a, b) => b.length - a.length);
    for (const key of namedKeys) {
        const value = named[key] ?? "";
        const re = new RegExp(`\\$${escapeRegExp(key)}\\b`, "g");
        out = out.replace(re, value);
    }
    out = out.split(dollarPlaceholder).join("$");
    return out;
}
function toCodexMcpConfig(config) {
    switch (config.type) {
        case "stdio":
            return {
                command: config.command,
                args: config.args,
                env: config.env,
            };
        case "http":
            return {
                url: config.url,
                http_headers: config.headers,
            };
        case "sse":
            return {
                url: config.url,
                http_headers: config.headers,
            };
    }
}
class CodexAppServerClient {
    constructor(child, logger) {
        this.child = child;
        this.logger = logger;
        this.pending = new Map();
        this.requestHandlers = new Map();
        this.notificationHandler = null;
        this.nextId = 1;
        this.disposed = false;
        this.stderrBuffer = "";
        this.resolveExitPromise = null;
        this.rl = readline.createInterface({ input: child.stdout });
        this.exitPromise = new Promise((resolve) => {
            this.resolveExitPromise = resolve;
        });
        this.rl.on("line", (line) => this.handleLine(line));
        child.stderr.on("data", (chunk) => {
            this.stderrBuffer += chunk.toString();
            if (this.stderrBuffer.length > 8192) {
                this.stderrBuffer = this.stderrBuffer.slice(-8192);
            }
        });
        child.on("error", (err) => {
            this.logger.error({ err }, "Codex app-server child process error");
            for (const pending of this.pending.values()) {
                clearTimeout(pending.timer);
                pending.reject(err);
            }
            this.pending.clear();
            this.disposed = true;
            this.resolveExitPromise?.();
            this.resolveExitPromise = null;
        });
        child.on("exit", (code, signal) => {
            const message = code === 0 && !signal
                ? "Codex app-server exited"
                : `Codex app-server exited with code ${code ?? "null"} and signal ${signal ?? "null"}`;
            const error = new Error(`${message}\n${this.stderrBuffer}`.trim());
            for (const pending of this.pending.values()) {
                clearTimeout(pending.timer);
                pending.reject(error);
            }
            this.pending.clear();
            this.disposed = true;
            this.resolveExitPromise?.();
            this.resolveExitPromise = null;
        });
    }
    setNotificationHandler(handler) {
        this.notificationHandler = handler;
    }
    setRequestHandler(method, handler) {
        this.requestHandlers.set(method, handler);
    }
    request(method, params, timeoutMs = DEFAULT_TIMEOUT_MS) {
        if (this.disposed) {
            return Promise.reject(new Error("Codex app-server client is closed"));
        }
        const id = this.nextId++;
        const payload = { id, method, params };
        const serialized = JSON.stringify(payload);
        this.child.stdin.write(`${serialized}\n`);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`Codex app-server request timed out for ${method}`));
            }, timeoutMs);
            this.pending.set(id, { resolve, reject, timer });
        });
    }
    notify(method, params) {
        if (this.disposed) {
            return;
        }
        const payload = { method, params };
        this.child.stdin.write(`${JSON.stringify(payload)}\n`);
    }
    writeJsonRpcResponse(response) {
        if (this.disposed || this.child.stdin.destroyed || !this.child.stdin.writable) {
            return;
        }
        try {
            this.child.stdin.write(`${JSON.stringify(response)}\n`);
        }
        catch (error) {
            this.logger.debug({ error }, "Failed to write Codex app-server JSON-RPC response");
        }
    }
    async dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.rl.close();
        try {
            this.child.stdin.end();
        }
        catch {
            // ignore
        }
        signalChildProcessTree(this.child, "SIGTERM");
        if (await this.waitForExit(APP_SERVER_GRACEFUL_SHUTDOWN_TIMEOUT_MS)) {
            return;
        }
        this.logger.warn({ timeoutMs: APP_SERVER_GRACEFUL_SHUTDOWN_TIMEOUT_MS }, "Codex app-server did not exit after SIGTERM; sending SIGKILL");
        signalChildProcessTree(this.child, "SIGKILL");
        if (await this.waitForExit(APP_SERVER_FORCE_SHUTDOWN_TIMEOUT_MS)) {
            return;
        }
        this.logger.warn({ timeoutMs: APP_SERVER_FORCE_SHUTDOWN_TIMEOUT_MS }, "Codex app-server did not report exit after SIGKILL");
    }
    async waitForExit(timeoutMs) {
        let timer = null;
        try {
            return await Promise.race([
                this.exitPromise.then(() => true),
                new Promise((resolve) => {
                    timer = setTimeout(() => resolve(false), timeoutMs);
                }),
            ]);
        }
        finally {
            if (timer) {
                clearTimeout(timer);
            }
        }
    }
    async handleLine(line) {
        if (!line.trim())
            return;
        let msg;
        try {
            msg = JSON.parse(line);
        }
        catch (error) {
            this.logger.warn({ error, line }, "Failed to parse Codex app-server JSON");
            return;
        }
        if (typeof msg.id === "number") {
            const id = msg.id;
            if (msg.result !== undefined || msg.error) {
                const pending = this.pending.get(id);
                if (!pending)
                    return;
                clearTimeout(pending.timer);
                this.pending.delete(id);
                if (msg.error) {
                    pending.reject(new Error(msg.error?.message ?? "Unknown error"));
                }
                else {
                    pending.resolve(msg.result);
                }
                return;
            }
            // Server-initiated request
            if (typeof msg.method === "string") {
                const request = msg;
                const handler = this.requestHandlers.get(request.method);
                try {
                    const result = handler ? await handler(request.params) : {};
                    this.writeJsonRpcResponse({ id: request.id, result });
                }
                catch (error) {
                    this.writeJsonRpcResponse({
                        id: request.id,
                        error: { message: error instanceof Error ? error.message : String(error) },
                    });
                }
                return;
            }
        }
        if (typeof msg.method === "string") {
            const notification = msg;
            this.notificationHandler?.(notification.method, notification.params);
        }
    }
}
function signalChildProcessTree(child, signal) {
    if (child.exitCode !== null || child.signalCode !== null) {
        return;
    }
    if (process.platform !== "win32" && typeof child.pid === "number" && child.pid > 0) {
        try {
            process.kill(-child.pid, signal);
            return;
        }
        catch {
            // Fall back to the direct child when no separate process group exists.
        }
    }
    try {
        child.kill(signal);
    }
    catch {
        // ignore
    }
}
function toAgentUsage(tokenUsage) {
    if (!tokenUsage || typeof tokenUsage !== "object")
        return undefined;
    const usage = tokenUsage;
    const contextWindowMaxTokens = typeof usage.model_context_window === "number" &&
        Number.isFinite(usage.model_context_window) &&
        usage.model_context_window > 0
        ? usage.model_context_window
        : typeof usage.modelContextWindow === "number" &&
            Number.isFinite(usage.modelContextWindow) &&
            usage.modelContextWindow > 0
            ? usage.modelContextWindow
            : undefined;
    const contextWindowUsedTokens = typeof usage.last?.total_tokens === "number" &&
        Number.isFinite(usage.last.total_tokens) &&
        usage.last.total_tokens > 0
        ? usage.last.total_tokens
        : typeof usage.last?.totalTokens === "number" &&
            Number.isFinite(usage.last.totalTokens) &&
            usage.last.totalTokens > 0
            ? usage.last.totalTokens
            : undefined;
    return {
        inputTokens: usage.last?.inputTokens,
        cachedInputTokens: usage.last?.cachedInputTokens,
        outputTokens: usage.last?.outputTokens,
        ...(contextWindowMaxTokens !== undefined ? { contextWindowMaxTokens } : {}),
        ...(contextWindowUsedTokens !== undefined ? { contextWindowUsedTokens } : {}),
    };
}
function extractUserText(content) {
    if (!Array.isArray(content))
        return null;
    const parts = [];
    for (const item of content) {
        if (item && typeof item === "object") {
            const obj = item;
            if (obj.type === "text" && typeof obj.text === "string") {
                parts.push(obj.text);
            }
        }
    }
    return parts.length > 0 ? parts.join("\n") : null;
}
function normalizePlanMarkdown(text) {
    return text
        .split("\n")
        .map((line) => line.replace(/\s+$/, ""))
        .join("\n")
        .trim();
}
function planStepsToMarkdown(steps) {
    const lines = steps
        .map((entry) => entry.step.trim())
        .filter((step) => step.length > 0)
        .map((step) => {
        if (/^(#{1,6}\s|[-*+]\s|\d+\.\s)/.test(step)) {
            return step;
        }
        return `- ${step}`;
    });
    return normalizePlanMarkdown(lines.join("\n"));
}
function mapCodexPlanToToolCall(params) {
    const text = normalizePlanMarkdown(params.text);
    if (!text) {
        return null;
    }
    return {
        type: "tool_call",
        callId: params.callId,
        name: "plan",
        status: "completed",
        error: null,
        detail: {
            type: "plan",
            text,
        },
    };
}
function buildPlanPermissionActions(options) {
    const actions = [
        {
            id: "reject",
            label: "Reject",
            behavior: "deny",
            variant: "danger",
            intent: "dismiss",
        },
        {
            id: "implement",
            label: "Implement",
            behavior: "allow",
            variant: "primary",
            intent: "implement",
        },
    ];
    if (options?.includeResumeAction && options.resumeLabel) {
        actions.push({
            id: "implement_resume",
            label: options.resumeLabel,
            behavior: "allow",
            variant: "secondary",
            intent: "implement_resume",
        });
    }
    return actions;
}
function buildCodexPlanImplementationPrompt(planText) {
    const normalizedPlan = normalizePlanMarkdown(planText);
    if (!normalizedPlan) {
        return `${CODEX_PLAN_IMPLEMENTATION_PROMPT_PREFIX} Make the required code changes and verify them.`;
    }
    return [
        CODEX_PLAN_IMPLEMENTATION_PROMPT_PREFIX,
        "Approved plan:",
        normalizedPlan,
        "Carry out the work, make the necessary code changes, and verify the result.",
    ].join("\n\n");
}
function normalizeCodexQuestionPrompts(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    const questions = [];
    for (const item of raw) {
        if (!item || typeof item !== "object") {
            continue;
        }
        const record = item;
        const id = nonEmptyString(record.id);
        const header = nonEmptyString(record.header);
        const question = nonEmptyString(record.question);
        if (!id || !header || !question) {
            continue;
        }
        const options = Array.isArray(record.options)
            ? record.options.flatMap((option) => {
                if (!option || typeof option !== "object") {
                    return [];
                }
                const optionRecord = option;
                const label = nonEmptyString(optionRecord.label);
                if (!label) {
                    return [];
                }
                return [
                    {
                        label,
                        ...(typeof optionRecord.description === "string" &&
                            optionRecord.description.trim().length > 0
                            ? { description: optionRecord.description }
                            : {}),
                    },
                ];
            })
            : [];
        questions.push({
            id,
            header,
            question,
            options,
            ...(record.multiSelect === true ? { multiSelect: true } : {}),
            ...(record.isOther === true ? { isOther: true } : {}),
            ...(record.isSecret === true ? { isSecret: true } : {}),
        });
    }
    return questions;
}
function formatCodexQuestionPrompts(questions) {
    return questions
        .map((question) => {
        const lines = [`${question.header}: ${question.question}`];
        if (question.options.length > 0) {
            lines.push(`Options: ${question.options.map((option) => option.label).join(", ")}`);
        }
        return lines.join("\n");
    })
        .join("\n\n")
        .trim();
}
function mapCodexQuestionRequestToToolCall(params) {
    const formattedQuestions = formatCodexQuestionPrompts(params.questions);
    const formattedAnswers = params.answers && Object.keys(params.answers).length > 0
        ? Object.entries(params.answers)
            .map(([id, values]) => `${id}: ${values.join(", ")}`)
            .join("\n")
        : null;
    const detailText = params.status === "completed" && formattedAnswers
        ? [formattedQuestions, "Answers:", formattedAnswers].filter(Boolean).join("\n\n")
        : formattedQuestions;
    const base = {
        type: "tool_call",
        callId: params.callId,
        name: "request_user_input",
        detail: {
            type: "plain_text",
            text: detailText,
            icon: "brain",
        },
        metadata: {
            questions: params.questions,
            ...(params.answers ? { answers: params.answers } : {}),
        },
    };
    if (params.status === "failed") {
        return {
            ...base,
            status: "failed",
            error: params.error ?? { message: "Question dismissed" },
        };
    }
    if (params.status === "canceled") {
        return {
            ...base,
            status: "canceled",
            error: null,
        };
    }
    if (params.status === "running") {
        return {
            ...base,
            status: "running",
            error: null,
        };
    }
    return {
        ...base,
        status: "completed",
        error: null,
    };
}
function mapCodexQuestionResponseByHeader(params) {
    if (params.response.behavior !== "allow") {
        return null;
    }
    const answersRecord = params.response.updatedInput && typeof params.response.updatedInput === "object"
        ? params.response.updatedInput.answers
        : undefined;
    if (!answersRecord || typeof answersRecord !== "object") {
        return null;
    }
    const answers = {};
    for (const question of params.questions) {
        const rawAnswer = answersRecord[question.header];
        if (typeof rawAnswer !== "string") {
            continue;
        }
        const normalizedAnswer = rawAnswer.trim();
        if (!normalizedAnswer) {
            continue;
        }
        const values = question.multiSelect
            ? normalizedAnswer
                .split(",")
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 0)
            : [normalizedAnswer];
        if (values.length > 0) {
            answers[question.id] = { answers: values };
        }
    }
    return Object.keys(answers).length > 0 ? answers : null;
}
function extractPatchLikeText(value) {
    if (!value || typeof value !== "object") {
        return undefined;
    }
    const record = value;
    const candidates = [
        record.diff,
        record.patch,
        record.unified_diff,
        record.unifiedDiff,
        record.content,
        record.newString,
    ];
    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.length > 0) {
            return candidate;
        }
    }
    return undefined;
}
function normalizeCodexThreadItemType(rawType) {
    if (!rawType) {
        return rawType;
    }
    switch (rawType) {
        case "UserMessage":
            return "userMessage";
        case "AgentMessage":
            return "agentMessage";
        case "Reasoning":
            return "reasoning";
        case "Plan":
            return "plan";
        case "CommandExecution":
            return "commandExecution";
        case "FileChange":
            return "fileChange";
        case "McpToolCall":
            return "mcpToolCall";
        case "WebSearch":
            return "webSearch";
        default:
            return rawType;
    }
}
function normalizeCodexCommandValue(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed.length) {
            return null;
        }
        const wrapperMatch = trimmed.match(/^(?:\/bin\/)?(?:zsh|bash|sh)\s+-(?:lc|c)\s+([\s\S]+)$/);
        if (!wrapperMatch) {
            return trimmed;
        }
        const candidate = wrapperMatch[1]?.trim() ?? "";
        if (!candidate.length) {
            return trimmed;
        }
        if ((candidate.startsWith('"') && candidate.endsWith('"')) ||
            (candidate.startsWith("'") && candidate.endsWith("'"))) {
            return candidate.slice(1, -1);
        }
        return candidate;
    }
    if (!Array.isArray(value)) {
        return null;
    }
    const parts = value
        .filter((entry) => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    if (parts.length === 0) {
        return null;
    }
    if (parts.length >= 3 && (parts[1] === "-lc" || parts[1] === "-c")) {
        return parts[2] ?? parts;
    }
    return parts;
}
function parseCodexPatchChanges(changes) {
    const resolvePathFromRecord = (record) => {
        const directPath = (typeof record.path === "string" && record.path.trim().length > 0
            ? record.path.trim()
            : "") ||
            (typeof record.file_path === "string" && record.file_path.trim().length > 0
                ? record.file_path.trim()
                : "") ||
            (typeof record.filePath === "string" && record.filePath.trim().length > 0
                ? record.filePath.trim()
                : "");
        return directPath;
    };
    if (!changes || typeof changes !== "object") {
        return [];
    }
    if (Array.isArray(changes)) {
        return changes
            .map((entry) => {
            if (!entry || typeof entry !== "object") {
                return null;
            }
            const record = entry;
            const pathValue = resolvePathFromRecord(record);
            if (!pathValue) {
                return null;
            }
            return {
                path: pathValue,
                kind: (typeof record.kind === "string" && record.kind) ||
                    (typeof record.type === "string" && record.type) ||
                    undefined,
                content: extractPatchLikeText(record),
            };
        })
            .filter((entry) => entry !== null);
    }
    const recordChanges = changes;
    const directPathValue = resolvePathFromRecord(recordChanges);
    if (directPathValue) {
        return [
            {
                path: directPathValue,
                kind: (typeof recordChanges.kind === "string" && recordChanges.kind) ||
                    (typeof recordChanges.type === "string" && recordChanges.type) ||
                    undefined,
                content: extractPatchLikeText(recordChanges),
            },
        ];
    }
    return Object.entries(recordChanges)
        .map(([path, value]) => {
        const normalizedPath = path.trim();
        if (!normalizedPath) {
            return null;
        }
        return {
            path: normalizedPath,
            kind: value &&
                typeof value === "object" &&
                typeof value.type === "string"
                ? (value.type ?? undefined)
                : undefined,
            content: extractPatchLikeText(value),
        };
    })
        .filter((entry) => entry !== null);
}
function codexPatchTextFields(text) {
    if (typeof text !== "string") {
        return {};
    }
    const normalized = text.trimStart();
    const looksLikeUnifiedDiff = normalized.startsWith("diff --git") ||
        normalized.startsWith("@@") ||
        normalized.startsWith("--- ") ||
        normalized.startsWith("+++ ");
    return looksLikeUnifiedDiff ? { patch: text } : { content: text };
}
function toRunningToolCall(item) {
    return {
        ...item,
        status: "running",
        error: null,
    };
}
function isEditToolCallWithoutContent(item) {
    if (item.type !== "tool_call") {
        return false;
    }
    if (item.detail.type !== "edit") {
        return false;
    }
    const hasDiff = typeof item.detail.unifiedDiff === "string" && item.detail.unifiedDiff.trim().length > 0;
    const hasNewString = typeof item.detail.newString === "string" && item.detail.newString.trim().length > 0;
    return !hasDiff && !hasNewString;
}
function decodeCodexOutputDeltaChunk(chunk) {
    const trimmed = chunk.trim();
    if (trimmed.length === 0) {
        return chunk;
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(trimmed) || trimmed.length % 4 !== 0) {
        return chunk;
    }
    try {
        const decoded = Buffer.from(trimmed, "base64").toString("utf8");
        if (decoded.length === 0) {
            return chunk;
        }
        const normalizedInput = trimmed.replace(/=+$/, "");
        const normalizedRoundTrip = Buffer.from(decoded, "utf8").toString("base64").replace(/=+$/, "");
        return normalizedRoundTrip === normalizedInput ? decoded : chunk;
    }
    catch {
        return chunk;
    }
}
function mapCodexExecNotificationToToolCall(params) {
    const command = normalizeCodexCommandValue(params.command);
    if (!command) {
        return null;
    }
    const isFailure = params.running
        ? false
        : params.success === false || (typeof params.exitCode === "number" && params.exitCode !== 0);
    const output = params.running
        ? null
        : {
            command,
            ...(params.output !== null && params.output !== undefined ? { output: params.output } : {}),
            ...(params.exitCode !== null && params.exitCode !== undefined
                ? { exitCode: params.exitCode }
                : {}),
        };
    const mapped = mapCodexRolloutToolCall({
        callId: params.callId ?? null,
        name: "shell",
        input: {
            command,
            ...(params.cwd ? { cwd: params.cwd } : {}),
        },
        output,
        error: isFailure ? { message: params.stderr?.trim() || "Command failed" } : null,
        cwd: params.cwd ?? null,
    });
    if (!mapped) {
        return null;
    }
    return params.running ? toRunningToolCall(mapped) : mapped;
}
function mapCodexPatchNotificationToToolCall(params) {
    const files = parseCodexPatchChanges(params.changes);
    const firstPath = files[0]?.path;
    const firstPatchText = files
        .map((file) => file.content?.trim())
        .find((value) => typeof value === "string" && value.length > 0);
    const patchText = firstPatchText;
    const patchFields = codexPatchTextFields(patchText);
    const mapped = mapCodexRolloutToolCall({
        callId: params.callId ?? null,
        name: "apply_patch",
        input: firstPath
            ? {
                path: firstPath,
                ...patchFields,
                files: files.map((file) => ({ path: file.path, kind: file.kind })),
            }
            : {
                changes: params.changes ?? null,
                ...patchFields,
            },
        output: params.running
            ? null
            : {
                ...(files.length > 0
                    ? {
                        files: files.map((file) => ({
                            path: file.path,
                            ...(file.kind ? { kind: file.kind } : {}),
                            ...codexPatchTextFields(file.content ?? patchText),
                        })),
                    }
                    : {}),
                ...(params.stdout ? { stdout: params.stdout } : {}),
                ...(params.stderr ? { stderr: params.stderr } : {}),
                ...(params.success !== null && params.success !== undefined
                    ? { success: params.success }
                    : {}),
            },
        error: params.running || params.success !== false
            ? null
            : { message: params.stderr?.trim() || "Patch apply failed" },
        cwd: params.cwd ?? null,
    });
    if (!mapped) {
        return null;
    }
    return params.running ? toRunningToolCall(mapped) : mapped;
}
function mapCodexTerminalInteractionToToolCall(params) {
    const processId = nonEmptyString(params.processId ?? undefined);
    const callId = processId
        ? `terminal-session-${processId}`
        : (nonEmptyString(params.fallbackCallId ?? undefined) ?? "terminal-interaction");
    const label = nonEmptyString(params.command ?? undefined);
    return {
        type: "tool_call",
        callId,
        name: "terminal",
        status: "completed",
        error: null,
        detail: {
            type: "plain_text",
            ...(label ? { label } : {}),
            icon: "square_terminal",
        },
        ...(processId ? { metadata: { processId } } : {}),
    };
}
function threadItemToTimeline(item, options) {
    if (!item || typeof item !== "object")
        return null;
    const includeUserMessage = options?.includeUserMessage ?? true;
    const cwd = options?.cwd ?? null;
    const normalizedType = normalizeCodexThreadItemType(typeof item.type === "string" ? item.type : undefined);
    const normalizedItem = normalizedType && normalizedType !== item.type
        ? { ...item, type: normalizedType }
        : item;
    switch (normalizedType) {
        case "userMessage": {
            if (!includeUserMessage) {
                return null;
            }
            const text = extractUserText(normalizedItem.content) ?? "";
            return { type: "user_message", text };
        }
        case "agentMessage": {
            return { type: "assistant_message", text: normalizedItem.text ?? "" };
        }
        case "plan": {
            return mapCodexPlanToToolCall({
                callId: nonEmptyString(normalizedItem.id ?? normalizedItem.itemId ?? undefined) ??
                    `plan:${normalizePlanMarkdown(normalizedItem.text ?? "")}`,
                text: normalizedItem.text ?? "",
            });
        }
        case "reasoning": {
            const summary = Array.isArray(normalizedItem.summary)
                ? normalizedItem.summary.join("\n")
                : "";
            const content = Array.isArray(normalizedItem.content)
                ? normalizedItem.content.join("\n")
                : "";
            const text = summary || content;
            return text ? { type: "reasoning", text } : null;
        }
        case "commandExecution":
        case "fileChange":
        case "mcpToolCall":
        case "webSearch":
            return mapCodexToolCallFromThreadItem(normalizedItem, { cwd });
        default:
            return null;
    }
}
function toSandboxPolicy(type, networkAccess) {
    switch (type) {
        case "read-only":
            return { type: "readOnly" };
        case "workspace-write":
            return { type: "workspaceWrite", networkAccess: networkAccess ?? false };
        case "danger-full-access":
            return { type: "dangerFullAccess" };
        default:
            return { type: "workspaceWrite", networkAccess: networkAccess ?? false };
    }
}
function getImageExtension(mimeType) {
    switch (mimeType) {
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        case "image/gif":
            return "gif";
        case "image/bmp":
            return "bmp";
        case "image/tiff":
            return "tiff";
        default:
            return "bin";
    }
}
function normalizeImageData(mimeType, data) {
    if (data.startsWith("data:")) {
        const match = data.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
            return { mimeType: match[1], data: match[2] };
        }
    }
    return { mimeType, data };
}
const ThreadStartedNotificationSchema = z
    .object({
    thread: z.object({ id: z.string() }).passthrough(),
})
    .passthrough();
const TurnStartedNotificationSchema = z
    .object({
    turn: z.object({ id: z.string() }).passthrough(),
})
    .passthrough();
const TurnCompletedNotificationSchema = z
    .object({
    turn: z
        .object({
        status: z.string(),
        error: z
            .object({
            message: z.string().optional(),
        })
            .passthrough()
            .nullable()
            .optional(),
    })
        .passthrough(),
})
    .passthrough();
const TurnPlanUpdatedNotificationSchema = z
    .object({
    plan: z.array(z
        .object({
        step: z.string().optional(),
        status: z.string().optional(),
    })
        .passthrough()),
})
    .passthrough();
const TurnDiffUpdatedNotificationSchema = z
    .object({
    diff: z.string(),
})
    .passthrough();
const ThreadTokenUsageUpdatedNotificationSchema = z
    .object({
    tokenUsage: z.unknown(),
})
    .passthrough();
const ItemTextDeltaNotificationSchema = z
    .object({
    itemId: z.string(),
    delta: z.string(),
})
    .passthrough();
const ItemLifecycleNotificationSchema = z
    .object({
    item: z
        .object({
        id: z.string().optional(),
        type: z.string().optional(),
    })
        .passthrough(),
})
    .passthrough();
const CodexEventTurnAbortedNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.literal("turn_aborted"),
        reason: z.string().optional(),
    })
        .passthrough(),
})
    .passthrough();
const CodexEventTaskCompleteNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.literal("task_complete"),
    })
        .passthrough(),
})
    .passthrough();
const CodexEventItemLifecycleNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.enum(["item_started", "item_completed"]),
        item: z
            .object({
            id: z.string().optional(),
            type: z.string().optional(),
        })
            .passthrough(),
    })
        .passthrough(),
})
    .passthrough();
const CodexEventExecCommandBeginNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.literal("exec_command_begin"),
        call_id: z.string().optional(),
        command: z.unknown().optional(),
        cwd: z.string().optional(),
    })
        .passthrough(),
})
    .passthrough();
const CodexEventExecCommandEndNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.literal("exec_command_end"),
        call_id: z.string().optional(),
        command: z.unknown().optional(),
        cwd: z.string().optional(),
        stdout: z.string().optional(),
        stderr: z.string().optional(),
        aggregated_output: z.string().optional(),
        aggregatedOutput: z.string().optional(),
        formatted_output: z.string().optional(),
        exit_code: z.number().nullable().optional(),
        exitCode: z.number().nullable().optional(),
        success: z.boolean().optional(),
    })
        .passthrough(),
})
    .passthrough();
const CodexEventExecCommandOutputDeltaNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.literal("exec_command_output_delta"),
        call_id: z.string().optional(),
        stream: z.string().optional(),
        chunk: z.string().optional(),
        delta: z.string().optional(),
    })
        .passthrough(),
})
    .passthrough();
const CodexEventTerminalInteractionNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.literal("terminal_interaction"),
        call_id: z.string().optional(),
        process_id: z.union([z.string(), z.number()]).optional(),
        stdin: z.string().optional(),
    })
        .passthrough(),
})
    .passthrough();
const ItemCommandExecutionTerminalInteractionNotificationSchema = z
    .object({
    itemId: z.string().optional(),
    processId: z.union([z.string(), z.number()]).optional(),
    stdin: z.string().optional(),
})
    .passthrough();
const CodexEventPatchApplyBeginNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.literal("patch_apply_begin"),
        call_id: z.string().optional(),
        changes: z.unknown().optional(),
    })
        .passthrough(),
})
    .passthrough();
const CodexEventPatchApplyEndNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.literal("patch_apply_end"),
        call_id: z.string().optional(),
        changes: z.unknown().optional(),
        stdout: z.string().optional(),
        stderr: z.string().optional(),
        success: z.boolean().optional(),
    })
        .passthrough(),
})
    .passthrough();
const ItemFileChangeOutputDeltaNotificationSchema = z
    .object({
    itemId: z.string(),
    delta: z.string().optional(),
    chunk: z.string().optional(),
})
    .passthrough();
const CodexEventTurnDiffNotificationSchema = z
    .object({
    msg: z
        .object({
        type: z.literal("turn_diff"),
        unified_diff: z.string().optional(),
        diff: z.string().optional(),
    })
        .passthrough(),
})
    .passthrough();
const CodexNotificationSchema = z.union([
    z
        .object({ method: z.literal("thread/started"), params: ThreadStartedNotificationSchema })
        .transform(({ params }) => ({
        kind: "thread_started",
        threadId: params.thread.id,
    })),
    z.object({ method: z.literal("thread/started"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({ method: z.literal("turn/started"), params: TurnStartedNotificationSchema })
        .transform(({ params }) => ({ kind: "turn_started", turnId: params.turn.id })),
    z.object({ method: z.literal("turn/started"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({ method: z.literal("turn/completed"), params: TurnCompletedNotificationSchema })
        .transform(({ params }) => ({
        kind: "turn_completed",
        status: params.turn.status,
        errorMessage: params.turn.error?.message ?? null,
    })),
    z.object({ method: z.literal("turn/completed"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({ method: z.literal("turn/plan/updated"), params: TurnPlanUpdatedNotificationSchema })
        .transform(({ params }) => ({
        kind: "plan_updated",
        plan: params.plan.map((entry) => ({
            step: entry.step ?? null,
            status: entry.status ?? null,
        })),
    })),
    z.object({ method: z.literal("turn/plan/updated"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({ method: z.literal("turn/diff/updated"), params: TurnDiffUpdatedNotificationSchema })
        .transform(({ params }) => ({ kind: "diff_updated", diff: params.diff })),
    z.object({ method: z.literal("turn/diff/updated"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("thread/tokenUsage/updated"),
        params: ThreadTokenUsageUpdatedNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "token_usage_updated",
        tokenUsage: params.tokenUsage,
    })),
    z.object({ method: z.literal("thread/tokenUsage/updated"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("item/agentMessage/delta"),
        params: ItemTextDeltaNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "agent_message_delta",
        itemId: params.itemId,
        delta: params.delta,
    })),
    z.object({ method: z.literal("item/agentMessage/delta"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("item/reasoning/summaryTextDelta"),
        params: ItemTextDeltaNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "reasoning_delta",
        itemId: params.itemId,
        delta: params.delta,
    })),
    z.object({ method: z.literal("item/reasoning/summaryTextDelta"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({ method: z.literal("item/completed"), params: ItemLifecycleNotificationSchema })
        .transform(({ params }) => ({
        kind: "item_completed",
        source: "item",
        item: params.item,
    })),
    z.object({ method: z.literal("item/completed"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({ method: z.literal("item/started"), params: ItemLifecycleNotificationSchema })
        .transform(({ params }) => ({
        kind: "item_started",
        source: "item",
        item: params.item,
    })),
    z.object({ method: z.literal("item/started"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/item_started"),
        params: CodexEventItemLifecycleNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "item_started",
        source: "codex_event",
        item: params.msg.item,
    })),
    z.object({ method: z.literal("codex/event/item_started"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/item_completed"),
        params: CodexEventItemLifecycleNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "item_completed",
        source: "codex_event",
        item: params.msg.item,
    })),
    z.object({ method: z.literal("codex/event/item_completed"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/exec_command_begin"),
        params: CodexEventExecCommandBeginNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "exec_command_started",
        callId: params.msg.call_id ?? null,
        command: params.msg.command ?? null,
        cwd: params.msg.cwd ?? null,
    })),
    z.object({ method: z.literal("codex/event/exec_command_begin"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/exec_command_end"),
        params: CodexEventExecCommandEndNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "exec_command_completed",
        callId: params.msg.call_id ?? null,
        command: params.msg.command ?? null,
        cwd: params.msg.cwd ?? null,
        output: params.msg.aggregated_output ??
            params.msg.aggregatedOutput ??
            params.msg.formatted_output ??
            params.msg.stdout ??
            null,
        exitCode: params.msg.exit_code ?? params.msg.exitCode ?? null,
        success: params.msg.success ?? null,
        stderr: params.msg.stderr ?? null,
    })),
    z.object({ method: z.literal("codex/event/exec_command_end"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/exec_command_output_delta"),
        params: CodexEventExecCommandOutputDeltaNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "exec_command_output_delta",
        callId: params.msg.call_id ?? null,
        stream: params.msg.stream ?? null,
        chunk: params.msg.chunk ?? params.msg.delta ?? null,
    })),
    z
        .object({
        method: z.literal("codex/event/exec_command_output_delta"),
        params: z.unknown(),
    })
        .transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/terminal_interaction"),
        params: CodexEventTerminalInteractionNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "terminal_interaction",
        source: "codex_event",
        callId: params.msg.call_id ?? null,
        processId: typeof params.msg.process_id === "number"
            ? String(params.msg.process_id)
            : (params.msg.process_id ?? null),
        stdin: params.msg.stdin ?? null,
    })),
    z
        .object({ method: z.literal("codex/event/terminal_interaction"), params: z.unknown() })
        .transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("item/commandExecution/terminalInteraction"),
        params: ItemCommandExecutionTerminalInteractionNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "terminal_interaction",
        source: "item",
        callId: params.itemId ?? null,
        processId: typeof params.processId === "number"
            ? String(params.processId)
            : (params.processId ?? null),
        stdin: params.stdin ?? null,
    })),
    z
        .object({
        method: z.literal("item/commandExecution/terminalInteraction"),
        params: z.unknown(),
    })
        .transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/patch_apply_begin"),
        params: CodexEventPatchApplyBeginNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "patch_apply_started",
        callId: params.msg.call_id ?? null,
        changes: params.msg.changes ?? null,
    })),
    z.object({ method: z.literal("codex/event/patch_apply_begin"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/patch_apply_end"),
        params: CodexEventPatchApplyEndNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "patch_apply_completed",
        callId: params.msg.call_id ?? null,
        changes: params.msg.changes ?? null,
        stdout: params.msg.stdout ?? null,
        stderr: params.msg.stderr ?? null,
        success: params.msg.success ?? null,
    })),
    z.object({ method: z.literal("codex/event/patch_apply_end"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("item/fileChange/outputDelta"),
        params: ItemFileChangeOutputDeltaNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "file_change_output_delta",
        itemId: params.itemId,
        delta: params.delta ?? params.chunk ?? null,
    })),
    z.object({ method: z.literal("item/fileChange/outputDelta"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/turn_diff"),
        params: CodexEventTurnDiffNotificationSchema,
    })
        .transform(({ params }) => ({
        kind: "diff_updated",
        diff: params.msg.unified_diff ?? params.msg.diff ?? "",
    })),
    z.object({ method: z.literal("codex/event/turn_diff"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/turn_aborted"),
        params: CodexEventTurnAbortedNotificationSchema,
    })
        .transform(() => ({
        kind: "turn_completed",
        status: "interrupted",
        errorMessage: null,
    })),
    z.object({ method: z.literal("codex/event/turn_aborted"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({
        method: z.literal("codex/event/task_complete"),
        params: CodexEventTaskCompleteNotificationSchema,
    })
        .transform(() => ({
        kind: "turn_completed",
        status: "completed",
        errorMessage: null,
    })),
    z.object({ method: z.literal("codex/event/task_complete"), params: z.unknown() }).transform(({ method, params }) => ({
        kind: "invalid_payload",
        method,
        params,
    })),
    z
        .object({ method: z.string(), params: z.unknown() })
        .transform(({ method, params }) => ({ kind: "unknown_method", method, params })),
]);
async function writeImageAttachment(mimeType, data) {
    const attachmentsDir = path.join(os.tmpdir(), CODEX_IMAGE_ATTACHMENT_DIR);
    await fs.mkdir(attachmentsDir, { recursive: true });
    const normalized = normalizeImageData(mimeType, data);
    const extension = getImageExtension(normalized.mimeType);
    const filename = `${randomUUID()}.${extension}`;
    const filePath = path.join(attachmentsDir, filename);
    await fs.writeFile(filePath, Buffer.from(normalized.data, "base64"));
    return filePath;
}
async function readCodexConfiguredDefaults(client, logger) {
    let savedConfigDefaults = {};
    try {
        const response = (await client.request("getUserSavedConfig", {}));
        savedConfigDefaults = {
            model: normalizeCodexModelId(response?.config?.model),
            thinkingOptionId: normalizeCodexThinkingOptionId(response?.config?.modelReasoningEffort ?? null),
        };
    }
    catch (error) {
        logger.debug({ error }, "Failed to read Codex saved config defaults");
    }
    if (savedConfigDefaults.model && savedConfigDefaults.thinkingOptionId) {
        return savedConfigDefaults;
    }
    let configReadDefaults = {};
    try {
        const response = (await client.request("config/read", {}));
        configReadDefaults = {
            model: normalizeCodexModelId(response?.config?.model),
            thinkingOptionId: normalizeCodexThinkingOptionId(response?.config?.model_reasoning_effort ?? null),
        };
    }
    catch (error) {
        logger.debug({ error }, "Failed to read Codex config defaults");
    }
    return mergeCodexConfiguredDefaults(savedConfigDefaults, configReadDefaults);
}
export async function codexAppServerTurnInputFromPrompt(prompt, logger) {
    if (typeof prompt === "string") {
        return [{ type: "text", text: prompt }];
    }
    const blocks = prompt;
    const output = [];
    for (const block of blocks) {
        if (!block || typeof block !== "object") {
            output.push(block);
            continue;
        }
        const record = block;
        if (record.type === "image" &&
            typeof record.mimeType === "string" &&
            typeof record.data === "string") {
            try {
                const filePath = await writeImageAttachment(record.mimeType, record.data);
                output.push({ type: "localImage", path: filePath });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logger.warn({ message }, "Failed to write Codex image attachment");
                output.push({
                    type: "text",
                    text: `User attached image (failed to write temp file): ${message}`,
                });
            }
            continue;
        }
        if (record.type === "github_pr" || record.type === "github_issue") {
            output.push({
                type: "text",
                text: renderPromptAttachmentAsText(record),
            });
            continue;
        }
        output.push(block);
    }
    return output;
}
function buildCodexAppServerEnv(runtimeSettings, launchEnv) {
    const env = applyProviderEnv(process.env, runtimeSettings);
    if (!launchEnv) {
        return env;
    }
    return {
        ...env,
        ...launchEnv,
    };
}
function buildCodexAppServerInitializeParams() {
    return {
        clientInfo: {
            name: "paseo",
            title: "Paseo",
            version: "0.0.0",
        },
        capabilities: {
            experimentalApi: true,
        },
    };
}
class CodexAppServerAgentSession {
    constructor(config, resumeHandle, logger, spawnAppServer, deps = {}) {
        this.resumeHandle = resumeHandle;
        this.spawnAppServer = spawnAppServer;
        this.deps = deps;
        this.provider = CODEX_PROVIDER;
        this.capabilities = CODEX_APP_SERVER_CAPABILITIES;
        this.currentThreadId = null;
        this.currentTurnId = null;
        this.client = null;
        this.subscribers = new Set();
        this.nextTurnOrdinal = 0;
        this.activeForegroundTurnId = null;
        this.cachedRuntimeInfo = null;
        this.serviceTier = null;
        this.planModeEnabled = false;
        this.historyPending = false;
        this.persistedHistory = [];
        this.pendingPermissions = new Map();
        this.pendingPermissionHandlers = new Map();
        this.resolvedPermissionRequests = new Set();
        this.pendingAgentMessages = new Map();
        this.pendingReasoning = new Map();
        this.pendingCommandOutputDeltas = new Map();
        this.pendingFileChangeOutputDeltas = new Map();
        this.terminalCommandByProcessId = new Map();
        this.pendingUnlabeledTerminalInteractions = new Set();
        this.emittedTerminalInteractionKeys = new Set();
        this.emittedExecCommandStartedCallIds = new Set();
        this.emittedExecCommandCompletedCallIds = new Set();
        this.emittedItemStartedIds = new Set();
        this.emittedItemCompletedIds = new Set();
        this.warnedUnknownNotificationMethods = new Set();
        this.warnedInvalidNotificationPayloads = new Set();
        this.warnedIncompleteEditToolCallIds = new Set();
        this.latestPlanResult = null;
        this.connected = false;
        this.collaborationModes = [];
        this.resolvedCollaborationMode = null;
        this.cachedSkills = [];
        this.logger = logger.child({ module: "agent", provider: CODEX_PROVIDER });
        if (config.modeId === undefined) {
            throw new Error("Codex agent requires modeId to be specified");
        }
        validateCodexMode(config.modeId);
        this.currentMode = config.modeId;
        this.config = config;
        this.config.thinkingOptionId = normalizeCodexThinkingOptionId(this.config.thinkingOptionId);
        if (this.config.featureValues?.fast_mode) {
            this.serviceTier = "fast";
        }
        if (this.config.featureValues?.plan_mode) {
            this.planModeEnabled = true;
        }
        if (this.resumeHandle?.sessionId) {
            this.currentThreadId = this.resumeHandle.sessionId;
            this.historyPending = true;
        }
    }
    get id() {
        return this.currentThreadId;
    }
    get features() {
        return buildCodexFeatures({
            modelId: this.config.model,
            fastModeEnabled: this.serviceTier === "fast",
            planModeEnabled: this.planModeEnabled,
            planModeAvailable: this.hasPlanCollaborationMode(),
        });
    }
    async connect() {
        if (this.connected)
            return;
        const child = await this.spawnAppServer();
        this.client = new CodexAppServerClient(child, this.logger);
        this.client.setNotificationHandler((method, params) => this.handleNotification(method, params));
        this.registerRequestHandlers();
        await this.client.request("initialize", buildCodexAppServerInitializeParams());
        this.client.notify("initialized", {});
        await this.loadCollaborationModes();
        await this.loadSkills();
        if (this.currentThreadId) {
            await this.loadPersistedHistory();
            await this.ensureThreadLoaded();
        }
        this.connected = true;
    }
    async loadCollaborationModes() {
        if (!this.client)
            return;
        try {
            const response = (await this.client.request("collaborationMode/list", {}));
            const data = Array.isArray(response?.data) ? response.data : [];
            this.collaborationModes = data.map((entry) => ({
                name: String(entry.name ?? ""),
                mode: entry.mode ?? null,
                model: entry.model ?? null,
                reasoning_effort: entry.reasoning_effort ?? null,
                developer_instructions: entry.developer_instructions ?? null,
            }));
        }
        catch (error) {
            this.logger.trace({ error }, "Failed to load collaboration modes");
            this.collaborationModes = [];
        }
        this.refreshResolvedCollaborationMode();
    }
    async loadSkills() {
        if (!this.client)
            return;
        try {
            const response = (await this.client.request("skills/list", {
                cwd: [this.config.cwd],
            }));
            const entries = Array.isArray(response?.data) ? response.data : [];
            const skills = [];
            for (const entry of entries) {
                const list = Array.isArray(entry.skills) ? entry.skills : [];
                for (const skill of list) {
                    if (!skill?.name || !skill?.path)
                        continue;
                    skills.push({
                        name: skill.name,
                        description: skill.description ?? skill.shortDescription ?? "Skill",
                        path: skill.path,
                    });
                }
            }
            this.cachedSkills = skills;
        }
        catch (error) {
            this.logger.trace({ error }, "Failed to load skills list");
            this.cachedSkills = [];
        }
    }
    findCollaborationMode(target) {
        if (this.collaborationModes.length === 0)
            return null;
        const findByName = (predicate) => this.collaborationModes.find((entry) => predicate(entry.name.toLowerCase()));
        if (target === "plan") {
            return findByName((name) => name.includes("plan") || name.includes("read")) ?? null;
        }
        return (findByName((name) => name.includes("auto") || name.includes("code")) ??
            this.collaborationModes.find((entry) => {
                const name = entry.name.toLowerCase();
                return !name.includes("plan") && !name.includes("read");
            }) ??
            this.collaborationModes[0] ??
            null);
    }
    hasPlanCollaborationMode() {
        return this.findCollaborationMode("plan") !== null;
    }
    resolveCollaborationMode() {
        const match = this.findCollaborationMode(this.planModeEnabled ? "plan" : "code");
        if (!match)
            return null;
        const settings = {};
        if (match.model)
            settings.model = match.model;
        if (match.reasoning_effort)
            settings.reasoning_effort = match.reasoning_effort;
        const developerInstructions = [
            match.developer_instructions?.trim(),
            this.config.systemPrompt?.trim(),
        ]
            .filter((entry) => typeof entry === "string" && entry.length > 0)
            .join("\n\n");
        if (developerInstructions)
            settings.developer_instructions = developerInstructions;
        if (this.config.model)
            settings.model = this.config.model;
        const thinkingOptionId = normalizeCodexThinkingOptionId(this.config.thinkingOptionId);
        if (thinkingOptionId)
            settings.reasoning_effort = thinkingOptionId;
        return { mode: match.mode ?? "code", settings, name: match.name };
    }
    refreshResolvedCollaborationMode() {
        this.resolvedCollaborationMode = this.resolveCollaborationMode();
    }
    applyFeatureValue(featureId, value) {
        this.config.featureValues = {
            ...(this.config.featureValues ?? {}),
            [featureId]: value,
        };
        if (featureId === "fast_mode") {
            this.serviceTier = value ? "fast" : null;
            this.cachedRuntimeInfo = null;
            return;
        }
        this.planModeEnabled = value;
        this.refreshResolvedCollaborationMode();
        this.cachedRuntimeInfo = null;
    }
    rememberPlanResult(item) {
        if (item.detail.type !== "plan") {
            return;
        }
        this.latestPlanResult = {
            callId: item.callId,
            text: item.detail.text,
            turnId: this.currentTurnId,
        };
    }
    emitSyntheticPlanApprovalRequest(planText) {
        const requestId = `permission-${randomUUID()}`;
        const request = {
            id: requestId,
            provider: CODEX_PROVIDER,
            name: "CodexPlanApproval",
            kind: "plan",
            title: "Plan",
            description: "Review the proposed plan before implementation starts.",
            input: { plan: planText },
            actions: buildPlanPermissionActions(),
            metadata: {
                planText,
                source: "codex_plan_approval",
            },
        };
        this.pendingPermissions.set(requestId, request);
        this.pendingPermissionHandlers.set(requestId, {
            resolve: () => undefined,
            kind: "plan",
            planText,
        });
        this.emitEvent({ type: "permission_requested", provider: CODEX_PROVIDER, request });
    }
    /**
     * Prepare the session for plan implementation by disabling plan mode
     * and returning the implementation prompt. The caller is responsible for
     * starting the turn through the normal streamAgent path.
     */
    preparePlanImplementation(params) {
        const planText = typeof params.planText === "string" ? normalizePlanMarkdown(params.planText) : "";
        this.applyFeatureValue("plan_mode", false);
        return buildCodexPlanImplementationPrompt(planText);
    }
    registerRequestHandlers() {
        if (!this.client)
            return;
        this.client.setRequestHandler("item/commandExecution/requestApproval", (params) => this.handleCommandApprovalRequest(params));
        this.client.setRequestHandler("item/fileChange/requestApproval", (params) => this.handleFileChangeApprovalRequest(params));
        this.client.setRequestHandler("item/tool/requestUserInput", (params) => this.handleToolApprovalRequest(params));
        // Keep the legacy method name for older Codex builds.
        this.client.setRequestHandler("tool/requestUserInput", (params) => this.handleToolApprovalRequest(params));
    }
    async loadPersistedHistory() {
        if (!this.client || !this.currentThreadId)
            return;
        try {
            let rolloutTimeline = [];
            try {
                rolloutTimeline = await loadCodexPersistedTimeline(this.currentThreadId, undefined, this.logger);
            }
            catch {
                rolloutTimeline = [];
            }
            const response = (await this.client.request("thread/read", {
                threadId: this.currentThreadId,
                includeTurns: true,
            }));
            const thread = response?.thread;
            const threadTimeline = [];
            if (thread && Array.isArray(thread.turns)) {
                for (const turn of thread.turns) {
                    const items = Array.isArray(turn.items) ? turn.items : [];
                    for (const item of items) {
                        const timelineItem = threadItemToTimeline(item, {
                            cwd: this.config.cwd ?? null,
                        });
                        if (timelineItem) {
                            if (timelineItem.type === "tool_call") {
                                this.warnOnIncompleteEditToolCall(timelineItem, "thread_read", item);
                            }
                            threadTimeline.push(timelineItem);
                        }
                    }
                }
            }
            const timeline = rolloutTimeline.length > 0 ? rolloutTimeline : threadTimeline;
            if (timeline.length > 0) {
                this.persistedHistory = timeline;
                this.historyPending = true;
            }
        }
        catch (error) {
            this.logger.warn({ error }, "Failed to load Codex thread history");
        }
    }
    async ensureThreadLoaded() {
        if (!this.client || !this.currentThreadId)
            return;
        try {
            const loaded = (await this.client.request("thread/loaded/list", {}));
            const ids = Array.isArray(loaded?.data) ? loaded.data : [];
            if (ids.includes(this.currentThreadId)) {
                return;
            }
            const params = { threadId: this.currentThreadId };
            if (this.config.systemPrompt?.trim()) {
                params.developerInstructions = this.config.systemPrompt.trim();
            }
            const codexConfig = this.buildCodexInnerConfig();
            if (codexConfig) {
                params.config = codexConfig;
            }
            await this.client.request("thread/resume", params);
        }
        catch (error) {
            this.logger.warn({ error }, "Failed to resume Codex thread, starting new thread");
            this.currentThreadId = null;
            await this.ensureThread();
        }
    }
    parseSlashCommandInput(text) {
        const trimmed = text.trim();
        if (!trimmed.startsWith("/") || trimmed.length <= 1) {
            return null;
        }
        const withoutPrefix = trimmed.slice(1);
        const firstWhitespaceIdx = withoutPrefix.search(/\s/);
        const commandName = firstWhitespaceIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, firstWhitespaceIdx);
        if (!commandName || commandName.includes("/")) {
            return null;
        }
        const rawArgs = firstWhitespaceIdx === -1 ? "" : withoutPrefix.slice(firstWhitespaceIdx + 1).trim();
        return rawArgs.length > 0 ? { commandName, args: rawArgs } : { commandName };
    }
    async resolveSlashCommandInvocation(prompt) {
        if (typeof prompt !== "string") {
            return null;
        }
        const parsed = this.parseSlashCommandInput(prompt);
        if (!parsed) {
            return null;
        }
        try {
            const commands = await this.listCommands();
            return commands.some((command) => command.name === parsed.commandName) ? parsed : null;
        }
        catch (error) {
            this.logger.warn({ err: error, commandName: parsed.commandName }, "Failed to resolve slash command; falling back to plain prompt input");
            return null;
        }
    }
    async buildCommandPromptInput(commandName, args) {
        if (commandName.startsWith("prompts:")) {
            const promptName = commandName.slice("prompts:".length);
            const codexHome = resolveCodexHomeDir();
            const promptPath = path.join(codexHome, "prompts", `${promptName}.md`);
            const raw = await fs.readFile(promptPath, "utf8");
            const parsed = parseFrontMatter(raw);
            return expandCodexCustomPrompt(parsed.body, args);
        }
        if (!this.connected) {
            await this.connect();
        }
        else {
            await this.loadSkills();
        }
        const skill = this.cachedSkills.find((entry) => entry.name === commandName);
        if (skill) {
            const input = [
                { type: "skill", name: skill.name, path: skill.path },
            ];
            if (args && args.trim().length > 0) {
                input.push({ type: "text", text: args.trim() });
            }
            else {
                input.push({ type: "text", text: `$${skill.name}` });
            }
            return input;
        }
        return args ? `$${commandName} ${args}` : `$${commandName}`;
    }
    async run(prompt, options) {
        const timeline = [];
        let finalText = "";
        let usage;
        let turnId = null;
        const bufferedEvents = [];
        let settled = false;
        let resolveCompletion;
        let rejectCompletion;
        const processEvent = (event) => {
            if (settled) {
                return;
            }
            const eventTurnId = event.turnId;
            if (turnId && eventTurnId && eventTurnId !== turnId) {
                return;
            }
            if (event.type === "timeline") {
                timeline.push(event.item);
                if (event.item.type === "assistant_message") {
                    finalText = event.item.text;
                }
                else if (event.item.type === "tool_call" && event.item.detail.type === "plan") {
                    finalText = event.item.detail.text;
                }
                return;
            }
            if (event.type === "turn_completed") {
                usage = event.usage;
                settled = true;
                resolveCompletion();
                return;
            }
            if (event.type === "turn_failed") {
                settled = true;
                rejectCompletion(new Error(event.error));
                return;
            }
            if (event.type === "turn_canceled") {
                settled = true;
                resolveCompletion();
            }
        };
        const completion = new Promise((resolve, reject) => {
            resolveCompletion = resolve;
            rejectCompletion = reject;
        });
        const unsubscribe = this.subscribe((event) => {
            if (!turnId) {
                bufferedEvents.push(event);
                return;
            }
            processEvent(event);
        });
        try {
            const result = await this.startTurn(prompt, options);
            turnId = result.turnId;
            for (const event of bufferedEvents) {
                processEvent(event);
            }
            if (!settled) {
                await completion;
            }
        }
        finally {
            unsubscribe();
        }
        const info = await this.getRuntimeInfo();
        return {
            sessionId: info.sessionId ?? "",
            finalText,
            usage,
            timeline,
        };
    }
    async startTurn(prompt, options) {
        if (this.activeForegroundTurnId) {
            throw new Error("A foreground turn is already active");
        }
        await this.connect();
        if (!this.client) {
            throw new Error("Codex client not initialized");
        }
        const slashCommand = await this.resolveSlashCommandInvocation(prompt);
        const effectivePrompt = slashCommand
            ? await this.buildCommandPromptInput(slashCommand.commandName, slashCommand.args)
            : prompt;
        if (this.currentThreadId) {
            await this.ensureThreadLoaded();
        }
        else {
            await this.ensureThread();
        }
        const input = await this.buildUserInput(effectivePrompt);
        const preset = MODE_PRESETS[this.currentMode] ?? MODE_PRESETS[DEFAULT_CODEX_MODE_ID];
        const approvalPolicy = this.config.approvalPolicy ?? preset.approvalPolicy;
        const sandboxPolicyType = this.config.sandboxMode ?? preset.sandbox;
        const params = {
            threadId: this.currentThreadId,
            input,
            approvalPolicy,
            sandboxPolicy: toSandboxPolicy(sandboxPolicyType, typeof this.config.networkAccess === "boolean"
                ? this.config.networkAccess
                : preset.networkAccess),
        };
        if (this.config.model) {
            params.model = this.config.model;
        }
        const thinkingOptionId = normalizeCodexThinkingOptionId(this.config.thinkingOptionId);
        if (thinkingOptionId) {
            params.effort = thinkingOptionId;
        }
        if (this.serviceTier) {
            params.serviceTier = this.serviceTier;
        }
        if (this.resolvedCollaborationMode) {
            params.collaborationMode = {
                mode: this.resolvedCollaborationMode.mode,
                settings: this.resolvedCollaborationMode.settings,
            };
        }
        if (this.config.cwd) {
            params.cwd = this.config.cwd;
        }
        if (options?.outputSchema) {
            params.outputSchema = normalizeCodexOutputSchema(options.outputSchema);
        }
        if (this.config.systemPrompt?.trim()) {
            params.developerInstructions = this.config.systemPrompt.trim();
        }
        const codexConfig = this.buildCodexInnerConfig();
        if (codexConfig) {
            params.config = codexConfig;
        }
        const turnId = this.createTurnId();
        this.activeForegroundTurnId = turnId;
        try {
            await this.client.request("turn/start", params, TURN_START_TIMEOUT_MS);
        }
        catch (error) {
            this.activeForegroundTurnId = null;
            throw error;
        }
        return { turnId };
    }
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => {
            this.subscribers.delete(callback);
        };
    }
    async *streamHistory() {
        if (!this.historyPending || this.persistedHistory.length === 0) {
            return;
        }
        const history = this.persistedHistory;
        this.persistedHistory = [];
        this.historyPending = false;
        for (const item of history) {
            yield { type: "timeline", provider: CODEX_PROVIDER, item };
        }
    }
    async getRuntimeInfo() {
        if (this.cachedRuntimeInfo)
            return { ...this.cachedRuntimeInfo };
        if (!this.connected) {
            await this.connect();
        }
        if (!this.currentThreadId) {
            await this.ensureThread();
        }
        const info = {
            provider: CODEX_PROVIDER,
            sessionId: this.currentThreadId,
            model: this.config.model ?? null,
            thinkingOptionId: normalizeCodexThinkingOptionId(this.config.thinkingOptionId) ?? null,
            modeId: this.currentMode ?? null,
            extra: this.resolvedCollaborationMode
                ? { collaborationMode: this.resolvedCollaborationMode.name }
                : undefined,
        };
        this.cachedRuntimeInfo = info;
        return { ...info };
    }
    async getAvailableModes() {
        return CODEX_MODES;
    }
    async getCurrentMode() {
        return this.currentMode ?? null;
    }
    async setMode(modeId) {
        validateCodexMode(modeId);
        this.currentMode = modeId;
        this.cachedRuntimeInfo = null;
    }
    async setModel(modelId) {
        this.config.model = modelId ?? undefined;
        if (!codexModelSupportsFastMode(this.config.model)) {
            this.serviceTier = null;
        }
        this.refreshResolvedCollaborationMode();
        this.cachedRuntimeInfo = null;
    }
    async setThinkingOption(thinkingOptionId) {
        this.config.thinkingOptionId = normalizeCodexThinkingOptionId(thinkingOptionId);
        this.refreshResolvedCollaborationMode();
        this.cachedRuntimeInfo = null;
    }
    async setFeature(featureId, value) {
        if (featureId === "fast_mode") {
            this.applyFeatureValue("fast_mode", Boolean(value));
            return;
        }
        if (featureId === "plan_mode") {
            this.applyFeatureValue("plan_mode", Boolean(value));
            return;
        }
        throw new Error(`Unknown Codex feature: ${featureId}`);
    }
    getPendingPermissions() {
        return Array.from(this.pendingPermissions.values());
    }
    async respondToPermission(requestId, response) {
        const pending = this.pendingPermissionHandlers.get(requestId);
        if (!pending) {
            throw new Error(`No pending Codex app-server permission request with id '${requestId}'`);
        }
        const pendingRequest = this.pendingPermissions.get(requestId) ?? null;
        if (pending.kind === "plan") {
            let followUpPrompt;
            if (response.behavior === "allow") {
                followUpPrompt = this.preparePlanImplementation({
                    planText: pending.planText ?? pendingRequest?.metadata?.planText,
                });
            }
            this.pendingPermissionHandlers.delete(requestId);
            this.pendingPermissions.delete(requestId);
            this.resolvedPermissionRequests.add(requestId);
            this.emitEvent({
                type: "permission_resolved",
                provider: CODEX_PROVIDER,
                requestId,
                resolution: response,
            });
            if (followUpPrompt) {
                return { followUpPrompt };
            }
            return;
        }
        this.pendingPermissionHandlers.delete(requestId);
        this.pendingPermissions.delete(requestId);
        this.resolvedPermissionRequests.add(requestId);
        if (response.behavior === "deny" && pendingRequest?.kind === "tool") {
            const fallbackName = pendingRequest.name === "CodexBash"
                ? "shell"
                : pendingRequest.name === "CodexFileChange"
                    ? "apply_patch"
                    : pendingRequest.name;
            this.emitEvent({
                type: "timeline",
                provider: CODEX_PROVIDER,
                item: {
                    type: "tool_call",
                    callId: requestId,
                    name: fallbackName,
                    status: "failed",
                    error: { message: response.message ?? "Permission denied" },
                    detail: pendingRequest.detail ?? {
                        type: "unknown",
                        input: pendingRequest.input ?? null,
                        output: null,
                    },
                    metadata: {
                        permissionRequestId: requestId,
                        denied: true,
                    },
                },
            });
        }
        this.emitEvent({
            type: "permission_resolved",
            provider: CODEX_PROVIDER,
            requestId,
            resolution: response,
        });
        if (pending.kind === "command") {
            const decision = response.behavior === "allow" ? "accept" : response.interrupt ? "cancel" : "decline";
            pending.resolve({ decision });
            return;
        }
        if (pending.kind === "file") {
            const decision = response.behavior === "allow" ? "accept" : response.interrupt ? "cancel" : "decline";
            pending.resolve({ decision });
            return;
        }
        const questions = pending.questions ?? [];
        const itemId = typeof pendingRequest?.metadata?.itemId === "string"
            ? pendingRequest.metadata.itemId
            : requestId;
        if (response.behavior === "allow") {
            const mappedAnswers = mapCodexQuestionResponseByHeader({
                questions,
                response,
            });
            const answers = mappedAnswers ??
                Object.fromEntries(questions
                    .map((question) => {
                    const fallback = question.options[0]?.label?.trim();
                    return fallback ? [question.id, { answers: [fallback] }] : null;
                })
                    .filter((entry) => entry !== null));
            this.emitEvent({
                type: "timeline",
                provider: CODEX_PROVIDER,
                item: mapCodexQuestionRequestToToolCall({
                    callId: itemId,
                    questions,
                    status: "completed",
                    answers: Object.fromEntries(Object.entries(answers).map(([id, value]) => [id, value.answers])),
                }),
            });
            pending.resolve({ answers });
            return;
        }
        this.emitEvent({
            type: "timeline",
            provider: CODEX_PROVIDER,
            item: mapCodexQuestionRequestToToolCall({
                callId: itemId,
                questions,
                status: response.interrupt ? "canceled" : "failed",
                error: { message: response.message ?? "Question dismissed" },
            }),
        });
        pending.resolve({ answers: {} });
    }
    describePersistence() {
        if (!this.currentThreadId)
            return null;
        const thinkingOptionId = normalizeCodexThinkingOptionId(this.config.thinkingOptionId) ?? null;
        return {
            provider: CODEX_PROVIDER,
            sessionId: this.currentThreadId,
            nativeHandle: this.currentThreadId,
            metadata: {
                provider: CODEX_PROVIDER,
                cwd: this.config.cwd,
                title: this.config.title ?? null,
                threadId: this.currentThreadId,
                modeId: this.currentMode,
                model: this.config.model ?? null,
                thinkingOptionId,
                extra: this.config.extra,
                systemPrompt: this.config.systemPrompt,
                mcpServers: this.config.mcpServers,
            },
        };
    }
    async interrupt() {
        if (!this.client || !this.currentThreadId || !this.currentTurnId)
            return;
        try {
            await this.client.request("turn/interrupt", {
                threadId: this.currentThreadId,
                turnId: this.currentTurnId,
            }, INTERRUPT_TIMEOUT_MS);
        }
        catch (error) {
            this.logger.warn({ error }, "Failed to interrupt Codex turn");
        }
    }
    async close() {
        for (const pending of this.pendingPermissionHandlers.values()) {
            pending.resolve({ decision: "cancel" });
        }
        this.pendingPermissionHandlers.clear();
        this.pendingPermissions.clear();
        this.resolvedPermissionRequests.clear();
        this.subscribers.clear();
        this.activeForegroundTurnId = null;
        if (this.client) {
            await this.client.dispose();
        }
        this.client = null;
        this.connected = false;
        this.currentThreadId = null;
        this.currentTurnId = null;
    }
    async listCommands() {
        const prompts = await listCodexCustomPrompts();
        if (!this.connected) {
            await this.connect();
        }
        else {
            await this.loadSkills();
        }
        const appServerSkills = this.cachedSkills.map((skill) => ({
            name: skill.name,
            description: skill.description,
            argumentHint: "",
        }));
        const fallbackSkills = appServerSkills.length === 0
            ? await listCodexSkills(this.config.cwd, this.deps.workspaceGitService)
            : [];
        return [...appServerSkills, ...fallbackSkills, ...prompts].sort((a, b) => a.name.localeCompare(b.name));
    }
    async ensureThread() {
        if (!this.client)
            return;
        if (this.currentThreadId)
            return;
        // Resolve model + thinking defaults when omitted.
        let configuredDefaults = {};
        let model = this.config.model;
        let thinkingOptionId = normalizeCodexThinkingOptionId(this.config.thinkingOptionId);
        if (!model || !thinkingOptionId) {
            configuredDefaults = await readCodexConfiguredDefaults(this.client, this.logger);
        }
        if (!model) {
            model = configuredDefaults.model;
        }
        if (!thinkingOptionId) {
            thinkingOptionId = configuredDefaults.thinkingOptionId;
        }
        if (!model || !thinkingOptionId) {
            const modelResponse = (await this.client.request("model/list", {}));
            const models = modelResponse?.data ?? [];
            const defaultModel = models.find((m) => m.isDefault) ?? models[0];
            if (!defaultModel) {
                throw new Error("No models available from Codex app-server");
            }
            const selectedModel = (model ? models.find((candidate) => candidate.id === model) : undefined) ?? defaultModel;
            if (!model) {
                model = selectedModel.id;
            }
            if (!thinkingOptionId) {
                thinkingOptionId = normalizeCodexThinkingOptionId(selectedModel.defaultReasoningEffort);
            }
        }
        this.config.model = model;
        this.config.thinkingOptionId = thinkingOptionId;
        const preset = MODE_PRESETS[this.currentMode] ?? MODE_PRESETS[DEFAULT_CODEX_MODE_ID];
        const approvalPolicy = this.config.approvalPolicy ?? preset.approvalPolicy;
        const sandbox = this.config.sandboxMode ?? preset.sandbox;
        const innerConfig = this.buildCodexInnerConfig();
        const response = (await this.client.request("thread/start", {
            model,
            cwd: this.config.cwd ?? null,
            approvalPolicy,
            sandbox,
            ...(this.config.systemPrompt?.trim()
                ? { developerInstructions: this.config.systemPrompt.trim() }
                : {}),
            ...(innerConfig ? { config: innerConfig } : {}),
        }));
        const threadId = response?.thread?.id;
        if (!threadId) {
            throw new Error("Codex app-server did not return thread id");
        }
        this.currentThreadId = threadId;
    }
    buildCodexInnerConfig() {
        const innerConfig = {};
        if (this.config.mcpServers) {
            const mcpServers = {};
            for (const [name, serverConfig] of Object.entries(this.config.mcpServers)) {
                mcpServers[name] = toCodexMcpConfig(serverConfig);
            }
            innerConfig.mcp_servers = mcpServers;
        }
        if (this.config.extra?.codex) {
            Object.assign(innerConfig, this.config.extra.codex);
        }
        return Object.keys(innerConfig).length > 0 ? innerConfig : null;
    }
    async buildUserInput(prompt) {
        if (typeof prompt === "string") {
            return [{ type: "text", text: prompt }];
        }
        const blocks = prompt;
        return await codexAppServerTurnInputFromPrompt(blocks, this.logger);
    }
    emitEvent(event) {
        if (event.type === "timeline") {
            if (event.item.type === "assistant_message") {
                this.pendingAgentMessages.clear();
            }
        }
        this.notifySubscribers(event);
    }
    notifySubscribers(event) {
        const turnId = this.activeForegroundTurnId;
        const tagged = turnId ? { ...event, turnId } : event;
        for (const callback of this.subscribers) {
            try {
                callback(tagged);
            }
            catch (error) {
                this.logger.warn({ err: error }, "Subscriber callback threw");
            }
        }
    }
    createTurnId() {
        return `codex-turn-${this.nextTurnOrdinal++}`;
    }
    handleNotification(method, params) {
        const parsed = CodexNotificationSchema.parse({ method, params });
        if (parsed.kind === "thread_started") {
            this.currentThreadId = parsed.threadId;
            this.emitEvent({
                type: "thread_started",
                provider: CODEX_PROVIDER,
                sessionId: parsed.threadId,
            });
            return;
        }
        if (parsed.kind === "turn_started") {
            this.currentTurnId = parsed.turnId;
            this.latestPlanResult = null;
            this.emittedItemStartedIds.clear();
            this.emittedItemCompletedIds.clear();
            this.emittedExecCommandStartedCallIds.clear();
            this.emittedExecCommandCompletedCallIds.clear();
            this.pendingCommandOutputDeltas.clear();
            this.pendingFileChangeOutputDeltas.clear();
            this.warnedIncompleteEditToolCallIds.clear();
            this.emitEvent({ type: "turn_started", provider: CODEX_PROVIDER });
            return;
        }
        if (parsed.kind === "turn_completed") {
            if (parsed.status === "failed") {
                this.emitEvent({
                    type: "turn_failed",
                    provider: CODEX_PROVIDER,
                    error: parsed.errorMessage ?? "Codex turn failed",
                });
            }
            else if (parsed.status === "interrupted") {
                this.emitEvent({ type: "turn_canceled", provider: CODEX_PROVIDER, reason: "interrupted" });
            }
            else {
                if (this.planModeEnabled && this.latestPlanResult?.text) {
                    this.emitSyntheticPlanApprovalRequest(this.latestPlanResult.text);
                }
                this.emitEvent({
                    type: "turn_completed",
                    provider: CODEX_PROVIDER,
                    usage: this.latestUsage,
                });
            }
            this.activeForegroundTurnId = null;
            this.latestPlanResult = null;
            this.emittedItemStartedIds.clear();
            this.emittedItemCompletedIds.clear();
            this.emittedExecCommandStartedCallIds.clear();
            this.emittedExecCommandCompletedCallIds.clear();
            this.pendingCommandOutputDeltas.clear();
            this.pendingFileChangeOutputDeltas.clear();
            this.warnedIncompleteEditToolCallIds.clear();
            return;
        }
        if (parsed.kind === "plan_updated") {
            const timelineItem = mapCodexPlanToToolCall({
                callId: `plan:${this.currentTurnId ?? this.currentThreadId ?? "current"}`,
                text: planStepsToMarkdown(parsed.plan.map((entry) => ({
                    step: entry.step ?? "",
                    status: entry.status ?? "pending",
                }))),
            });
            if (timelineItem) {
                this.rememberPlanResult(timelineItem);
                this.emitEvent({
                    type: "timeline",
                    provider: CODEX_PROVIDER,
                    item: timelineItem,
                });
            }
            return;
        }
        if (parsed.kind === "diff_updated") {
            // NOTE: Codex app-server emits frequent `turn/diff/updated` notifications
            // containing a full accumulated unified diff for the *entire turn*.
            // This is not a concrete file-change tool call; it is progress telemetry.
            // We intentionally do NOT store every diff update in the timeline.
            return;
        }
        if (parsed.kind === "token_usage_updated") {
            this.latestUsage = toAgentUsage(parsed.tokenUsage);
            if (this.latestUsage) {
                this.notifySubscribers({
                    type: "usage_updated",
                    provider: CODEX_PROVIDER,
                    usage: this.latestUsage,
                });
            }
            return;
        }
        if (parsed.kind === "agent_message_delta") {
            const prev = this.pendingAgentMessages.get(parsed.itemId) ?? "";
            this.pendingAgentMessages.set(parsed.itemId, prev + parsed.delta);
            return;
        }
        if (parsed.kind === "reasoning_delta") {
            const prev = this.pendingReasoning.get(parsed.itemId) ?? [];
            prev.push(parsed.delta);
            this.pendingReasoning.set(parsed.itemId, prev);
            return;
        }
        if (parsed.kind === "exec_command_output_delta") {
            this.appendOutputDeltaChunk(this.pendingCommandOutputDeltas, parsed.callId, parsed.chunk, {
                decodeBase64: true,
            });
            return;
        }
        if (parsed.kind === "file_change_output_delta") {
            this.appendOutputDeltaChunk(this.pendingFileChangeOutputDeltas, parsed.itemId, parsed.delta);
            return;
        }
        if (parsed.kind === "exec_command_started") {
            if (parsed.callId) {
                this.emittedExecCommandStartedCallIds.add(parsed.callId);
                this.pendingCommandOutputDeltas.delete(parsed.callId);
            }
            const timelineItem = mapCodexExecNotificationToToolCall({
                callId: parsed.callId,
                command: parsed.command,
                cwd: parsed.cwd ?? this.config.cwd ?? null,
                running: true,
            });
            if (timelineItem) {
                this.emitEvent({ type: "timeline", provider: CODEX_PROVIDER, item: timelineItem });
            }
            return;
        }
        if (parsed.kind === "exec_command_completed") {
            const bufferedOutput = this.consumeOutputDelta(this.pendingCommandOutputDeltas, parsed.callId);
            const resolvedOutput = parsed.output ?? bufferedOutput;
            this.rememberTerminalProcessForCommand(parsed.command, resolvedOutput);
            const timelineItem = mapCodexExecNotificationToToolCall({
                callId: parsed.callId,
                command: parsed.command,
                cwd: parsed.cwd ?? this.config.cwd ?? null,
                output: resolvedOutput,
                exitCode: parsed.exitCode,
                success: parsed.success,
                stderr: parsed.stderr,
                running: false,
            });
            if (timelineItem) {
                this.emittedExecCommandCompletedCallIds.add(timelineItem.callId);
                this.emitEvent({ type: "timeline", provider: CODEX_PROVIDER, item: timelineItem });
            }
            return;
        }
        if (parsed.kind === "terminal_interaction") {
            const interactionKey = [parsed.processId ?? "", parsed.stdin ?? ""].join("\u0000");
            if (!this.shouldEmitTerminalInteractionKey(interactionKey)) {
                return;
            }
            const command = (parsed.processId ? this.terminalCommandByProcessId.get(parsed.processId) : undefined) ??
                null;
            if (!command && parsed.processId) {
                this.pendingUnlabeledTerminalInteractions.add(parsed.processId);
            }
            const timelineItem = mapCodexTerminalInteractionToToolCall({
                processId: parsed.processId,
                fallbackCallId: parsed.callId,
                command,
            });
            this.emitEvent({ type: "timeline", provider: CODEX_PROVIDER, item: timelineItem });
            return;
        }
        if (parsed.kind === "patch_apply_started") {
            if (parsed.callId) {
                this.pendingFileChangeOutputDeltas.delete(parsed.callId);
            }
            const timelineItem = mapCodexPatchNotificationToToolCall({
                callId: parsed.callId,
                changes: parsed.changes,
                cwd: this.config.cwd ?? null,
                running: true,
            });
            if (timelineItem) {
                this.warnOnIncompleteEditToolCall(timelineItem, "patch_apply_started", {
                    callId: parsed.callId,
                    changes: parsed.changes,
                });
                this.emitEvent({ type: "timeline", provider: CODEX_PROVIDER, item: timelineItem });
            }
            return;
        }
        if (parsed.kind === "patch_apply_completed") {
            const bufferedOutput = this.consumeOutputDelta(this.pendingFileChangeOutputDeltas, parsed.callId);
            const timelineItem = mapCodexPatchNotificationToToolCall({
                callId: parsed.callId,
                changes: parsed.changes,
                cwd: this.config.cwd ?? null,
                stdout: parsed.stdout ?? bufferedOutput,
                stderr: parsed.stderr,
                success: parsed.success,
                running: false,
            });
            if (timelineItem) {
                this.warnOnIncompleteEditToolCall(timelineItem, "patch_apply_completed", {
                    callId: parsed.callId,
                    changes: parsed.changes,
                    stdout: parsed.stdout,
                });
                this.emitEvent({ type: "timeline", provider: CODEX_PROVIDER, item: timelineItem });
            }
            return;
        }
        if (parsed.kind === "item_completed") {
            // Codex emits mirrored lifecycle notifications via both `codex/event/item_*`
            // and canonical `item/*`. We render only the canonical channel to avoid
            // duplicated assistant/reasoning rows.
            if (parsed.source === "codex_event") {
                return;
            }
            const timelineItem = threadItemToTimeline(parsed.item, {
                includeUserMessage: false,
                cwd: this.config.cwd ?? null,
            });
            if (timelineItem) {
                const normalizedItemType = normalizeCodexThreadItemType(typeof parsed.item.type === "string" ? parsed.item.type : undefined);
                const itemId = parsed.item.id;
                // For commandExecution items, codex/event/exec_command_* is authoritative.
                // Keep item/completed as fallback only when no exec_command completion was seen.
                if (timelineItem.type === "tool_call" && normalizedItemType === "commandExecution") {
                    const callId = timelineItem.callId || itemId;
                    if (callId && this.emittedExecCommandCompletedCallIds.has(callId)) {
                        return;
                    }
                }
                if (itemId && this.emittedItemCompletedIds.has(itemId)) {
                    return;
                }
                if (timelineItem.type === "assistant_message" && itemId) {
                    const buffered = this.pendingAgentMessages.get(itemId);
                    if (buffered && buffered.length > 0) {
                        timelineItem.text = buffered;
                    }
                }
                if (timelineItem.type === "reasoning" && itemId) {
                    const buffered = this.pendingReasoning.get(itemId);
                    if (buffered && buffered.length > 0) {
                        timelineItem.text = buffered.join("");
                    }
                }
                if (timelineItem.type === "tool_call") {
                    if (timelineItem.detail.type === "plan") {
                        this.rememberPlanResult(timelineItem);
                    }
                    this.warnOnIncompleteEditToolCall(timelineItem, "item_completed", parsed.item);
                }
                this.emitEvent({ type: "timeline", provider: CODEX_PROVIDER, item: timelineItem });
                if (itemId) {
                    this.emittedItemCompletedIds.add(itemId);
                    this.emittedItemStartedIds.delete(itemId);
                    this.pendingCommandOutputDeltas.delete(itemId);
                    this.pendingFileChangeOutputDeltas.delete(itemId);
                }
            }
            return;
        }
        if (parsed.kind === "item_started") {
            if (parsed.source === "codex_event") {
                return;
            }
            const timelineItem = threadItemToTimeline(parsed.item, {
                includeUserMessage: false,
                cwd: this.config.cwd ?? null,
            });
            if (timelineItem && timelineItem.type === "tool_call") {
                const normalizedItemType = normalizeCodexThreadItemType(typeof parsed.item.type === "string" ? parsed.item.type : undefined);
                const itemId = parsed.item.id;
                if (normalizedItemType === "commandExecution") {
                    const callId = timelineItem.callId || itemId;
                    if (callId && this.emittedExecCommandStartedCallIds.has(callId)) {
                        return;
                    }
                }
                if (itemId && this.emittedItemStartedIds.has(itemId)) {
                    return;
                }
                this.warnOnIncompleteEditToolCall(timelineItem, "item_started", parsed.item);
                this.emitEvent({ type: "timeline", provider: CODEX_PROVIDER, item: timelineItem });
                if (itemId) {
                    this.emittedItemStartedIds.add(itemId);
                    this.pendingCommandOutputDeltas.delete(itemId);
                    this.pendingFileChangeOutputDeltas.delete(itemId);
                }
            }
            return;
        }
        if (parsed.kind === "invalid_payload") {
            this.warnInvalidNotificationPayload(parsed.method, parsed.params);
            return;
        }
        this.warnUnknownNotificationMethod(parsed.method, parsed.params);
    }
    warnUnknownNotificationMethod(method, params) {
        if (this.warnedUnknownNotificationMethods.has(method)) {
            return;
        }
        this.warnedUnknownNotificationMethods.add(method);
        this.logger.trace({ method, params }, "Unhandled Codex app-server notification method");
    }
    warnInvalidNotificationPayload(method, params) {
        const key = method;
        if (this.warnedInvalidNotificationPayloads.has(key)) {
            return;
        }
        this.warnedInvalidNotificationPayloads.add(key);
        this.logger.warn({ method, params }, "Invalid Codex app-server notification payload");
    }
    appendOutputDeltaChunk(store, id, chunk, options) {
        if (!id || !chunk) {
            return;
        }
        const normalized = options?.decodeBase64 ? decodeCodexOutputDeltaChunk(chunk) : chunk;
        if (!normalized.length) {
            return;
        }
        const prev = store.get(id) ?? [];
        prev.push(normalized);
        store.set(id, prev);
    }
    consumeOutputDelta(store, id) {
        if (!id) {
            return null;
        }
        const buffered = store.get(id);
        if (!buffered || buffered.length === 0) {
            return null;
        }
        store.delete(id);
        return buffered.join("");
    }
    rememberTerminalProcessForCommand(command, output) {
        const normalizedCommand = normalizeCodexCommandValue(command);
        if (!normalizedCommand) {
            return;
        }
        const displayCommand = typeof normalizedCommand === "string"
            ? normalizedCommand
            : normalizedCommand.join(" ").trim();
        if (!displayCommand) {
            return;
        }
        const processId = extractCodexTerminalSessionId(output ?? undefined);
        if (!processId) {
            return;
        }
        this.terminalCommandByProcessId.set(processId, displayCommand);
        if (!this.pendingUnlabeledTerminalInteractions.has(processId)) {
            return;
        }
        this.pendingUnlabeledTerminalInteractions.delete(processId);
        this.emitEvent({
            type: "timeline",
            provider: CODEX_PROVIDER,
            item: mapCodexTerminalInteractionToToolCall({
                processId,
                command: displayCommand,
            }),
        });
    }
    shouldEmitTerminalInteractionKey(key) {
        if (this.emittedTerminalInteractionKeys.has(key)) {
            return false;
        }
        this.emittedTerminalInteractionKeys.add(key);
        return true;
    }
    warnOnIncompleteEditToolCall(item, source, payload) {
        if (!isEditToolCallWithoutContent(item)) {
            return;
        }
        const warnKey = `${source}:${item.callId}`;
        if (this.warnedIncompleteEditToolCallIds.has(warnKey)) {
            return;
        }
        this.warnedIncompleteEditToolCallIds.add(warnKey);
        this.logger.warn({
            source,
            callId: item.callId,
            status: item.status,
            name: item.name,
            detail: item.detail,
            payload,
        }, "Codex edit tool call is missing diff/content fields");
    }
    handleCommandApprovalRequest(params) {
        const parsed = params;
        const commandPreview = mapCodexExecNotificationToToolCall({
            callId: parsed.itemId,
            command: parsed.command,
            cwd: parsed.cwd ?? this.config.cwd ?? null,
            running: true,
        });
        const requestId = `permission-${parsed.itemId}`;
        const title = parsed.command ? `Run command: ${parsed.command}` : "Run command";
        const request = {
            id: requestId,
            provider: CODEX_PROVIDER,
            name: "CodexBash",
            kind: "tool",
            title,
            description: parsed.reason ?? undefined,
            input: {
                command: parsed.command ?? undefined,
                cwd: parsed.cwd ?? undefined,
            },
            detail: commandPreview?.detail ?? {
                type: "unknown",
                input: {
                    command: parsed.command ?? null,
                    cwd: parsed.cwd ?? null,
                },
                output: null,
            },
            metadata: {
                itemId: parsed.itemId,
                threadId: parsed.threadId,
                turnId: parsed.turnId,
            },
        };
        this.pendingPermissions.set(requestId, request);
        this.emitEvent({ type: "permission_requested", provider: CODEX_PROVIDER, request });
        return new Promise((resolve) => {
            this.pendingPermissionHandlers.set(requestId, { resolve, kind: "command" });
        });
    }
    handleFileChangeApprovalRequest(params) {
        const parsed = params;
        const requestId = `permission-${parsed.itemId}`;
        const request = {
            id: requestId,
            provider: CODEX_PROVIDER,
            name: "CodexFileChange",
            kind: "tool",
            title: "Apply file changes",
            description: parsed.reason ?? undefined,
            detail: {
                type: "unknown",
                input: {
                    reason: parsed.reason ?? null,
                },
                output: null,
            },
            metadata: {
                itemId: parsed.itemId,
                threadId: parsed.threadId,
                turnId: parsed.turnId,
            },
        };
        this.pendingPermissions.set(requestId, request);
        this.emitEvent({ type: "permission_requested", provider: CODEX_PROVIDER, request });
        return new Promise((resolve) => {
            this.pendingPermissionHandlers.set(requestId, { resolve, kind: "file" });
        });
    }
    handleToolApprovalRequest(params) {
        const parsed = params;
        const requestId = `permission-${parsed.itemId}`;
        const questions = normalizeCodexQuestionPrompts(parsed.questions);
        const request = {
            id: requestId,
            provider: CODEX_PROVIDER,
            name: "request_user_input",
            kind: "question",
            title: "Question",
            description: undefined,
            detail: {
                type: "plain_text",
                text: formatCodexQuestionPrompts(questions),
                icon: "brain",
            },
            input: { questions },
            metadata: {
                itemId: parsed.itemId,
                threadId: parsed.threadId,
                turnId: parsed.turnId,
                questions,
            },
        };
        this.pendingPermissions.set(requestId, request);
        this.emitEvent({
            type: "timeline",
            provider: CODEX_PROVIDER,
            item: mapCodexQuestionRequestToToolCall({
                callId: parsed.itemId,
                questions,
                status: "running",
            }),
        });
        this.emitEvent({ type: "permission_requested", provider: CODEX_PROVIDER, request });
        return new Promise((resolve) => {
            this.pendingPermissionHandlers.set(requestId, {
                resolve,
                kind: "question",
                questions,
            });
        });
    }
}
export class CodexAppServerAgentClient {
    constructor(logger, runtimeSettings, deps = {}) {
        this.logger = logger;
        this.runtimeSettings = runtimeSettings;
        this.deps = deps;
        this.provider = CODEX_PROVIDER;
        this.capabilities = CODEX_APP_SERVER_CAPABILITIES;
    }
    async spawnAppServer(launchEnv) {
        const launchPrefix = await resolveCodexLaunchPrefix(this.runtimeSettings);
        this.logger.trace({
            launchPrefix,
        }, "Spawning Codex app server");
        return spawnProcess(launchPrefix.command, [...launchPrefix.args, "app-server"], {
            detached: process.platform !== "win32",
            stdio: ["pipe", "pipe", "pipe"],
            env: buildCodexAppServerEnv(this.runtimeSettings, launchEnv),
        });
    }
    async createSession(config, launchContext) {
        const sessionConfig = { ...config, provider: CODEX_PROVIDER };
        const session = new CodexAppServerAgentSession(sessionConfig, null, this.logger, () => this.spawnAppServer(launchContext?.env), this.deps);
        await session.connect();
        return session;
    }
    async resumeSession(handle, overrides, launchContext) {
        const storedConfig = (handle.metadata ?? {});
        const merged = {
            ...storedConfig,
            ...overrides,
            provider: CODEX_PROVIDER,
            cwd: overrides?.cwd ?? storedConfig.cwd ?? process.cwd(),
        };
        const session = new CodexAppServerAgentSession(merged, handle, this.logger, () => this.spawnAppServer(launchContext?.env), this.deps);
        await session.connect();
        return session;
    }
    async listPersistedAgents(options) {
        const child = await this.spawnAppServer();
        const client = new CodexAppServerClient(child, this.logger);
        try {
            await client.request("initialize", buildCodexAppServerInitializeParams());
            client.notify("initialized", {});
            const limit = options?.limit ?? 20;
            const response = (await client.request("thread/list", { limit }));
            const threads = Array.isArray(response?.data) ? response.data : [];
            const descriptors = [];
            for (const thread of threads.slice(0, limit)) {
                const threadId = thread.id;
                const cwd = thread.cwd ?? process.cwd();
                const title = thread.preview ?? null;
                let timeline = [];
                try {
                    const rolloutTimeline = await loadCodexPersistedTimeline(threadId, undefined, this.logger);
                    const read = (await client.request("thread/read", {
                        threadId,
                        includeTurns: true,
                    }));
                    const turns = read.thread?.turns ?? [];
                    const itemsFromThreadRead = [];
                    for (const turn of turns) {
                        for (const item of turn.items ?? []) {
                            const timelineItem = threadItemToTimeline(item, { cwd });
                            if (timelineItem)
                                itemsFromThreadRead.push(timelineItem);
                        }
                    }
                    timeline = rolloutTimeline.length > 0 ? rolloutTimeline : itemsFromThreadRead;
                }
                catch {
                    timeline = [];
                }
                descriptors.push({
                    provider: CODEX_PROVIDER,
                    sessionId: threadId,
                    cwd,
                    title,
                    lastActivityAt: new Date((thread.updatedAt ?? thread.createdAt ?? 0) * 1000),
                    persistence: {
                        provider: CODEX_PROVIDER,
                        sessionId: threadId,
                        nativeHandle: threadId,
                        metadata: {
                            provider: CODEX_PROVIDER,
                            cwd,
                            title,
                            threadId,
                        },
                    },
                    timeline,
                });
            }
            return descriptors;
        }
        finally {
            await client.dispose();
        }
    }
    async listModels(_options) {
        // Codex model/list is global to the app server in this flow; cwd/force are intentionally ignored.
        const child = await this.spawnAppServer();
        const client = new CodexAppServerClient(child, this.logger);
        try {
            await client.request("initialize", buildCodexAppServerInitializeParams());
            client.notify("initialized", {});
            const response = (await client.request("model/list", {}));
            const models = Array.isArray(response?.data) ? response.data : [];
            const configuredDefaults = await readCodexConfiguredDefaults(client, this.logger);
            const configuredDefaultModelId = configuredDefaults.model;
            const configuredDefaultThinkingOptionId = configuredDefaults.thinkingOptionId;
            const hasConfiguredDefaultModel = typeof configuredDefaultModelId === "string"
                ? models.some((model) => model?.id === configuredDefaultModelId)
                : false;
            return models.map((model) => {
                const defaultReasoningEffort = normalizeCodexThinkingOptionId(typeof model.defaultReasoningEffort === "string" ? model.defaultReasoningEffort : null);
                const resolvedDefaultReasoningEffort = configuredDefaultThinkingOptionId ?? defaultReasoningEffort;
                const thinkingById = new Map();
                if (Array.isArray(model.supportedReasoningEfforts)) {
                    for (const entry of model.supportedReasoningEfforts) {
                        const id = normalizeCodexThinkingOptionId(typeof entry?.reasoningEffort === "string" ? entry.reasoningEffort : null);
                        if (!id)
                            continue;
                        const description = typeof entry?.description === "string" && entry.description.trim().length > 0
                            ? entry.description
                            : undefined;
                        thinkingById.set(id, { id, label: id, description });
                    }
                }
                if (resolvedDefaultReasoningEffort && !thinkingById.has(resolvedDefaultReasoningEffort)) {
                    thinkingById.set(resolvedDefaultReasoningEffort, {
                        id: resolvedDefaultReasoningEffort,
                        label: resolvedDefaultReasoningEffort,
                        description: configuredDefaultThinkingOptionId === resolvedDefaultReasoningEffort
                            ? "Configured default reasoning effort"
                            : "Model default reasoning effort",
                    });
                }
                const thinkingOptions = Array.from(thinkingById.values()).map((option) => ({
                    ...option,
                    isDefault: option.id === resolvedDefaultReasoningEffort,
                }));
                const defaultThinkingOptionId = resolvedDefaultReasoningEffort ??
                    thinkingOptions.find((option) => option.isDefault)?.id ??
                    thinkingOptions[0]?.id;
                const isDefaultModel = hasConfiguredDefaultModel
                    ? model.id === configuredDefaultModelId
                    : model.isDefault;
                return {
                    provider: CODEX_PROVIDER,
                    id: model.id,
                    label: normalizeCodexModelLabel(model.displayName),
                    description: model.description,
                    isDefault: isDefaultModel,
                    thinkingOptions: thinkingOptions.length > 0 ? thinkingOptions : undefined,
                    defaultThinkingOptionId,
                    metadata: {
                        model: model.model,
                        defaultReasoningEffort: model.defaultReasoningEffort,
                        supportedReasoningEfforts: model.supportedReasoningEfforts,
                    },
                };
            });
        }
        finally {
            await client.dispose();
        }
    }
    async isAvailable() {
        const command = this.runtimeSettings?.command;
        if (command?.mode === "replace") {
            return await isCommandAvailable(command.argv[0]);
        }
        return await isCommandAvailable("codex");
    }
    async getDiagnostic() {
        try {
            const available = await this.isAvailable();
            const resolvedBinary = await findExecutable("codex");
            const entries = [
                {
                    label: "Binary",
                    value: resolvedBinary ?? "not found",
                },
                {
                    label: "Version",
                    value: resolvedBinary ? await resolveBinaryVersion(resolvedBinary) : "unknown",
                },
            ];
            let status = formatDiagnosticStatus(available);
            if (!available) {
                entries.push({ label: "Models", value: "Not checked" });
            }
            else {
                try {
                    const models = await this.listModels({ cwd: homedir(), force: false });
                    entries.push({ label: "Models", value: String(models.length) });
                }
                catch (error) {
                    entries.push({
                        label: "Models",
                        value: `Error - ${toDiagnosticErrorMessage(error)}`,
                    });
                    status = formatDiagnosticStatus(available, {
                        source: "model fetch",
                        cause: error,
                    });
                }
            }
            entries.push({ label: "Status", value: status });
            return {
                diagnostic: formatProviderDiagnostic("Codex", entries),
            };
        }
        catch (error) {
            return {
                diagnostic: formatProviderDiagnosticError("Codex", error),
            };
        }
    }
}
export const __codexAppServerInternals = {
    buildCodexAppServerEnv,
    CodexAppServerClient,
    codexModelSupportsFastMode,
    CodexAppServerAgentSession,
    formatCodexQuestionPrompts,
    mapCodexQuestionRequestToToolCall,
    mapCodexPatchNotificationToToolCall,
    planStepsToMarkdown,
    mapCodexPlanToToolCall,
    listCodexSkills,
    normalizeCodexOutputSchema,
    normalizeCodexQuestionPrompts,
    toAgentUsage,
    threadItemToTimeline,
};
//# sourceMappingURL=codex-app-server-agent.js.map