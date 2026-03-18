export const runtime = "nodejs"

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
])
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"])

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot >= 0 ? filename.slice(dot).toLowerCase() : ""
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type by MIME type and extension
    const ext = getExtension(file.name)
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
      return Response.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: "File too large. Maximum size is 5 MB." },
        { status: 400 },
      )
    }

    // Extract text content
    // For now, only TXT files are fully supported for text extraction.
    // PDF and DOCX would need additional parsers.
    let text: string

    if (file.type === "text/plain" || ext === ".txt") {
      text = await file.text()
    } else if (ext === ".pdf" || file.type === "application/pdf") {
      // PDF parsing not yet implemented — return the raw text attempt
      // A real implementation would use pdf-parse or similar
      text = await file.text()
      if (!text.trim() || text.includes("\x00")) {
        return Response.json(
          {
            error:
              "PDF text extraction is not yet supported. Please upload a TXT file, or copy and paste your resume into the chat.",
          },
          { status: 422 },
        )
      }
    } else if (
      ext === ".docx" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return Response.json(
        {
          error:
            "DOCX text extraction is not yet supported. Please upload a TXT file, or copy and paste your resume into the chat.",
        },
        { status: 422 },
      )
    } else {
      return Response.json(
        { error: "Unsupported file type." },
        { status: 400 },
      )
    }

    if (!text.trim()) {
      return Response.json(
        { error: "File appears to be empty." },
        { status: 400 },
      )
    }

    return Response.json({ success: true, text: text.trim() })
  } catch {
    return Response.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    )
  }
}
