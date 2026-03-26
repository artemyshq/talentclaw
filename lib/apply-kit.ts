import type { ProfileFrontmatter, ApplicationFile } from "./types"
import { formatCompensation } from "./ui-utils"

export interface ScreeningAnswer {
  question: string
  answer: string
  source: string
}

/** Derive common screening Q&A from profile data. Only includes answers where the profile has data. */
export function buildScreeningAnswers(profile: ProfileFrontmatter): ScreeningAnswer[] {
  const answers: ScreeningAnswer[] = []

  if (profile.experience_years != null) {
    answers.push({
      question: "How many years of professional experience do you have?",
      answer: `${profile.experience_years} years`,
      source: "profile.experience_years",
    })
  }

  if (profile.salary_range) {
    const { min, max, currency } = profile.salary_range
    const rangeStr = formatCompensation({ min, max })
    if (rangeStr) {
      answers.push({
        question: "What are your salary expectations?",
        answer: currency ? `${rangeStr} ${currency}` : rangeStr,
        source: "profile.salary_range",
      })
    }
  }

  if (profile.remote_preference) {
    const labels: Record<string, string> = {
      remote_only: "Remote only",
      remote_ok: "Open to remote",
      hybrid: "Hybrid",
      onsite: "On-site",
      flexible: "Flexible",
    }
    answers.push({
      question: "What is your preferred work arrangement?",
      answer: labels[profile.remote_preference] || profile.remote_preference,
      source: "profile.remote_preference",
    })
  }

  if (profile.preferred_locations && profile.preferred_locations.length > 0) {
    answers.push({
      question: "Are you willing to relocate? / Preferred locations?",
      answer: profile.preferred_locations.join(", "),
      source: "profile.preferred_locations",
    })
  }

  if (profile.availability) {
    const labels: Record<string, string> = {
      active: "Actively looking",
      passive: "Open to opportunities",
      not_looking: "Not currently looking",
    }
    answers.push({
      question: "What is your current availability?",
      answer: labels[profile.availability] || profile.availability,
      source: "profile.availability",
    })
  }

  return answers
}

/** Find an existing application for a given job slug. */
export function findApplicationForJob(
  applications: ApplicationFile[],
  jobSlug: string,
): ApplicationFile | undefined {
  return applications.find((app) => app.frontmatter.job === jobSlug)
}
