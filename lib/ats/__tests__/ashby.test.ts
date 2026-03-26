import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"

import {
  submitAshbyApplication,
  fetchAshbyCustomQuestions,
} from "@/lib/ats/ashby"
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
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ashby-test-"))
  resumePath = path.join(tmpDir, "resume.pdf")
  await fs.writeFile(resumePath, Buffer.from("%PDF-1.4 fake resume content"))
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete process.env.ASHBY_API_KEY
  await fs.rm(tmpDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// fetchAshbyCustomQuestions
// ---------------------------------------------------------------------------

describe("fetchAshbyCustomQuestions", () => {
  const ASHBY_RESPONSE = {
    success: true,
    results: {
      applicationFormDefinition: {
        sections: [
          {
            fields: [
              {
                isRequired: true,
                field: {
                  path: "_systemfield_name",
                  title: "Full Name",
                  type: "String",
                  isNullable: false,
                },
              },
              {
                isRequired: true,
                field: {
                  path: "_systemfield_email",
                  title: "Email",
                  type: "Email",
                  isNullable: false,
                },
              },
              {
                isRequired: true,
                field: {
                  path: "_systemfield_resume",
                  title: "Resume",
                  type: "File",
                  isNullable: false,
                },
              },
            ],
          },
          {
            fields: [
              {
                isRequired: true,
                field: {
                  path: "custom_field_work_auth",
                  title: "Are you authorized to work in the US?",
                  type: "Boolean",
                  isNullable: false,
                },
              },
              {
                isRequired: false,
                field: {
                  path: "custom_field_experience",
                  title: "Years of experience",
                  type: "ValueSelect",
                  isNullable: true,
                  selectableValues: [
                    { label: "0-2", value: "0-2" },
                    { label: "3-5", value: "3-5" },
                    { label: "5+", value: "5+" },
                  ],
                },
              },
              {
                isRequired: false,
                field: {
                  path: "custom_field_linkedin",
                  title: "LinkedIn URL",
                  type: "SocialLink",
                  isNullable: true,
                },
              },
              {
                isRequired: false,
                field: {
                  path: "custom_field_about",
                  title: "Tell us about yourself",
                  type: "LongText",
                  isNullable: true,
                },
              },
            ],
          },
        ],
      },
    },
  }

  it("extracts custom fields from sections and maps types correctly", async () => {
    process.env.ASHBY_API_KEY = "test-key"

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ASHBY_RESPONSE,
      })
    )

    const questions = await fetchAshbyCustomQuestions("acme", "uuid-1234")

    expect(questions).toHaveLength(4)

    expect(questions[0]).toMatchObject({
      id: "custom_field_work_auth",
      text: "Are you authorized to work in the US?",
      required: true,
      type: "select",
      options: ["Yes", "No"],
    })

    expect(questions[1]).toMatchObject({
      id: "custom_field_experience",
      text: "Years of experience",
      required: false,
      type: "select",
      options: ["0-2", "3-5", "5+"],
    })

    expect(questions[2]).toMatchObject({
      id: "custom_field_linkedin",
      text: "LinkedIn URL",
      required: false,
      type: "text",
    })

    expect(questions[3]).toMatchObject({
      id: "custom_field_about",
      text: "Tell us about yourself",
      required: false,
      type: "textarea",
    })
  })

  it("filters out system fields", async () => {
    process.env.ASHBY_API_KEY = "test-key"

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ASHBY_RESPONSE,
      })
    )

    const questions = await fetchAshbyCustomQuestions("acme", "uuid-1234")
    const ids = questions.map((q) => q.id)

    expect(ids).not.toContain("_systemfield_name")
    expect(ids).not.toContain("_systemfield_email")
    expect(ids).not.toContain("_systemfield_resume")
  })

  it("returns empty array when ASHBY_API_KEY is not set", async () => {
    delete process.env.ASHBY_API_KEY

    const questions = await fetchAshbyCustomQuestions("acme", "uuid-1234")
    expect(questions).toEqual([])
  })

  it("returns empty array on network error", async () => {
    process.env.ASHBY_API_KEY = "test-key"

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network failure"))
    )

    const questions = await fetchAshbyCustomQuestions("acme", "uuid-1234")
    expect(questions).toEqual([])
  })

  it("returns empty array when the server responds with a non-OK status", async () => {
    process.env.ASHBY_API_KEY = "test-key"

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })
    )

    const questions = await fetchAshbyCustomQuestions("acme", "uuid-1234")
    expect(questions).toEqual([])
  })

  it("calls the correct Ashby API endpoint with POST", async () => {
    process.env.ASHBY_API_KEY = "test-key"

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: { applicationFormDefinition: { sections: [] } } }),
    })
    vi.stubGlobal("fetch", mockFetch)

    await fetchAshbyCustomQuestions("acme", "uuid-5678")

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.ashbyhq.com/jobPosting.info",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ jobPostingId: "uuid-5678" }),
      })
    )
  })
})

// ---------------------------------------------------------------------------
// submitAshbyApplication
// ---------------------------------------------------------------------------

describe("submitAshbyApplication", () => {
  it("returns success with applicationId on a successful response", async () => {
    process.env.ASHBY_API_KEY = "test-key"

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          results: { applicationId: "app-uuid-123" },
        }),
      })
    )

    const result = await submitAshbyApplication(
      "acme",
      "posting-uuid",
      baseApplicant,
      resumePath
    )

    expect(result).toEqual({
      success: true,
      platform: "ashby",
      applicationId: "app-uuid-123",
      submissionMethod: "ats_api",
    })
  })

  it("builds fieldSubmissions with system fields and custom answers", async () => {
    process.env.ASHBY_API_KEY = "test-key"
    let capturedBody: FormData | undefined

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        capturedBody = init.body as FormData
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            results: { applicationId: "app-uuid-456" },
          }),
        })
      })
    )

    await submitAshbyApplication(
      "acme",
      "posting-uuid",
      { ...baseApplicant, phone: "+1-555-0100" },
      resumePath,
      { custom_field_1: "answer1" }
    )

    expect(capturedBody).toBeDefined()
    const fieldSubmissions = JSON.parse(
      capturedBody!.get("fieldSubmissions") as string
    )

    expect(fieldSubmissions).toEqual(
      expect.arrayContaining([
        { path: "_systemfield_name", value: "Ada Lovelace" },
        { path: "_systemfield_email", value: "ada@example.com" },
        { path: "_systemfield_phone", value: "+1-555-0100" },
        { path: "custom_field_1", value: "answer1" },
      ])
    )

    expect(capturedBody!.get("jobPostingId")).toBe("posting-uuid")
    expect(capturedBody!.get("_systemfield_resume")).toBeTruthy()
  })

  it("sends Authorization header with Basic auth", async () => {
    process.env.ASHBY_API_KEY = "my-ashby-key"
    let capturedHeaders: HeadersInit | undefined

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        capturedHeaders = init.headers
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            results: { applicationId: "app-uuid-789" },
          }),
        })
      })
    )

    await submitAshbyApplication(
      "acme",
      "posting-uuid",
      baseApplicant,
      resumePath
    )

    expect(capturedHeaders).toMatchObject({
      Authorization: `Basic ${btoa("my-ashby-key:")}`,
    })
  })

  it("returns error when ASHBY_API_KEY is not set", async () => {
    delete process.env.ASHBY_API_KEY

    const result = await submitAshbyApplication(
      "acme",
      "posting-uuid",
      baseApplicant,
      resumePath
    )

    expect(result).toEqual({
      success: false,
      platform: "ashby",
      error: "Ashby API key not configured — set ASHBY_API_KEY",
      submissionMethod: "ats_api",
    })
  })

  it("returns failure on API error response", async () => {
    process.env.ASHBY_API_KEY = "test-key"

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          success: false,
          errors: ["Invalid job posting", "Missing required field"],
        }),
      })
    )

    const result = await submitAshbyApplication(
      "acme",
      "posting-uuid",
      baseApplicant,
      resumePath
    )

    expect(result).toEqual({
      success: false,
      platform: "ashby",
      error: "Invalid job posting; Missing required field",
      submissionMethod: "ats_api",
    })
  })

  it("returns failure when the resume file does not exist", async () => {
    process.env.ASHBY_API_KEY = "test-key"

    const result = await submitAshbyApplication(
      "acme",
      "posting-uuid",
      baseApplicant,
      "/tmp/nonexistent-resume-file-abc123.pdf"
    )

    expect(result.success).toBe(false)
    expect(result.platform).toBe("ashby")
    expect(result.error).toBeTruthy()
  })
})
