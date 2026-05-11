const en = {
  startingPaseo: "Starting mcoding...",
  checking: "Checking",
  preparingDaemon: "Preparing daemon...",
  loadingQr: "Loading QR...",
  components: "Components",
  refresh: "Refresh",
  bundled: "Bundled",
  daemonRunning: "Daemon running",
  daemonStatusUnavailable: "Daemon status unavailable.",
  daemonStopped: "Daemon stopped",
  error: "Error",
  install: "Install",
  installed: "Installed",
  installing: "Installing...",
  initializing: "Initializing...",
  loading: "Loading",
  missing: "Missing",
  noComponents: "No components found.",
  connectedDevices: "Connected devices: {count}",
  notAvailable: "Not available",
  ok: "OK",
  path: "PATH",
  preloadUnavailable: "Desktop bridge unavailable.",
  qrUnavailable: "QR code unavailable.",
  ready: "Ready",
  sdk: "SDK",
  stoppingDaemon: "Stopping daemon with desktop...",
  upgrade: "Upgrade",
  upgrading: "Upgrading...",
  working: "Working...",
  newVersionAvailable: "New version available",
  download: "Download",
  installAndRestart: "Install & Restart",
  installingUpdate: "Installing...",
  restarting: "Restarting...",
  version: "Version",
  scanHint: "Scan with the mcoding app to connect",
  autoLaunch: "Auto-start on boot",
  settings: "Settings",
  copied: "Copied",
  copyLogs: "Copy",
  clearLogs: "Clear",
  componentInstallLogs: "Component Install Logs",
  componentInstallLogsHint: "Installation and upgrade output appears here when a local component command runs.",
  noLogsYet: "No install logs yet.",
  officialInstall: "Official Install",
  relayConfigTitle: "Relay Service",
  relayAddressLabel: "Relay address",
  relayConfigHint: "Enter the relay-service address before starting the daemon. It will be saved locally for next time.",
  saveAndStart: "Save and Start",
  savingRelayConfig: "Saving relay configuration...",
  relayConfigRequired: "Enter the relay-service address before starting the daemon.",
  relayConfigSaved: "Relay configuration saved.",
};

const zhCN = {
  startingPaseo: "正在启动 mcoding...",
  checking: "检测中",
  preparingDaemon: "正在准备守护进程...",
  loadingQr: "加载二维码...",
  components: "组件",
  refresh: "刷新",
  bundled: "内置",
  daemonRunning: "运行中",
  daemonStatusUnavailable: "不可用。",
  daemonStopped: "已停止",
  error: "错误",
  install: "安装",
  installed: "已安装",
  installing: "正在安装...",
  initializing: "正在初始化...",
  loading: "加载中",
  missing: "未安装",
  noComponents: "未发现组件。",
  connectedDevices: "已连接设备: {count}",
  notAvailable: "不可用",
  ok: "正常",
  path: "PATH",
  preloadUnavailable: "桌面桥接不可用。",
  qrUnavailable: "二维码不可用。",
  ready: "就绪",
  sdk: "SDK",
  stoppingDaemon: "正在停止守护进程...",
  upgrade: "升级",
  upgrading: "正在升级...",
  working: "处理中...",
  newVersionAvailable: "有新版本可用",
  download: "下载",
  installAndRestart: "更新",
  installingUpdate: "正在安装...",
  restarting: "正在重启...",
  version: "版本",
  scanHint: "请用 mcoding App 扫码连接本机",
  autoLaunch: "开机自动启动",
  settings: "设置",
  copied: "已复制",
  copyLogs: "复制",
  clearLogs: "清空",
  componentInstallLogs: "组件安装日志",
  componentInstallLogsHint: "本地组件执行安装或升级时，输出会显示在这里。",
  noLogsYet: "暂时还没有安装日志。",
  officialInstall: "官网安装",
  relayConfigTitle: "Relay 服务",
  relayAddressLabel: "Relay 地址",
  relayConfigHint: "请先输入 relay-service 地址，再启动 daemon。该地址会保存到本机，下次自动使用。",
  saveAndStart: "保存并启动",
  savingRelayConfig: "正在保存 relay 配置...",
  relayConfigRequired: "请先输入 relay-service 地址，再启动 daemon。",
  relayConfigSaved: "Relay 配置已保存。",
};

let locale = "en";

export function setLocale(lang) {
  if (lang && (lang === "zh-CN" || lang === "zh-Hans" || lang === "zh" || lang.startsWith("zh"))) {
    locale = "zh-CN";
  } else {
    locale = "en";
  }
}

export function getLocale() {
  return locale;
}

function getMessages() {
  return locale === "zh-CN" ? zhCN : en;
}

export function t(key, params) {
  const msgs = getMessages();
  let text = msgs[key] || en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key) el.title = t(key);
  });
}
