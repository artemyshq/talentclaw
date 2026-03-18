"use client"

import Link from "next/link"
import type { ThreadFile } from "@/lib/types"
import { formatRelativeTime } from "@/lib/ui-utils"

interface ThreadListProps {
  threads: ThreadFile[]
}

export function ThreadList({ threads }: ThreadListProps) {
  return (
    <div className="space-y-1">
      {threads.map((thread) => {
        const lastMessage =
          thread.messages.length > 0
            ? thread.messages[thread.messages.length - 1]
            : null
        const preview = lastMessage
          ? lastMessage.content.slice(0, 120) +
            (lastMessage.content.length > 120 ? "..." : "")
          : "No messages"
        const isUnread = thread.frontmatter.unread

        return (
          <Link
            key={thread.slug}
            href={`/inbox/${thread.slug}`}
            className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-raised border border-border-subtle hover:border-accent/30 transition-colors group"
          >
            {/* Unread indicator */}
            <div className="pt-1.5 shrink-0 w-2">
              {isUnread && (
                <div className="w-2 h-2 rounded-full bg-accent" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3 mb-0.5">
                <h3
                  className={`font-prose text-base truncate group-hover:text-accent-hover transition-colors ${
                    isUnread
                      ? "text-text-primary font-semibold"
                      : "text-text-primary"
                  }`}
                >
                  {thread.frontmatter.participant}
                </h3>
                <span className="text-xs text-text-muted shrink-0 whitespace-nowrap">
                  {formatRelativeTime(thread.frontmatter.last_active)}
                </span>
              </div>

              {thread.frontmatter.subject && (
                <p
                  className={`text-sm truncate mb-0.5 ${
                    isUnread ? "text-text-primary font-medium" : "text-text-secondary"
                  }`}
                >
                  {thread.frontmatter.subject}
                </p>
              )}

              <p className="text-sm text-text-muted truncate">{preview}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
