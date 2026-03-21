"use client"

import type { ReactNode } from "react"
import { ChatProvider, useChatContext } from "./chat-provider"
import { ChatPanel } from "./chat-panel"
import { ChatToggle } from "./chat-toggle"

function ChatOverlay() {
  const { isOpen, setIsOpen, isAvailable, displayName } = useChatContext()
  return (
    <>
      <ChatPanel displayName={displayName} />
      <ChatToggle
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        isAvailable={isAvailable}
      />
    </>
  )
}

export function ChatShell({ children, displayName = "" }: { children: ReactNode; displayName?: string }) {
  return (
    <ChatProvider displayName={displayName}>
      {children}
      <ChatOverlay />
    </ChatProvider>
  )
}
