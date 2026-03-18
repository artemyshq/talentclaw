"use client"

import { useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { MessageFile } from "@/lib/types"
import { formatDate } from "@/lib/ui-utils"

interface ThreadViewProps {
  messages: MessageFile[]
}

export function ThreadView({ messages }: ThreadViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Sort messages by sent_at ascending
  const sorted = [...messages].sort((a, b) =>
    a.frontmatter.sent_at.localeCompare(b.frontmatter.sent_at)
  )

  // Auto-scroll to bottom on mount
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" })
  }, [])

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-text-muted py-8 text-center">
        No messages in this thread yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {sorted.map((msg) => {
        const isOutbound = msg.frontmatter.direction === "outbound"

        return (
          <div
            key={msg.filename}
            className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                isOutbound
                  ? "bg-accent-subtle rounded-br-md"
                  : "bg-surface-overlay rounded-bl-md"
              }`}
            >
              {/* Sender name */}
              <p
                className={`text-xs font-medium mb-1 ${
                  isOutbound ? "text-accent" : "text-text-secondary"
                }`}
              >
                {msg.frontmatter.from}
              </p>

              {/* Message content */}
              <div
                className="prose prose-stone prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-accent prose-strong:text-text-primary prose-p:my-1 prose-p:leading-relaxed"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>

              {/* Timestamp */}
              <p className="text-[11px] text-text-muted mt-1.5">
                {formatDate(msg.frontmatter.sent_at, { includeTime: true })}
              </p>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
