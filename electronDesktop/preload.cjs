const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("paseoDesktop", {
  config: () => ipcRenderer.invoke("daemon:config"),
  configure: (payload) => ipcRenderer.invoke("daemon:configure", payload),
  status: () => ipcRenderer.invoke("daemon:status"),
  start: () => ipcRenderer.invoke("daemon:start"),
  stop: () => ipcRenderer.invoke("daemon:stop"),
  restart: () => ipcRenderer.invoke("daemon:restart"),
  pairing: () => ipcRenderer.invoke("daemon:pairing"),
  logs: (lineCount) => ipcRenderer.invoke("daemon:logs", lineCount),
  connections: () => ipcRenderer.invoke("daemon:connections"),
  listTools: () => ipcRenderer.invoke("tools:list"),
  toolStatus: () => ipcRenderer.invoke("tools:status"),
  toolLogs: () => ipcRenderer.invoke("tools:logs"),
  clearToolLogs: () => ipcRenderer.invoke("tools:logs:clear"),
  copyToolLogs: () => ipcRenderer.invoke("tools:logs:copy"),
  installTool: (toolId) => ipcRenderer.invoke("tools:install", toolId),
  updateTool: (toolId) => ipcRenderer.invoke("tools:update", toolId),
  checkUpdate: () => ipcRenderer.invoke("update:check"),
  getLatestUpdate: () => ipcRenderer.invoke("update:latest"),
  installUpdate: (info) => ipcRenderer.invoke("update:install", info),
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),
  onDaemonEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("daemon:event", listener);
    return () => ipcRenderer.removeListener("daemon:event", listener);
  },
  onUpdateAvailable: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("update:available", listener);
    return () => ipcRenderer.removeListener("update:available", listener);
  },
});
