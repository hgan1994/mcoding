import { spawn } from "node:child_process";
import { closeSync, existsSync, fstatSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");

const DEFAULT_UPSTREAM_ROOT = path.join(
  projectRoot,
  "electronDesktop",
  "upstream",
  "paseo-0.1.64",
  "paseo-0.1.64",
);
const DEFAULT_LISTEN_TARGET = "0.0.0.0:6767";
const STARTUP_GRACE_MS = 1200;
const STARTUP_POLL_MS = 250;
const STARTUP_POLL_ATTEMPTS = 80;
const CONNECTION_LOG_TAIL_BYTES = 256 * 1024;
const CONNECTION_LOG_TAIL_LINES = 800;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function firstExistingPath(candidates, label) {
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`${label} was not found. Checked:\n${candidates.join("\n")}`);
  }
  return found;
}

function findJsonStart(text) {
  const objectIndex = text.indexOf("{");
  const arrayIndex = text.indexOf("[");
  if (objectIndex === -1) return arrayIndex;
  if (arrayIndex === -1) return objectIndex;
  return Math.min(objectIndex, arrayIndex);
}

function normalizeEndpoint(value, fallback) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function normalizeRelayEndpoint(value, fallback) {
  const endpoint = normalizeEndpoint(value, fallback);
  if (!endpoint) {
    return "";
  }
  if (/^(\[[^\]]+\]|[^:]+):\d{1,5}$/.test(endpoint)) {
    return endpoint;
  }
  if (/^\[[^\]]+\]$/.test(endpoint) || !endpoint.includes(":")) {
    return `${endpoint}:443`;
  }
  return endpoint;
}

function deriveRelayConfig(relayAddress) {
  const trimmed = relayAddress?.trim() || "";
  if (!trimmed) {
    return {
      relayAddress: "",
      relayEndpoint: "",
      relayPublicEndpoint: "",
      appBaseUrl: "",
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    const relayEndpoint = normalizeRelayEndpoint(url.host, "");
    return {
      relayAddress: trimmed,
      relayEndpoint,
      relayPublicEndpoint: relayEndpoint,
      appBaseUrl: `${url.protocol}//${url.host}`,
    };
  }

  const relayEndpoint = normalizeRelayEndpoint(trimmed, "");
  const appBaseUrl = relayEndpoint.endsWith(":443")
    ? `https://${relayEndpoint.replace(/:443$/, "")}`
    : `http://${relayEndpoint}`;
  return {
    relayAddress: trimmed,
    relayEndpoint,
    relayPublicEndpoint: relayEndpoint,
    appBaseUrl,
  };
}

function stripAnsi(value) {
  if (typeof value !== "string") return null;
  return value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
}

function readTailText(filePath, maxBytes) {
  let fd;
  try {
    fd = openSync(filePath, "r");
    const size = fstatSync(fd).size;
    const start = Math.max(0, size - maxBytes);
    const length = Math.max(0, size - start);
    const buffer = Buffer.alloc(length);
    if (length > 0) {
      readSync(fd, buffer, 0, length, start);
    }
    return buffer.toString("utf8");
  } finally {
    if (typeof fd === "number") {
      closeSync(fd);
    }
  }
}

function parseConnectionLogEvent(line) {
  if (!line) return null;
  try {
    const payload = JSON.parse(line);
    const time = typeof payload?.time === "number" ? payload.time : 0;
    if (payload?.msg === "ws_runtime_metrics") {
      const count = payload?.sessions?.activeConnections;
      if (typeof count === "number") {
        return { type: "snapshot", time, count };
      }
    }
    if (
      payload?.msg === "relay_data_connected" &&
      typeof payload?.connectionId === "string" &&
      payload.connectionId.trim()
    ) {
      return { type: "connected", time, connectionId: payload.connectionId.trim() };
    }
    if (
      payload?.msg === "relay_data_disconnected" &&
      typeof payload?.connectionId === "string" &&
      payload.connectionId.trim()
    ) {
      return { type: "disconnected", time, connectionId: payload.connectionId.trim() };
    }
  } catch {
    return null;
  }
  return null;
}

export class DaemonManager {
  constructor(options = {}) {
    this.upstreamRoot = path.resolve(
      options.upstreamRoot ||
        process.env.PASEO_UPSTREAM_ROOT ||
        DEFAULT_UPSTREAM_ROOT,
    );
    this.relayAddress = "";
    this.relayEndpoint = "";
    this.relayPublicEndpoint = "";
    this.appBaseUrl = "";
    this.listenTarget = normalizeEndpoint(
      options.listenTarget || process.env.PASEO_LISTEN,
      DEFAULT_LISTEN_TARGET,
    );
    this.paseoHome = path.resolve(
      options.paseoHome ||
        process.env.PASEO_HOME ||
        path.join(os.homedir(), ".paseo"),
    );
    this.connectionLogCache = null;
    if (options.relayAddress) {
      this.updateRelayConfig({ relayAddress: options.relayAddress });
    } else {
      this.updateRelayConfig({
        relayEndpoint: options.relayEndpoint || process.env.PASEO_RELAY_ENDPOINT,
        relayPublicEndpoint: options.relayPublicEndpoint || process.env.PASEO_RELAY_PUBLIC_ENDPOINT,
        appBaseUrl: options.appBaseUrl || process.env.PASEO_APP_BASE_URL,
      });
    }
  }

  getConfig() {
    return {
      upstreamRoot: this.upstreamRoot,
      relayAddress: this.relayAddress,
      hasRelayConfig: this.hasRelayConfig(),
      appBaseUrl: this.appBaseUrl,
      relayEndpoint: this.relayEndpoint,
      relayPublicEndpoint: this.relayPublicEndpoint,
      listenTarget: this.listenTarget,
      paseoHome: this.paseoHome,
    };
  }

  hasRelayConfig() {
    return Boolean(this.relayEndpoint && this.appBaseUrl);
  }

  updateRelayConfig({
    relayAddress,
    relayEndpoint,
    relayPublicEndpoint,
    appBaseUrl,
  } = {}) {
    if (typeof relayAddress === "string") {
      const derived = deriveRelayConfig(relayAddress);
      this.relayAddress = derived.relayAddress;
      this.relayEndpoint = derived.relayEndpoint;
      this.relayPublicEndpoint = derived.relayPublicEndpoint;
      this.appBaseUrl = derived.appBaseUrl;
      return this.getConfig();
    }

    this.relayEndpoint = normalizeRelayEndpoint(relayEndpoint, "");
    this.relayPublicEndpoint = normalizeRelayEndpoint(
      relayPublicEndpoint,
      this.relayEndpoint,
    );
    this.appBaseUrl = normalizeEndpoint(appBaseUrl, "");
    this.relayAddress = this.relayPublicEndpoint || this.relayEndpoint;
    return this.getConfig();
  }

  ensureRelayConfig() {
    if (!this.hasRelayConfig()) {
      throw new Error("Relay service address is required before starting the daemon.");
    }
  }

  createEnv(extra = {}) {
    return {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PASEO_HOME: this.paseoHome,
      PASEO_APP_BASE_URL: this.appBaseUrl,
      PASEO_RELAY_ENDPOINT: this.relayEndpoint,
      PASEO_RELAY_PUBLIC_ENDPOINT: this.relayPublicEndpoint,
      PASEO_LISTEN: this.listenTarget,
      ...extra,
    };
  }

  resolveCliEntrypoint() {
    const cliRoot = path.join(this.upstreamRoot, "packages", "cli");
    const packageJson = path.join(cliRoot, "package.json");
    if (!existsSync(packageJson)) {
      throw new Error(`Paseo CLI package is missing at ${cliRoot}`);
    }

    const dist = path.join(cliRoot, "dist", "index.js");
    if (existsSync(dist)) {
      return { execArgv: [], entryPath: dist };
    }

    return {
      execArgv: ["--import", "tsx"],
      entryPath: firstExistingPath(
        [path.join(cliRoot, "src", "index.ts"), path.join(cliRoot, "src", "index.js")],
        "Paseo CLI source entrypoint",
      ),
    };
  }

  resolveDaemonEntrypoint() {
    const serverRoot = path.join(this.upstreamRoot, "packages", "server");
    const packageJson = path.join(serverRoot, "package.json");
    if (!existsSync(packageJson)) {
      throw new Error(`Paseo server package is missing at ${serverRoot}`);
    }

    const dist = path.join(serverRoot, "dist", "scripts", "supervisor-entrypoint.js");
    if (existsSync(dist)) {
      return { execArgv: [], entryPath: dist };
    }

    return {
      execArgv: ["--import", "tsx"],
      entryPath: firstExistingPath(
        [path.join(serverRoot, "scripts", "supervisor-entrypoint.ts")],
        "Paseo daemon supervisor entrypoint",
      ),
    };
  }

  nodeArgs(entrypoint, args = []) {
    return ["--disable-warning=DEP0040", ...entrypoint.execArgv, entrypoint.entryPath, ...args];
  }

  runNode(entrypoint, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, this.nodeArgs(entrypoint, args), {
        cwd: this.upstreamRoot,
        env: this.createEnv(options.env),
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.once("error", reject);
      child.once("close", (exitCode, signal) => {
        resolve({ exitCode, signal, stdout, stderr });
      });
    });
  }

  async runCliJson(args) {
    const result = await this.runNode(this.resolveCliEntrypoint(), args);
    if (result.exitCode !== 0) {
      throw new Error(
        result.stderr.trim() ||
          result.stdout.trim() ||
          `Paseo CLI exited with ${result.exitCode ?? result.signal ?? "unknown status"}`,
      );
    }

    const output = result.stdout.trim();
    const start = findJsonStart(output);
    if (start < 0) {
      throw new Error(`Paseo CLI did not return JSON. Output: ${output.slice(0, 300)}`);
    }

    return JSON.parse(output.slice(start));
  }

  async status() {
    try {
      const payload = await this.runCliJson(["daemon", "status", "--json"]);
      return this.normalizeStatus(payload);
    } catch (error) {
      return {
        serverId: "",
        status: "errored",
        listen: null,
        hostname: null,
        pid: null,
        startedAt: null,
        version: null,
        desktopManaged: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  normalizeStatus(payload) {
    const running = payload?.localDaemon === "running";
    return {
      serverId: typeof payload?.serverId === "string" ? payload.serverId : "",
      status: running ? "running" : "stopped",
      listen: running && typeof payload?.listen === "string" ? payload.listen : null,
      hostname: running && typeof payload?.hostname === "string" ? payload.hostname : null,
      pid: running && Number.isInteger(payload?.pid) ? payload.pid : null,
      startedAt: running && typeof payload?.startedAt === "string" ? payload.startedAt : null,
      version: typeof payload?.daemonVersion === "string" ? payload.daemonVersion : null,
      desktopManaged: payload?.desktopManaged === true,
      error: null,
    };
  }

  async start() {
    this.ensureRelayConfig();
    const current = await this.status();
    if (current.status === "running") {
      if (current.desktopManaged) {
        return current;
      }
      await this.stop();
    }

    const entrypoint = this.resolveDaemonEntrypoint();
    const child = spawn(process.execPath, this.nodeArgs(entrypoint), {
      cwd: this.upstreamRoot,
      detached: true,
      env: this.createEnv({ PASEO_DESKTOP_MANAGED: "1" }),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.unref();

    const earlyExit = await new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), STARTUP_GRACE_MS);
      child.once("error", (error) => {
        clearTimeout(timer);
        finish({ error });
      });
      child.once("exit", (code, signal) => {
        clearTimeout(timer);
        finish({ code, signal });
      });
    });

    if (earlyExit) {
      const reason = earlyExit.error
        ? earlyExit.error.message
        : `exit ${earlyExit.code ?? "unknown"}${earlyExit.signal ? ` (${earlyExit.signal})` : ""}`;
      throw new Error(`Daemon failed to start: ${reason}\n${stderr || stdout}`.trim());
    }

    return await this.pollForRunningDaemon();
  }

  async pollForRunningDaemon() {
    for (let attempt = 0; attempt < STARTUP_POLL_ATTEMPTS; attempt += 1) {
      const status = await this.status();
      if (status.status === "running" && status.serverId) {
        return status;
      }
      await delay(STARTUP_POLL_MS);
    }

    return await this.status();
  }

  async stop() {
    await this.runCliJson([
      "daemon",
      "stop",
      "--json",
      "--timeout",
      "5",
      "--force",
      "--kill-timeout",
      "5",
    ]).catch((error) => {
      throw new Error(`Failed to stop daemon: ${error instanceof Error ? error.message : String(error)}`);
    });
    return await this.status();
  }

  async restart() {
    const current = await this.status();
    if (current.status === "running") {
      await this.stop();
    }
    return await this.start();
  }

  async pairing() {
    if (!this.hasRelayConfig()) {
      return {
        relayEnabled: false,
        url: null,
        qr: null,
        qrDataUrl: null,
        error: "Relay service address is required before generating the QR code.",
      };
    }
    const status = await this.status();
    if (status.status !== "running") {
      return { relayEnabled: false, url: null, qr: null, error: "Daemon is not running." };
    }

    try {
      const payload = await this.runCliJson(["daemon", "pair", "--json"]);
      const url = typeof payload?.url === "string" ? payload.url : null;
      return {
        relayEnabled: payload?.relayEnabled === true,
        url,
        qr: stripAnsi(payload?.qr),
        qrDataUrl: url
          ? await QRCode.toDataURL(url, {
              errorCorrectionLevel: "M",
              margin: 1,
              width: 220,
              color: {
                dark: "#111827",
                light: "#ffffff",
              },
            })
          : null,
        error: null,
      };
    } catch (error) {
      return {
        relayEnabled: false,
        url: null,
        qr: null,
        qrDataUrl: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  logs(lineCount = 120) {
    const logPath = path.join(this.paseoHome, "daemon.log");
    try {
      const lines = readFileSync(logPath, "utf8").split("\n").filter(Boolean);
      return { logPath, contents: lines.slice(-lineCount).join("\n") };
    } catch {
      return { logPath, contents: "" };
    }
  }

  async connections() {
    const status = await this.status();
    if (!this.appBaseUrl || status.status !== "running" || !status.serverId) {
      return { activeConnections: 0, totalConnections: 0 };
    }

    try {
      const url = new URL(`/relay/daemon/${status.serverId}/stats`, this.appBaseUrl);
      const transport = url.protocol === "https:" ? https : http;
      const data = await new Promise((resolve, reject) => {
        const req = transport.get(url.toString(), { timeout: 5000 }, (res) => {
          let body = "";
          res.on("data", (chunk) => { body += chunk; });
          res.on("end", () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({ activeConnections: 0, totalConnections: 0 }); }
          });
        });
        req.on("error", reject);
        req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
      });
      return {
        activeConnections: typeof data.activeConnections === "number" ? data.activeConnections : 0,
        totalConnections: typeof data.totalConnections === "number" ? data.totalConnections : 0,
      };
    } catch {
      const fallback = this.connectionsFromDaemonLog(status);
      if (fallback) {
        return fallback;
      }
      return { activeConnections: 0, totalConnections: 0 };
    }
  }

  connectionsFromDaemonLog(status) {
    const logPath = path.join(this.paseoHome, "daemon.log");
    try {
      const stats = statSync(logPath);
      if (
        this.connectionLogCache &&
        this.connectionLogCache.size === stats.size &&
        this.connectionLogCache.mtimeMs === stats.mtimeMs
      ) {
        return this.connectionLogCache.data;
      }

      const tail = readTailText(logPath, CONNECTION_LOG_TAIL_BYTES);
      const lines = tail.split("\n").filter(Boolean).slice(-CONNECTION_LOG_TAIL_LINES);
      const daemonStartedAtMs = Date.parse(status.startedAt ?? "");

      let snapshotTime = Number.isFinite(daemonStartedAtMs) ? daemonStartedAtMs : -1;
      let snapshotCount = Number.isFinite(daemonStartedAtMs) ? 0 : null;
      const events = [];

      for (const line of lines) {
        const event = parseConnectionLogEvent(line);
        if (!event) continue;

        if (event.type === "snapshot") {
          if (event.time >= snapshotTime) {
            snapshotTime = event.time;
            snapshotCount = event.count;
            events.length = 0;
          }
          continue;
        }

        if (event.time >= snapshotTime) {
          events.push(event);
        }
      }

      if (snapshotCount === null) {
        this.connectionLogCache = { size: stats.size, mtimeMs: stats.mtimeMs, data: null };
        return null;
      }

      let delta = 0;
      const seenStates = new Map();
      for (const event of events) {
        const previous = seenStates.get(event.connectionId);
        if (event.type === "connected") {
          if (previous !== "connected") {
            delta += 1;
            seenStates.set(event.connectionId, "connected");
          }
          continue;
        }
        if (previous !== "disconnected") {
          delta -= 1;
          seenStates.set(event.connectionId, "disconnected");
        }
      }

      const activeConnections = Math.max(0, snapshotCount + delta);
      const data = {
        activeConnections,
        totalConnections: activeConnections,
      };
      this.connectionLogCache = { size: stats.size, mtimeMs: stats.mtimeMs, data };
      return data;
    } catch {
      return null;
    }
  }

  isDesktopManagedDaemonRunning() {
    const pidPath = path.join(this.paseoHome, "paseo.pid");
    try {
      const lock = readJsonFile(pidPath);
      if (lock.desktopManaged !== true || !Number.isInteger(lock.pid)) {
        return false;
      }
      process.kill(lock.pid, 0);
      return true;
    } catch (error) {
      if (error && typeof error === "object" && error.code === "EPERM") {
        return true;
      }
      return false;
    }
  }
}
