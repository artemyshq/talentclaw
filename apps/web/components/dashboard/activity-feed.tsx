"use client"

import {
  Search,
  Send,
  MessageSquare,
  CheckCircle,
  Bookmark,
  Star,
} from "lucide-react"

interface Activity {
  id: string
  type: "discovered" | "applied" | "message" | "saved" | "interview" | "offer"
  title: string
  description: string
  time: string
}

const activities: Activity[] = [
  {
    id: "act1",
    type: "discovered",
    title: "New match found",
    description: "Staff Engineer at Figma - 95% fit score",
    time: "2 hours ago",
  },
  {
    id: "act2",
    type: "applied",
    title: "Application submitted",
    description: "Senior Software Engineer at Datadog via Coffee Shop",
    time: "5 hours ago",
  },
  {
    id: "act3",
    type: "message",
    title: "Employer response",
    description: "Airbnb recruiter wants to schedule system design round",
    time: "Yesterday",
  },
  {
    id: "act4",
    type: "interview",
    title: "Interview scheduled",
    description: "Staff Frontend Engineer at Airbnb - System design, Mar 12",
    time: "Yesterday",
  },
  {
    id: "act5",
    type: "saved",
    title: "Job saved to pipeline",
    description: "Principal Engineer at Stripe - 91% match",
    time: "2 days ago",
  },
  {
    id: "act6",
    type: "discovered",
    title: "3 new matches",
    description: "Linear, Vercel, and Notion roles matching your profile",
    time: "3 days ago",
  },
  {
    id: "act7",
    type: "applied",
    title: "Application submitted",
    description: "Engineering Manager at Notion via Coffee Shop",
    time: "5 days ago",
  },
]

const activityIcons: Record<string, React.ReactNode> = {
  discovered: <Search className="w-4 h-4" />,
  applied: <Send className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  saved: <Bookmark className="w-4 h-4" />,
  interview: <Star className="w-4 h-4" />,
  offer: <CheckCircle className="w-4 h-4" />,
}

const activityColors: Record<string, string> = {
  discovered: "bg-accent-subtle text-accent",
  applied: "bg-violet-subtle text-violet",
  message: "bg-emerald-500/10 text-emerald-400",
  saved: "bg-blue-500/10 text-blue-400",
  interview: "bg-amber-500/10 text-amber-400",
  offer: "bg-green-500/10 text-green-400",
}

export function ActivityFeed() {
  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-5">Recent Activity</h3>

      <div className="space-y-1">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3.5 py-3 border-b border-border-subtle last:border-0"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activityColors[activity.type] || "bg-surface-overlay text-text-muted"}`}>
              {activityIcons[activity.type]}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{activity.title}</p>
              <p className="text-xs text-text-secondary mt-0.5 truncate">{activity.description}</p>
            </div>

            <span className="text-xs text-text-muted shrink-0 whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
