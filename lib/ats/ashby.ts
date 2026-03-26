import fs from "node:fs/promises"
import path from "node:path"
import { ApplicantDataSchema } from "./types"
import type {
  ApplicantData,
  AtsCustomQuestion,
  AtsSubmissionResult,
} from "./types"

const ASHBY_API = "https://api.ashbyhq.com"

const SYSTEM_FIELDS = new Set([
  "_systemfield_name",
  "_systemfield_email",
  "_systemfield_resume",
])

function mapFieldType(
  ashbyType: string
): AtsCustomQuestion["type"] {
  switch (ashbyType) {
    case "LongText":
      return "textarea"
    case "File":
      return "file"
    case "ValueSelect":
    case "MultiValueSelect":
    case "Boolean":
      return "select"
    default:
      return "text"
  }
}

export async function fetchAshbyCustomQuestions(
  _companySlug: string,
  postingId: string
): Promise<AtsCustomQuestion[]> {
  const apiKey = process.env.ASHBY_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(`${ASHBY_API}/jobPosting.info`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobPostingId: postingId }),
    })
    if (!res.ok) return []

    const body = await res.json()
    const sections =
      body.results?.applicationFormDefinition?.sections
    if (!Array.isArray(sections)) return []

    const questions: AtsCustomQuestion[] = []

    for (const section of sections) {
      if (!Array.isArray(section.fields)) continue

      for (const entry of section.fields) {
        const field = entry.field
        if (!field) continue

        if (SYSTEM_FIELDS.has(field.path)) continue

        const type = mapFieldType(field.type)
        let options: string[] | undefined

        if (field.type === "Boolean") {
          options = ["Yes", "No"]
        } else if (
          (field.type === "ValueSelect" ||
            field.type === "MultiValueSelect") &&
          Array.isArray(field.selectableValues)
        ) {
          options = field.selectableValues.map(
            (v: { label: string }) => v.label
          )
        }

        questions.push({
          id: field.path,
          text: field.title || "",
          required: !!entry.isRequired,
          type,
          ...(options && { options }),
        })
      }
    }

    return questions
  } catch {
    return []
  }
}

export async function submitAshbyApplication(
  _companySlug: string,
  postingId: string,
  applicant: ApplicantData,
  resumePath: string,
  customAnswers?: Record<string, string>
): Promise<AtsSubmissionResult> {
  const apiKey = process.env.ASHBY_API_KEY
  if (!apiKey) {
    return {
      success: false,
      platform: "ashby",
      error: "Ashby API key not configured — set ASHBY_API_KEY",
      submissionMethod: "ats_api",
    }
  }

  try {
    const validated = ApplicantDataSchema.parse(applicant)
    const resumeBuffer = await fs.readFile(resumePath)
    const filename = path.basename(resumePath)

    const fieldSubmissions: { path: string; value: string }[] = [
      { path: "_systemfield_name", value: validated.name },
      { path: "_systemfield_email", value: validated.email },
    ]

    if (validated.phone) {
      fieldSubmissions.push({
        path: "_systemfield_phone",
        value: validated.phone,
      })
    }

    if (customAnswers) {
      for (const [key, value] of Object.entries(customAnswers)) {
        fieldSubmissions.push({ path: key, value })
      }
    }

    const form = new FormData()
    form.append("jobPostingId", postingId)
    form.append("fieldSubmissions", JSON.stringify(fieldSubmissions))

    const blob = new Blob([resumeBuffer], { type: "application/pdf" })
    form.append("_systemfield_resume", blob, filename)

    const res = await fetch(`${ASHBY_API}/applicationForm.submit`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
      },
      body: form,
    })

    const body = await res.json()

    if (body.success) {
      return {
        success: true,
        platform: "ashby",
        applicationId: body.results?.applicationId,
        submissionMethod: "ats_api",
      }
    }

    const errorMsg = Array.isArray(body.errors)
      ? body.errors.join("; ")
      : body.error || `HTTP ${res.status}`

    return {
      success: false,
      platform: "ashby",
      error: errorMsg,
      submissionMethod: "ats_api",
    }
  } catch (err) {
    return {
      success: false,
      platform: "ashby",
      error: err instanceof Error ? err.message : String(err),
      submissionMethod: "ats_api",
    }
  }
}
