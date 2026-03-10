"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Cog, ArrowLeft, Plus } from "lucide-react"
import { KanbanBoard } from "@/components/kanban/board"
import { PIPELINE_STAGES } from "@/lib/schema"
import type { KanbanCardData } from "@/components/kanban/card"

// Demo data for initial render
const demoData: Record<string, KanbanCardData[]> = {
  discovered: [
    {
      id: "d1",
      title: "Staff Engineer",
      company: "Figma",
      appliedDate: null,
      nextAction: "Review job posting",
      matchScore: 95,
    },
    {
      id: "d2",
      title: "Senior Frontend Engineer",
      company: "Linear",
      appliedDate: null,
      nextAction: "Check requirements",
      matchScore: 87,
    },
    {
      id: "d3",
      title: "Product Engineer",
      company: "Vercel",
      appliedDate: null,
      nextAction: null,
      matchScore: 82,
    },
  ],
  saved: [
    {
      id: "s1",
      title: "Principal Engineer",
      company: "Stripe",
      appliedDate: null,
      nextAction: "Tailor resume",
      matchScore: 91,
    },
  ],
  applied: [
    {
      id: "a1",
      title: "Engineering Manager",
      company: "Notion",
      appliedDate: "Mar 5",
      nextAction: "Awaiting response",
      matchScore: 78,
    },
    {
      id: "a2",
      title: "Senior Software Engineer",
      company: "Datadog",
      appliedDate: "Mar 3",
      nextAction: "Follow up in 5 days",
      matchScore: 85,
    },
  ],
  interviewing: [
    {
      id: "i1",
      title: "Staff Frontend Engineer",
      company: "Airbnb",
      appliedDate: "Feb 28",
      nextAction: "System design round - Mar 12",
      matchScore: 88,
    },
  ],
  offer: [],
  accepted: [],
  rejected: [],
}

export default function PipelinePage() {
  const [data, setData] = useState<Record<string, KanbanCardData[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Load from DuckDB via API route
    // For now, use demo data
    const initial: Record<string, KanbanCardData[]> = {}
    for (const stage of PIPELINE_STAGES) {
      initial[stage] = demoData[stage] || []
    }
    setData(initial)
    setLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-[1800px] mx-auto px-5 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
                <Cog className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight text-text-primary">
                TalentClaw
              </span>
            </Link>
            <span className="text-text-muted">/</span>
            <span className="text-sm font-medium text-text-primary">Pipeline</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/jobs"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Jobs
            </Link>
            <button className="flex items-center gap-1.5 bg-accent text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              Add Job
            </button>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="p-5 max-w-[1800px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-text-muted text-sm">Loading pipeline...</div>
          </div>
        ) : (
          <KanbanBoard initialData={data} />
        )}
      </main>
    </div>
  )
}
