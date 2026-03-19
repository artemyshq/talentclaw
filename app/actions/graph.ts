"use server"

import { revalidatePath } from "next/cache"
import { updateApplication } from "@/lib/fs-data"

export async function approveApplication(slug: string): Promise<void> {
  await updateApplication(slug, { workflow_status: "approved" })
  revalidatePath("/dashboard")
}

export async function rejectApplication(
  slug: string,
  reason?: string
): Promise<void> {
  const data: Record<string, unknown> = { workflow_status: "failed" }
  if (reason) {
    data.confidence_reasoning = reason
  }
  await updateApplication(slug, data)
  revalidatePath("/dashboard")
}
