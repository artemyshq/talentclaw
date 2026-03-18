"use server"

import { revalidatePath } from "next/cache"
import { updateProfile as updateProfileData, appendActivity } from "@/lib/fs-data"
import { ProfileFrontmatterSchema } from "@/lib/types"

export async function updateProfile(
  data: Record<string, unknown>,
): Promise<{ error?: string }> {
  const parsed = ProfileFrontmatterSchema.partial().safeParse(data)
  if (!parsed.success) {
    return { error: `Validation failed: ${parsed.error.message}` }
  }

  try {
    await updateProfileData(parsed.data)
    await appendActivity({
      type: "profile_updated",
      summary: "Updated career profile",
    })
    revalidatePath("/dashboard")
    revalidatePath("/profile")
    return {}
  } catch (err) {
    return {
      error: `Failed to update profile: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}
