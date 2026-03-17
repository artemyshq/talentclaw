import type { ProfileFrontmatter } from "./types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineBranch {
  type: "education" | "company"
  name: string
  role: string
  startYear: number
  endYear: number
  color: string
  skills: string[]
  projects: string[]
  side: -1 | 1
  offsetY: number
}

// ---------------------------------------------------------------------------
// Color palette — vibrant on light backgrounds
// ---------------------------------------------------------------------------

const BRANCH_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#059669", // green
  "#f59e0b", // amber
  "#ec4899", // pink
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#ef4444", // red
  "#d946ef", // fuchsia
  "#0ea5e9", // sky
  "#84cc16", // lime
]

const EDU_COLOR = "#06b6d4" // cyan

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/** Parse a year string like "2019" into a number, or NaN. */
function parseYear(s: string | undefined): number {
  if (!s) return NaN
  const n = parseInt(s, 10)
  return isFinite(n) ? n : NaN
}

export function buildTimelineData(
  profile: ProfileFrontmatter
): TimelineBranch[] {
  const branches: TimelineBranch[] = []
  let colorIdx = 0
  const currentYear = new Date().getFullYear()

  // Education entries
  for (const edu of profile.education ?? []) {
    const gradYear = parseYear(edu.year)
    if (!isFinite(gradYear)) continue

    // Estimate duration from degree type
    const degLower = edu.degree.toLowerCase()
    let duration = 4
    if (degLower.includes("master") || degLower.includes("ms ") || degLower.includes("m.s.") || degLower.includes("mba")) {
      duration = 2
    } else if (degLower.includes("phd") || degLower.includes("doctorate")) {
      duration = 5
    } else if (degLower.includes("bootcamp") || degLower.includes("certificate")) {
      duration = 1
    }

    branches.push({
      type: "education",
      name: edu.institution,
      role: edu.degree,
      startYear: gradYear - duration,
      endYear: gradYear,
      color: EDU_COLOR,
      skills: edu.skills ?? [],
      projects: [],
      side: 1, // placeholder — assigned below
      offsetY: 60,
    })
  }

  // Experience entries
  for (const exp of profile.experience ?? []) {
    const start = parseYear(exp.start)
    if (!isFinite(start)) continue

    const end = parseYear(exp.end)
    const endYear = isFinite(end) ? end : currentYear

    branches.push({
      type: "company",
      name: exp.company,
      role: exp.title,
      startYear: start,
      endYear,
      color: BRANCH_COLORS[colorIdx % BRANCH_COLORS.length],
      skills: exp.skills ?? [],
      projects: exp.projects ?? [],
      side: 1, // placeholder
      offsetY: 70,
    })
    colorIdx++
  }

  // Sort chronologically
  branches.sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear)

  // Auto-assign alternating sides
  for (let i = 0; i < branches.length; i++) {
    branches[i].side = i % 2 === 0 ? -1 : 1
  }

  return branches
}
