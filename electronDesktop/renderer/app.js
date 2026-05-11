import { t, setLocale, applyTranslations } from "./i18n.js";

setLocale(navigator.language);
applyTranslations();

const bridge = window.paseoDesktop;
const missingBridgeError = t("preloadUnavailable");
const api =
  bridge ||
  {
    config: async () => {
      throw new Error(missingBridgeError);
    },
    configure: async () => {
      throw new Error(missingBridgeError);
    },
    status: async () => fallbackStatus(missingBridgeError),
    start: async () => {
      throw new Error(missingBridgeError);
    },
    stop: async () => {
      throw new Error(missingBridgeError);
    },
    restart: async () => {
      throw new Error(missingBridgeError);
    },
    pairing: async () => ({ relayEnabled: false, url: null, qr: null, error: missingBridgeError }),
    listTools: async () => [],
    toolStatus: async () => [],
    toolLogs: async () => ({ contents: "" }),
    clearToolLogs: async () => ({ contents: "" }),
    copyToolLogs: async () => ({ copied: false, length: 0 }),
    installTool: async () => {
      throw new Error(missingBridgeError);
    },
    updateTool: async () => {
      throw new Error(missingBridgeError);
    },
    checkUpdate: async () => null,
    getLatestUpdate: async () => null,
    installUpdate: async () => {
      throw new Error(missingBridgeError);
    },
    openExternal: async () => {
      throw new Error(missingBridgeError);
    },
    connections: async () => ({ activeConnections: 0, totalConnections: 0 }),
    onDaemonEvent: () => () => {},
    onUpdateAvailable: () => () => {},
  };

const elements = {
  notice: document.querySelector("#notice"),
  stateBadge: document.querySelector("#stateBadge"),
  connectionInfo: document.querySelector("#connectionInfo"),
  relayAddressInput: document.querySelector("#relayAddressInput"),
  relayConfigButton: document.querySelector("#relayConfigButton"),
  relayConfigHint: document.querySelector("#relayConfigHint"),
  qrImage: document.querySelector("#qrImage"),
  qrMessage: document.querySelector("#qrMessage"),
  qrHint: document.querySelector(".qr-hint"),
  toolsList: document.querySelector("#toolsList"),
  toolsRefreshButton: document.querySelector("#toolsRefreshButton"),
  toolLogsOutput: document.querySelector("#toolLogsOutput"),
  toolLogsRefreshButton: document.querySelector("#toolLogsRefreshButton"),
  toolLogsCopyButton: document.querySelector("#toolLogsCopyButton"),
  toolLogsClearButton: document.querySelector("#toolLogsClearButton"),
  loadingOverlay: document.querySelector("#loadingOverlay"),
  loadingText: document.querySelector(".loading-text"),
  mainShell: document.querySelector("#mainShell"),
  updateBanner: document.querySelector("#updateBanner"),
  updateBannerText: document.querySelector("#updateBannerText"),
  updateDownloadBtn: document.querySelector("#updateDownloadBtn"),
  updateDismissBtn: document.querySelector("#updateDismissBtn"),
  updateProgressBar: document.querySelector("#updateProgressBar"),
};

let config = null;
const toolBusyIds = new Set();
let latestToolStatuses = [];
let loadingDismissed = false;
let providerLoadingTimer = null;
let pairingLoadPromise = null;
let connectionPollTimer = null;
let toolLogsRefreshTimer = null;
const toolInstallFailures = new Map();
let relayConfigBusy = false;

function fallbackStatus(error) {
  return {
    serverId: "",
    status: "errored",
    listen: null,
    hostname: null,
    pid: null,
    version: null,
    desktopManaged: false,
    error: error instanceof Error ? error.message : String(error || t("daemonStatusUnavailable")),
  };
}

function isStatus(value) {
  return Boolean(value && typeof value === "object" && typeof value.status === "string");
}

function setNotice(message) {
  elements.notice.textContent = text(message);
}

function text(value) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

let dismissedUpdateVersionCode = null;

function showUpdateBanner(info) {
  if (!info || !elements.updateBanner) return;
  if (dismissedUpdateVersionCode === info.versionCode) return;
  elements.updateBannerText.textContent = `${t("newVersionAvailable")}: v${info.versionName}`;
  elements.updateBanner.hidden = false;
  elements.updateDownloadBtn.disabled = false;
  elements.updateDownloadBtn.textContent = t("installAndRestart");
  if (elements.updateProgressBar) {
    elements.updateProgressBar.hidden = true;
  }
  elements.updateDownloadBtn.onclick = async () => {
    if (!api.installUpdate) return;
    elements.updateDownloadBtn.disabled = true;
    elements.updateDownloadBtn.textContent = t("installingUpdate");
    if (elements.updateProgressBar) {
      elements.updateProgressBar.hidden = false;
    }
    try {
      await api.installUpdate(info);
      elements.updateDownloadBtn.textContent = t("restarting");
      if (elements.updateProgressBar) {
        elements.updateProgressBar.hidden = true;
      }
    } catch (error) {
      elements.updateDownloadBtn.disabled = false;
      elements.updateDownloadBtn.textContent = t("installAndRestart");
      if (elements.updateProgressBar) {
        elements.updateProgressBar.hidden = true;
      }
      setNotice(error instanceof Error ? error.message : String(error));
    }
  };
  elements.updateDismissBtn.onclick = () => {
    elements.updateBanner.hidden = true;
    dismissedUpdateVersionCode = info.versionCode;
  };
}

function renderStatus(status) {
  const safeStatus = isStatus(status) ? status : fallbackStatus();
  elements.stateBadge.textContent = safeStatus.status;
  elements.stateBadge.dataset.state = safeStatus.status;

  if (!config?.hasRelayConfig) {
    setNotice(t("relayConfigRequired"));
    stopConnectionPoll();
    hideConnectionInfo();
  } else if (safeStatus.error) {
    setNotice(safeStatus.error);
    stopConnectionPoll();
    hideConnectionInfo();
  } else if (safeStatus.status === "running") {
    setNotice(t("daemonRunning"));
    startConnectionPoll();
  } else {
    setNotice(t("daemonStopped"));
    stopConnectionPoll();
    hideConnectionInfo();
  }
}

function renderRelayConfig() {
  if (!elements.relayAddressInput || !elements.relayConfigButton) return;
  const relayAddress = config?.relayAddress || "";
  if (document.activeElement !== elements.relayAddressInput) {
    elements.relayAddressInput.value = relayAddress;
  }
  elements.relayConfigButton.disabled = relayConfigBusy;
  elements.relayConfigButton.textContent = relayConfigBusy
    ? t("savingRelayConfig")
    : t("saveAndStart");
}

async function refresh() {
  const status = await api.status();
  renderStatus(status);
  return status;
}

function hideConnectionInfo() {
  if (elements.connectionInfo) {
    elements.connectionInfo.hidden = true;
    elements.connectionInfo.textContent = "";
  }
}

function renderConnections(data) {
  if (!elements.connectionInfo) return;
  const count = data?.activeConnections ?? 0;
  elements.connectionInfo.textContent = t("connectedDevices", { count });
  elements.connectionInfo.hidden = false;
}

function renderToolLogs(payload) {
  if (!elements.toolLogsOutput) return;
  const contents = payload?.contents?.trim();
  elements.toolLogsOutput.textContent = contents || t("noLogsYet");
}

async function loadToolLogs() {
  if (!api.toolLogs) return;
  const payload = await api.toolLogs();
  renderToolLogs(payload);
}

function startToolLogPolling() {
  if (toolLogsRefreshTimer) return;
  toolLogsRefreshTimer = setInterval(() => {
    void loadToolLogs().catch(() => {});
  }, 1200);
}

function stopToolLogPolling() {
  if (!toolLogsRefreshTimer) return;
  clearInterval(toolLogsRefreshTimer);
  toolLogsRefreshTimer = null;
}

async function loadConnections() {
  if (!api.connections) return;
  const data = await api.connections();
  renderConnections(data);
}

function startConnectionPoll() {
  stopConnectionPoll();
  void loadConnections();
  connectionPollTimer = setInterval(() => void loadConnections(), 5000);
}

function stopConnectionPoll() {
  if (connectionPollTimer) {
    clearInterval(connectionPollTimer);
    connectionPollTimer = null;
  }
}

async function loadPairing() {
  if (!config?.hasRelayConfig) {
    elements.qrImage.hidden = true;
    elements.qrImage.removeAttribute("src");
    elements.qrHint.hidden = true;
    elements.qrMessage.hidden = false;
    elements.qrMessage.classList.remove("loading");
    elements.qrMessage.textContent = t("relayConfigRequired");
    return false;
  }
  const pairing = await api.pairing();
  if (pairing.error) {
    elements.qrImage.hidden = true;
    elements.qrImage.removeAttribute("src");
    elements.qrHint.hidden = true;
    elements.qrMessage.hidden = false;
    elements.qrMessage.classList.remove("loading");
    elements.qrMessage.textContent = pairing.error;
    return false;
  }
  if (pairing.qrDataUrl) {
    try {
      await showQrImage(pairing.qrDataUrl);
      dismissLoading();
      return true;
    } catch (error) {
      elements.qrImage.hidden = true;
      elements.qrImage.removeAttribute("src");
      elements.qrHint.hidden = true;
      elements.qrMessage.hidden = false;
      elements.qrMessage.classList.remove("loading");
      elements.qrMessage.textContent = error instanceof Error ? error.message : t("qrUnavailable");
      return false;
    }
  } else {
    elements.qrImage.hidden = true;
    elements.qrImage.removeAttribute("src");
    elements.qrHint.hidden = true;
    elements.qrMessage.hidden = false;
    elements.qrMessage.classList.remove("loading");
    elements.qrMessage.textContent = pairing.qr || t("qrUnavailable");
    return false;
  }
}

function showQrImage(qrDataUrl) {
  if (elements.qrImage.src === qrDataUrl && !elements.qrImage.hidden) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const onLoad = async () => {
      cleanup();
      try {
        if (typeof elements.qrImage.decode === "function") {
          await elements.qrImage.decode();
        }
      } catch {
      }
      elements.qrImage.hidden = false;
      elements.qrMessage.hidden = true;
      elements.qrMessage.classList.remove("loading");
      elements.qrHint.hidden = false;
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(t("qrUnavailable")));
    };
    const cleanup = () => {
      elements.qrImage.removeEventListener("load", onLoad);
      elements.qrImage.removeEventListener("error", onError);
    };

    elements.qrImage.addEventListener("load", onLoad, { once: true });
    elements.qrImage.addEventListener("error", onError, { once: true });
    elements.qrImage.src = qrDataUrl;
    if (elements.qrImage.complete && elements.qrImage.naturalWidth > 0) {
      void onLoad();
    }
  });
}

function renderTools(statuses) {
  const items = Array.isArray(statuses) ? statuses : [];
  latestToolStatuses = items;
  if (items.length === 0) {
    elements.toolsList.innerHTML = `<p class="empty">${t("noComponents")}</p>`;
    return;
  }

  elements.toolsList.innerHTML = "";
  const anyToolBusy = toolBusyIds.size > 0;
  for (const status of items) {
    const tool = status.tool || {};
    const isBusy = toolBusyIds.has(tool.id);
    const officialInstallUrl =
      status.installSupported === false
        ? status.officialInstallUrl || tool.officialInstallUrl
        : toolInstallFailures.get(tool.id);
    const showOfficialInstall =
      Boolean(officialInstallUrl) &&
      (!status.installed || toolInstallFailures.has(tool.id) || status.installSupported === false);
    const hideAction = status.installed && status.isLatest !== false;
    const row = document.createElement("article");
    row.className = "tool-row";
    row.dataset.installed = status.installed ? "true" : "false";
    row.dataset.providerStatus = status.providerStatus || "";

    const meta = document.createElement("div");
    meta.className = "tool-meta";

    const title = document.createElement("div");
    title.className = "tool-title";
    title.textContent = text(tool.label);

    const detail = document.createElement("div");
    detail.className = "tool-detail";
    detail.textContent = status.installed
      ? [
          providerLabel(status.providerStatus),
          sourceLabel(status.source),
          status.version,
        ]
          .filter(Boolean)
          .join(" · ") || t("installed")
      : [
          providerLabel(status.providerStatus),
          text(tool.installLabel || tool.npmPackage || tool.command),
        ]
          .filter(Boolean)
          .join(" · ");

    meta.append(title, detail);

    const state = document.createElement("span");
    state.className = "tool-state";
    state.textContent =
      isBusy
        ? t("working")
        : status.providerStatus === "available"
          ? t("ready")
          : status.providerStatus === "loading"
            ? t("loading")
            : status.providerStatus === "error"
              ? t("error")
              : status.providerStatus === "unavailable"
                ? t("notAvailable")
                : status.source === "bundled"
                  ? t("bundled")
                  : status.installed
                    ? t("ok")
                    : t("missing");

    const installButton = document.createElement("button");
    installButton.className = "tool-install";
    installButton.textContent = toolActionText({
      showOfficialInstall,
      isBusy,
      installed: status.installed,
      source: status.source,
    });
    installButton.disabled =
      !showOfficialInstall && (anyToolBusy || (!tool.npmPackage && !tool.installCommand));
    installButton.setAttribute("aria-busy", isBusy ? "true" : "false");
    installButton.addEventListener("click", () => {
      if (showOfficialInstall && officialInstallUrl) {
        void api.openExternal(officialInstallUrl);
        return;
      }
      void runToolAction(tool.id, status.installed ? "update" : "install");
    });

    const actions = document.createElement("div");
    actions.className = "tool-actions";
    actions.append(state);
    if (!status.installed) {
      actions.append(installButton);
    }

    row.append(meta, actions);
    elements.toolsList.append(row);
  }
}

function sourceLabel(source) {
  if (source === "bundled") return t("sdk");
  if (source === "path") return t("path");
  return "";
}

function providerLabel(status) {
  if (!status) return "";
  return status;
}

function rememberToolFailure(status) {
  const toolId = status?.tool?.id;
  const url = status?.officialInstallUrl || status?.tool?.officialInstallUrl;
  if (!toolId || !status?.error || !url) return;
  toolInstallFailures.set(toolId, url);
}

function clearToolFailure(status) {
  const toolId = status?.tool?.id;
  if (toolId && status?.installed) {
    toolInstallFailures.delete(toolId);
  }
}

function toolActionText({ showOfficialInstall, isBusy, installed, source }) {
  if (showOfficialInstall) return t("officialInstall");
  if (isBusy) return installed ? t("upgrading") : t("installing");
  if (source === "bundled") return t("install");
  return installed ? t("upgrade") : t("install");
}

async function loadTools() {
  const statuses = await api.toolStatus();
  renderTools(statuses);
  syncQrVisibility(statuses);
}

function syncQrVisibility(statuses) {
  const items = Array.isArray(statuses) ? statuses : [];
  const anyLoading = items.some(
    (s) => s.providerStatus === "loading",
  );

  if (anyLoading) {
    if (!providerLoadingTimer) {
      void loadPairing();
      providerLoadingTimer = setInterval(async () => {
        const refreshed = await api.toolStatus();
        renderTools(refreshed);
        syncQrVisibility(refreshed);
      }, 3000);
    }
  } else {
    if (providerLoadingTimer) {
      clearInterval(providerLoadingTimer);
      providerLoadingTimer = null;
    }
    void loadPairing().catch(() => {});
  }
}

async function runToolAction(toolId, action) {
  if (toolBusyIds.size > 0) return;
  toolBusyIds.add(toolId);
  renderTools(latestToolStatuses);
  await loadToolLogs().catch(() => {});
  startToolLogPolling();
  setNotice(action === "install" ? t("installing") : t("upgrading"));
  try {
    const result =
      action === "install" ? await api.installTool(toolId) : await api.updateTool(toolId);
    if (result.error) {
      rememberToolFailure(result);
    } else {
      clearToolFailure(result);
    }
    const refreshed = await api.toolStatus();
    refreshed.forEach(clearToolFailure);
    renderTools(
      refreshed.map((status) => (status.tool?.id === toolId ? result : status)),
    );
    setNotice(result.error || `${text(result.tool?.label)} ${t("ready")}`);
  } catch (error) {
    setNotice(error instanceof Error ? error.message : String(error));
    await loadTools().catch(() => {});
  } finally {
    toolBusyIds.delete(toolId);
    if (toolBusyIds.size === 0) {
      stopToolLogPolling();
    }
    await loadToolLogs().catch(() => {});
    await loadTools().catch(() => {});
  }
}

async function saveRelayConfigAndStart() {
  const relayAddress = elements.relayAddressInput?.value?.trim() || "";
  if (!relayAddress) {
    setNotice(t("relayConfigRequired"));
    elements.relayAddressInput?.focus();
    return;
  }

  relayConfigBusy = true;
  renderRelayConfig();
  setNotice(t("savingRelayConfig"));

  try {
    config = await api.configure({ relayAddress });
    renderRelayConfig();
    setNotice(t("relayConfigSaved"));
    const currentStatus = await api.status();
    const status =
      currentStatus?.status === "running" ? await api.restart() : await api.start();
    renderStatus(status);
    await waitForPairing();
  } catch (error) {
    setNotice(error instanceof Error ? error.message : String(error));
  } finally {
    relayConfigBusy = false;
    renderRelayConfig();
  }
}

if (elements.relayConfigButton) {
  elements.relayConfigButton.addEventListener("click", () => {
    void saveRelayConfigAndStart();
  });
}

if (elements.relayAddressInput) {
  elements.relayAddressInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveRelayConfigAndStart();
    }
  });
}

elements.toolsRefreshButton.addEventListener("click", () => {
  void loadTools();
});

if (elements.toolLogsRefreshButton) {
  elements.toolLogsRefreshButton.addEventListener("click", () => {
    void loadToolLogs();
  });
}

if (elements.toolLogsCopyButton) {
  elements.toolLogsCopyButton.addEventListener("click", async () => {
    if (!api.copyToolLogs) return;
    await api.copyToolLogs();
    setNotice(t("copied"));
  });
}

if (elements.toolLogsClearButton) {
  elements.toolLogsClearButton.addEventListener("click", async () => {
    if (!api.clearToolLogs) return;
    const payload = await api.clearToolLogs();
    renderToolLogs(payload);
  });
}

api.onDaemonEvent((event = {}) => {
  if (event.type === "notice") {
    const msg = event.messageKey ? t(event.messageKey) : event.message;
    setNotice(msg);
    if (elements.loadingText && !loadingDismissed) {
      elements.loadingText.textContent = msg;
    }
  }
  if (event.type === "error") {
    setNotice(event.message);
    dismissLoading();
  }
  if (event.type === "status") {
    renderStatus(event.status);
    void loadConnections();
    void waitForPairing();
  }
});

if (api.onUpdateAvailable) {
  api.onUpdateAvailable((info) => showUpdateBanner(info));
}

async function checkForUpdate() {
  if (!api.checkUpdate) return;
  try {
    const latest = api.getLatestUpdate ? await api.getLatestUpdate() : null;
    if (latest && latest.hasUpdate) {
      showUpdateBanner(latest);
      return;
    }
    const result = await api.checkUpdate();
    if (result && result.hasUpdate) {
      showUpdateBanner(result);
    }
  } catch {}
}

function dismissLoading() {
  if (loadingDismissed) return;
  loadingDismissed = true;
  if (!elements.mainShell || !elements.loadingOverlay) return;
  elements.mainShell.classList.remove("shell-hidden");
  elements.loadingOverlay.classList.add("fade-out");
  elements.loadingOverlay.addEventListener("transitionend", () => {
    elements.loadingOverlay.remove();
  }, { once: true });
  setTimeout(() => {
    if (elements.loadingOverlay && elements.loadingOverlay.parentNode) {
      elements.loadingOverlay.remove();
    }
  }, 500);
}

setTimeout(() => {
  if (!loadingDismissed) {
    waitForPairing().catch(() => dismissLoading());
  }
}, 8000);

async function waitForPairing() {
  if (!pairingLoadPromise) {
    pairingLoadPromise = loadPairing().finally(() => {
      pairingLoadPromise = null;
    });
  }
  const hasQr = await pairingLoadPromise;
  if (!hasQr) {
    dismissLoading();
  }
  return hasQr;
}

async function boot() {
  try {
    config = await api.config();
    renderRelayConfig();
    renderStatus(await api.status());
    const bootTasks = [loadTools(), loadConnections(), loadToolLogs()];
    if (config?.hasRelayConfig) {
      bootTasks.unshift(waitForPairing());
    }
    const [pairingResult] = await Promise.allSettled(bootTasks);
    if (pairingResult.status === "rejected") {
      dismissLoading();
    }
    if (!config?.hasRelayConfig) {
      dismissLoading();
    }
    void checkForUpdate();
  } catch (error) {
    renderStatus(fallbackStatus(error));
    dismissLoading();
  }
}

void boot();
