"use server"

import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import { revalidatePath } from "next/cache"
import { getDataDir, getProfile } from "@/lib/fs-data"
import type { ProfileFrontmatter } from "@/lib/types"

export async function updateProfile(
  updates: Partial<ProfileFrontmatter>
): Promise<{ error?: string }> {
  try {
    const profile = await getProfile()
    const merged = { ...profile.frontmatter, ...updates, updated_at: new Date().toISOString() }
    const filePath = path.join(getDataDir(), "profile.md")
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    const fileContent = matter.stringify(profile.content, merged)
    await fs.writeFile(filePath, fileContent, "utf-8")
    revalidatePath("/profile")
    revalidatePath("/dashboard")
    return {}
  } catch (err) {
    return { error: `Failed to update profile: ${err instanceof Error ? err.message : "unknown error"}` }
  }
}
