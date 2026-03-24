// Agent SDK configuration.
// The Agent SDK spawns a Claude Code process, which uses whatever auth
// Claude Code has configured — subscription (Pro/Max), API key, or org.
// ANTHROPIC_API_KEY is optional; the SDK inherits Claude Code's auth.

import type { AgentConfig } from "./types"
import { which } from "../deps"

const DEFAULT_MODEL = "claude-opus-4-6"

export function getAgentConfig(): AgentConfig {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.TALENTCLAW_MODEL ?? DEFAULT_MODEL,
  }
}

// Cache the check — the binary won't appear/disappear during a server run
let claudeAvailable: boolean | null = null

export function isAgentConfigured(): boolean {
  if (claudeAvailable !== null) return claudeAvailable

  claudeAvailable = which("claude")

  return claudeAvailable
}
