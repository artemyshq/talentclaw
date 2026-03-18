"use server"

import { revalidatePath } from "next/cache"
import { getThread, createMessage, appendActivity } from "@/lib/fs-data"
import { getDataDir } from "@/lib/fs-data"
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"

export async function replyToMessage(
  threadId: string,
  content: string,
): Promise<{ error?: string }> {
  if (!threadId || !content.trim()) {
    return { error: "Thread ID and content are required" }
  }

  try {
    const thread = await getThread(threadId)
    if (!thread) {
      return { error: `Thread not found: ${threadId}` }
    }

    await createMessage(threadId, {
      direction: "outbound",
      from: "me",
      to: thread.frontmatter.participant,
      sent_at: new Date().toISOString(),
    }, content.trim())

    await appendActivity({
      type: "message_sent",
      slug: threadId,
      summary: `Replied to ${thread.frontmatter.participant}`,
    })

    revalidatePath("/inbox")
    return {}
  } catch (err) {
    return {
      error: `Failed to send reply: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function markThreadRead(
  threadId: string,
): Promise<{ error?: string }> {
  if (!threadId) {
    return { error: "Thread ID is required" }
  }

  if (threadId.includes("..") || threadId.includes("/") || threadId.includes("\\")) {
    return { error: `Invalid thread ID: ${threadId}` }
  }

  try {
    const threadFilePath = path.join(
      getDataDir(),
      "messages",
      threadId,
      "thread.md",
    )
    const raw = await fs.readFile(threadFilePath, "utf-8")
    const { data, content } = matter(raw)
    data.unread = false
    await fs.writeFile(
      threadFilePath,
      matter.stringify(content, data),
      "utf-8",
    )

    revalidatePath("/inbox")
    return {}
  } catch (err) {
    return {
      error: `Failed to mark thread as read: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}
