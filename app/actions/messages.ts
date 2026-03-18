"use server"

import { createMessage, markThreadAsRead, appendActivity } from "@/lib/fs-data"
import { revalidatePath } from "next/cache"

export async function replyToMessage(
  threadId: string,
  content: string,
): Promise<{ error?: string }> {
  if (!content.trim()) {
    return { error: "Message cannot be empty" }
  }

  try {
    await createMessage(threadId, content.trim(), "me", "them")
    await appendActivity({
      type: "message",
      slug: threadId,
      summary: `Replied in thread ${threadId}`,
    })
    revalidatePath(`/inbox/${threadId}`)
    revalidatePath("/inbox")
    return {}
  } catch (err) {
    return {
      error: `Failed to send message: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function markThreadRead(
  threadId: string,
): Promise<{ error?: string }> {
  try {
    await markThreadAsRead(threadId)
    revalidatePath("/inbox")
    return {}
  } catch (err) {
    return {
      error: `Failed to mark thread as read: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}
