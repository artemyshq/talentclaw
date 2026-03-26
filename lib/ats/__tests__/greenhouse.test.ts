import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"

import {
  submitGreenhouseApplication,
  fetchGreenhouseCustomQuestions,
} from "@/lib/ats/greenhouse"
import type { ApplicantData } from "@/lib/ats/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseApplicant: ApplicantData = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  source: "talentclaw",
}

let tmpDir: string
let resumePath: string

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "greenhouse-test-"))
  resumePath = path.join(tmpDir, "resume.pdf")
  await fs.writeFile(resumePath, Buffer.from("%PDF-1.4 fake resume content"))
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete process.env.GREENHOUSE_API_KEY
  await fs.rm(tmpDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// fetchGreenhouseCustomQuestions
// ---------------------------------------------------------------------------

describe("fetchGreenhouseCustomQuestions", () => {
  const GREENHOUSE_RESPONSE = {
    title: "Software Engineer",
    questions: [
      {
        label: "First Name",
        required: true,
        fields: [{ name: "first_name", type: "input_text", values: [] }],
      },
      {
        label: "Last Name",
        required: true,
        fields: [{ name: "last_name", type: "input_text", values: [] }],
      },
      {
        label: "Email",
        required: true,
        fields: [{ name: "email", type: "input_text", values: [] }],
      },
      {
        label: "Resume",
        required: true,
        fields: [{ name: "resume", type: "input_file", values: [] }],
      },
      {
        label: "Hidden tracking",
        required: false,
        fields: [{ name: "question_001", type: "input_hidden", values: [] }],
      },
      {
        label: "Are you authorized to work in the US?",
        required: true,
        fields: [
          {
            name: "question_14831426008",
            type: "multi_value_single_select",
            values: [
              { value: 1, label: "Yes" },
              { value: 2, label: "No" },
            ],
          },
        ],
      },
      {
        label: "Tell us about yourself",
        required: false,
        fields: [{ name: "question_14831426009", type: "textarea", values: [] }],
      },
      {
        label: "Years of experience",
        required: true,
        fields: [
          {
            name: "question_14831426010",
            type: "input_text",
            values: [],
          },
        ],
      },
    ],
  }

  it("extracts custom questions and maps types correctly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => GREENHOUSE_RESPONSE,
      })
    )

    const questions = await fetchGreenhouseCustomQuestions("acme", "12345")

    expect(questions).toHaveLength(3)

    expect(questions[0]).toMatchObject({
      id: "question_14831426008",
      text: "Are you authorized to work in the US?",
      required: true,
      type: "select",
      options: ["Yes", "No"],
    })

    expect(questions[1]).toMatchObject({
      id: "question_14831426009",
      text: "Tell us about yourself",
      required: false,
      type: "textarea",
    })

    expect(questions[2]).toMatchObject({
      id: "question_14831426010",
      text: "Years of experience",
      required: true,
      type: "text",
    })
  })

  it("filters out standard fields (first_name, last_name, email, resume)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => GREENHOUSE_RESPONSE,
      })
    )

    const questions = await fetchGreenhouseCustomQuestions("acme", "12345")
    const ids = questions.map((q) => q.id)

    expect(ids).not.toContain("first_name")
    expect(ids).not.toContain("last_name")
    expect(ids).not.toContain("email")
    expect(ids).not.toContain("resume")
  })

  it("filters out hidden fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => GREENHOUSE_RESPONSE,
      })
    )

    const questions = await fetchGreenhouseCustomQuestions("acme", "12345")
    const ids = questions.map((q) => q.id)

    expect(ids).not.toContain("question_001")
  })

  it("calls the correct Greenhouse API URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [] }),
    })
    vi.stubGlobal("fetch", mockFetch)

    await fetchGreenhouseCustomQuestions("acme-corp", "67890")

    expect(mockFetch).toHaveBeenCalledWith(
      "https://boards-api.greenhouse.io/v1/boards/acme-corp/jobs/67890?questions=true"
    )
  })

  it("returns empty array on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network failure"))
    )

    const questions = await fetchGreenhouseCustomQuestions("acme", "12345")
    expect(questions).toEqual([])
  })

  it("returns empty array when the server responds with a non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })
    )

    const questions = await fetchGreenhouseCustomQuestions("acme", "12345")
    expect(questions).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// submitGreenhouseApplication
// ---------------------------------------------------------------------------

describe("submitGreenhouseApplication", () => {
  it("returns success on a 200 OK response", async () => {
    process.env.GREENHOUSE_API_KEY = "test-key"

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 98765 }),
      })
    )

    const result = await submitGreenhouseApplication(
      "acme",
      "12345",
      baseApplicant,
      resumePath
    )

    expect(result).toEqual({
      success: true,
      platform: "greenhouse",
      applicationId: "98765",
      submissionMethod: "ats_api",
    })
  })

  it("splits name into first_name and last_name correctly", async () => {
    process.env.GREENHOUSE_API_KEY = "test-key"
    let capturedBody: FormData | undefined

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        capturedBody = init.body as FormData
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 111 }),
        })
      })
    )

    await submitGreenhouseApplication(
      "acme",
      "12345",
      { ...baseApplicant, name: "Ada Augusta Lovelace" },
      resumePath
    )

    expect(capturedBody!.get("first_name")).toBe("Ada")
    expect(capturedBody!.get("last_name")).toBe("Augusta Lovelace")
  })

  it("uses first name as last name when only one name part", async () => {
    process.env.GREENHOUSE_API_KEY = "test-key"
    let capturedBody: FormData | undefined

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        capturedBody = init.body as FormData
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 222 }),
        })
      })
    )

    await submitGreenhouseApplication(
      "acme",
      "12345",
      { ...baseApplicant, name: "Ada" },
      resumePath
    )

    expect(capturedBody!.get("first_name")).toBe("Ada")
    expect(capturedBody!.get("last_name")).toBe("Ada")
  })

  it("includes resume file in form data", async () => {
    process.env.GREENHOUSE_API_KEY = "test-key"
    let capturedBody: FormData | undefined

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        capturedBody = init.body as FormData
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 333 }),
        })
      })
    )

    await submitGreenhouseApplication(
      "acme",
      "12345",
      baseApplicant,
      resumePath
    )

    expect(capturedBody!.get("resume")).toBeTruthy()
  })

  it("sends Authorization header with Basic auth", async () => {
    process.env.GREENHOUSE_API_KEY = "my-secret-key"
    let capturedHeaders: HeadersInit | undefined

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        capturedHeaders = init.headers
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 444 }),
        })
      })
    )

    await submitGreenhouseApplication(
      "acme",
      "12345",
      baseApplicant,
      resumePath
    )

    expect(capturedHeaders).toMatchObject({
      Authorization: `Basic ${btoa("my-secret-key:")}`,
    })
  })

  it("returns error when GREENHOUSE_API_KEY is not set", async () => {
    delete process.env.GREENHOUSE_API_KEY

    const result = await submitGreenhouseApplication(
      "acme",
      "12345",
      baseApplicant,
      resumePath
    )

    expect(result).toEqual({
      success: false,
      platform: "greenhouse",
      error: "Greenhouse API key not configured — set GREENHOUSE_API_KEY",
      submissionMethod: "ats_api",
    })
  })

  it("returns failure on API error response", async () => {
    process.env.GREENHOUSE_API_KEY = "test-key"

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: "Invalid posting" }),
      })
    )

    const result = await submitGreenhouseApplication(
      "acme",
      "12345",
      baseApplicant,
      resumePath
    )

    expect(result).toEqual({
      success: false,
      platform: "greenhouse",
      error: "Invalid posting",
      submissionMethod: "ats_api",
    })
  })
})
