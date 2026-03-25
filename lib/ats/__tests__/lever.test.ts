import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"

import {
  submitLeverApplication,
  fetchLeverCustomQuestions,
} from "@/lib/ats/lever"
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
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lever-test-"))
  resumePath = path.join(tmpDir, "resume.pdf")
  await fs.writeFile(resumePath, Buffer.from("%PDF-1.4 fake resume content"))
})

afterEach(async () => {
  vi.restoreAllMocks()
  await fs.rm(tmpDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// submitLeverApplication
// ---------------------------------------------------------------------------

describe("submitLeverApplication", () => {
  it("returns success with applicationId on a 200 OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, applicationId: "test-id" }),
      })
    )

    const result = await submitLeverApplication(
      "acme",
      "aaaa1111-bb22-cc33-dd44-eeeeeeffffff",
      baseApplicant,
      resumePath
    )

    expect(result).toEqual({
      success: true,
      platform: "lever",
      applicationId: "test-id",
      submissionMethod: "ats_api",
    })

    vi.unstubAllGlobals()
  })

  it("sends FormData with required fields (name, email, resume)", async () => {
    let capturedBody: FormData | undefined

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        capturedBody = init.body as FormData
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, applicationId: "id-123" }),
        })
      })
    )

    await submitLeverApplication(
      "acme",
      "aaaa1111-bb22-cc33-dd44-eeeeeeffffff",
      baseApplicant,
      resumePath
    )

    expect(capturedBody).toBeDefined()
    expect(capturedBody!.get("name")).toBe("Ada Lovelace")
    expect(capturedBody!.get("email")).toBe("ada@example.com")
    expect(capturedBody!.get("resume")).toBeTruthy()

    vi.unstubAllGlobals()
  })

  it("includes optional fields when provided and omits them when not", async () => {
    let capturedBody: FormData | undefined

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        capturedBody = init.body as FormData
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, applicationId: "id-456" }),
        })
      })
    )

    const fullApplicant: ApplicantData = {
      ...baseApplicant,
      phone: "+1-555-0100",
      org: "Lovelace Ltd",
      linkedinUrl: "https://linkedin.com/in/ada",
      githubUrl: "https://github.com/ada",
      websiteUrl: "https://ada.dev",
      coverLetter: "I am passionate about computing.",
    }

    await submitLeverApplication(
      "acme",
      "aaaa1111-bb22-cc33-dd44-eeeeeeffffff",
      fullApplicant,
      resumePath
    )

    expect(capturedBody!.get("phone")).toBe("+1-555-0100")
    expect(capturedBody!.get("org")).toBe("Lovelace Ltd")
    expect(capturedBody!.get("urls[LinkedIn]")).toBe(
      "https://linkedin.com/in/ada"
    )
    expect(capturedBody!.get("urls[GitHub]")).toBe("https://github.com/ada")
    expect(capturedBody!.get("urls[Portfolio]")).toBe("https://ada.dev")
    expect(capturedBody!.get("comments")).toBe(
      "I am passionate about computing."
    )

    vi.unstubAllGlobals()

    // Now submit with only required fields and verify optionals are absent
    let minimalBody: FormData | undefined

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        minimalBody = init.body as FormData
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, applicationId: "id-789" }),
        })
      })
    )

    await submitLeverApplication(
      "acme",
      "aaaa1111-bb22-cc33-dd44-eeeeeeffffff",
      baseApplicant,
      resumePath
    )

    expect(minimalBody!.get("phone")).toBeNull()
    expect(minimalBody!.get("org")).toBeNull()
    expect(minimalBody!.get("urls[LinkedIn]")).toBeNull()
    expect(minimalBody!.get("urls[GitHub]")).toBeNull()
    expect(minimalBody!.get("urls[Portfolio]")).toBeNull()
    expect(minimalBody!.get("comments")).toBeNull()

    vi.unstubAllGlobals()
  })

  it("returns failure on a 400 API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ ok: false, error: "Invalid posting" }),
      })
    )

    const result = await submitLeverApplication(
      "acme",
      "aaaa1111-bb22-cc33-dd44-eeeeeeffffff",
      baseApplicant,
      resumePath
    )

    expect(result).toEqual({
      success: false,
      platform: "lever",
      error: "Invalid posting",
      submissionMethod: "ats_api",
    })

    vi.unstubAllGlobals()
  })

  it("returns failure when the resume file does not exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, applicationId: "never" }),
      })
    )

    const result = await submitLeverApplication(
      "acme",
      "aaaa1111-bb22-cc33-dd44-eeeeeeffffff",
      baseApplicant,
      "/tmp/nonexistent-resume-file-abc123.pdf"
    )

    expect(result.success).toBe(false)
    expect(result.platform).toBe("lever")
    expect(result.error).toBeTruthy()

    vi.unstubAllGlobals()
  })
})

// ---------------------------------------------------------------------------
// fetchLeverCustomQuestions
// ---------------------------------------------------------------------------

describe("fetchLeverCustomQuestions", () => {
  const LEVER_HTML_WITH_QUESTIONS = `
<html><body>
<form>
<div class="section application-additional">
  <div class="application-question custom-question">
    <label for="cards[0][field0]">Are you authorized to work in the US?</label>
    <input type="text" name="cards[0][field0]" required>
  </div>
  <div class="application-question custom-question">
    <label for="cards[0][field1]">Years of experience</label>
    <select name="cards[0][field1]">
      <option value="">Select...</option>
      <option value="1-3">1-3 years</option>
      <option value="3-5">3-5 years</option>
      <option value="5+">5+ years</option>
    </select>
  </div>
</div>
<div class="section application-confirmation">
  <button type="submit">Submit</button>
</div>
</form>
</body></html>`

  const LEVER_HTML_NO_QUESTIONS = `
<html><body>
<form>
<div class="section application-basics">
  <label>Name</label>
  <input type="text" name="name">
</div>
</form>
</body></html>`

  it("extracts custom questions from Lever apply page HTML", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => LEVER_HTML_WITH_QUESTIONS,
      })
    )

    const questions = await fetchLeverCustomQuestions("acme", "some-uuid")

    expect(questions).toHaveLength(2)
    expect(questions[0]).toMatchObject({
      id: "cards[0][field0]",
      text: "Are you authorized to work in the US?",
      required: true,
      type: "text",
    })
    expect(questions[1]).toMatchObject({
      id: "cards[0][field1]",
      text: "Years of experience",
      type: "select",
      options: ["1-3", "3-5", "5+"],
    })

    vi.unstubAllGlobals()
  })

  it("calls the correct Lever apply URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "<html></html>",
    })
    vi.stubGlobal("fetch", mockFetch)

    await fetchLeverCustomQuestions("acme-corp", "uuid-1234")

    expect(mockFetch).toHaveBeenCalledWith(
      "https://jobs.lever.co/acme-corp/uuid-1234/apply"
    )

    vi.unstubAllGlobals()
  })

  it("returns empty array on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network failure"))
    )

    const questions = await fetchLeverCustomQuestions("acme", "some-uuid")
    expect(questions).toEqual([])

    vi.unstubAllGlobals()
  })

  it("returns empty array when the page has no custom questions section", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => LEVER_HTML_NO_QUESTIONS,
      })
    )

    const questions = await fetchLeverCustomQuestions("acme", "some-uuid")
    expect(questions).toEqual([])

    vi.unstubAllGlobals()
  })

  it("returns empty array when the server responds with a non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })
    )

    const questions = await fetchLeverCustomQuestions("acme", "some-uuid")
    expect(questions).toEqual([])

    vi.unstubAllGlobals()
  })
})
