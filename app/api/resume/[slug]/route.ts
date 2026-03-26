import fs from "node:fs/promises"
import path from "node:path"
import { getDataDir } from "@/lib/fs-data"

const SAFE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  // Validate slug format: alphanumeric + hyphens only, no path traversal
  if (!SAFE_SLUG_RE.test(slug)) {
    return new Response("Invalid slug", { status: 400 })
  }

  const pdfPath = path.join(getDataDir(), "resumes", "exports", `${slug}.pdf`)

  // Guard against path traversal (belt-and-suspenders)
  const resolved = path.resolve(pdfPath)
  const safePrefix = path.resolve(path.join(getDataDir(), "resumes", "exports")) + path.sep
  if (!resolved.startsWith(safePrefix)) {
    return new Response("Invalid path", { status: 400 })
  }

  try {
    const buffer = await fs.readFile(pdfPath)
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slug}.pdf"`,
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
