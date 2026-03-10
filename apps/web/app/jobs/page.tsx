"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Cog,
  Search,
  MapPin,
  DollarSign,
  Wifi,
  Building2,
  Bookmark,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react"
import { SearchBar } from "@/components/query/search-bar"
import { Filters } from "@/components/query/filters"

interface JobListing {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  compensationMin: number | null
  compensationMax: number | null
  skills: string[]
  matchScore: number | null
  postedDate: string
  source: string
}

// Demo data
const demoJobs: JobListing[] = [
  {
    id: "j1",
    title: "Staff Engineer",
    company: "Figma",
    location: "Remote",
    remote: true,
    compensationMin: 200000,
    compensationMax: 260000,
    skills: ["TypeScript", "React", "Design Systems"],
    matchScore: 95,
    postedDate: "2d ago",
    source: "coffeeshop",
  },
  {
    id: "j2",
    title: "Senior Frontend Engineer",
    company: "Linear",
    location: "San Francisco, CA",
    remote: false,
    compensationMin: 180000,
    compensationMax: 220000,
    skills: ["TypeScript", "React", "Performance"],
    matchScore: 87,
    postedDate: "3d ago",
    source: "coffeeshop",
  },
  {
    id: "j3",
    title: "Product Engineer",
    company: "Vercel",
    location: "Remote",
    remote: true,
    compensationMin: 160000,
    compensationMax: 200000,
    skills: ["Next.js", "TypeScript", "Serverless"],
    matchScore: 82,
    postedDate: "1d ago",
    source: "coffeeshop",
  },
  {
    id: "j4",
    title: "Principal Engineer",
    company: "Stripe",
    location: "Remote / SF",
    remote: true,
    compensationMin: 250000,
    compensationMax: 350000,
    skills: ["Distributed Systems", "TypeScript", "APIs"],
    matchScore: 91,
    postedDate: "5d ago",
    source: "coffeeshop",
  },
  {
    id: "j5",
    title: "Engineering Manager, Frontend",
    company: "Notion",
    location: "New York, NY",
    remote: false,
    compensationMin: 200000,
    compensationMax: 280000,
    skills: ["React", "Leadership", "Architecture"],
    matchScore: 78,
    postedDate: "1w ago",
    source: "coffeeshop",
  },
  {
    id: "j6",
    title: "Senior Software Engineer",
    company: "Datadog",
    location: "Remote",
    remote: true,
    compensationMin: 170000,
    compensationMax: 230000,
    skills: ["TypeScript", "Go", "Observability"],
    matchScore: 85,
    postedDate: "4d ago",
    source: "coffeeshop",
  },
]

function formatComp(min: number | null, max: number | null): string {
  if (!min && !max) return "Not listed"
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`
  if (min && max) return `${fmt(min)} - ${fmt(max)}`
  if (min) return `${fmt(min)}+`
  return `Up to ${fmt(max!)}`
}

export default function JobsPage() {
  const [jobs] = useState<JobListing[]>(demoJobs)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.skills.some((s) => s.toLowerCase().includes(q))
    )
  })

  const toggleSave = (id: string) => {
    setSavedJobs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-[1200px] mx-auto px-5 flex items-center justify-between h-14">
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
            <span className="text-sm font-medium text-text-primary">Jobs</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/pipeline"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Pipeline
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-5 py-8">
        {/* Search & Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                showFilters
                  ? "border-accent/40 bg-accent-subtle text-accent"
                  : "border-border-default bg-surface-raised text-text-secondary hover:border-accent/30"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
          {showFilters && <Filters />}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-text-muted">
            {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} found
          </p>
          <p className="text-xs text-text-muted">
            Source: Coffee Shop Network
          </p>
        </div>

        {/* Job listings */}
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-surface-raised rounded-xl p-5 border border-border-subtle hover:border-accent/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-accent-hover transition-colors">
                      {job.title}
                    </h3>
                    {job.matchScore !== null && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        job.matchScore >= 90
                          ? "bg-emerald-500/10 text-emerald-400"
                          : job.matchScore >= 80
                            ? "bg-accent-subtle text-accent"
                            : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {job.matchScore}% match
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                    {job.remote && (
                      <span className="flex items-center gap-1.5 text-accent">
                        <Wifi className="w-3.5 h-3.5" />
                        Remote
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatComp(job.compensationMin, job.compensationMax)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-1 rounded-md bg-surface-overlay text-text-secondary border border-border-subtle"
                      >
                        {skill}
                      </span>
                    ))}
                    <span className="text-xs text-text-muted ml-2">{job.postedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleSave(job.id)}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      savedJobs.has(job.id)
                        ? "border-accent/40 bg-accent-subtle text-accent"
                        : "border-border-default bg-surface-overlay text-text-muted hover:text-accent hover:border-accent/30"
                    }`}
                    title="Save to pipeline"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-lg border border-border-default bg-surface-overlay text-text-muted hover:text-text-primary hover:border-border-default transition-colors cursor-pointer"
                    title="View details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-sm">No jobs match your search.</p>
            <p className="text-text-muted text-xs mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}
      </main>
    </div>
  )
}
