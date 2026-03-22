// Shared Claude Code auth detection — used by bin/cli.ts and desktop/first-run.ts

import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

/** Check for Claude Code credential files on disk (fallback for older versions). */
export function hasClaudeCredentialFiles(): boolean {
  const claudeDir = join(homedir(), ".claude")
  return (
    existsSync(join(claudeDir, "credentials.json")) ||
    existsSync(join(claudeDir, ".credentials"))
  )
}
