import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOOL_TIMEOUT_MS = 12_000;
const INSTALL_TIMEOUT_MS = 10 * 60_000;
const PROCESS_KILL_GRACE_MS = 1_500;
const INSTALL_LOG_LIMIT = 400;
const NPM_LATEST_CACHE_MS = 10 * 60_000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const upstreamRoot = path.join(
  projectRoot,
  "electronDesktop",
  "upstream",
  "paseo-0.1.64",
  "paseo-0.1.64",
);
const latestNpmVersions = new Map();
let npmCommandQueue = Promise.resolve();

export const localTools = [
  {
    id: "claude",
    label: "Claude Code",
    command: "claude",
    provider: "claude",
    npmPackage: "@anthropic-ai/claude-code",
    officialInstallUrl: "https://code.claude.com/docs/en/overview",
    description: "Anthropic local coding agent.",
  },
  {
    id: "codex",
    label: "Codex CLI",
    command: "codex",
    provider: "codex",
    npmPackage: "@openai/codex",
    officialInstallUrl: "https://help.openai.com/en/articles/11096431-openai-codex-cli-getting-started",
    description: "OpenAI Codex command-line agent.",
  },
  {
    id: "opencode",
    label: "OpenCode",
    command: "opencode",
    provider: "opencode",
    npmPackage: "opencode-ai",
    npmInstallCommand: "npm i -g opencode-ai",
    npmUpdateCommand: "npm i -g opencode-ai",
    officialInstallUrl: "https://opencode.ai/docs/",
    description: "OpenCode local agent CLI.",
  },
];

function getShell() {
  if (process.platform === "win32") return { command: "cmd", args: ["/c"] };
  return { command: process.env.SHELL?.trim() || "/bin/sh", args: ["-i", "-l", "-c"] };
}

function shellQuote(value) {
  if (process.platform === "win32") {
    return /[\s&|<>^"]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  }
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function firstLine(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) || null;
}

function findJsonStart(text) {
  const objectIndex = text.indexOf("{");
  const arrayIndex = text.indexOf("[");
  if (objectIndex === -1) return arrayIndex;
  if (arrayIndex === -1) return objectIndex;
  return Math.min(objectIndex, arrayIndex);
}

function parseJsonOutput(text) {
  const start = findJsonStart(text.trim());
  if (start < 0) return null;
  return JSON.parse(text.slice(start));
}

function processMessage(result, fallback) {
  if (result.stderr.trim()) return result.stderr.trim();
  if (result.stdout.trim()) return result.stdout.trim();
  if (result.timedOut) return "Command timed out.";
  return fallback;
}

function resultText(result) {
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

function nodeRuntimeInstallUrl() {
  return "https://nodejs.org/en/download";
}

function npmShellEnv() {
  return {
    CI: "1",
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_progress: "false",
    npm_config_update_notifier: "false",
  };
}

function isNpmRenameConflict(result) {
  const text = resultText(result);
  return /\bENOTEMPTY\b/.test(text) && /\brename\b/.test(text);
}

function isWingetTempFileConflict(result) {
  const text = resultText(result);
  return /WinGet[\\/]/i.test(text) && /being used by another process/i.test(text);
}

function parseNpmRenameConflictPaths(result, packageName) {
  const text = resultText(result);
  const pathMatch = text.match(/npm error path (.+)/);
  const destMatch = text.match(/npm error dest (.+)/);
  const sourcePath = pathMatch?.[1]?.trim() || null;
  const destPath = destMatch?.[1]?.trim() || null;
  const candidates = [sourcePath, destPath].filter(Boolean);
  const packageMarker = packageName.replace("/", path.sep);

  if (candidates.length === 0) return null;
  if (!candidates.some((value) => value.includes(packageMarker) || value.includes(packageName))) {
    return null;
  }

  return { sourcePath, destPath };
}

function firstSemver(value) {
  if (!value) return null;
  const match = String(value).match(/\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?/);
  return match ? match[0] : null;
}

function stripPrerelease(value) {
  return value ? value.split("-")[0].split("+")[0] : null;
}

function sameVersion(a, b) {
  const left = stripPrerelease(firstSemver(a));
  const right = stripPrerelease(firstSemver(b));
  return Boolean(left && right && left === right);
}

function commandLookup(name) {
  const quoted = shellQuote(name);
  return process.platform === "win32" ? `where ${quoted}` : `command -v ${quoted}`;
}

function enqueueNpmCommand(task) {
  const run = npmCommandQueue.catch(() => {}).then(task);
  npmCommandQueue = run.catch(() => {});
  return run;
}

function killChildProcessTree(child, signal = "SIGTERM") {
  if (!child?.pid) return;

  if (process.platform === "win32") {
    const args = ["/pid", String(child.pid), "/t", "/f"];
    const killer = spawn("taskkill", args, {
      windowsHide: true,
      stdio: "ignore",
    });
    killer.once("error", () => {
      try {
        child.kill(signal);
      } catch {
        // Ignore cleanup failures.
      }
    });
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      // Ignore cleanup failures.
    }
  }
}

function nodeInstallCommand() {
  if (process.platform === "darwin") {
    return "if command -v brew >/dev/null 2>&1; then brew install node; else echo 'Homebrew is not installed. Install Node.js LTS from https://nodejs.org/ or install Homebrew first.' >&2; exit 127; fi";
  }

  if (process.platform === "win32") {
    return [
      "where winget >nul 2>nul && winget install --id OpenJS.NodeJS.LTS -e --silent --disable-interactivity --accept-package-agreements --accept-source-agreements",
      "where choco >nul 2>nul && choco install nodejs-lts -y",
    ].join(" || ");
  }

  return [
    "command -v brew >/dev/null 2>&1 && brew install node",
    "command -v apt-get >/dev/null 2>&1 && sudo apt-get update && sudo apt-get install -y nodejs npm",
    "command -v dnf >/dev/null 2>&1 && sudo dnf install -y nodejs npm",
    "command -v yum >/dev/null 2>&1 && sudo yum install -y nodejs npm",
    "command -v pacman >/dev/null 2>&1 && sudo pacman -Sy --noconfirm nodejs npm",
  ].join(" || ");
}

function readPackageVersion(packageJsonPath) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return typeof packageJson.version === "string" ? packageJson.version : null;
  } catch {
    return null;
  }
}

function findBundledClaudeAgentSdk() {
  const candidates = [
    path.join(projectRoot, "node_modules", "@anthropic-ai", "claude-agent-sdk", "package.json"),
    path.join(
      projectRoot,
      "electronDesktop",
      "upstream",
      "paseo-0.1.64",
      "paseo-0.1.64",
      "packages",
      "server",
      "node_modules",
      "@anthropic-ai",
      "claude-agent-sdk",
      "package.json",
    ),
  ];

  for (const packageJsonPath of candidates) {
    if (!existsSync(packageJsonPath)) continue;
    const version = readPackageVersion(packageJsonPath);
    if (version) {
      return { packageJsonPath, version };
    }
  }

  return null;
}

function runShell(command, timeoutMs, options = {}) {
  return new Promise((resolve, reject) => {
    const shell = getShell();
    const child = spawn(shell.command, [...shell.args, command], {
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        ...options.env,
      },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let killTimer = null;

    const timer = setTimeout(() => {
      timedOut = true;
      killChildProcessTree(child, "SIGTERM");
      killTimer = setTimeout(() => {
        killChildProcessTree(child, "SIGKILL");
      }, PROCESS_KILL_GRACE_MS);
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      options.onStdout?.(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      options.onStderr?.(text);
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      reject(error);
    });
    child.once("close", (exitCode, signal) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolve({ exitCode, signal, stdout, stderr, timedOut });
    });
  });
}

function logShellChunk(log, label, chunk) {
  const text = chunk
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
  if (text) {
    log(`${label}:\n${text}`);
  }
}

async function hasShellCommand(name) {
  const result = await runShell(commandLookup(name), TOOL_TIMEOUT_MS);
  return result.exitCode === 0 && Boolean(firstLine(result.stdout));
}

async function latestNpmVersion(packageName) {
  if (!packageName) return null;
  const cached = latestNpmVersions.get(packageName);
  if (cached && Date.now() - cached.checkedAt < NPM_LATEST_CACHE_MS) {
    return cached.version;
  }

  const result = await enqueueNpmCommand(() =>
    runShell(`npm view ${shellQuote(packageName)} version`, TOOL_TIMEOUT_MS, {
      env: npmShellEnv(),
    }),
  );
  const version = result.exitCode === 0 ? firstSemver(firstLine(result.stdout)) : null;
  latestNpmVersions.set(packageName, { version, checkedAt: Date.now() });
  return version;
}

async function runLoggedShell(command, log, timeoutMs = INSTALL_TIMEOUT_MS, shellOptions = {}) {
  log(`Running command: ${command}`);
  const result = await runShell(command, timeoutMs, {
    ...shellOptions,
    onStdout: (chunk) => logShellChunk(log, "stdout", chunk),
    onStderr: (chunk) => logShellChunk(log, "stderr", chunk),
  });
  log(`Command exit code: ${result.exitCode ?? "unknown"}${result.timedOut ? " (timed out)" : ""}`);
  return result;
}

async function runNpmInstallWithRecovery(packageName, installCommand, log) {
  return enqueueNpmCommand(async () => {
    const shellOptions = { env: npmShellEnv() };
    const firstResult = await runLoggedShell(installCommand, log, INSTALL_TIMEOUT_MS, shellOptions);
    if (firstResult.exitCode === 0 || !isNpmRenameConflict(firstResult)) {
      return firstResult;
    }

    const paths = parseNpmRenameConflictPaths(firstResult, packageName);
    if (!paths) {
      log("Detected npm rename conflict, but could not parse the conflicting package paths for cleanup.");
      return firstResult;
    }

    log("Detected npm rename conflict from leftover package directories. Removing the conflicting package paths and retrying once.");
    for (const target of [paths.destPath, paths.sourcePath].filter(Boolean)) {
      if (!existsSync(target)) {
        log(`Cleanup skipped (not found): ${target}`);
        continue;
      }
      try {
        rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        log(`Removed conflicting path: ${target}`);
      } catch (error) {
        log(`Cleanup failed for ${target}: ${error instanceof Error ? error.message : String(error)}`);
        return firstResult;
      }
    }

    log("Retrying npm install after directory cleanup.");
    return runLoggedShell(installCommand, log, INSTALL_TIMEOUT_MS, shellOptions);
  });
}

async function ensureNodeAndNpm(log = () => {}) {
  const missing = [];
  if (!(await hasShellCommand("node"))) missing.push("node");
  if (!(await hasShellCommand("npm"))) missing.push("npm");
  if (missing.length === 0) {
    log("Node.js/npm check passed.");
    return { ok: true };
  }

  const installCommand = nodeInstallCommand();
  log(`Missing runtime dependency: ${missing.join(" and ")}.`);
  log(`Attempting runtime install: ${installCommand}`);
  if (process.platform === "win32") {
    log("Windows runtime install may show a UAC prompt. If it stays here, install Node.js LTS manually and restart Paseo Desktop.");
  }
  const installResult = await runShell(installCommand, INSTALL_TIMEOUT_MS, {
    onStdout: (chunk) => logShellChunk(log, "runtime stdout", chunk),
    onStderr: (chunk) => logShellChunk(log, "runtime stderr", chunk),
  });
  log(`Runtime install exit code: ${installResult.exitCode ?? "unknown"}${installResult.timedOut ? " (timed out)" : ""}`);
  if (installResult.exitCode !== 0) {
    const runtimeError = isWingetTempFileConflict(installResult)
      ? "Windows auto-install for Node.js failed because winget could not clean up its temporary download files. Install Node.js LTS manually, then restart Paseo Desktop."
      : `Node.js/npm are required before installing npm components. Auto-install failed while checking ${missing.join(
          " and ",
        )}: ${processMessage(installResult, "No supported Node.js installer was found.")}`;
    return {
      ok: false,
      error: runtimeError,
      officialInstallUrl: nodeRuntimeInstallUrl(),
    };
  }

  const stillMissing = [];
  if (!(await hasShellCommand("node"))) stillMissing.push("node");
  if (!(await hasShellCommand("npm"))) stillMissing.push("npm");
  if (stillMissing.length > 0) {
    log(`Runtime check after install still missing: ${stillMissing.join(" and ")}.`);
    return {
      ok: false,
      error: `Node.js/npm installation finished, but ${stillMissing.join(
        " and ",
      )} is still not available in PATH. Restart Paseo Desktop or install Node.js LTS manually.`,
      officialInstallUrl: nodeRuntimeInstallUrl(),
    };
  }

  log("Runtime install completed successfully.");
  return { ok: true };
}

function resolveUpstreamCliEntrypoint() {
  const dist = path.join(upstreamRoot, "packages", "cli", "dist", "index.js");
  if (existsSync(dist)) {
    return { entrypoint: dist, execArgv: [] };
  }

  const src = path.join(upstreamRoot, "packages", "cli", "src", "index.ts");
  if (existsSync(src)) {
    return { entrypoint: src, execArgv: ["--import", "tsx"] };
  }

  return null;
}

function runNodeScript(entrypoint, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--disable-warning=DEP0040", ...entrypoint.execArgv, entrypoint.entrypoint, ...args],
      {
        cwd: upstreamRoot,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: "1",
        },
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (exitCode, signal) => {
      clearTimeout(timer);
      resolve({ exitCode, signal, stdout, stderr, timedOut });
    });
  });
}

export class LocalToolManager {
  constructor() {
    this.installLogs = [];
    this.activeInstall = null;
    this.activeInstallToolId = null;
  }

  list() {
    return localTools;
  }

  appendInstallLog(message) {
    const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
    this.installLogs.push(`[${timestamp}] ${message}`);
    if (this.installLogs.length > INSTALL_LOG_LIMIT) {
      this.installLogs.splice(0, this.installLogs.length - INSTALL_LOG_LIMIT);
    }
  }

  getInstallLogs() {
    return { contents: this.installLogs.join("\n") };
  }

  clearInstallLogs() {
    this.installLogs = [];
    return this.getInstallLogs();
  }

  getTool(toolId) {
    const tool = localTools.find((candidate) => candidate.id === toolId);
    if (!tool) {
      throw new Error(`Unknown local tool: ${toolId}`);
    }
    return tool;
  }

  async status() {
    const providers = await this.providerStatus();
    return Promise.all(localTools.map((tool) => this.inspect(tool.id, providers)));
  }

  async providerStatus() {
    const entrypoint = resolveUpstreamCliEntrypoint();
    if (!entrypoint) return new Map();

    try {
      const status = await runNodeScript(entrypoint, ["daemon", "status", "--json"], TOOL_TIMEOUT_MS);
      if (status.exitCode !== 0) return new Map();
      const daemonStatus = parseJsonOutput(status.stdout);
      if (daemonStatus?.connectedDaemon !== "reachable") return new Map();

      const result = await runNodeScript(entrypoint, ["provider", "ls", "--json"], TOOL_TIMEOUT_MS);
      if (result.exitCode !== 0) return new Map();
      const parsed = parseJsonOutput(result.stdout);
      if (!Array.isArray(parsed)) return new Map();
      return new Map(
        parsed
          .filter((entry) => entry && typeof entry.provider === "string")
          .map((entry) => [entry.provider, entry]),
      );
    } catch {
      return new Map();
    }
  }

  async inspect(toolId, providerStatuses) {
    const tool = this.getTool(toolId);
    const providers = providerStatuses ?? (await this.providerStatus());
    const provider = providers.get(tool.provider);
    const providerStatus =
      typeof provider?.status === "string" ? provider.status : null;
    const providerEnabled = provider?.enabled ?? null;
    const providerError =
      providerStatus &&
      !["available", "ready", "loading"].includes(providerStatus)
        ? `Paseo provider status: ${providerStatus}`
        : null;
    const locateCommand =
      commandLookup(tool.command);
    const locateResult = await runShell(locateCommand, TOOL_TIMEOUT_MS);
    const commandPath = firstLine(locateResult.stdout);

    if (locateResult.exitCode !== 0 || !commandPath) {
      if (tool.id === "claude") {
        const bundled = findBundledClaudeAgentSdk();
        if (bundled) {
          return {
            tool,
            installed: true,
            source: "bundled",
            providerStatus,
            providerEnabled,
            installSupported: true,
            officialInstallUrl: tool.officialInstallUrl,
            latestVersion: null,
            isLatest: null,
            path: bundled.packageJsonPath,
            version: `@anthropic-ai/claude-agent-sdk ${bundled.version}`,
            error: providerError,
          };
        }
      }

      return {
        tool,
        installed: false,
        source: "missing",
        providerStatus,
        providerEnabled,
        installSupported: true,
        officialInstallUrl: tool.officialInstallUrl,
        latestVersion: null,
        isLatest: null,
        path: null,
        version: null,
        error: providerError,
      };
    }

    const versionResult = await runShell(
      `${shellQuote(commandPath)} --version`,
      TOOL_TIMEOUT_MS,
    );
    const installedVersion = firstLine(versionResult.stdout);
    const latestVersion = tool.npmPackage ? await latestNpmVersion(tool.npmPackage) : null;
    return {
      tool,
      installed: true,
      source: "path",
      providerStatus,
      providerEnabled,
      installSupported: true,
      officialInstallUrl: tool.officialInstallUrl,
      path: commandPath,
      version: installedVersion,
      latestVersion,
      isLatest: latestVersion && installedVersion ? sameVersion(installedVersion, latestVersion) : null,
      error:
        providerError ??
        (versionResult.exitCode === 0
          ? null
          : processMessage(versionResult, "Version check failed.")),
    };
  }

  async install(toolId) {
    return this.installOrUpdate(toolId, "install");
  }

  async update(toolId) {
    return this.installOrUpdate(toolId, "update");
  }

  async installOrUpdate(toolId, action) {
    const tool = this.getTool(toolId);
    if (this.activeInstall && this.activeInstallToolId !== toolId) {
      const activeToolLabel = this.getTool(this.activeInstallToolId).label;
      return {
        tool,
        installed: false,
        source: "missing",
        officialInstallUrl: tool.officialInstallUrl,
        latestVersion: null,
        isLatest: null,
        path: null,
        version: null,
        error: `Another component installation is still running (${activeToolLabel}). Wait for it to finish before starting a new one.`,
      };
    }

    this.installLogs = [];
    const log = (message) => this.appendInstallLog(`[${tool.label}] ${message}`);
    log(
      `${action === "install" ? "Install" : "Update"} started. platform=${process.platform} arch=${process.arch}`,
    );

    const installPromise = (async () => {
      let command = null;
      if (tool.npmPackage) {
        const runtimeCheck = await ensureNodeAndNpm(log);
        if (!runtimeCheck.ok) {
          log(`Runtime check failed: ${runtimeCheck.error}`);
          return {
            tool,
            installed: false,
            source: "missing",
            officialInstallUrl: runtimeCheck.officialInstallUrl || tool.officialInstallUrl,
            latestVersion: null,
            isLatest: null,
            path: null,
            version: null,
            error: runtimeCheck.error,
          };
        }
        command =
          action === "update" && tool.npmUpdateCommand
            ? tool.npmUpdateCommand
            : tool.npmInstallCommand
              ? tool.npmInstallCommand
              : `npm install -g ${shellQuote(`${tool.npmPackage}@latest`)}`;
      } else {
        command =
          action === "update" && tool.updateCommand ? tool.updateCommand : tool.installCommand;
      }

      if (!command) {
        log("Install aborted: no automated install command is configured.");
        return {
          tool,
          installed: false,
          source: "missing",
          officialInstallUrl: tool.officialInstallUrl,
          latestVersion: null,
          isLatest: null,
          path: null,
          version: null,
          error: "This tool does not have an automated install command yet.",
        };
      }

      const result = tool.npmPackage
        ? await runNpmInstallWithRecovery(tool.npmPackage, command, log)
        : await runLoggedShell(command, log);
      if (result.exitCode !== 0) {
        log(`Install failed: ${processMessage(result, "npm install failed.")}`);
        return {
          tool,
          installed: false,
          source: "missing",
          officialInstallUrl: tool.officialInstallUrl,
          latestVersion: null,
          isLatest: null,
          path: null,
          version: null,
          error: processMessage(result, "npm install failed."),
        };
      }

      const inspected = await this.inspect(tool.id);
      log(`Install completed. Status: ${inspected.installed ? "installed" : "not installed"}.`);
      return inspected;
    })();

    this.activeInstall = installPromise;
    this.activeInstallToolId = toolId;
    try {
      return await installPromise;
    } finally {
      if (this.activeInstall === installPromise) {
        this.activeInstall = null;
        this.activeInstallToolId = null;
      }
    }
  }
}
