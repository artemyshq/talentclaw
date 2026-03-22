// Shared constants for server lifecycle — used by both bin/cli.ts and desktop/main.ts

/** Strings in Next.js stdout that indicate the server is ready to accept requests. */
export const SERVER_READY_SIGNALS = ["ready", "listening", "started server"] as const

/** Check if a stdout line indicates the server is ready. */
export function isServerReady(text: string): boolean {
  const lower = text.toLowerCase()
  return SERVER_READY_SIGNALS.some((signal) => lower.includes(signal))
}
