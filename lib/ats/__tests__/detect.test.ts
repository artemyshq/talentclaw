import { describe, it, expect } from "vitest"
import { detectAtsPlatform } from "@/lib/ats/detect"

describe("detectAtsPlatform", () => {
  describe("Lever URLs", () => {
    it("detects a standard Lever posting URL", () => {
      const result = detectAtsPlatform(
        "https://jobs.lever.co/figma/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      )
      expect(result).toEqual({
        platform: "lever",
        companySlug: "figma",
        postingId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        originalUrl:
          "https://jobs.lever.co/figma/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      })
    })

    it("strips /apply suffix and returns the same result", () => {
      const result = detectAtsPlatform(
        "https://jobs.lever.co/figma/a1b2c3d4-e5f6-7890-abcd-ef1234567890/apply"
      )
      expect(result.platform).toBe("lever")
      expect(result.companySlug).toBe("figma")
      expect(result.postingId).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    })

    it("works with trailing slash", () => {
      const result = detectAtsPlatform(
        "https://jobs.lever.co/figma/a1b2c3d4-e5f6-7890-abcd-ef1234567890/"
      )
      expect(result.platform).toBe("lever")
      expect(result.companySlug).toBe("figma")
      expect(result.postingId).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    })

    it("ignores query params (regex anchors strip them — returns unknown)", () => {
      // The regex uses $ anchor so query params cause a non-match.
      // This documents the actual behaviour.
      const url =
        "https://jobs.lever.co/figma/a1b2c3d4-e5f6-7890-abcd-ef1234567890?source=linkedin"
      const result = detectAtsPlatform(url)
      // The current regex does NOT tolerate query strings
      expect(result.platform).toBe("unknown")
    })
  })

  describe("Greenhouse URLs", () => {
    it("detects a boards.greenhouse.io URL", () => {
      const result = detectAtsPlatform(
        "https://boards.greenhouse.io/anthropic/jobs/4567890"
      )
      expect(result).toEqual({
        platform: "greenhouse",
        companySlug: "anthropic",
        postingId: "4567890",
        originalUrl: "https://boards.greenhouse.io/anthropic/jobs/4567890",
      })
    })

    it("detects a job-boards.greenhouse.io URL", () => {
      const result = detectAtsPlatform(
        "https://job-boards.greenhouse.io/anthropic/jobs/4567890"
      )
      expect(result).toEqual({
        platform: "greenhouse",
        companySlug: "anthropic",
        postingId: "4567890",
        originalUrl:
          "https://job-boards.greenhouse.io/anthropic/jobs/4567890",
      })
    })
  })

  describe("Ashby URLs", () => {
    it("detects a standard Ashby posting URL", () => {
      const result = detectAtsPlatform(
        "https://jobs.ashbyhq.com/notion/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      )
      expect(result).toEqual({
        platform: "ashby",
        companySlug: "notion",
        postingId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        originalUrl:
          "https://jobs.ashbyhq.com/notion/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      })
    })
  })

  describe("Unknown URLs", () => {
    it("returns unknown for a Google careers URL", () => {
      const result = detectAtsPlatform(
        "https://careers.google.com/jobs/results/123"
      )
      expect(result).toEqual({
        platform: "unknown",
        companySlug: "",
        postingId: "",
        originalUrl: "https://careers.google.com/jobs/results/123",
      })
    })

    it("returns unknown for a LinkedIn job URL", () => {
      const result = detectAtsPlatform(
        "https://linkedin.com/jobs/view/12345"
      )
      expect(result.platform).toBe("unknown")
    })

    it("returns unknown for an empty string", () => {
      const result = detectAtsPlatform("")
      expect(result.platform).toBe("unknown")
      expect(result.originalUrl).toBe("")
    })

    it("returns unknown for an invalid string", () => {
      const result = detectAtsPlatform("not-a-url")
      expect(result.platform).toBe("unknown")
    })
  })
})
