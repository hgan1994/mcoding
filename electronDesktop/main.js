import { app, BrowserWindow, clipboard, ipcMain, Menu, nativeImage, shell, Tray } from "electron";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { inheritLoginShellEnv } from "./lib/login-shell-env.js";
import { DaemonManager } from "./lib/daemon-manager.js";
import { LocalToolManager } from "./lib/local-tools.js";
import { UpdateChecker } from "./lib/update-checker.js";

inheritLoginShellEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const daemonManager = new DaemonManager();
const localToolManager = new LocalToolManager();
const PROJECT_WEBSITE_URL = process.env.PASEO_PROJECT_URL?.trim() || "";
const PUBLIC_APP_URL = process.env.PASEO_PUBLIC_APP_URL?.trim() || "";
const updateChecker = new UpdateChecker({
  checkUrl: process.env.PASEO_APP_UPDATE_URL?.trim() || "",
  onUpdateAvailable: (info) => {
    send("update:available", info);
  },
});

let mainWindow = null;
let tray = null;
let quitInProgress = false;
let autoLaunchEnabled = true;

function getDesktopConfigPath() {
  return path.join(app.getPath("userData"), "desktop-config.json");
}

function loadDesktopConfig() {
  try {
    return JSON.parse(readFileSync(getDesktopConfigPath(), "utf8"));
  } catch {
    return {};
  }
}

function saveDesktopConfig(config) {
  const filePath = getDesktopConfigPath();
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(config, null, 2));
}

function applyDesktopConfig(config) {
  daemonManager.updateRelayConfig({
    relayAddress: typeof config?.relayAddress === "string" ? config.relayAddress : "",
  });
  return daemonManager.getConfig();
}

async function showAppDownloadQr() {
  const url = PUBLIC_APP_URL;
  if (!url) {
    return;
  }
  let qrDataUrl;
  try {
    qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 256,
      color: { dark: "#111827", light: "#ffffff" },
    });
  } catch {
    shell.openExternal(url);
    return;
  }
  const win = new BrowserWindow({
    width: 340,
    height: 420,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: "APP下载",
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  win.setMenuBarVisibility(false);
  win.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>APP下载</title><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fff;color:#333}img{width:220px;height:220px;border-radius:12px}p{margin-top:20px;font-size:14px;color:#666}a{color:#2563eb;text-decoration:none}</style></head><body><img src="${qrDataUrl}" alt="QR Code"/><p>扫描二维码下载 APP</p><p style="margin-top:8px;font-size:12px;color:#999">${url}</p></body></html>`)
  );
}

function toggleAutoLaunch() {
  autoLaunchEnabled = !autoLaunchEnabled;
  try {
    app.setLoginItemSettings({ openAtLogin: autoLaunchEnabled });
  } catch {
    autoLaunchEnabled = !autoLaunchEnabled;
  }
  rebuildMenu();
  rebuildTrayMenu();
}

function send(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(channel, payload);
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function toggleMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showMainWindow();
  }
}

async function restartDaemonFromTray() {
  send("daemon:event", { type: "notice", messageKey: "initializing" });
  try {
    const status = await daemonManager.restart();
    send("daemon:event", { type: "status", status });
  } catch (error) {
    send("daemon:event", {
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function requestQuit() {
  app.quit();
}

function createTrayIcon() {
  const iconPath = path.join(__dirname, "build", "icon.png");
  try {
    const image = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
    if (!image.isEmpty()) return image;
  } catch {}
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path fill="#000" d="M9 1.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 2.2a5.3 5.3 0 1 1 0 10.6A5.3 5.3 0 0 1 9 3.7Zm0 2.2a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Z"/></svg>`;
  const image = nativeImage.createFromDataURL(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`);
  image.setTemplateImage(true);
  return image;
}

function createTray() {
  if (tray) return;
  tray = new Tray(createTrayIcon());
  tray.setToolTip("mcoding Desktop");
  rebuildTrayMenu();
  tray.on("click", toggleMainWindow);
  tray.on("double-click", showMainWindow);
}

function rebuildTrayMenu() {
  if (!tray) return;
  const externalLinks = [
    ...(PROJECT_WEBSITE_URL
      ? [{ label: "项目主页", click: () => shell.openExternal(PROJECT_WEBSITE_URL) }]
      : []),
    ...(PUBLIC_APP_URL
      ? [{ label: "APP下载", click: () => void showAppDownloadQr() }]
      : []),
  ];
  const template = [
    { label: "显示 mcoding", click: showMainWindow },
    { label: "隐藏窗口", click: () => mainWindow?.hide() },
    ...(externalLinks.isNotEmpty ? [{ type: "separator" }, ...externalLinks] : []),
    { type: "separator" },
    { label: "开机自动启动", type: "checkbox", checked: autoLaunchEnabled, click: toggleAutoLaunch },
    { type: "separator" },
    { label: "重启守护进程", click: () => void restartDaemonFromTray() },
    { type: "separator" },
    { label: "退出", click: requestQuit },
  ];
  tray.setContextMenu(Menu.buildFromTemplate(template));
}

function rebuildMenu() {
  const externalLinks = [
    ...(PROJECT_WEBSITE_URL
      ? [{ label: "项目主页", click: () => shell.openExternal(PROJECT_WEBSITE_URL) }]
      : []),
    ...(PUBLIC_APP_URL
      ? [{ label: "APP下载", click: () => void showAppDownloadQr() }]
      : []),
  ];
  const template = [
    {
      label: "mcoding",
      submenu: [
        ...externalLinks,
        ...(externalLinks.isNotEmpty ? [{ type: "separator" }] : []),
        { label: "隐藏 mcoding", accelerator: "CmdOrCtrl+H", click: () => mainWindow?.hide() },
        { type: "separator" },
        { label: "退出", accelerator: "CmdOrCtrl+Q", click: requestQuit },
      ],
    },
    {
      label: "设置",
      submenu: [
        {
          label: "开机自动启动",
          type: "checkbox",
          checked: autoLaunchEnabled,
          click: toggleAutoLaunch,
        },
        { type: "separator" },
        {
          label: `版本 ${app.getVersion()}`,
          enabled: false,
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function registerIpc() {
  ipcMain.handle("daemon:config", () => daemonManager.getConfig());
  ipcMain.handle("daemon:configure", (_event, payload = {}) => {
    const relayAddress =
      typeof payload?.relayAddress === "string" ? payload.relayAddress.trim() : "";
    if (!relayAddress) {
      throw new Error("Relay service address is required.");
    }
    saveDesktopConfig({ relayAddress });
    return applyDesktopConfig({ relayAddress });
  });
  ipcMain.handle("daemon:status", () => daemonManager.status());
  ipcMain.handle("daemon:start", () => daemonManager.start());
  ipcMain.handle("daemon:stop", () => daemonManager.stop());
  ipcMain.handle("daemon:restart", () => daemonManager.restart());
  ipcMain.handle("daemon:pairing", () => daemonManager.pairing());
  ipcMain.handle("daemon:logs", (_event, lineCount) => daemonManager.logs(lineCount));
  ipcMain.handle("daemon:connections", () => daemonManager.connections());
  ipcMain.handle("tools:list", () => localToolManager.list());
  ipcMain.handle("tools:status", () => localToolManager.status());
  ipcMain.handle("tools:logs", () => localToolManager.getInstallLogs());
  ipcMain.handle("tools:logs:clear", () => localToolManager.clearInstallLogs());
  ipcMain.handle("tools:logs:copy", () => {
    const logs = localToolManager.getInstallLogs().contents || "";
    clipboard.writeText(logs);
    return { copied: true, length: logs.length };
  });
  ipcMain.handle("tools:install", (_event, toolId) => localToolManager.install(toolId));
  ipcMain.handle("tools:update", (_event, toolId) => localToolManager.update(toolId));
  ipcMain.handle("shell:openExternal", (_event, url) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      throw new Error("Invalid external URL.");
    }
    return shell.openExternal(url);
  });
  ipcMain.handle("update:check", () => updateChecker.checkForUpdate());
  ipcMain.handle("update:latest", () => updateChecker.lastResult);
  ipcMain.handle("update:install", async (_event, info) => {
    const result = await updateChecker.installAndRelaunch(info);
    setTimeout(() => app.quit(), 300);
    return result;
  });
  ipcMain.handle("autolaunch:get", () => {
    try {
      const settings = app.getLoginItemSettings();
      autoLaunchEnabled = settings.openAtLogin;
    } catch {}
    return { enabled: autoLaunchEnabled };
  });
  ipcMain.handle("autolaunch:set", (_event, enabled) => {
    autoLaunchEnabled = Boolean(enabled);
    try {
      app.setLoginItemSettings({ openAtLogin: autoLaunchEnabled });
    } catch {
      autoLaunchEnabled = !autoLaunchEnabled;
    }
    rebuildMenu();
    return { enabled: autoLaunchEnabled };
  });
}

async function createMainWindow() {
  const appIcon = nativeImage.createFromPath(path.join(__dirname, "build", "icon.png"));
  mainWindow = new BrowserWindow({
    title: "mcoding Desktop",
    width: 400,
    height: 852,
    minWidth: 340,
    minHeight: 620,
    resizable: true,
    backgroundColor: "#0a0e1a",
    icon: appIcon.isEmpty() ? undefined : appIcon,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 10 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("close", (event) => {
    if (quitInProgress) return;
    event.preventDefault();
    mainWindow.hide();
  });

  await mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

async function autoStartDaemon() {
  if (!daemonManager.hasRelayConfig()) {
    send("daemon:event", { type: "notice", messageKey: "relayConfigRequired" });
    return;
  }
  send("daemon:event", { type: "notice", messageKey: "initializing" });
  try {
    const started = await daemonManager.start();
    send("daemon:event", { type: "status", status: started });
  } catch (error) {
    send("daemon:event", {
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

app.setName("mcoding Desktop");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    showMainWindow();
  });

  app.whenReady().then(async () => {
    applyDesktopConfig(loadDesktopConfig());
    registerIpc();
    await createMainWindow();
    createTray();
    rebuildMenu();
    try { app.setLoginItemSettings({ openAtLogin: true }); } catch {}
    void autoStartDaemon();
    updateChecker.startPeriodicCheck();
  });
}

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
  showMainWindow();
});

app.on("before-quit", (event) => {
  if (quitInProgress) return;
  quitInProgress = true;
  event.preventDefault();
  send("daemon:event", { type: "notice", messageKey: "stoppingDaemon" });
  updateChecker.stopPeriodicCheck();

  daemonManager
    .stop()
    .catch((error) => {
      console.error("[electronDesktop] failed to stop daemon on quit", error);
    })
    .finally(() => {
      app.exit(0);
    });
});

app.on("window-all-closed", () => {});
