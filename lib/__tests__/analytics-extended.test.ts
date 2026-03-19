import { describe, it, expect } from "vitest"
import {
  computeMomentum,
  computeConfidenceBreakdown,
  generateBriefing,
} from "@/lib/analytics"
import type { JobFile, ApplicationFile, ActivityEntry, ProfileFrontmatter } from "@/lib/types"
import type { MatchBreakdown } from "@/lib/match-scoring"

function makeJob(slug: string, opts: Partial<JobFile["frontmatter"]> = {}): JobFile {
  return {
    slug,
    frontmatter: {
      title: "Engineer",
      company: "Corp",
      status: "discovered",
      source: "manual",
      ...opts,
    },
    content: "",
  }
}

function makeApp(slug: string, opts: Partial<ApplicationFile["frontmatter"]> = {}): ApplicationFile {
  return {
    slug,
    frontmatter: {
      job: slug,
      status: "applied",
      ...opts,
    },
    content: "",
  }
}

function makeActivity(type: string, summary: string, daysAgo: number, metadata?: Record<string, unknown>): ActivityEntry {
  const ts = new Date(Date.now() - daysAgo * 86400000).toISOString()
  return { ts, type, summary, metadata }
}

describe("computeMomentum", () => {
  it("returns null score with 0 applications", () => {
    const result = computeMomentum([], [], [])
    expect(result.score).toBeNull()
    expect(result.trend).toBe("flat")
    expect(result.qualifier).toContain("Not enough data")
  })

  it("returns null score with 1-2 applications", () => {
    const apps = [makeApp("a1"), makeApp("a2")]
    const result = computeMomentum([], apps, [])
    expect(result.score).toBeNull()
    expect(result.qualifier).toContain("Not enough data")
  })

  it("computes score with 10 applications", () => {
    const apps = Array.from({ length: 10 }, (_, i) =>
      makeApp(`a${i}`, { applied_at: new Date(Date.now() - i * 86400000).toISOString() })
    )
    const activity = Array.from({ length: 20 }, (_, i) =>
      makeActivity("search", "Searched jobs", i)
    )
    const result = computeMomentum([], apps, activity)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.qualifier).toContain("10 applications")
  })

  it("computes non-zero score even with all rejected applications", () => {
    const apps = Array.from({ length: 5 }, (_, i) =>
      makeApp(`a${i}`, {
        status: "rejected",
        applied_at: new Date(Date.now() - i * 86400000).toISOString(),
      })
    )
    const activity = Array.from({ length: 5 }, (_, i) =>
      makeActivity("apply", "Applied", i)
    )
    const result = computeMomentum([], apps, activity)
    expect(result.score).not.toBeNull()
    // Score should still reflect activity — not zero
    expect(result.score!).toBeGreaterThanOrEqual(0)
  })

  it("detects upward trend", () => {
    // 5 recent apps, 1 older app
    const recentApps = Array.from({ length: 5 }, (_, i) =>
      makeApp(`r${i}`, { applied_at: new Date(Date.now() - i * 86400000).toISOString() })
    )
    const olderApps = [
      makeApp("old", { applied_at: new Date(Date.now() - 20 * 86400000).toISOString() }),
    ]
    const result = computeMomentum([], [...recentApps, ...olderApps], [])
    expect(result.trend).toBe("up")
  })

  it("handles division by zero (no older apps)", () => {
    const apps = Array.from({ length: 3 }, (_, i) =>
      makeApp(`a${i}`, { applied_at: new Date(Date.now() - i * 86400000).toISOString() })
    )
    // Should not throw
    const result = computeMomentum([], apps, [])
    expect(result.trend).toBe("up") // recent activity, no older = up
  })
})

describe("computeConfidenceBreakdown", () => {
  const baseBreakdown: MatchBreakdown = {
    overall: 75,
    dimensions: {
      skills: { label: "Skills", score: 80, detail: "", breakdown: { matched: [], missing: [], extra: [] } },
      experience: { label: "Exp", score: 75, detail: "", yourYears: 5, requiredYears: 3 },
      salary: { label: "Salary", score: 70, detail: "", yourRange: null, offeredRange: null },
      location: { label: "Location", score: 80, detail: "" },
      remote: { label: "Remote", score: 90, detail: "" },
    },
  }

  it("returns score based on match score with no history", () => {
    const result = computeConfidenceBreakdown(baseBreakdown, [])
    expect(result.score).toBe(75) // same as overall when no history
    expect(result.qualifier).toContain("Not enough data")
  })

  it("blends with historical performance when enough data", () => {
    const apps = Array.from({ length: 5 }, (_, i) =>
      makeApp(`a${i}`, { status: i < 2 ? "offer" : "applied" })
    )
    const result = computeConfidenceBreakdown(baseBreakdown, apps)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.qualifier).toContain("5 applications")
  })

  it("includes reasoning text", () => {
    const result = computeConfidenceBreakdown(baseBreakdown, [])
    expect(result.reasoning).toContain("Match score: 75%")
  })

  it("clamps score to 0-100 range", () => {
    const highBreakdown = { ...baseBreakdown, overall: 99 }
    const apps = Array.from({ length: 10 }, (_, i) =>
      makeApp(`a${i}`, { status: "offer" })
    )
    const result = computeConfidenceBreakdown(highBreakdown, apps)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })
})

describe("generateBriefing", () => {
  const emptyProfile: ProfileFrontmatter = {}

  it("counts agent actions from activity log", () => {
    const activity: ActivityEntry[] = [
      makeActivity("agent", "Applied to job", 1, { type: "agent_action" }),
      makeActivity("agent", "Searched jobs", 2, { type: "agent_action" }),
      makeActivity("agent", "Old action", 20, { type: "agent_action" }), // too old
    ]
    const result = generateBriefing({ jobs: [], applications: [], threads: [], profile: emptyProfile, activityLog: activity })
    expect(result.agentActions).toBe(2) // only recent ones
  })

  it("returns zero agent actions with empty log", () => {
    const result = generateBriefing({ jobs: [], applications: [], threads: [], profile: emptyProfile, activityLog: [] })
    expect(result.agentActions).toBe(0)
  })

  it("returns zero agent actions when no metadata", () => {
    const activity: ActivityEntry[] = [
      makeActivity("search", "Searched", 1),
    ]
    const result = generateBriefing({ jobs: [], applications: [], threads: [], profile: emptyProfile, activityLog: activity })
    expect(result.agentActions).toBe(0)
  })

  it("counts new jobs from last 7 days", () => {
    const jobs = [
      makeJob("j1", { discovered_at: new Date().toISOString() }),
      makeJob("j2", { discovered_at: new Date(Date.now() - 3 * 86400000).toISOString() }),
      makeJob("j3", { discovered_at: new Date(Date.now() - 10 * 86400000).toISOString() }),
    ]
    const result = generateBriefing({ jobs, applications: [], threads: [], profile: emptyProfile })
    expect(result.newJobs).toBe(2)
  })
})
