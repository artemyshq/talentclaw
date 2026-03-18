"use server"

import fs from "node:fs/promises"
import path from "node:path"
import { revalidatePath } from "next/cache"
import { createJob, getDataDir, appendActivity } from "@/lib/fs-data"
import { slugify } from "@/lib/slugify"
import type { JobFrontmatter } from "@/lib/types"

export async function createJobAction(
  data: {
    title: string
    company: string
    location?: string
    remote?: "remote" | "hybrid" | "onsite"
    compensationMin?: number
    compensationMax?: number
    url?: string
    tags?: string[]
    status?: string
    notes?: string
  }
): Promise<{ error?: string; slug?: string }> {
  try {
    const slug = slugify(data.company, data.title)
    const frontmatter: Record<string, unknown> = {
      title: data.title,
      company: data.company,
      source: "manual",
      status: data.status || "discovered",
      discovered_at: new Date().toISOString(),
    }

    if (data.location) frontmatter.location = data.location
    if (data.remote) frontmatter.remote = data.remote
    if (data.url) frontmatter.url = data.url
    if (data.tags && data.tags.length > 0) frontmatter.tags = data.tags
    if (data.compensationMin || data.compensationMax) {
      frontmatter.compensation = {
        min: data.compensationMin || undefined,
        max: data.compensationMax || undefined,
        currency: "USD",
      }
    }

    await createJob(slug, frontmatter, data.notes || "")
    await appendActivity({
      type: "job_created",
      slug,
      summary: `Added ${data.title} at ${data.company}`,
    })

    revalidatePath("/jobs")
    revalidatePath("/pipeline")
    revalidatePath("/dashboard")
    return { slug }
  } catch (err) {
    return { error: `Failed to create job: ${err instanceof Error ? err.message : "unknown error"}` }
  }
}

export async function deleteJobAction(
  slug: string
): Promise<{ error?: string }> {
  try {
    const dataDir = getDataDir()
    const filePath = path.join(dataDir, "jobs", `${slug}.md`)

    // Security: ensure path is within the jobs directory
    const resolved = path.resolve(filePath)
    const safePrefix = path.resolve(path.join(dataDir, "jobs")) + path.sep
    if (!resolved.startsWith(safePrefix)) {
      return { error: "Invalid job slug" }
    }

    await fs.unlink(filePath)
    await appendActivity({
      type: "job_deleted",
      slug,
      summary: `Removed ${slug} from jobs`,
    })

    revalidatePath("/jobs")
    revalidatePath("/pipeline")
    revalidatePath("/dashboard")
    return {}
  } catch (err) {
    return { error: `Failed to delete job: ${err instanceof Error ? err.message : "unknown error"}` }
  }
}
