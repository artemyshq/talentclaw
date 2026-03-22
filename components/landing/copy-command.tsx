"use client"

import { useState, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"

interface CopyCommandProps {
  command: string
  icon?: ReactNode
  className?: string
}

export function CopyCommand({ command, icon, className = "" }: CopyCommandProps) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={`group flex items-center gap-3 cursor-pointer transition-colors ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <code className="text-[0.85rem] text-text-secondary font-mono whitespace-nowrap">
        {command}
      </code>
      <span className="shrink-0 text-text-muted group-hover:text-text-secondary transition-colors">
        {copied ? (
          <Check className="w-4 h-4 text-emerald-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </span>
    </button>
  )
}
