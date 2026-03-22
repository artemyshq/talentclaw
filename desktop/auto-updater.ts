// desktop/auto-updater.ts — Auto-update state machine for TalentClaw
//
// Wraps electron-updater with a state machine, user-facing dialogs,
// and scheduled background checks. Imported by main.ts.

import { app, dialog } from "electron";
import { autoUpdater, type UpdateInfo } from "electron-updater";

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";

let currentState: UpdateState = "idle";
let isManualCheck = false;
let downloadPercent = 0;
let checkInterval: ReturnType<typeof setInterval> | null = null;

const FIRST_CHECK_DELAY_MS = 15_000;
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1_000; // 4 hours

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function configureAutoUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // In development, don't actually check (no published builds to find)
  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true;
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

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
    downloadPercent = Math.round(progress.percent);
    // Update dock badge with download progress
    if (process.platform === "darwin") {
      app.dock?.setBadge(`${downloadPercent}%`);
    }
  });

  autoUpdater.on("update-downloaded", () => {
    currentState = "downloaded";
    // Clear dock badge
    if (process.platform === "darwin") {
      app.dock?.setBadge("");
    }
    promptInstall();
  });

  autoUpdater.on("error", (err) => {
    currentState = "error";
    // Clear dock badge on error
    if (process.platform === "darwin") {
      app.dock?.setBadge("");
    }
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
    // Reset to idle after a brief delay so the state doesn't stick on error
    setTimeout(() => {
      if (currentState === "error") {
        currentState = "idle";
      }
    }, 5_000);
  });
}

// ---------------------------------------------------------------------------
// User-facing dialogs
// ---------------------------------------------------------------------------

async function promptDownload(info: UpdateInfo): Promise<void> {
  const version = info.version;
  const { response } = await dialog.showMessageBox({
    type: "info",
    title: "Update Available",
    message: `Version ${version} is available.`,
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

// ---------------------------------------------------------------------------
// Exported API
// ---------------------------------------------------------------------------

/**
 * Initialize the auto-updater. Call once after app is ready.
 * Schedules an initial check after 15 seconds, then every 4 hours.
 */
export function initAutoUpdater(): void {
  configureAutoUpdater();
  bindEvents();

  // First check after a short delay (let the app finish starting)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error("[auto-updater] Scheduled check failed:", err.message);
    });
  }, FIRST_CHECK_DELAY_MS);

  // Recurring checks every 4 hours
  checkInterval = setInterval(() => {
    if (currentState === "idle") {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error("[auto-updater] Scheduled check failed:", err.message);
      });
    }
  }, CHECK_INTERVAL_MS);
}

/**
 * Trigger a manual update check (from the menu item).
 * Shows dialogs for both "update available" and "no update" results.
 */
export function checkForUpdatesManual(): void {
  isManualCheck = true;
  autoUpdater.checkForUpdates().catch((err) => {
    console.error("[auto-updater] Manual check failed:", err.message);
    isManualCheck = false;
  });
}

/**
 * Returns the current state of the auto-updater.
 */
export function getUpdateState(): UpdateState {
  return currentState;
}

/**
 * Quit the app and install the downloaded update.
 */
export function quitAndInstall(): void {
  autoUpdater.quitAndInstall();
}
