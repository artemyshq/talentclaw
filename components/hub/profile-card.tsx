import Link from "next/link"
import { CrabLogo } from "@/components/crab-logo"
import { STAGE_LABELS, STAGE_PILL_COLORS, FUNNEL_STAGES, getGreeting, formatBriefDate } from "@/lib/ui-utils"
import type { ProfileFrontmatter, ProfileCompletenessResult } from "@/lib/types"
import type { BriefingResult } from "@/lib/analytics"
import { ResumeUpload } from "@/components/profile/resume-upload"
import { ProfileOptimizeButton } from "./profile-optimize-button"
import { TrendingUp, Mail, Calendar } from "lucide-react"

interface ProfileCardProps {
  profile: ProfileFrontmatter
  isFirstRun: boolean
  stageCounts: Record<string, number>
  briefing?: BriefingResult
  completeness?: ProfileCompletenessResult
}

export function ProfileCard({
  profile,
  isFirstRun,
  stageCounts,
  briefing,
  completeness,
}: ProfileCardProps) {
  if (isFirstRun) {
    return (
      <div className="bg-surface-raised rounded-2xl border border-border-subtle p-8">
        <div className="flex items-center gap-4 mb-6">
          <CrabLogo className="w-12 h-12 text-accent" />
          <div>
            <h2 className="font-prose text-xl text-text-primary">
              Welcome to talentclaw
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Let&apos;s set up your career hub.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <OnboardingStep
            step={1}
            title="Build your profile"
            description="Talk to your agent — it'll ask the right questions and set everything up."
          />
          <OnboardingStep
            step={2}
            title="Connect to Coffee Shop"
            description="Your agent will register you automatically. Just start a conversation."
          />
          <OnboardingStep
            step={3}
            title="Add jobs to your pipeline"
            description="Run talentclaw search to discover jobs, or ask your agent."
          />
        </div>
        <ResumeUpload />
      </div>
    )
  }

  const total = Object.values(stageCounts).reduce((a, b) => a + b, 0)
  const hasUpcoming = briefing && briefing.upcomingActions.length > 0
  const showCompleteness = completeness && completeness.percentage < 100

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      {/* Top row: greeting + actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-prose text-xl text-text-primary">
            {getGreeting()}, {profile.display_name}
          </h2>
          {profile.headline && (
            <p className="text-sm text-text-secondary mt-1">{profile.headline}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ProfileOptimizeButton />
          <Link
            href="/pipeline"
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            View pipeline &rarr;
          </Link>
        </div>
      </div>

      {/* Pipeline funnel pills */}
      <div className="mt-4">
        {total === 0 ? (
          <p className="text-sm text-text-muted py-2">
            No jobs in your pipeline yet.
          </p>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FUNNEL_STAGES.map((stage, i) => {
              const count = stageCounts[stage] || 0
              return (
                <div key={stage} className="flex items-center gap-1.5 shrink-0">
                  {i > 0 && (
                    <div className="text-text-muted/40 text-xs">&rarr;</div>
                  )}
                  <Link
                    href="/pipeline"
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:opacity-80 ${
                      count > 0
                        ? STAGE_PILL_COLORS[stage]
                        : "bg-surface-overlay text-text-muted border-border-subtle"
                    }`}
                  >
                    {STAGE_LABELS[stage]} {count}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Briefing + completeness row */}
      {(briefing || showCompleteness) && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {/* Briefing stats */}
            {briefing && (
              <>
                <BriefingStat
                  icon={<TrendingUp className="w-3.5 h-3.5 text-accent" />}
                  value={briefing.newJobs}
                  label={briefing.newJobs === 1 ? "new job" : "new jobs"}
                />
                <BriefingStat
                  icon={<Mail className="w-3.5 h-3.5 text-blue-500" />}
                  value={briefing.unreadMessages}
                  label="unread"
                />
              </>
            )}

            {/* Completeness */}
            {showCompleteness && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${completeness.percentage}%` }}
                  />
                </div>
                <Link
                  href="/profile"
                  className="text-xs text-text-muted hover:text-accent transition-colors"
                >
                  Profile {completeness.percentage}%
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming actions (compact) */}
          {hasUpcoming && (
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
              {briefing.upcomingActions.slice(0, 3).map((action, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-text-muted" />
                  <span className="text-xs text-text-secondary">
                    {action.title}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatBriefDate(action.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BriefingStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={`text-sm font-semibold ${value > 0 ? "text-text-primary" : "text-text-muted"}`}>
        {value}
      </span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  )
}

function OnboardingStep({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3.5 bg-surface-overlay rounded-xl p-4">
      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent shrink-0">
        {step}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}

