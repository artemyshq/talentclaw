import type { ProfileFrontmatter, JobFrontmatter, MatchBreakdown } from "./types"

export function calculateMatchBreakdown(
  profile: ProfileFrontmatter,
  job: JobFrontmatter,
): MatchBreakdown {
  const skillsResult = calculateSkillsOverlap(profile, job)
  const experienceFit = calculateExperienceFit(profile, job)
  const salaryAlignment = calculateSalaryAlignment(profile, job)
  const locationMatch = calculateLocationMatch(profile, job)
  const remoteMatch = calculateRemoteMatch(profile, job)

  // Weighted overall score
  const weights = {
    skills: 0.4,
    experience: 0.2,
    salary: 0.2,
    location: 0.1,
    remote: 0.1,
  }

  const locationScore = locationMatch ? 100 : 50
  const remoteScore = remoteMatch ? 100 : 50

  const overall = Math.round(
    skillsResult.overlap * weights.skills +
      experienceFit * weights.experience +
      salaryAlignment * weights.salary +
      locationScore * weights.location +
      remoteScore * weights.remote,
  )

  return {
    overall: Math.min(100, Math.max(0, overall)),
    skills_overlap: skillsResult.overlap,
    skills_matched: skillsResult.matched,
    skills_missing: skillsResult.missing,
    experience_fit: experienceFit,
    salary_alignment: salaryAlignment,
    location_match: locationMatch,
    remote_match: remoteMatch,
  }
}

// --- Internal helpers ---

function calculateSkillsOverlap(
  profile: ProfileFrontmatter,
  job: JobFrontmatter,
): { overlap: number; matched: string[]; missing: string[] } {
  const profileSkills = (profile.skills || []).map((s) => s.toLowerCase())

  // Collect skills from job tags (common convention for required skills)
  const jobSkills = (job.tags || []).map((s) => s.toLowerCase())

  if (jobSkills.length === 0) {
    // No job skills to compare — give a neutral score
    return { overlap: 50, matched: [], missing: [] }
  }

  const matched: string[] = []
  const missing: string[] = []

  for (const skill of jobSkills) {
    if (profileSkills.includes(skill)) {
      matched.push(skill)
    } else {
      missing.push(skill)
    }
  }

  const overlap = Math.round((matched.length / jobSkills.length) * 100)
  return { overlap, matched, missing }
}

function calculateExperienceFit(
  profile: ProfileFrontmatter,
  job: JobFrontmatter,
): number {
  const profileYears = profile.experience_years
  if (profileYears === undefined || profileYears === null) {
    return 50 // neutral when unknown
  }

  // Without explicit job experience requirements, use a heuristic:
  // Senior roles (inferred from title) expect 5+ years, mid-level 2-5, entry 0-2
  const title = (job.title || "").toLowerCase()
  let expectedMin = 0
  let expectedMax = 20

  if (
    title.includes("senior") ||
    title.includes("sr.") ||
    title.includes("lead") ||
    title.includes("principal") ||
    title.includes("staff")
  ) {
    expectedMin = 5
    expectedMax = 20
  } else if (
    title.includes("junior") ||
    title.includes("jr.") ||
    title.includes("entry") ||
    title.includes("intern")
  ) {
    expectedMin = 0
    expectedMax = 3
  } else {
    // Mid-level default
    expectedMin = 2
    expectedMax = 10
  }

  if (profileYears >= expectedMin && profileYears <= expectedMax) {
    return 100
  } else if (profileYears < expectedMin) {
    const gap = expectedMin - profileYears
    return Math.max(0, 100 - gap * 20)
  } else {
    // Overqualified — slight penalty but not severe
    const excess = profileYears - expectedMax
    return Math.max(50, 100 - excess * 5)
  }
}

function calculateSalaryAlignment(
  profile: ProfileFrontmatter,
  job: JobFrontmatter,
): number {
  const profileRange = profile.salary_range
  const jobComp = job.compensation

  if (!profileRange || !jobComp) {
    return 50 // neutral when unknown
  }

  const profileMin = profileRange.min || 0
  const profileMax = profileRange.max || Infinity
  const jobMin = jobComp.min || 0
  const jobMax = jobComp.max || Infinity

  // Check overlap between ranges
  if (jobMax !== Infinity && profileMin > jobMax) {
    // Profile expects more than job offers
    const gap = profileMin - jobMax
    const maxSalary = Math.max(profileMin, jobMax, 1)
    return Math.max(0, Math.round(100 - (gap / maxSalary) * 100))
  }

  if (profileMax !== Infinity && jobMin > profileMax) {
    // Job pays more than profile max — this is actually good
    return 90
  }

  // There's overlap
  return 100
}

function calculateLocationMatch(
  profile: ProfileFrontmatter,
  job: JobFrontmatter,
): boolean {
  const preferredLocations = profile.preferred_locations
  const jobLocation = job.location

  if (!preferredLocations || preferredLocations.length === 0 || !jobLocation) {
    return true // no preference or no job location = match
  }

  const jobLoc = jobLocation.toLowerCase()
  return preferredLocations.some((loc) => jobLoc.includes(loc.toLowerCase()))
}

function calculateRemoteMatch(
  profile: ProfileFrontmatter,
  job: JobFrontmatter,
): boolean {
  const remotePref = profile.remote_preference
  const jobRemote = job.remote

  if (!remotePref || !jobRemote) {
    return true // no preference or no info = match
  }

  switch (remotePref) {
    case "remote_only":
      return jobRemote === "remote"
    case "onsite":
      return jobRemote === "onsite"
    case "hybrid":
      return jobRemote === "hybrid" || jobRemote === "remote"
    case "remote_ok":
    case "flexible":
      return true // any arrangement works
    default:
      return true
  }
}
