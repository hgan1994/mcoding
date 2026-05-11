import { net } from "electron";
import { app } from "electron";
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_CHECK_URL = "";
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export class UpdateChecker {
  constructor(options = {}) {
    this.checkUrl = options.checkUrl || DEFAULT_CHECK_URL;
    this.platform = options.platform || desktopUpdatePlatform();
    this.currentVersionCode = options.versionCode || 0;
    this.currentVersionName = options.versionName || app.getVersion() || "0.1.0";
    this.lastResult = null;
    this.timer = null;
    this.onUpdateAvailable = options.onUpdateAvailable || (() => {});
  }

  get versionCodeFromPackage() {
    const parts = this.currentVersionName.split(".").map(Number);
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      return parts[0] * 10000 + parts[1] * 100 + parts[2];
    }
    return this.currentVersionCode;
  }

  buildCheckUrl() {
    const vc = this.currentVersionCode || this.versionCodeFromPackage;
    const separator = this.checkUrl.includes("?") ? "&" : "?";
    return `${this.checkUrl}${separator}platform=${this.platform}&versionCode=${vc}`;
  }

  async checkForUpdate() {
    if (!this.checkUrl || !this.checkUrl.trim()) {
      this.lastResult = null;
      return null;
    }
    const url = this.buildCheckUrl();
    return new Promise((resolve) => {
      const request = net.request(url);
      let body = "";
      request.on("response", (response) => {
        if (response.statusCode !== 200) {
          resolve(null);
          return;
        }
        response.on("data", (chunk) => {
          body += chunk.toString();
        });
        response.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (data.hasUpdate) {
              this.lastResult = data;
              this.onUpdateAvailable(data);
            } else {
              this.lastResult = null;
            }
            resolve(data);
          } catch {
            resolve(null);
          }
        });
      });
      request.on("error", () => resolve(null));
      request.end();
    });
  }

  startPeriodicCheck() {
    this.stopPeriodicCheck();
    void this.checkForUpdate();
    this.timer = setInterval(() => {
      void this.checkForUpdate();
    }, CHECK_INTERVAL_MS);
  }

  stopPeriodicCheck() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async installAndRelaunch(info = null) {
    const update = normalizeUpdateInfo(info || this.lastResult);
    if (!update?.downloadUrl) {
      throw new Error("No update download URL available.");
    }

    const filePath = await this.downloadUpdate(update);
    const scriptPath = await createInstallScript(filePath, update);
    const child = spawn("/bin/sh", [scriptPath], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    return { ok: true, filePath };
  }

  async downloadUpdate(update) {
    const dir = path.join(os.tmpdir(), `paseo-update-${update.versionCode || Date.now()}`);
    await mkdir(dir, { recursive: true });
    const fileName = updateFileName(update);
    const filePath = path.join(dir, fileName);
    await downloadToFile(update.downloadUrl, filePath);
    if (update.md5) {
      const actual = await fileMd5(filePath);
      if (actual.toLowerCase() !== update.md5.toLowerCase()) {
        throw new Error("Downloaded update checksum does not match.");
      }
    }
    return filePath;
  }
}

function desktopUpdatePlatform() {
  if (process.platform === "darwin") return "electron-mac";
  if (process.platform === "win32") return "electron-win";
  return "electron-linux";
}

function normalizeUpdateInfo(info) {
  if (!info || typeof info !== "object") return null;
  return {
    ...info,
    downloadUrl: typeof info.downloadUrl === "string" ? info.downloadUrl : null,
    versionCode: Number.isFinite(info.versionCode) ? info.versionCode : null,
    versionName: typeof info.versionName === "string" ? info.versionName : "latest",
    md5: typeof info.md5 === "string" && info.md5 ? info.md5 : null,
  };
}

function updateFileName(update) {
  try {
    const url = new URL(update.downloadUrl);
    const base = path.basename(decodeURIComponent(url.pathname));
    if (base && base.includes(".")) return base;
  } catch {}
  return `paseo-${update.versionName}.dmg`;
}

function downloadToFile(url, filePath, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    try {
      new URL(url);
    } catch {
      reject(new Error("Update download URL is invalid."));
      return;
    }
    const request = net.request(url);
    request.on("response", (response) => {
      const status = response.statusCode || 0;
      const location = response.headers.location;
      if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
        const nextUrl = new URL(Array.isArray(location) ? location[0] : location, url).toString();
        response.resume();
        downloadToFile(nextUrl, filePath, redirectsLeft - 1).then(resolve, reject);
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(`Update download failed with HTTP ${status}.`));
        return;
      }

      const output = createWriteStream(filePath);
      response.pipe(output);
      response.on("error", reject);
      output.on("finish", () => output.close(resolve));
      output.on("error", reject);
    });
    request.on("error", reject);
    request.end();
  });
}

async function fileMd5(filePath) {
  const { createReadStream } = await import("node:fs");
  return new Promise((resolve, reject) => {
    const hash = createHash("md5");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function currentAppBundlePath() {
  const executablePath = app.getPath("exe");
  if (process.platform === "win32") {
    return path.dirname(executablePath);
  }
  if (process.platform === "linux") {
    return executablePath;
  }
  const marker = ".app/Contents/";
  const markerIndex = executablePath.indexOf(marker);
  if (markerIndex >= 0) {
    return executablePath.slice(0, markerIndex + ".app".length);
  }
  return executablePath;
}

async function createInstallScript(filePath, update) {
  const dir = path.dirname(filePath);
  const scriptPath =
    process.platform === "win32"
      ? path.join(dir, "install-update.cmd")
      : path.join(dir, "install-update.sh");
  const appPath = currentAppBundlePath();
  const appPid = process.pid;
  const ext = path.extname(filePath).toLowerCase();
  const script =
    process.platform === "win32"
      ? windowsInstallScript({ filePath, appPath, appPid })
      : process.platform === "darwin"
        ? ext === ".pkg"
          ? pkgInstallScript({ filePath, appPid })
          : appBundleInstallScript({ filePath, appPath, appPid, ext, versionName: update.versionName })
        : linuxInstallScript({ filePath, appPath, appPid, ext });

  await writeFile(scriptPath, script, { mode: 0o755 });
  return scriptPath;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function pkgInstallScript({ filePath, appPid }) {
  return `#!/bin/sh
set -eu
open ${shellQuote(filePath)}
while kill -0 ${appPid} 2>/dev/null; do
  sleep 0.2
done
`;
}

function appBundleInstallScript({ filePath, appPath, appPid, ext }) {
  const stagingPath = path.join(path.dirname(filePath), "staging");
  return `#!/bin/sh
set -eu
FILE=${shellQuote(filePath)}
APP_PATH=${shellQuote(appPath)}
STAGING=${shellQuote(stagingPath)}
MOUNT_DIR=""
cleanup() {
  if [ -n "$MOUNT_DIR" ] && [ -d "$MOUNT_DIR" ]; then
    hdiutil detach "$MOUNT_DIR" -quiet || true
    rmdir "$MOUNT_DIR" 2>/dev/null || true
  fi
}
trap cleanup EXIT
rm -rf "$STAGING"
mkdir -p "$STAGING"
if [ ${shellQuote(ext)} = ".dmg" ]; then
  MOUNT_DIR="$(mktemp -d /tmp/paseo-update.XXXXXX)"
  hdiutil attach "$FILE" -nobrowse -quiet -mountpoint "$MOUNT_DIR"
  NEW_APP="$(find "$MOUNT_DIR" -maxdepth 2 -name "*.app" -type d | head -n 1)"
elif [ ${shellQuote(ext)} = ".zip" ]; then
  ditto -x -k "$FILE" "$STAGING"
  NEW_APP="$(find "$STAGING" -maxdepth 3 -name "*.app" -type d | head -n 1)"
else
  open "$FILE"
  exit 0
fi
if [ -z "$NEW_APP" ]; then
  open "$FILE"
  exit 0
fi
while kill -0 ${appPid} 2>/dev/null; do
  sleep 0.2
done
rm -rf "$APP_PATH"
ditto "$NEW_APP" "$APP_PATH"
open -n "$APP_PATH"
`;
}

function windowsInstallScript({ filePath, appPath, appPid }) {
  const stagingPath = path.join(path.dirname(filePath), "staging");
  const targetExeName = path.basename(app.getPath("exe"));
  return `@echo off
setlocal
set "FILE=${windowsQuote(filePath)}"
set "TARGET_DIR=${windowsQuote(appPath)}"
set "STAGING=${windowsQuote(stagingPath)}"
set "TARGET_EXE=${windowsQuote(targetExeName)}"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$pidToWait=${appPid};" ^
  "Wait-Process -Id $pidToWait;" ^
  "$file=$env:FILE;" ^
  "$targetDir=$env:TARGET_DIR;" ^
  "$staging=$env:STAGING;" ^
  "$targetExe=$env:TARGET_EXE;" ^
  "Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "New-Item -ItemType Directory -Path $staging -Force | Out-Null;" ^
  "$expanded=Join-Path $staging 'expanded';" ^
  "Expand-Archive -LiteralPath $file -DestinationPath $expanded -Force;" ^
  "$candidate=Get-ChildItem -Path $expanded -Recurse -Filter $targetExe | Select-Object -First 1;" ^
  "if (-not $candidate) { $candidate=Get-ChildItem -Path $expanded -Recurse -Filter *.exe | Select-Object -First 1 };" ^
  "if (-not $candidate) { throw 'No executable found in update package.' };" ^
  "$sourceRoot=$candidate.Directory.FullName;" ^
  "robocopy $sourceRoot $targetDir /MIR /NFL /NDL /NJH /NJS /NP /R:2 /W:1 | Out-Null;" ^
  "Start-Process (Join-Path $targetDir $targetExe)"
endlocal
`;
}

function linuxInstallScript({ filePath, appPath, appPid, ext }) {
  return `#!/bin/sh
set -eu
FILE=${shellQuote(filePath)}
APP_PATH=${shellQuote(appPath)}
while kill -0 ${appPid} 2>/dev/null; do
  sleep 0.2
done
if [ ${shellQuote(ext)} = ".appimage" ]; then
  chmod +x "$FILE"
  "$FILE" >/dev/null 2>&1 &
  exit 0
fi
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$FILE" >/dev/null 2>&1 || true
fi
if [ -x "$APP_PATH" ]; then
  "$APP_PATH" >/dev/null 2>&1 &
fi
`;
}

function windowsQuote(value) {
  return String(value).replace(/"/g, '""');
}
