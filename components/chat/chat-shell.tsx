"use client"

import { type ReactNode, useEffect, useRef } from "react"
import { ChatProvider, useChatContext } from "./chat-provider"
import { ChatPanel } from "./chat-panel"
import { ChatToggle } from "./chat-toggle"
import { useSidebar } from "@/components/workspace/sidebar-wrapper"

function ChatLayout({ children }: { children: ReactNode }) {
  const { isOpen, setIsOpen, isAvailable, displayName } = useChatContext()
  const { collapsed, setCollapsed } = useSidebar()
  const wasCollapsedBeforeChat = useRef(false)

  // Auto-collapse sidebar when chat opens, restore when it closes
  useEffect(() => {
    if (isOpen) {
      wasCollapsedBeforeChat.current = collapsed
      setCollapsed(true)
    } else {
      // Restore previous collapsed state
      setCollapsed(wasCollapsedBeforeChat.current)
    }
  }, [isOpen, setCollapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {children}
      </div>
      <ChatPanel displayName={displayName} />
      <ChatToggle
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        isAvailable={isAvailable}
      />
    </div>
  )
}

export function ChatShell({ children, displayName = "" }: { children: ReactNode; displayName?: string }) {
  return (
    <ChatProvider displayName={displayName}>
      <ChatLayout>{children}</ChatLayout>
    </ChatProvider>
  )
}
