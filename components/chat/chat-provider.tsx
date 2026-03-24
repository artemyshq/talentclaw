"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useChat, type ConversationSummary } from "@/lib/agent/use-chat"
import type { ChatMessage } from "@/lib/agent/types"

type PendingMessage = { prompt: string; displayText?: string } | null

type ChatContextValue = {
  messages: ChatMessage[]
  isStreaming: boolean
  isAvailable: boolean | null
  error: string | null
  sendMessage: (text: string, displayText?: string) => void
  sendPrefilled: (prompt: string, displayText?: string) => void
  clearMessages: () => void
  pendingMessage: PendingMessage
  clearPending: () => void
  displayName: string
  conversations: ConversationSummary[]
  conversationSlug: string | null
  loadConversation: (slug: string) => Promise<void>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children, displayName = "" }: { children: ReactNode; displayName?: string }) {
  const router = useRouter()
  const [pendingMessage, setPendingMessage] = useState<PendingMessage>(null)
  const chat = useChat()

  const sendPrefilled = useCallback(
    (prompt: string, displayText?: string) => {
      setPendingMessage({ prompt, displayText })
      router.push("/chat")
    },
    [router],
  )

  const clearPending = useCallback(() => {
    setPendingMessage(null)
  }, [])

  return (
    <ChatContext.Provider value={{ sendPrefilled, pendingMessage, clearPending, displayName, ...chat }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within a ChatProvider")
  return ctx
}
