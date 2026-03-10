"use client"

import Link from "next/link"
import { Cog } from "lucide-react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export default function DashboardPage() {
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
            <span className="text-sm font-medium text-text-primary">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pipeline"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Pipeline
            </Link>
            <Link
              href="/jobs"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Jobs
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-5 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-1">Dashboard</h1>
          <p className="text-sm text-text-secondary">Your career search at a glance.</p>
        </div>

        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>

          {/* Upcoming deadlines */}
          <div>
            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-5">Upcoming Deadlines</h3>
              <div className="space-y-4">
                {[
                  { title: "System design round", company: "Airbnb", date: "Mar 12", urgent: true },
                  { title: "Follow up on application", company: "Datadog", date: "Mar 14", urgent: false },
                  { title: "Take-home assignment due", company: "Linear", date: "Mar 18", urgent: false },
                ].map((deadline) => (
                  <div key={deadline.title} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      deadline.urgent ? "bg-warning" : "bg-accent"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">
                        {deadline.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        {deadline.company} &middot; {deadline.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 mt-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/jobs"
                  className="block w-full text-left px-4 py-3 rounded-xl bg-surface-overlay border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
                >
                  Browse new jobs
                </Link>
                <Link
                  href="/pipeline"
                  className="block w-full text-left px-4 py-3 rounded-xl bg-surface-overlay border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
                >
                  View pipeline
                </Link>
                <button className="block w-full text-left px-4 py-3 rounded-xl bg-surface-overlay border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors cursor-pointer">
                  Check inbox messages
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
