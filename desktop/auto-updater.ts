import { app, dialog } from "electron";
import { autoUpdater, type UpdateInfo } from "electron-updater";

export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";

let currentState: UpdateState = "idle";
let isManualCheck = false;
let checkInterval: ReturnType<typeof setInterval> | null = null;
let firstCheckTimer: ReturnType<typeof setTimeout> | null = null;

const FIRST_CHECK_DELAY_MS = 15_000;
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1_000; // 4 hours

function clearDockBadge(): void {
  if (process.platform === "darwin") app.dock?.setBadge("");
}

function bindEvents(): void {
  autoUpdater.on("checking-for-update", () => {
    currentState = "checking";
  });

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    currentState = "available";
    promptDownload(info);
  });

  autoUpdater.on("update-not-available", () => {
    currentState = "idle";
    if (isManualCheck) {
      isManualCheck = false;
      dialog.showMessageBox({
        type: "info",
        title: "No Updates",
        message: "You're up to date.",
        detail: `TalentClaw ${app.getVersion()} is the latest version.`,
        buttons: ["OK"],
      });
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    currentState = "downloading";
    if (process.platform === "darwin") {
      app.dock?.setBadge(`${Math.round(progress.percent)}%`);
    }
  });

  autoUpdater.on("update-downloaded", () => {
    currentState = "downloaded";
    clearDockBadge();
    promptInstall();
  });

  autoUpdater.on("error", (err) => {
    currentState = "error";
    clearDockBadge();
    console.error("[auto-updater] Error:", err.message);

    if (isManualCheck) {
      isManualCheck = false;
      dialog.showMessageBox({
        type: "error",
        title: "Update Error",
        message: "Could not check for updates.",
        detail: err.message,
        buttons: ["OK"],
      });
    }
    setTimeout(() => {
      if (currentState === "error") currentState = "idle";
    }, 5_000);
  });
}

async function promptDownload(info: UpdateInfo): Promise<void> {
  const { response } = await dialog.showMessageBox({
    type: "info",
    title: "Update Available",
    message: `Version ${info.version} is available.`,
    detail: "Would you like to download it now?",
    buttons: ["Download", "Later"],
    defaultId: 0,
    cancelId: 1,
  });

  if (response === 0) {
    currentState = "downloading";
    autoUpdater.downloadUpdate();
  } else {
    currentState = "idle";
  }
}

async function promptInstall(): Promise<void> {
  const { response } = await dialog.showMessageBox({
    type: "info",
    title: "Update Ready",
    message: "A new version has been downloaded.",
    detail: "Restart TalentClaw now to install the update?",
    buttons: ["Restart", "Later"],
    defaultId: 0,
    cancelId: 1,
  });

  if (response === 0) {
    quitAndInstall();
  }
}

/** Initialize the auto-updater. Call once after app is ready. */
export function initAutoUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  if (!app.isPackaged) autoUpdater.forceDevUpdateConfig = true;

  bindEvents();

  firstCheckTimer = setTimeout(() => {
    firstCheckTimer = null;
    autoUpdater.checkForUpdates().catch((err) => {
      console.error("[auto-updater] Scheduled check failed:", err.message);
    });
  }, FIRST_CHECK_DELAY_MS);

  checkInterval = setInterval(() => {
    if (currentState === "idle") {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error("[auto-updater] Scheduled check failed:", err.message);
      });
    }
  }, CHECK_INTERVAL_MS);
}

/** Clean up timers. Call on app quit. */
export function teardownAutoUpdater(): void {
  if (firstCheckTimer) { clearTimeout(firstCheckTimer); firstCheckTimer = null; }
  if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }
}

/** Trigger a manual update check from the menu. */
export function checkForUpdatesManual(): void {
  isManualCheck = true;
  autoUpdater.checkForUpdates().catch((err) => {
    console.error("[auto-updater] Manual check failed:", err.message);
    isManualCheck = false;
  });
}

export function getUpdateState(): UpdateState {
  return currentState;
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall();
}
