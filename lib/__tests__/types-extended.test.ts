import { describe, it, expect } from "vitest"
import {
  ApplicationWorkflowStatusSchema,
  JobFrontmatterSchema,
  ContactFrontmatterSchema,
  CompanyFrontmatterSchema,
  ProfileFrontmatterSchema,
  ActivityEntrySchema,
} from "@/lib/types"

describe("ApplicationWorkflowStatus", () => {
  it("accepts valid statuses", () => {
    for (const status of ["queued", "review_required", "approved", "submitted", "failed"]) {
      expect(ApplicationWorkflowStatusSchema.safeParse(status).success).toBe(true)
    }
  })

  it("rejects invalid status", () => {
    expect(ApplicationWorkflowStatusSchema.safeParse("invalid").success).toBe(false)
    expect(ApplicationWorkflowStatusSchema.safeParse("").success).toBe(false)
  })
})

describe("Job relationship fields", () => {
  it("accepts company_ref", () => {
    const result = JobFrontmatterSchema.safeParse({
      title: "Engineer",
      company: "Acme",
      company_ref: "acme-corp",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company_ref).toBe("acme-corp")
    }
  })

  it("accepts contact_refs array", () => {
    const result = JobFrontmatterSchema.safeParse({
      title: "Engineer",
      company: "Acme",
      contact_refs: ["jane", "bob"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.contact_refs).toEqual(["jane", "bob"])
    }
  })

  it("allows missing relationship fields", () => {
    const result = JobFrontmatterSchema.safeParse({
      title: "Engineer",
      company: "Acme",
    })
    expect(result.success).toBe(true)
  })
})

describe("Contact relationship fields", () => {
  it("accepts company_ref", () => {
    const result = ContactFrontmatterSchema.safeParse({
      name: "Jane",
      company_ref: "acme",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company_ref).toBe("acme")
    }
  })

  it("accepts job_refs array", () => {
    const result = ContactFrontmatterSchema.safeParse({
      name: "Jane",
      job_refs: ["eng-role", "pm-role"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.job_refs).toEqual(["eng-role", "pm-role"])
    }
  })
})

describe("Company extended fields", () => {
  it("accepts comp_range", () => {
    const result = CompanyFrontmatterSchema.safeParse({
      name: "Acme",
      comp_range: { min: 100000, max: 200000 },
    })
    expect(result.success).toBe(true)
  })

  it("accepts interview_stages", () => {
    const result = CompanyFrontmatterSchema.safeParse({
      name: "Acme",
      interview_stages: ["phone", "onsite", "final"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.interview_stages).toHaveLength(3)
    }
  })

  it("accepts response_rate", () => {
    const result = CompanyFrontmatterSchema.safeParse({
      name: "Acme",
      response_rate: 0.75,
    })
    expect(result.success).toBe(true)
  })
})

describe("Profile narrative fields", () => {
  it("accepts career_arc_summary", () => {
    const result = ProfileFrontmatterSchema.safeParse({
      career_arc_summary: "Started as junior, now senior",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.career_arc_summary).toBe("Started as junior, now senior")
    }
  })

  it("accepts core_strengths_summary", () => {
    const result = ProfileFrontmatterSchema.safeParse({
      core_strengths_summary: "Strong in systems design",
    })
    expect(result.success).toBe(true)
  })

  it("accepts current_situation_summary", () => {
    const result = ProfileFrontmatterSchema.safeParse({
      current_situation_summary: "Looking for next challenge",
    })
    expect(result.success).toBe(true)
  })

  it("accepts growth_edges_summary", () => {
    const result = ProfileFrontmatterSchema.safeParse({
      growth_edges_summary: "Working on leadership skills",
    })
    expect(result.success).toBe(true)
  })
})

describe("ActivityEntry with metadata", () => {
  it("accepts entry with metadata", () => {
    const result = ActivityEntrySchema.safeParse({
      ts: "2026-01-01T00:00:00Z",
      type: "agent_action",
      summary: "Applied to job",
      metadata: { type: "agent_action", jobSlug: "acme-sre" },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.metadata).toEqual({ type: "agent_action", jobSlug: "acme-sre" })
    }
  })

  it("accepts entry without metadata", () => {
    const result = ActivityEntrySchema.safeParse({
      ts: "2026-01-01T00:00:00Z",
      type: "search",
      summary: "Searched for jobs",
    })
    expect(result.success).toBe(true)
  })
})
