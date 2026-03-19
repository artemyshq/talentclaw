import {
  listJobs,
  listApplications,
  getActivityLog,
  getProfile,
} from "@/lib/fs-data"
import { buildTimelineData } from "@/lib/timeline-data"
import { generateBriefing, calculateCompleteness, computeMomentum } from "@/lib/analytics"
import { PIPELINE_STAGES } from "@/lib/types"
import { ProfileCard } from "@/components/hub/profile-card"
import { MorningBriefing } from "@/components/hub/morning-briefing"
import { ActivityFeed } from "@/components/hub/activity-feed"
import { UpcomingActions } from "@/components/hub/upcoming-actions"
import { AgentQueue } from "@/components/hub/agent-queue"
import { OutcomeInsights } from "@/components/hub/outcome-insights"
import CareerGraphWrapper from "@/components/graph/career-graph-wrapper"

export default async function DashboardPage() {
  const [jobs, applications, activityLog, profile] = await Promise.all([
    listJobs(),
    listApplications(),
    getActivityLog(50),
    getProfile(),
  ])

  const timelineData = buildTimelineData(profile.frontmatter)

  const isFirstRun =
    !profile.frontmatter.display_name && !profile.frontmatter.headline

  // Stage counts
  const stageCounts: Record<string, number> = {}
  for (const stage of PIPELINE_STAGES) {
    stageCounts[stage] = 0
  }
  for (const job of jobs) {
    const stage = job.frontmatter.status
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++
    }
  }

  // Upcoming actions from applications
  const upcomingActions = applications
    .filter(
      (app) => app.frontmatter.next_step && app.frontmatter.next_step_date
    )
    .map((app) => ({
      title: app.frontmatter.next_step!,
      company: app.slug,
      date: app.frontmatter.next_step_date!,
      urgent: isWithinDays(app.frontmatter.next_step_date!, 3),
      overdue: isOverdue(app.frontmatter.next_step_date!),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  // Analytics
  const briefing = generateBriefing({ jobs, applications, threads: [], profile: profile.frontmatter, activityLog })
  const completeness = calculateCompleteness(profile.frontmatter)
  const momentum = computeMomentum(jobs, applications, activityLog)

  // Agent queue — applications with workflow_status "queued" or "review_required"
  const jobMap = new Map(jobs.map((j) => [j.slug, j]))
  const queueItems = applications
    .filter((app) =>
      app.frontmatter.workflow_status === "queued" ||
      app.frontmatter.workflow_status === "review_required"
    )
    .map((app) => ({
      application: app,
      job: jobMap.get(app.frontmatter.job) ?? null,
    }))

  return (
    <div className="p-6 max-w-6xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto space-y-6">
      {/* Profile Card */}
      <ProfileCard
        profile={profile.frontmatter}
        isFirstRun={isFirstRun}
        stageCounts={stageCounts}
        briefing={briefing}
        completeness={completeness}
        momentum={momentum}
      />

      {/* Agent Queue (conditional — hidden when empty) */}
      {queueItems.length > 0 && <AgentQueue items={queueItems} />}

      {/* Briefing + Outcome Insights (2-col on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MorningBriefing briefing={briefing} applicationCount={applications.length} />
        <OutcomeInsights applications={applications} jobMap={jobMap} />
      </div>

      {/* Career Timeline (if data exists) */}
      {timelineData.length > 0 && (
        <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden h-[480px] xl:h-[560px] 2xl:h-[640px]">
          <CareerGraphWrapper branches={timelineData} />
        </div>
      )}

      {/* Activity Feed + Upcoming Actions (2-col on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed entries={activityLog} />
        <UpcomingActions actions={upcomingActions} />
      </div>
    </div>
  )
}

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now()
}
