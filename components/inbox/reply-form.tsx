"use client"

import { useState, useTransition } from "react"
import { Send } from "lucide-react"
import { replyToMessage } from "@/app/actions/messages"

interface ReplyFormProps {
  threadId: string
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isPending) return

    setError(null)
    startTransition(async () => {
      const result = await replyToMessage(threadId, content)
      if (result.error) {
        setError(result.error)
      } else {
        setContent("")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="text-xs text-danger mb-2">{error}</p>
      )}

      <div className="flex items-end gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply..."
          rows={2}
          disabled={isPending}
          className="flex-1 resize-none rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e)
            }
          }}
        />
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="shrink-0 p-3 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Send reply (Cmd+Enter)"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-text-muted mt-2">
        Press <kbd className="px-1 py-0.5 rounded bg-surface-overlay text-text-muted text-[10px]">Cmd+Enter</kbd> to send
      </p>
    </form>
  )
}
