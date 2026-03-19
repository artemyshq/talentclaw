import type { ProfileFrontmatter, JobFrontmatter } from "./types"

export interface MatchDimension {
  label: string
  score: number // 0–100
  detail: string // human-readable explanation
}

export interface SkillsBreakdown {
  matched: string[]
  missing: string[]
  extra: string[] // skills you have that the job doesn't list
}

export interface MatchBreakdown {
  overall: number
  dimensions: {
    skills: MatchDimension & { breakdown: SkillsBreakdown }
    experience: MatchDimension & { yourYears: number | null; requiredYears: number | null }
    salary: MatchDimension & { yourRange: { min?: number; max?: number } | null; offeredRange: { min?: number; max?: number } | null }
    location: MatchDimension
    remote: MatchDimension
    careerTrajectory?: MatchDimension
    cultureFit?: MatchDimension
  }
}

/**
 * Calculates a detailed match breakdown between a user profile and a job listing.
 * Uses the job's existing match_score as the overall score if available,
 * and derives dimensional scores from available data.
 */
export function calculateMatchBreakdown(
  profile: ProfileFrontmatter,
  job: JobFrontmatter
): MatchBreakdown {
  const skillsResult = calculateSkillsMatch(profile, job)
  const experienceResult = calculateExperienceMatch(profile, job)
  const salaryResult = calculateSalaryMatch(profile, job)
  const locationResult = calculateLocationMatch(profile, job)
  const remoteResult = calculateRemoteMatch(profile, job)

  // If the job has a stored match_score, use it; otherwise compute from dimensions
  const overall =
    job.match_score ??
    Math.round(
      skillsResult.score * 0.35 +
        experienceResult.score * 0.25 +
        salaryResult.score * 0.2 +
        locationResult.score * 0.1 +
        remoteResult.score * 0.1
    )

  return {
    overall,
    dimensions: {
      skills: skillsResult,
      experience: experienceResult,
      salary: salaryResult,
      location: locationResult,
      remote: remoteResult,
    },
  }
}

function normalizeSkill(s: string): string {
  return s.toLowerCase().trim()
}

function calculateSkillsMatch(
  profile: ProfileFrontmatter,
  job: JobFrontmatter
): MatchDimension & { breakdown: SkillsBreakdown } {
  const profileSkills = (profile.skills || []).map(normalizeSkill)
  const jobSkills = (job.tags || []).map(normalizeSkill)

  if (jobSkills.length === 0) {
    return {
      label: "Skills",
      score: 100,
      detail: "No specific skills listed",
      breakdown: { matched: [], missing: [], extra: profileSkills },
    }
  }

  const profileSkillSet = new Set(profileSkills)
  const jobSkillSet = new Set(jobSkills)

  const matched = jobSkills.filter((s) => profileSkillSet.has(s))
  const missing = jobSkills.filter((s) => !profileSkillSet.has(s))
  const extra = profileSkills.filter((s) => !jobSkillSet.has(s))

  const score = jobSkills.length > 0 ? Math.round((matched.length / jobSkills.length) * 100) : 100

  // Use original casing from the source arrays
  const originalJobTags = job.tags || []
  const originalProfileSkills = profile.skills || []

  const matchedOriginal = originalJobTags.filter((s) =>
    profileSkillSet.has(normalizeSkill(s))
  )
  const missingOriginal = originalJobTags.filter(
    (s) => !profileSkillSet.has(normalizeSkill(s))
  )
  const extraOriginal = originalProfileSkills.filter(
    (s) => !jobSkillSet.has(normalizeSkill(s))
  )

  const detail =
    matched.length === jobSkills.length
      ? `All ${jobSkills.length} skills matched`
      : `${matched.length} of ${jobSkills.length} skills matched`

  return {
    label: "Skills",
    score,
    detail,
    breakdown: {
      matched: matchedOriginal,
      missing: missingOriginal,
      extra: extraOriginal,
    },
  }
}

function calculateExperienceMatch(
  profile: ProfileFrontmatter,
  job: JobFrontmatter
): MatchDimension & { yourYears: number | null; requiredYears: number | null } {
  const yourYears = profile.experience_years ?? null

  // Try to extract required years from the job title or tags (heuristic)
  // For now, we don't have a dedicated field, so estimate from seniority keywords
  let requiredYears: number | null = null
  const titleLower = (job.title || "").toLowerCase()
  if (titleLower.includes("senior") || titleLower.includes("sr.") || titleLower.includes("sr ")) {
    requiredYears = 5
  } else if (titleLower.includes("staff") || titleLower.includes("principal")) {
    requiredYears = 8
  } else if (titleLower.includes("lead")) {
    requiredYears = 6
  } else if (titleLower.includes("junior") || titleLower.includes("jr.") || titleLower.includes("jr ")) {
    requiredYears = 1
  } else if (titleLower.includes("entry")) {
    requiredYears = 0
  }

  if (yourYears === null || requiredYears === null) {
    return {
      label: "Experience",
      score: 75, // neutral when we can't assess
      detail: yourYears !== null ? `${yourYears} years experience` : "Experience not specified",
      yourYears,
      requiredYears,
    }
  }

  let score: number
  if (yourYears >= requiredYears) {
    score = 100
  } else {
    const gap = requiredYears - yourYears
    score = Math.max(0, Math.round(100 - gap * 20))
  }

  const detail =
    yourYears >= requiredYears
      ? `${yourYears}y experience meets ${requiredYears}y requirement`
      : `${yourYears}y experience, ${requiredYears}y preferred`

  return { label: "Experience", score, detail, yourYears, requiredYears }
}

function calculateSalaryMatch(
  profile: ProfileFrontmatter,
  job: JobFrontmatter
): MatchDimension & {
  yourRange: { min?: number; max?: number } | null
  offeredRange: { min?: number; max?: number } | null
} {
  const yourRange = profile.salary_range
    ? { min: profile.salary_range.min ?? undefined, max: profile.salary_range.max ?? undefined }
    : null
  const offeredRange = job.compensation
    ? { min: job.compensation.min ?? undefined, max: job.compensation.max ?? undefined }
    : null

  if (!yourRange || !offeredRange) {
    return {
      label: "Salary",
      score: 75,
      detail: !offeredRange ? "Compensation not listed" : "Your range not set",
      yourRange,
      offeredRange,
    }
  }

  const yourMin = yourRange.min ?? 0
  const yourMax = yourRange.max ?? Infinity
  const offMin = offeredRange.min ?? 0
  const offMax = offeredRange.max ?? Infinity

  // Check overlap
  const hasOverlap = yourMin <= offMax && offMin <= yourMax
  if (!hasOverlap) {
    const detail = yourMin > offMax ? "Offered below your range" : "Offered above your range"
    return { label: "Salary", score: 20, detail, yourRange, offeredRange }
  }

  // Full containment of your range within offered
  if (offMin <= yourMin && offMax >= yourMax) {
    return {
      label: "Salary",
      score: 100,
      detail: "Fully within your target range",
      yourRange,
      offeredRange,
    }
  }

  return {
    label: "Salary",
    score: 70,
    detail: "Partial overlap with your range",
    yourRange,
    offeredRange,
  }
}

function calculateLocationMatch(
  profile: ProfileFrontmatter,
  job: JobFrontmatter
): MatchDimension {
  const preferredLocations = (profile.preferred_locations || []).map((l) =>
    l.toLowerCase().trim()
  )
  const jobLocation = (job.location || "").toLowerCase().trim()

  if (!jobLocation || preferredLocations.length === 0) {
    return {
      label: "Location",
      score: 75,
      detail: !jobLocation ? "Location not specified" : "No location preference set",
    }
  }

  const isMatch = preferredLocations.some(
    (loc) => jobLocation.includes(loc) || loc.includes(jobLocation)
  )

  return {
    label: "Location",
    score: isMatch ? 100 : 40,
    detail: isMatch ? `Matches your preferred location` : `${job.location} not in your preferences`,
  }
}

function calculateRemoteMatch(
  profile: ProfileFrontmatter,
  job: JobFrontmatter
): MatchDimension {
  const pref = profile.remote_preference
  const jobRemote = job.remote

  if (!pref || !jobRemote) {
    return {
      label: "Remote",
      score: 75,
      detail: !jobRemote ? "Remote policy not listed" : "No remote preference set",
    }
  }

  // Compatibility matrix
  const compatible: Record<string, string[]> = {
    remote_only: ["remote"],
    remote_ok: ["remote", "hybrid"],
    hybrid: ["hybrid", "remote"],
    onsite: ["onsite", "hybrid"],
    flexible: ["remote", "hybrid", "onsite"],
  }

  const isMatch = (compatible[pref] || []).includes(jobRemote)

  const prefLabels: Record<string, string> = {
    remote_only: "Remote only",
    remote_ok: "Remote OK",
    hybrid: "Hybrid",
    onsite: "On-site",
    flexible: "Flexible",
  }

  return {
    label: "Remote",
    score: isMatch ? 100 : 30,
    detail: isMatch
      ? `${jobRemote} matches your ${prefLabels[pref] || pref} preference`
      : `${jobRemote} doesn't match your ${prefLabels[pref] || pref} preference`,
  }
}
