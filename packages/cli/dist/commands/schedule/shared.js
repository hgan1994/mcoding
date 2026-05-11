import { connectToDaemon, getDaemonHost } from "../../utils/client.js";
import { parseDuration } from "../../utils/duration.js";
import { resolveProviderAndModel } from "../../utils/provider-model.js";
export async function connectScheduleClient(host) {
    const resolvedHost = getDaemonHost({ host });
    try {
        const client = (await connectToDaemon({
            host,
        }));
        return { client, host: resolvedHost };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw {
            code: "DAEMON_NOT_RUNNING",
            message: `Cannot connect to daemon at ${resolvedHost}: ${message}`,
            details: "Start the daemon with: paseo daemon start",
        };
    }
}
export function toScheduleCommandError(code, action, error) {
    if (error && typeof error === "object" && "code" in error) {
        return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
        code,
        message: `Failed to ${action}: ${message}`,
    };
}
export function formatCadence(cadence) {
    if (cadence.type === "cron") {
        return `cron:${cadence.expression}`;
    }
    return `every:${formatDurationMs(cadence.everyMs)}`;
}
export function formatTarget(target) {
    if (target.type === "self") {
        return `self:${target.agentId.slice(0, 7)}`;
    }
    if (target.type === "agent") {
        return `agent:${target.agentId.slice(0, 7)}`;
    }
    const modelSuffix = target.config.model ? `/${target.config.model}` : "";
    return `new-agent:${target.config.provider}${modelSuffix}`;
}
export function formatDurationMs(durationMs) {
    const parts = [];
    let remainingMs = durationMs;
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    if (hours > 0) {
        parts.push(`${hours}h`);
        remainingMs -= hours * 60 * 60 * 1000;
    }
    const minutes = Math.floor(remainingMs / (60 * 1000));
    if (minutes > 0) {
        parts.push(`${minutes}m`);
        remainingMs -= minutes * 60 * 1000;
    }
    const seconds = Math.floor(remainingMs / 1000);
    if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds}s`);
    }
    return parts.join("");
}
export function parseScheduleCreateInput(options) {
    const prompt = options.prompt.trim();
    if (!prompt) {
        throw {
            code: "INVALID_PROMPT",
            message: "Schedule prompt cannot be empty",
        };
    }
    const cadenceCount = Number(options.every !== undefined) + Number(options.cron !== undefined);
    if (cadenceCount !== 1) {
        throw {
            code: "INVALID_CADENCE",
            message: "Specify exactly one of --every or --cron",
        };
    }
    const cadence = options.every
        ? { type: "every", everyMs: parseDuration(options.every) }
        : { type: "cron", expression: options.cron.trim() };
    const targetValue = options.target?.trim();
    const hasExplicitProviderSelection = options.provider !== undefined;
    const resolvedProviderModel = resolveProviderAndModel({
        provider: options.provider,
        defaultProvider: "claude",
    });
    const newAgentTarget = {
        type: "new-agent",
        config: {
            provider: resolvedProviderModel.provider,
            cwd: process.cwd(),
            ...(resolvedProviderModel.model ? { model: resolvedProviderModel.model } : {}),
        },
    };
    let target;
    if (!targetValue) {
        const currentAgentId = process.env.PASEO_AGENT_ID?.trim();
        if (currentAgentId && !hasExplicitProviderSelection) {
            target = { type: "self", agentId: currentAgentId };
        }
        else {
            target = newAgentTarget;
        }
    }
    else if (targetValue === "self") {
        if (hasExplicitProviderSelection) {
            throw {
                code: "INVALID_TARGET",
                message: "--provider can only be used with a new-agent target",
                details: "Use --target new-agent or omit --target to create a new agent schedule",
            };
        }
        const currentAgentId = process.env.PASEO_AGENT_ID?.trim();
        if (!currentAgentId) {
            throw {
                code: "INVALID_TARGET",
                message: "--target self requires running inside a Paseo agent",
            };
        }
        target = { type: "self", agentId: currentAgentId };
    }
    else if (targetValue === "new-agent") {
        target = newAgentTarget;
    }
    else {
        if (hasExplicitProviderSelection) {
            throw {
                code: "INVALID_TARGET",
                message: "--provider can only be used with a new-agent target",
                details: "Use --target new-agent or omit --target to create a new agent schedule",
            };
        }
        target = {
            type: "agent",
            agentId: targetValue,
        };
    }
    const maxRuns = options.maxRuns === undefined ? undefined : parsePositiveInt(options.maxRuns, "--max-runs");
    const expiresAt = options.expiresIn === undefined
        ? undefined
        : new Date(Date.now() + parseDuration(options.expiresIn)).toISOString();
    return {
        prompt,
        cadence,
        target,
        ...(options.name?.trim() ? { name: options.name.trim() } : {}),
        ...(maxRuns !== undefined ? { maxRuns } : {}),
        ...(expiresAt ? { expiresAt } : {}),
    };
}
function parsePositiveInt(value, flag) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw {
            code: "INVALID_INTEGER",
            message: `${flag} must be a positive integer`,
        };
    }
    return parsed;
}
export function toScheduleRow(schedule) {
    return {
        id: schedule.id,
        name: schedule.name,
        cadence: formatCadence(schedule.cadence),
        target: formatTarget(schedule.target),
        status: schedule.status,
        nextRunAt: schedule.nextRunAt,
        lastRunAt: schedule.lastRunAt,
    };
}
//# sourceMappingURL=shared.js.map