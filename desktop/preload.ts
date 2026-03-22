// desktop/preload.ts — Context bridge for TalentClaw's renderer process
//
// Exposes a minimal API to the renderer via window.talentclaw.
// All communication goes through IPC — no Node.js APIs leak to the page.

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("talentclaw", {
  /** Returns the localhost URL where the Next.js server is running */
  getServerUrl: (): Promise<string> => ipcRenderer.invoke("get-server-url"),

  /** Returns the auth token for server-client isolation */
  getAuthToken: (): Promise<string> => ipcRenderer.invoke("get-auth-token"),

  /** The host platform (darwin, win32, linux) */
  platform: process.platform,
});
