import {
  Sparkles,
  Mail,
  Calendar,
  TrendingUp,
} from "lucide-react"
import type { BriefingResult } from "@/lib/analytics"
import { getGreeting, formatBriefDate } from "@/lib/ui-utils"

interface MorningBriefingProps {
  briefing: BriefingResult
}

const actionTypeIcons: Record<string, React.ReactNode> = {
  interview: <Calendar className="w-3.5 h-3.5 text-violet-500" />,
  "follow-up": <Mail className="w-3.5 h-3.5 text-blue-500" />,
  deadline: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
}

export function MorningBriefing({ briefing }: MorningBriefingProps) {
  const hasAnyData =
    briefing.newJobs > 0 ||
    briefing.unreadMessages > 0 ||
    briefing.upcomingActions.length > 0

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="font-prose text-lg text-text-primary">
            {getGreeting()}
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            Your career snapshot
          </p>
        </div>
      </div>

      {!hasAnyData ? (
        <p className="text-sm text-text-muted py-2">
          Nothing to report yet. Start by adding jobs to your pipeline.
        </p>
      ) : (
        <div className="space-y-3">
          <BriefingRow
            icon={<TrendingUp className="w-4 h-4 text-accent" />}
            value={briefing.newJobs}
            label={briefing.newJobs === 1 ? "new job this week" : "new jobs this week"}
            accent={briefing.newJobs > 0}
          />

          <BriefingRow
            icon={<Mail className="w-4 h-4 text-blue-500" />}
            value={briefing.unreadMessages}
            label={briefing.unreadMessages === 1 ? "unread message" : "unread messages"}
            accent={briefing.unreadMessages > 0}
          />

          {briefing.upcomingActions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border-subtle">
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2.5">
                Coming up
              </p>
              <div className="space-y-2">
                {briefing.upcomingActions.slice(0, 3).map((action, i) => (
                  <div
                    key={`${action.title}-${i}`}
                    className="flex items-center gap-2.5 py-1.5"
                  >
                    <div className="shrink-0">
                      {actionTypeIcons[action.type] || (
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">
                        {action.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatBriefDate(action.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BriefingRow({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode
  value: number
  label: string
  accent: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-8 h-8 rounded-lg bg-surface-overlay flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-lg font-semibold ${
            accent ? "text-text-primary" : "text-text-muted"
          }`}
        >
          {value}
        </span>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
    </div>
  )
}
