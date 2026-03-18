"use client"

import { Sparkles } from "lucide-react"
import { AgentActionButton } from "@/components/shared/agent-action-button"
import { OPTIMIZE_PROFILE_PROMPT } from "@/lib/agent-prompts"

export function ProfileOptimizeButton() {
  return (
    <AgentActionButton
      prompt={OPTIMIZE_PROFILE_PROMPT}
      label="Optimize profile"
      icon={<Sparkles className="w-3 h-3" />}
      size="sm"
    />
  )
}
