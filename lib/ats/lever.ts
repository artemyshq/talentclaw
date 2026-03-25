import fs from "node:fs/promises"
import path from "node:path"
import { ApplicantDataSchema } from "./types"
import type {
  ApplicantData,
  AtsCustomQuestion,
  AtsSubmissionResult,
} from "./types"

const LEVER_BASE = "https://jobs.lever.co"
const LEVER_API = "https://api.lever.co/v0/postings"

// Lever has no public API for custom questions, so we scrape the apply page HTML
const SECTION_START_RE = /<div[^>]*class="[^"]*application-additional[^"]*"[^>]*>/i
const SECTION_END_RE = /<div[^>]*class="[^"]*application-(?:page|confirmation|system)[^"]*"[^>]*>|<\/form>/i
const FIELD_BLOCK_RE = /<div[^>]*class="[^"]*(?:application-question|custom-question)[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*(?:application-question|custom-question)[^"]*"|$)/gi
const LABEL_RE = /<label[^>]*>([^<]+)<\/label>|<div[^>]*class="[^"]*application-label[^"]*"[^>]*>([^<]+)<\/div>/i
const FIELD_NAME_RE = /name="(cards\[\d+\]\[field\d+\])"/i
const OPTION_RE = /<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/gi

export async function fetchLeverCustomQuestions(
  companySlug: string,
  postingId: string
): Promise<AtsCustomQuestion[]> {
  try {
    const res = await fetch(`${LEVER_BASE}/${companySlug}/${postingId}/apply`)
    if (!res.ok) return []

    const html = await res.text()
    const questions: AtsCustomQuestion[] = []

    const sectionStart = html.search(SECTION_START_RE)
    if (sectionStart === -1) return []

    const openTagEnd = html.indexOf(">", sectionStart) + 1
    const sectionEnd = html.slice(openTagEnd).search(SECTION_END_RE)
    const section = html.slice(openTagEnd, sectionEnd === -1 ? undefined : openTagEnd + sectionEnd)

    for (const block of section.matchAll(FIELD_BLOCK_RE)) {
      const blockHtml = block[1]

      const labelMatch = blockHtml.match(LABEL_RE)
      const label = (labelMatch?.[1] || labelMatch?.[2] || "").trim()
      if (!label) continue

      const nameMatch = blockHtml.match(FIELD_NAME_RE)
      const fieldId = nameMatch?.[1] || ""
      if (!fieldId) continue

      const isRequired = /required/.test(blockHtml)

      let type: AtsCustomQuestion["type"] = "text"
      let options: string[] | undefined

      if (/<textarea/i.test(blockHtml)) {
        type = "textarea"
      } else if (/<select/i.test(blockHtml)) {
        type = "select"
        options = []
        for (const opt of blockHtml.matchAll(OPTION_RE)) {
          const val = opt[1].trim()
          if (val) options.push(val)
        }
      } else if (/<input[^>]*type="file"/i.test(blockHtml)) {
        type = "file"
      }

      questions.push({
        id: fieldId,
        text: label,
        required: isRequired,
        type,
        ...(options && { options }),
      })
    }

    return questions
  } catch {
    return []
  }
}

export async function submitLeverApplication(
  companySlug: string,
  postingId: string,
  applicant: ApplicantData,
  resumePath: string,
  customAnswers?: Record<string, string>
): Promise<AtsSubmissionResult> {
  try {
    const validated = ApplicantDataSchema.parse(applicant)
    const resumeBuffer = await fs.readFile(resumePath)
    const filename = path.basename(resumePath)

    const form = new FormData()
    form.append("name", validated.name)
    form.append("email", validated.email)

    if (validated.phone) form.append("phone", validated.phone)
    if (validated.org) form.append("org", validated.org)
    if (validated.linkedinUrl) form.append("urls[LinkedIn]", validated.linkedinUrl)
    if (validated.githubUrl) form.append("urls[GitHub]", validated.githubUrl)
    if (validated.websiteUrl) form.append("urls[Portfolio]", validated.websiteUrl)
    if (validated.coverLetter) form.append("comments", validated.coverLetter)
    if (validated.source) form.append("source", validated.source)

    const blob = new Blob([resumeBuffer], { type: "application/pdf" })
    form.append("resume", blob, filename)

    if (customAnswers) {
      for (const [key, value] of Object.entries(customAnswers)) {
        form.append(key, value)
      }
    }

    const res = await fetch(`${LEVER_API}/${companySlug}/${postingId}`, {
      method: "POST",
      body: form,
    })

    const body = await res.json()

    if (res.ok && body.ok) {
      return {
        success: true,
        platform: "lever",
        applicationId: body.applicationId,
        submissionMethod: "ats_api",
      }
    }

    return {
      success: false,
      platform: "lever",
      error: body.error || `HTTP ${res.status}`,
      submissionMethod: "ats_api",
    }
  } catch (err) {
    return {
      success: false,
      platform: "lever",
      error: err instanceof Error ? err.message : String(err),
      submissionMethod: "ats_api",
    }
  }
}
