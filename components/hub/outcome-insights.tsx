import type { ApplicationFile, JobFile } from "@/lib/types"
import { PROGRESSED_STATUSES } from "@/lib/types"

interface OutcomeInsightsProps {
  applications: ApplicationFile[]
  jobMap: Map<string, JobFile>
}

export function OutcomeInsights({ applications, jobMap }: OutcomeInsightsProps) {
  const appCount = applications.length

  if (appCount === 0) {
    return (
      <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
        <h3 className="font-prose text-lg text-text-primary">
          Apply to jobs to start learning
        </h3>
        <p className="text-sm text-text-secondary mt-2">
          As you search, apply, and interview, your agent builds a picture of what works for you.
          Insights will appear here once you have enough history.
        </p>
      </div>
    )
  }

  // Derive insights from application + job data
  const insights = deriveInsights(applications, jobMap)

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <h3 className="font-prose text-lg text-text-primary">
        What your agent learned
      </h3>
      <div className="mt-3 space-y-3">
        {insights.map((insight, i) => (
          <p key={i} className="text-sm text-text-secondary leading-relaxed">
            {insight}
          </p>
        ))}
      </div>
      <p className="text-[11px] text-text-muted mt-4">
        Based on {appCount} {appCount === 1 ? "application" : "applications"}
      </p>
    </div>
  )
}

function deriveInsights(applications: ApplicationFile[], jobMap: Map<string, JobFile>): string[] {
  const insights: string[] = []

  // Interview conversion
  const interviewing = applications.filter((a) =>
    (PROGRESSED_STATUSES as readonly string[]).includes(a.frontmatter.status)
  )
  if (applications.length >= 3) {
    const rate = Math.round((interviewing.length / applications.length) * 100)
    insights.push(
      `${rate}% of your applications have progressed to interviews or beyond.`
    )
  }

  // Top companies by response
  const companiesWithResponse = new Set<string>()
  for (const app of interviewing) {
    const job = jobMap.get(app.frontmatter.job)
    if (job) companiesWithResponse.add(job.frontmatter.company)
  }
  if (companiesWithResponse.size > 0) {
    const names = Array.from(companiesWithResponse).slice(0, 3).join(", ")
    insights.push(
      `Companies that responded well: ${names}.`
    )
  }

  // Remote vs onsite preference signal
  const allJobs = Array.from(jobMap.values())
  const remoteJobs = allJobs.filter((j) => j.frontmatter.remote === "remote")
  const onsiteJobs = allJobs.filter((j) => j.frontmatter.remote === "onsite")
  if (remoteJobs.length > onsiteJobs.length * 2 && remoteJobs.length >= 3) {
    insights.push(
      "You tend to gravitate toward remote roles. Your agent will prioritize these."
    )
  }

  if (insights.length === 0) {
    insights.push(
      "Keep applying and your agent will surface patterns about what roles and companies are the best fit."
    )
  }

  return insights.slice(0, 3)
}
