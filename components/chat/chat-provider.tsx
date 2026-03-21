"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useChat } from "@/lib/agent/use-chat"
import type { ChatMessage } from "@/lib/agent/types"

type ChatContextValue = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: ChatMessage[]
  isStreaming: boolean
  isAvailable: boolean | null
  error: string | null
  sendMessage: (text: string) => void
  sendPrefilled: (text: string) => void
  clearMessages: () => void
  displayName: string
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children, displayName = "" }: { children: ReactNode; displayName?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const chat = useChat()

  const sendPrefilled = useCallback(
    (text: string) => {
      setIsOpen(true)
      // Brief delay to let the panel open before sending
      setTimeout(() => {
        chat.sendMessage(text)
      }, 150)
    },
    [chat],
  )

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, sendPrefilled, displayName, ...chat }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within a ChatProvider")
  return ctx
}
