"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { MatchBreakdown } from "@/lib/match-scoring"
import { Check, X, Minus } from "lucide-react"

interface MatchTooltipProps {
  breakdown: MatchBreakdown
  children: React.ReactNode
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

function DimensionRow({
  label,
  score,
  detail,
}: {
  label: string
  score: number
  detail: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] font-medium text-text-secondary">
          {label}
        </span>
        <span className={`text-[0.65rem] font-semibold ${scoreColor(score)}`}>
          {score}%
        </span>
      </div>
      <div className="h-1 bg-surface-overlay rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[0.6rem] text-text-muted leading-tight">{detail}</p>
    </div>
  )
}

function SkillsPills({
  matched,
  missing,
}: {
  matched: string[]
  missing: string[]
}) {
  const total = matched.length + missing.length
  if (total === 0) return null

  // Show at most 6 skills in the tooltip to keep it compact
  const maxShow = 6
  const skills = [
    ...matched.slice(0, maxShow).map((s) => ({ name: s, type: "matched" as const })),
    ...missing
      .slice(0, Math.max(0, maxShow - matched.length))
      .map((s) => ({ name: s, type: "missing" as const })),
  ]

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {skills.map((skill) => (
        <span
          key={skill.name}
          className={`inline-flex items-center gap-0.5 text-[0.6rem] px-1.5 py-0.5 rounded ${
            skill.type === "matched"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-400/10 text-red-400"
          }`}
        >
          {skill.type === "matched" ? (
            <Check className="w-2 h-2" />
          ) : (
            <X className="w-2 h-2" />
          )}
          {skill.name}
        </span>
      ))}
      {total > maxShow && (
        <span className="text-[0.6rem] text-text-muted px-1">
          +{total - maxShow} more
        </span>
      )}
    </div>
  )
}

export function MatchTooltip({ breakdown, children }: MatchTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<"above" | "below">("above")
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const adjustPosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    // If less than 320px above, position below
    setPosition(rect.top < 320 ? "below" : "above")
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    adjustPosition()
    setIsOpen(true)
  }, [adjustPosition])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const { skills, experience, salary, location, remote } = breakdown.dimensions

  return (
    <div
      className="relative inline-flex"
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isOpen && (
        <div
          ref={tooltipRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute z-50 w-[250px] bg-surface-raised border border-border-default rounded-xl shadow-lg p-3 space-y-2.5 ${
            position === "above"
              ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
              : "top-full mt-2 left-1/2 -translate-x-1/2"
          }`}
        >
          {/* Overall score */}
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
            <div
              className={`text-lg font-semibold ${scoreColor(breakdown.overall)}`}
            >
              {breakdown.overall}%
            </div>
            <span className="text-[0.65rem] text-text-muted font-prose">
              Match Score
            </span>
          </div>

          {/* Dimensions */}
          <DimensionRow
            label={skills.label}
            score={skills.score}
            detail={skills.detail}
          />
          <SkillsPills
            matched={skills.breakdown.matched}
            missing={skills.breakdown.missing}
          />

          <DimensionRow
            label={experience.label}
            score={experience.score}
            detail={experience.detail}
          />

          <DimensionRow
            label={salary.label}
            score={salary.score}
            detail={salary.detail}
          />

          <DimensionRow
            label={location.label}
            score={location.score}
            detail={location.detail}
          />

          <DimensionRow
            label={remote.label}
            score={remote.score}
            detail={remote.detail}
          />

          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-raised border-border-default rotate-45 ${
              position === "above"
                ? "bottom-[-5px] border-r border-b"
                : "top-[-5px] border-l border-t"
            }`}
          />
        </div>
      )}
    </div>
  )
}
