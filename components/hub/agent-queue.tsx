"use client"

import { barColor } from "@/lib/ui-utils"
import { approveApplication, rejectApplication } from "@/app/actions/graph"
import type { ApplicationFile, JobFile } from "@/lib/types"

interface QueueItem {
  application: ApplicationFile
  job: JobFile | null
}

interface AgentQueueProps {
  items: QueueItem[]
}

export function AgentQueue({ items }: AgentQueueProps) {
  if (items.length === 0) return null

  const visible = items.slice(0, 3)
  const hasMore = items.length > 3

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-prose text-lg text-text-primary">
          {items.length} {items.length === 1 ? "application" : "applications"} ready for review
        </h3>
        {hasMore && (
          <span className="text-xs text-accent hover:text-accent-hover transition-colors cursor-pointer">
            View all &rarr;
          </span>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {visible.map((item) => (
          <QueueCard key={item.application.slug} item={item} />
        ))}
      </div>
    </>
  )
}

function QueueCard({ item }: { item: QueueItem }) {
  const { application, job } = item
  const confidence = application.frontmatter.confidence_score ?? 0
  const companyName = job?.frontmatter.company ?? application.frontmatter.job
  const jobTitle = job?.frontmatter.title ?? "Unknown position"

  return (
    <div className="bg-surface-overlay rounded-xl p-4 min-w-[260px] max-w-[320px] shrink-0">
      <p className="text-xs text-text-muted">{companyName}</p>
      <p className="text-sm font-medium text-text-primary mt-0.5 truncate">{jobTitle}</p>

      {/* Confidence bar */}
      <div className="mt-3">
        <div
          className="h-1.5 rounded-full bg-surface-overlay overflow-hidden"
          role="progressbar"
          aria-valuenow={confidence}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Confidence: ${confidence}%`}
        >
          <div
            className={`h-full rounded-full ${barColor(confidence)}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <p className="text-[11px] text-text-muted mt-1">{confidence}% confidence</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => approveApplication(application.slug)}
          className="flex-1 bg-accent text-white rounded-md min-h-[44px] text-sm font-medium transition-colors hover:bg-accent-hover"
          aria-label={`Approve application for ${jobTitle} at ${companyName}`}
        >
          Approve
        </button>
        <button
          onClick={() => rejectApplication(application.slug)}
          className="flex-1 bg-surface-overlay text-text-secondary border border-border-default rounded-md min-h-[44px] text-sm font-medium transition-colors hover:text-text-primary"
          aria-label={`Review application for ${jobTitle} at ${companyName}`}
        >
          Review
        </button>
      </div>
    </div>
  )
}
