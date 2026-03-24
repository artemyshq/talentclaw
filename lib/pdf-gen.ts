// Markdown → PDF conversion using pdfkit (pure JS, no Chrome).
// Produces clean, professional resume PDFs from markdown content.

import path from "node:path"

type TextSegment = { text: string; bold?: boolean; italic?: boolean; link?: string }

const PAGE_MARGIN = 54
const SUPPORTED_IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg"])

/** Resolve an image path relative to a base directory, returning null for unsupported formats. */
function resolveImagePath(src: string, baseDir?: string): string | null {
  const ext = path.extname(src).toLowerCase()
  if (!SUPPORTED_IMAGE_EXTS.has(ext)) return null

  const resolved = path.isAbsolute(src) ? src : baseDir ? path.resolve(baseDir, src) : null
  return resolved
}

/** Convert markdown content to a PDF buffer. */
export async function markdownToPdf(markdown: string, options?: { baseDir?: string }): Promise<Buffer> {
  // Dynamic import to avoid webpack bundling issues with pdfkit's native deps
  const PDFDocument = (await import("pdfkit")).default
  const baseDir = options?.baseDir

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      info: { Title: "Resume", Producer: "talentclaw" },
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const lines = markdown.split("\n")
    let i = 0
    let needsGap = false

    while (i < lines.length) {
      const line = lines[i]

      // Empty lines signal spacing before the next block
      if (line.trim() === "") {
        needsGap = true
        i++
        continue
      }

      // Headings
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const text = stripInlineMarkdown(headingMatch[2])
        if (needsGap) doc.moveDown(0.6)

        if (level === 1) {
          doc.fontSize(20).font("Helvetica-Bold").text(text)
          // Thin rule under H1
          doc.moveDown(0.2)
          doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - PAGE_MARGIN, doc.y).lineWidth(0.5).stroke("#cccccc")
          doc.moveDown(0.3)
        } else if (level === 2) {
          doc.fontSize(14).font("Helvetica-Bold").text(text)
          doc.moveDown(0.15)
        } else {
          doc.fontSize(12).font("Helvetica-Bold").text(text)
          doc.moveDown(0.1)
        }
        needsGap = true
        i++
        continue
      }

      // Block-level image: ![alt](path)
      const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
      if (imageMatch) {
        const imgPath = resolveImagePath(imageMatch[2], baseDir)
        if (imgPath) {
          try {
            if (needsGap) doc.moveDown(0.3)
            const maxWidth = doc.page.width - PAGE_MARGIN - PAGE_MARGIN
            doc.image(imgPath, { fit: [maxWidth, 200] })
            doc.moveDown(0.3)
          } catch {
            // Silently skip unreadable images — don't break the PDF
          }
        }
        needsGap = true
        i++
        continue
      }

      // Horizontal rule
      if (/^[-*_]{3,}\s*$/.test(line)) {
        if (needsGap) doc.moveDown(0.3)
        doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - PAGE_MARGIN, doc.y).lineWidth(0.5).stroke("#cccccc")
        doc.moveDown(0.4)
        needsGap = true
        i++
        continue
      }

      // List items
      const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/)
      if (listMatch) {
        if (needsGap) doc.moveDown(0.3)
        const indent = Math.min(Math.floor(listMatch[1].length / 2), 3) * 18
        const segments = parseInlineMarkdown(listMatch[2])
        doc.fontSize(10.5).font("Helvetica")

        // Bullet character
        doc.text("•", PAGE_MARGIN + indent, doc.y, { continued: true, width: 12 })
        doc.text(" ", { continued: true })
        renderSegments(doc, segments, { width: doc.page.width - PAGE_MARGIN - PAGE_MARGIN - indent - 14 })

        needsGap = false
        i++
        continue
      }

      // Regular paragraph
      if (needsGap) doc.moveDown(0.3)
      const segments = parseInlineMarkdown(line)
      doc.fontSize(10.5)
      renderSegments(doc, segments, { width: doc.page.width - PAGE_MARGIN - PAGE_MARGIN })
      needsGap = true
      i++
    }

    doc.end()
  })
}

/** Parse inline markdown (bold, italic, links) into segments. */
function parseInlineMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  // Match **bold**, *italic*, [text](url), or plain text
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)|([^*[\]]+)/g
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match[1] !== undefined) {
      segments.push({ text: match[1], bold: true })
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], italic: true })
    } else if (match[3] !== undefined && match[4] !== undefined) {
      segments.push({ text: match[3], link: match[4] })
    } else if (match[5] !== undefined) {
      segments.push({ text: match[5] })
    }
  }

  return segments.length > 0 ? segments : [{ text }]
}

/** Strip inline markdown to plain text. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
}

/** Render a sequence of styled text segments using pdfkit. */
function renderSegments(
  doc: PDFKit.PDFDocument,
  segments: TextSegment[],
  options: { width: number },
) {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const isLast = i === segments.length - 1
    const font = seg.bold ? "Helvetica-Bold" : seg.italic ? "Helvetica-Oblique" : "Helvetica"

    doc.font(font)

    if (seg.link) {
      doc.fillColor("#1a6b4a").text(seg.text, {
        continued: !isLast,
        link: seg.link,
        underline: true,
        width: isLast ? options.width : undefined,
      })
      doc.fillColor("#1c1917")
    } else {
      doc.text(seg.text, {
        continued: !isLast,
        width: isLast ? options.width : undefined,
      })
    }
  }
}
