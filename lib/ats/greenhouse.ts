import fs from "node:fs/promises"
import path from "node:path"
import { ApplicantDataSchema } from "./types"
import type {
  ApplicantData,
  AtsCustomQuestion,
  AtsSubmissionResult,
} from "./types"

const GREENHOUSE_BOARDS_API = "https://boards-api.greenhouse.io/v1/boards"

const STANDARD_FIELDS = new Set([
  "first_name",
  "last_name",
  "email",
  "phone",
  "resume",
  "resume_text",
  "cover_letter",
  "cover_letter_text",
])

function mapFieldType(
  ghType: string
): AtsCustomQuestion["type"] {
  switch (ghType) {
    case "textarea":
      return "textarea"
    case "input_file":
      return "file"
    case "multi_value_single_select":
    case "multi_value_multi_select":
      return "select"
    default:
      return "text"
  }
}

export async function fetchGreenhouseCustomQuestions(
  companySlug: string,
  postingId: string
): Promise<AtsCustomQuestion[]> {
  try {
    const res = await fetch(
      `${GREENHOUSE_BOARDS_API}/${companySlug}/jobs/${postingId}?questions=true`
    )
    if (!res.ok) return []

    const body = await res.json()
    const questions: AtsCustomQuestion[] = []

    if (!Array.isArray(body.questions)) return []

    for (const question of body.questions) {
      if (!Array.isArray(question.fields)) continue

      for (const field of question.fields) {
        if (field.type === "input_hidden") continue
        if (STANDARD_FIELDS.has(field.name)) continue

        const type = mapFieldType(field.type)
        const options =
          type === "select" && Array.isArray(field.values)
            ? field.values.map((v: { label: string }) => v.label)
            : undefined

        questions.push({
          id: field.name,
          text: question.label || "",
          required: !!question.required,
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

export async function submitGreenhouseApplication(
  companySlug: string,
  postingId: string,
  applicant: ApplicantData,
  resumePath: string,
  customAnswers?: Record<string, string>
): Promise<AtsSubmissionResult> {
  const apiKey = process.env.GREENHOUSE_API_KEY
  if (!apiKey) {
    return {
      success: false,
      platform: "greenhouse",
      error:
        "Greenhouse API key not configured — set GREENHOUSE_API_KEY",
      submissionMethod: "ats_api",
    }
  }

  try {
    const validated = ApplicantDataSchema.parse(applicant)
    const resumeBuffer = await fs.readFile(resumePath)
    const filename = path.basename(resumePath)

    const nameParts = validated.name.trim().split(/\s+/)
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") || firstName

    const form = new FormData()
    form.append("first_name", firstName)
    form.append("last_name", lastName)
    form.append("email", validated.email)

    if (validated.phone) form.append("phone", validated.phone)
    if (validated.coverLetter)
      form.append("cover_letter_text", validated.coverLetter)

    const blob = new Blob([resumeBuffer], { type: "application/pdf" })
    form.append("resume", blob, filename)

    if (customAnswers) {
      for (const [key, value] of Object.entries(customAnswers)) {
        form.append(key, value)
      }
    }

    const res = await fetch(
      `${GREENHOUSE_BOARDS_API}/${companySlug}/jobs/${postingId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(apiKey + ":")}`,
        },
        body: form,
      }
    )

    const body = await res.json()

    if (res.ok) {
      return {
        success: true,
        platform: "greenhouse",
        applicationId: body.id ? String(body.id) : undefined,
        submissionMethod: "ats_api",
      }
    }

    return {
      success: false,
      platform: "greenhouse",
      error: body.message || body.error || `HTTP ${res.status}`,
      submissionMethod: "ats_api",
    }
  } catch (err) {
    return {
      success: false,
      platform: "greenhouse",
      error: err instanceof Error ? err.message : String(err),
      submissionMethod: "ats_api",
    }
  }
}
