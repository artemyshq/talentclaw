"use client"

import type { MatchBreakdown } from "@/lib/match-scoring"
import { formatCompensation } from "@/lib/ui-utils"
import { Check, X, Minus, User, Briefcase } from "lucide-react"

interface HowYouCompareProps {
  breakdown: MatchBreakdown
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400"
  if (score >= 80) return "text-accent"
  return "text-amber-400"
}

function scoreBgColor(score: number): string {
  if (score >= 90) return "bg-emerald-500/10"
  if (score >= 80) return "bg-accent-subtle"
  return "bg-amber-500/10"
}

function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-red-400"
}

function StatusIcon({ status }: { status: "match" | "miss" | "neutral" }) {
  if (status === "match") {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-emerald-400" />
      </div>
    )
  }
  if (status === "miss") {
    return (
      <div className="w-5 h-5 rounded-full bg-red-400/10 flex items-center justify-center shrink-0">
        <X className="w-3 h-3 text-red-400" />
      </div>
    )
  }
  return (
    <div className="w-5 h-5 rounded-full bg-surface-overlay flex items-center justify-center shrink-0">
      <Minus className="w-3 h-3 text-text-muted" />
    </div>
  )
}

function SkillsComparison({
  matched,
  missing,
  extra,
}: {
  matched: string[]
  missing: string[]
  extra: string[]
}) {
  return (
    <div className="space-y-3">
      {/* Matched skills */}
      {matched.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-1.5">Matched skills</p>
          <div className="flex flex-wrap gap-1.5">
            {matched.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                <Check className="w-3 h-3" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing skills */}
      {missing.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-1.5">Missing skills</p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-400/10 text-red-400 border border-red-400/20"
              >
                <X className="w-3 h-3" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Extra skills (yours, not required) */}
      {extra.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-1.5">Your additional skills</p>
          <div className="flex flex-wrap gap-1.5">
            {extra.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-surface-overlay text-text-muted border border-border-subtle"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {matched.length === 0 && missing.length === 0 && (
        <p className="text-xs text-text-muted">No skill requirements listed</p>
      )}
    </div>
  )
}

function ComparisonRow({
  label,
  yourValue,
  jobValue,
  score,
}: {
  label: string
  yourValue: string
  jobValue: string
  score: number
}) {
  const status: "match" | "miss" | "neutral" =
    score >= 80 ? "match" : score >= 50 ? "neutral" : "miss"

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
      {/* Your profile */}
      <div className="text-right">
        <p className="text-xs text-text-secondary">{yourValue}</p>
      </div>

      {/* Status icon */}
      <StatusIcon status={status} />

      {/* Job requirement */}
      <div>
        <p className="text-xs text-text-secondary">{jobValue}</p>
      </div>
    </div>
  )
}

export function HowYouCompare({ breakdown }: HowYouCompareProps) {
  const { skills, experience, salary, location, remote } = breakdown.dimensions

  const expYour = experience.yourYears !== null ? `${experience.yourYears} years` : "Not set"
  const expJob =
    experience.requiredYears !== null ? `${experience.requiredYears}+ years` : "Not specified"

  const salaryYour = salary.yourRange
    ? formatCompensation({
        min: salary.yourRange.min ?? null,
        max: salary.yourRange.max ?? null,
      }) || "Not set"
    : "Not set"
  const salaryJob = salary.offeredRange
    ? formatCompensation({
        min: salary.offeredRange.min ?? null,
        max: salary.offeredRange.max ?? null,
      }) || "Not listed"
    : "Not listed"

  const remoteLabels: Record<string, string> = {
    remote_only: "Remote only",
    remote_ok: "Remote OK",
    hybrid: "Hybrid",
    onsite: "On-site",
    flexible: "Flexible",
  }

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-prose text-lg text-text-primary">How You Compare</h2>
        <div
          className={`text-sm font-semibold px-2.5 py-1 rounded-full ${scoreBgColor(breakdown.overall)} ${scoreColor(breakdown.overall)}`}
        >
          {breakdown.overall}% match
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 pb-2 border-b border-border-subtle">
        <div className="flex items-center justify-end gap-1.5 text-xs text-text-muted">
          <User className="w-3 h-3" />
          Your Profile
        </div>
        <div className="w-5" /> {/* spacer for icon column */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Briefcase className="w-3 h-3" />
          Job Requirements
        </div>
      </div>

      {/* Skills section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-text-primary">Skills</h3>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-surface-overlay rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor(skills.score)}`}
                style={{ width: `${skills.score}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${scoreColor(skills.score)}`}>
              {skills.score}%
            </span>
          </div>
        </div>
        <SkillsComparison
          matched={skills.breakdown.matched}
          missing={skills.breakdown.missing}
          extra={skills.breakdown.extra}
        />
      </div>

      {/* Experience */}
      <div className="space-y-2 pt-3 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-text-primary">Experience</h3>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-surface-overlay rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor(experience.score)}`}
                style={{ width: `${experience.score}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${scoreColor(experience.score)}`}>
              {experience.score}%
            </span>
          </div>
        </div>
        <ComparisonRow
          label="Experience"
          yourValue={expYour}
          jobValue={expJob}
          score={experience.score}
        />
      </div>

      {/* Salary */}
      <div className="space-y-2 pt-3 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-text-primary">Compensation</h3>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-surface-overlay rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor(salary.score)}`}
                style={{ width: `${salary.score}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${scoreColor(salary.score)}`}>
              {salary.score}%
            </span>
          </div>
        </div>
        <ComparisonRow
          label="Salary"
          yourValue={salaryYour}
          jobValue={salaryJob}
          score={salary.score}
        />
      </div>

      {/* Location & Remote */}
      <div className="space-y-2 pt-3 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-text-primary">Location & Remote</h3>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-surface-overlay rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor(Math.round((location.score + remote.score) / 2))}`}
                style={{ width: `${Math.round((location.score + remote.score) / 2)}%` }}
              />
            </div>
            <span
              className={`text-xs font-medium ${scoreColor(Math.round((location.score + remote.score) / 2))}`}
            >
              {Math.round((location.score + remote.score) / 2)}%
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <StatusIcon status={location.score >= 80 ? "match" : location.score >= 50 ? "neutral" : "miss"} />
            <p className="text-xs text-text-secondary">{location.detail}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon status={remote.score >= 80 ? "match" : remote.score >= 50 ? "neutral" : "miss"} />
            <p className="text-xs text-text-secondary">{remote.detail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
