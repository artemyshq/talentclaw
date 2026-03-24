import type { PipelineStage } from "./types"
import { PIPELINE_STAGES } from "./types"

// Shared date formatting for file viewer headers
export function formatDate(
  d: unknown,
  options?: { includeTime?: boolean; monthFormat?: "short" | "long" }
): string | null {
  if (typeof d !== "string") return null
  try {
    const opts: Intl.DateTimeFormatOptions = {
      month: options?.monthFormat ?? "short",
      day: "numeric",
      year: "numeric",
    }
    if (options?.includeTime) {
      opts.hour = "numeric"
      opts.minute = "2-digit"
    }
    return new Date(d).toLocaleDateString("en-US", opts)
  } catch {
    return String(d)
  }
}

// Status badge colors shared across file viewer headers
export const STATUS_COLORS: Record<PipelineStage, { bg: string; text: string }> = {
  discovered: { bg: "bg-slate-100", text: "text-slate-700" },
  saved: { bg: "bg-blue-100", text: "text-blue-700" },
  applied: { bg: "bg-emerald-100", text: "text-emerald-700" },
  interviewing: { bg: "bg-violet-100", text: "text-violet-700" },
  offer: { bg: "bg-emerald-100", text: "text-emerald-700" },
  accepted: { bg: "bg-green-100", text: "text-green-700" },
  rejected: { bg: "bg-red-100", text: "text-red-700" },
}

// XSS prevention: only allow http/https URLs
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

// Relative time formatting (e.g. "5m ago", "3h ago", "Yesterday", "7d ago")
export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  return `${days}d ago`
}

// Compensation range formatting (e.g. "$120k – $180k", "$100k+", "Up to $150k")
export function formatCompensation(
  comp: { min?: number | null; max?: number | null }
): string | null {
  const min = typeof comp.min === "number" ? comp.min : null
  const max = typeof comp.max === "number" ? comp.max : null
  if (min === null && max === null) return null
  const fmt = (n: number) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}k`
    return `$${n}`
  }
  if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)}`
  if (min !== null) return `${fmt(min)}+`
  if (max !== null) return `Up to ${fmt(max)}`
  return null
}

// Human-readable pipeline stage labels
export const STAGE_LABELS: Record<string, string> = {
  discovered: "Discovered",
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
}

// Stage visual theme — single source of truth for dot + border colors
// Uses full Tailwind class strings (required for Tailwind v4 content scanning)
export const STAGE_THEME: Record<string, { dot: string; border: string }> = {
  discovered: { dot: "bg-slate-500", border: "border-l-slate-500" },
  saved: { dot: "bg-blue-500", border: "border-l-blue-500" },
  applied: { dot: "bg-accent", border: "border-l-accent" },
  interviewing: { dot: "bg-violet-500", border: "border-l-violet-500" },
  offer: { dot: "bg-emerald-500", border: "border-l-emerald-500" },
  accepted: { dot: "bg-green-500", border: "border-l-green-500" },
  rejected: { dot: "bg-red-500", border: "border-l-red-500" },
}

// Brief date formatting for briefing cards
export function formatBriefDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

// Time-of-day greeting
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

// Stage pill colors for pipeline funnel badges
export const STAGE_PILL_COLORS: Record<string, string> = {
  discovered: "bg-slate-500/15 text-slate-600 border-slate-200",
  saved: "bg-blue-500/10 text-blue-600 border-blue-200",
  applied: "bg-accent-subtle text-accent border-accent/20",
  interviewing: "bg-violet-500/10 text-violet-600 border-violet-200",
  offer: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  accepted: "bg-green-500/10 text-green-600 border-green-200",
  rejected: "bg-red-500/10 text-red-500 border-red-200",
}

// Pipeline stages excluding rejected (for funnel display)
export const FUNNEL_STAGES = PIPELINE_STAGES.filter((s) => s !== "rejected")

// Match score badge color classes
export function matchScoreClass(score: number): string {
  if (score >= 90) return "bg-emerald-500/10 text-emerald-400"
  if (score >= 75) return "bg-accent-subtle text-accent"
  return "bg-amber-500/10 text-amber-400"
}

// Score text color (shared across match-tooltip and how-you-compare)
export function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400"
  if (score >= 80) return "text-accent"
  return "text-amber-400"
}

// Score background color
export function scoreBgColor(score: number): string {
  if (score >= 90) return "bg-emerald-500/10"
  if (score >= 80) return "bg-accent-subtle"
  return "bg-amber-500/10"
}

// Progress bar color
export function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-red-400"
}

// Simple pluralization: pluralize(n, "job") → "job" | "jobs"
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}
