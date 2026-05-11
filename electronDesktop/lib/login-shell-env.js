import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { userInfo } from "node:os";
import { basename } from "node:path";

const RESOLVE_TIMEOUT_MS = 10_000;

function getSystemShell() {
  if (process.env.SHELL) return process.env.SHELL;
  try {
    const info = userInfo();
    if (info.shell && info.shell !== "/bin/false") return info.shell;
  } catch {
    // Fall through to platform default.
  }
  return process.platform === "darwin" ? "/bin/zsh" : "/bin/bash";
}

function resolveShellEnv() {
  if (process.platform === "win32") return undefined;

  const savedRunAsNode = process.env.ELECTRON_RUN_AS_NODE;
  const savedNoAttach = process.env.ELECTRON_NO_ATTACH_CONSOLE;
  const mark = randomUUID().replaceAll("-", "").slice(0, 12);
  const regex = new RegExp(`${mark}({.*})${mark}`);
  const shell = getSystemShell();
  const name = basename(shell);

  let command;
  let shellArgs;

  if (/^(?:pwsh|powershell)(?:-preview)?$/.test(name)) {
    command = `& '${process.execPath}' -p '''${mark}'' + JSON.stringify(process.env) + ''${mark}'''`;
    shellArgs = ["-Login", "-Command"];
  } else if (name === "nu") {
    command = `^'${process.execPath}' -p '"${mark}" + JSON.stringify(process.env) + "${mark}"'`;
    shellArgs = ["-i", "-l", "-c"];
  } else if (name === "xonsh") {
    command = `import os, json; print("${mark}", json.dumps(dict(os.environ)), "${mark}")`;
    shellArgs = ["-i", "-l", "-c"];
  } else {
    command = `'${process.execPath}' -p '"${mark}" + JSON.stringify(process.env) + "${mark}"'`;
    shellArgs = name === "tcsh" || name === "csh" ? ["-ic"] : ["-i", "-l", "-c"];
  }

  const shellEnv = { ...process.env };
  delete shellEnv.PASEO_NODE_ENV;
  delete shellEnv.PASEO_DESKTOP_MANAGED;
  delete shellEnv.PASEO_SUPERVISED;

  const result = spawnSync(shell, [...shellArgs, command], {
    encoding: "utf8",
    timeout: RESOLVE_TIMEOUT_MS,
    env: {
      ...shellEnv,
      ELECTRON_RUN_AS_NODE: "1",
      ELECTRON_NO_ATTACH_CONSOLE: "1",
    },
  });

  if (result.status !== 0 && result.status !== null) return undefined;
  if (!result.stdout) return undefined;

  const match = regex.exec(result.stdout);
  if (!match?.[1]) return undefined;

  try {
    const env = JSON.parse(match[1]);
    if (savedRunAsNode) {
      env.ELECTRON_RUN_AS_NODE = savedRunAsNode;
    } else {
      delete env.ELECTRON_RUN_AS_NODE;
    }
    if (savedNoAttach) {
      env.ELECTRON_NO_ATTACH_CONSOLE = savedNoAttach;
    } else {
      delete env.ELECTRON_NO_ATTACH_CONSOLE;
    }
    delete env.XDG_RUNTIME_DIR;
    return env;
  } catch {
    return undefined;
  }
}

export function inheritLoginShellEnv() {
  try {
    const env = resolveShellEnv();
    if (env) {
      Object.assign(process.env, env);
    }
  } catch {
    // Keep Electron's inherited environment if shell lookup fails.
  }
}
