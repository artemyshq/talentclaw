"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

interface CopyFieldProps {
  label: string
  value: string
  multiline?: boolean
  placeholder?: string
}

export function CopyField({ label, value, multiline, placeholder }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)
  const isEmpty = !value.trim()

  function copy() {
    if (isEmpty) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {label}
        </label>
        <button
          type="button"
          onClick={copy}
          disabled={isEmpty}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div
        onClick={isEmpty ? undefined : copy}
        className={`rounded-[6px] border transition-colors ${
          isEmpty
            ? "border-border-subtle bg-surface-overlay cursor-default"
            : "border-border-default bg-surface-raised cursor-pointer hover:border-accent/30"
        } ${multiline ? "px-3.5 py-3 min-h-[80px]" : "px-3.5 py-2.5"}`}
      >
        {isEmpty ? (
          <span className="text-sm text-text-muted italic">
            {placeholder || "Not available"}
          </span>
        ) : (
          <span
            className={`text-sm text-text-primary ${
              multiline ? "whitespace-pre-wrap block" : ""
            }`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  )
}
