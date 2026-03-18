import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getThread } from "@/lib/fs-data"
import { markThreadRead } from "@/app/actions/messages"
import { ThreadView } from "@/components/inbox/thread-view"
import { ReplyForm } from "@/components/inbox/reply-form"

interface ThreadPageProps {
  params: Promise<{ threadId: string }>
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId } = await params
  const thread = await getThread(threadId)

  if (!thread) {
    notFound()
  }

  // Mark as read on view
  if (thread.frontmatter.unread) {
    await markThreadRead(threadId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border-subtle bg-surface-raised px-5 py-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Inbox
          </Link>
          <h1 className="font-prose text-xl text-text-primary">
            {thread.frontmatter.participant}
          </h1>
          {thread.frontmatter.subject && (
            <p className="text-sm text-text-secondary mt-0.5">
              {thread.frontmatter.subject}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6">
        <div className="max-w-3xl mx-auto">
          <ThreadView messages={thread.messages} />
        </div>
      </div>

      {/* Reply form */}
      <div className="shrink-0 border-t border-border-subtle bg-surface-raised px-5 py-4">
        <div className="max-w-3xl mx-auto">
          <ReplyForm threadId={threadId} />
        </div>
      </div>
    </div>
  )
}
