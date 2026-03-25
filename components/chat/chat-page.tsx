"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SquarePen } from "lucide-react"
import { CrabLogo } from "@/components/crab-logo"
import { getGreeting } from "@/lib/ui-utils"
import { useChatContext } from "./chat-provider"
import { ChatMessageBubble } from "./chat-message"
import { ChatInput } from "./chat-input"
import { SuggestionChips } from "./suggestion-chips"

function NewChatView({
  onSend,
}: {
  onSend: (text: string) => void
}) {
  const { displayName } = useChatContext()
  const firstName = displayName.split(" ")[0]

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-[12vh]">
        <h1 className="font-display text-4xl text-text-primary mb-8 flex items-center gap-3">
          <CrabLogo className="w-10 h-10 text-accent" />
          {getGreeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <div className="w-full max-w-[680px]">
          <ChatInput onSend={onSend} autoFocus />
          <SuggestionChips onSelect={onSend} />
        </div>
      </div>
    </div>
  )
}

function ActiveChatView({
  onSend,
  onNewChat,
}: {
  onSend: (text: string) => void
  onNewChat: () => void
}) {
  const { messages, isStreaming, error, conversations, conversationSlug } = useChatContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages and when streaming ends (typewriter snap)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    // Double-RAF catches typewriter snap render after streaming ends
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
    })
    return () => cancelAnimationFrame(id)
  }, [messages.length, isStreaming])

  // During streaming, poll to pin scroll to bottom
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !isStreaming) return

    const interval = setInterval(() => {
      el.scrollTop = el.scrollHeight
    }, 100)

    return () => clearInterval(interval)
  }, [isStreaming])

  // Use saved title from frontmatter when available, fall back to first user message
  const savedConvo = conversationSlug
    ? conversations.find((c) => c.slug === conversationSlug)
    : null
  const title = savedConvo?.frontmatter.title
    ?? messages.find((m) => m.role === "user")?.content.slice(0, 80)
    ?? "New conversation"

  const lastAssistantIdx = messages.reduce(
    (acc, m, i) => (m.role === "assistant" ? i : acc), -1
  )

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header with conversation title + new chat */}
      <div className="flex items-center gap-2 px-5 py-3 shrink-0">
        <span className="text-sm font-medium text-text-primary truncate">
          {title}
        </span>
        <button
          type="button"
          onClick={onNewChat}
          title="New chat"
          className="ml-auto p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
        >
          <SquarePen className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto chat-scrollbar px-6 pb-4"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {messages.map((msg, i) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isLastAssistant={i === lastAssistantIdx}
              isStreaming={isStreaming}
            />
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-3xl mx-auto w-full px-6 mb-2">
          <div className="px-3 py-2 rounded-lg bg-danger/8 text-danger text-xs">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-2 shrink-0">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={onSend} disabled={isStreaming} autoFocus />
        </div>
      </div>
    </div>
  )
}

export function ChatPage({ initialSlug }: { initialSlug?: string } = {}) {
  const { messages, isAvailable, sendMessage, clearMessages, pendingMessage, clearPending, conversationSlug, loadConversation } =
    useChatContext()
  const router = useRouter()
  const pathname = usePathname()

  const loadingSlugRef = useRef<string | null>(null)

  // When mounting /chat (no slug), start fresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!initialSlug) clearMessages() }, [])

  // When navigating to /chat/[slug], load that conversation
  useEffect(() => {
    if (initialSlug && conversationSlug !== initialSlug && loadingSlugRef.current !== initialSlug) {
      loadingSlugRef.current = initialSlug
      loadConversation(initialSlug).finally(() => { loadingSlugRef.current = null })
    }
  }, [initialSlug, conversationSlug, loadConversation])

  // Update URL when a new conversation is created on /chat
  useEffect(() => {
    if (!initialSlug && conversationSlug && pathname === "/chat") {
      router.replace(`/chat/${conversationSlug}`)
    }
  }, [conversationSlug, initialSlug, pathname, router])

  // Auto-send pending message from sendPrefilled navigation
  useEffect(() => {
    if (pendingMessage) {
      sendMessage(pendingMessage.prompt, pendingMessage.displayText)
      clearPending()
    }
  }, [pendingMessage, sendMessage, clearPending])

  if (isAvailable === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <CrabLogo className="w-12 h-12 text-text-muted mb-4" />
        <h2 className="font-display text-xl text-text-primary mb-2">Agent not available</h2>
        <p className="text-sm text-text-secondary max-w-sm">
          Make sure Claude Code is installed and running, then reload the page.
        </p>
      </div>
    )
  }

  const isEmpty = messages.length === 0

  if (isEmpty) {
    return <NewChatView onSend={sendMessage} />
  }

  return (
    <ActiveChatView
      onSend={sendMessage}
      onNewChat={() => { clearMessages(); router.push("/chat") }}
    />
  )
}
