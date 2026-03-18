import {
  PIPELINE_STAGES,
  type JobFile,
  type ApplicationFile,
  type ActivityEntry,
  type ThreadFrontmatter,
  type ProfileFrontmatter,
  type ProfileCompletenessResult,
} from "./types"

// --- Funnel ---

export interface FunnelResult {
  stages: Record<string, number>
  conversions: Record<string, number> // e.g. "discovered→saved": 0.45
}

export function calculateFunnel(jobs: JobFile[]): FunnelResult {
  const stages: Record<string, number> = {}
  for (const stage of PIPELINE_STAGES) {
    stages[stage] = 0
  }
  for (const job of jobs) {
    const status = job.frontmatter.status
    if (status in stages) {
      stages[status]++
    }
  }

  // Calculate conversion ratios between adjacent stages
  const conversions: Record<string, number> = {}
  for (let i = 0; i < PIPELINE_STAGES.length - 1; i++) {
    const from = PIPELINE_STAGES[i]
    const to = PIPELINE_STAGES[i + 1]
    const fromCount = stages[from]
    // "to" count is cumulative — anyone who reached that stage or beyond
    let toCount = 0
    for (let j = i + 1; j < PIPELINE_STAGES.length; j++) {
      toCount += stages[PIPELINE_STAGES[j]]
    }
    conversions[`${from}\u2192${to}`] = fromCount > 0 ? toCount / fromCount : 0
  }

  return { stages, conversions }
}

// --- Time in Stage ---

export interface TimeInStageResult {
  averageDays: Record<string, number>
}

export function calculateTimeInStage(
  jobs: JobFile[],
  activityLog: ActivityEntry[],
): TimeInStageResult {
  const stageDurations: Record<string, number[]> = {}
  for (const stage of PIPELINE_STAGES) {
    stageDurations[stage] = []
  }

  // Build timeline per job from activity log
  for (const job of jobs) {
    const slug = job.slug
    const jobEvents = activityLog
      .filter((e) => e.slug === slug && e.type === "status_changed")
      .sort(
        (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
      )

    for (let i = 0; i < jobEvents.length - 1; i++) {
      const current = jobEvents[i]
      const next = jobEvents[i + 1]
      // Extract stage from summary: "Moved slug to <stage>"
      const stageMatch = current.summary.match(/to (\w+)$/)
      if (stageMatch) {
        const stage = stageMatch[1]
        const days =
          (new Date(next.ts).getTime() - new Date(current.ts).getTime()) /
          (1000 * 60 * 60 * 24)
        if (stage in stageDurations) {
          stageDurations[stage].push(days)
        }
      }
    }
  }

  const averageDays: Record<string, number> = {}
  for (const [stage, durations] of Object.entries(stageDurations)) {
    if (durations.length > 0) {
      averageDays[stage] =
        Math.round(
          (durations.reduce((a, b) => a + b, 0) / durations.length) * 10,
        ) / 10
    } else {
      averageDays[stage] = 0
    }
  }

  return { averageDays }
}

// --- Dashboard Briefing ---

export interface BriefingResult {
  newJobs: number
  unreadMessages: number
  upcomingActions: Array<{ title: string; date: string; type: string }>
}

export function generateBriefing(
  jobs: JobFile[],
  applications: ApplicationFile[],
  threads: Array<{ threadId: string; frontmatter: ThreadFrontmatter }>,
  profile: ProfileFrontmatter,
): BriefingResult {
  // Count jobs discovered in the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const newJobs = jobs.filter((j) => {
    const discovered = j.frontmatter.discovered_at
    if (!discovered) return false
    return new Date(discovered) >= sevenDaysAgo
  }).length

  // Count unread threads
  const unreadMessages = threads.filter((t) => t.frontmatter.unread).length

  // Collect upcoming actions from applications with next_step_date
  const upcomingActions: Array<{ title: string; date: string; type: string }> =
    []
  for (const app of applications) {
    if (app.frontmatter.next_step && app.frontmatter.next_step_date) {
      upcomingActions.push({
        title: app.frontmatter.next_step,
        date: app.frontmatter.next_step_date,
        type: "application",
      })
    }
  }

  // Sort by date ascending
  upcomingActions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  return { newJobs, unreadMessages, upcomingActions }
}

// --- Profile Completeness ---

export function calculateCompleteness(
  profile: ProfileFrontmatter,
): ProfileCompletenessResult {
  const fields: Array<{
    key: keyof ProfileFrontmatter
    label: string
    suggestion: string
  }> = [
    {
      key: "display_name",
      label: "display name",
      suggestion: "Add your name so employers know who you are",
    },
    {
      key: "headline",
      label: "headline",
      suggestion:
        "Write a headline that summarizes your professional identity",
    },
    {
      key: "skills",
      label: "skills",
      suggestion: "List your key skills to improve job matching",
    },
    {
      key: "experience_years",
      label: "experience years",
      suggestion: "Add your total years of experience",
    },
    {
      key: "preferred_roles",
      label: "preferred roles",
      suggestion: "Specify the roles you're targeting",
    },
    {
      key: "preferred_locations",
      label: "preferred locations",
      suggestion: "Set your location preferences for better matches",
    },
    {
      key: "remote_preference",
      label: "remote preference",
      suggestion: "Indicate your remote work preference",
    },
    {
      key: "salary_range",
      label: "salary range",
      suggestion: "Set your salary expectations for alignment scoring",
    },
    {
      key: "experience",
      label: "experience",
      suggestion: "Add your work history for stronger match analysis",
    },
    {
      key: "education",
      label: "education",
      suggestion: "Include your education background",
    },
  ]

  const missing: string[] = []
  const suggestions: string[] = []

  for (const field of fields) {
    const value = profile[field.key]
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)

    if (isEmpty) {
      missing.push(field.label)
      suggestions.push(field.suggestion)
    }
  }

  const filled = fields.length - missing.length
  const percentage = Math.round((filled / fields.length) * 100)

  return { percentage, missing, suggestions }
}
