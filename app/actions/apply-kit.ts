"use server"

import { revalidatePath } from "next/cache"
import {
  updateJobStatus,
  getApplication,
  createApplication,
  updateApplication,
  appendActivity,
  exportVariantPdf,
} from "@/lib/fs-data"

export async function markAsApplied(
  jobSlug: string,
): Promise<{ error?: string }> {
  try {
    await updateJobStatus(jobSlug, "applied")

    const appSlug = `${jobSlug}-app`
    const existing = await getApplication(appSlug)

    if (existing) {
      await updateApplication(appSlug, {
        status: "applied",
        applied_at: new Date().toISOString(),
        submission_method: "apply_kit",
      })
    } else {
      await createApplication(appSlug, {
        job: jobSlug,
        status: "applied",
        applied_at: new Date().toISOString(),
        submission_method: "apply_kit",
      })
    }

    await appendActivity({
      type: "applied",
      slug: jobSlug,
      summary: `Marked ${jobSlug} as applied via Apply Kit`,
    })

    revalidatePath("/pipeline")
    revalidatePath(`/pipeline/${jobSlug}/apply`)
    return {}
  } catch (err) {
    return {
      error: `Failed to mark as applied: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}

export async function exportResumePdf(
  variantSlug: string,
): Promise<{ error?: string; path?: string }> {
  try {
    const pdfPath = await exportVariantPdf(variantSlug)
    return { path: pdfPath }
  } catch (err) {
    return {
      error: `Failed to export PDF: ${err instanceof Error ? err.message : "unknown error"}`,
    }
  }
}
