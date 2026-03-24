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
  discovered: { bg: "bg-[#78716c]/10", text: "text-[#78716c]" },
  saved: { bg: "bg-[#5a7ea6]/10", text: "text-[#5a7ea6]" },
  applied: { bg: "bg-accent-subtle", text: "text-accent" },
  interviewing: { bg: "bg-[#8b6aaf]/10", text: "text-[#8b6aaf]" },
  offer: { bg: "bg-[#c2820e]/10", text: "text-[#c2820e]" },
  accepted: { bg: "bg-[#1a8c80]/10", text: "text-[#1a8c80]" },
  rejected: { bg: "bg-[#b85c5c]/10", text: "text-[#b85c5c]" },
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

// Stage hex colors for inline styles (pill thermometers, etc.)
// Warm, muted palette — editorial feel, no repeated hues
export const STAGE_HEX: Record<string, string> = {
  discovered: "#78716c",   // warm stone
  saved: "#5a7ea6",        // dusty slate blue
  applied: "#059669",      // brand emerald (accent)
  interviewing: "#8b6aaf", // muted wisteria
  offer: "#c2820e",        // deep honey gold
  accepted: "#1a8c80",     // warm teal
  rejected: "#b85c5c",     // dusty clay rose
}

// Stage visual theme — single source of truth for dot + border colors
// Uses full Tailwind class strings (required for Tailwind v4 content scanning)
export const STAGE_THEME: Record<string, { dot: string; border: string }> = {
  discovered: { dot: "bg-[#78716c]", border: "border-l-[#78716c]" },
  saved: { dot: "bg-[#5a7ea6]", border: "border-l-[#5a7ea6]" },
  applied: { dot: "bg-accent", border: "border-l-accent" },
  interviewing: { dot: "bg-[#8b6aaf]", border: "border-l-[#8b6aaf]" },
  offer: { dot: "bg-[#c2820e]", border: "border-l-[#c2820e]" },
  accepted: { dot: "bg-[#1a8c80]", border: "border-l-[#1a8c80]" },
  rejected: { dot: "bg-[#b85c5c]", border: "border-l-[#b85c5c]" },
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
  discovered: "bg-[#78716c]/12 text-[#78716c] border-[#78716c]/20",
  saved: "bg-[#5a7ea6]/10 text-[#5a7ea6] border-[#5a7ea6]/20",
  applied: "bg-accent-subtle text-accent border-accent/20",
  interviewing: "bg-[#8b6aaf]/10 text-[#8b6aaf] border-[#8b6aaf]/20",
  offer: "bg-[#c2820e]/10 text-[#c2820e] border-[#c2820e]/20",
  accepted: "bg-[#1a8c80]/10 text-[#1a8c80] border-[#1a8c80]/20",
  rejected: "bg-[#b85c5c]/10 text-[#b85c5c] border-[#b85c5c]/20",
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

// Day label for grouping: "Today", "Yesterday", or formatted date
export function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (target.getTime() === today.getTime()) return "Today"
  if (target.getTime() === yesterday.getTime()) return "Yesterday"

  const opts: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear()
      ? { month: "long", day: "numeric" }
      : { month: "long", day: "numeric", year: "numeric" }
  return date.toLocaleDateString("en-US", opts)
}
