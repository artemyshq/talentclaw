"use client"

import {
  Briefcase,
  Send,
  MessageSquare,
  TrendingUp,
} from "lucide-react"

interface StatCard {
  label: string
  value: string
  change: string
  changeType: "up" | "down" | "neutral"
  icon: React.ReactNode
  color: string
}

const stats: StatCard[] = [
  {
    label: "Total Opportunities",
    value: "24",
    change: "+6 this week",
    changeType: "up",
    icon: <Briefcase className="w-5 h-5" />,
    color: "from-accent to-violet",
  },
  {
    label: "Applications Sent",
    value: "8",
    change: "+2 this week",
    changeType: "up",
    icon: <Send className="w-5 h-5" />,
    color: "from-violet to-purple-500",
  },
  {
    label: "Response Rate",
    value: "62%",
    change: "+8% vs last month",
    changeType: "up",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "from-emerald-500 to-teal-500",
  },
  {
    label: "Interviewing",
    value: "3",
    change: "1 this week",
    changeType: "neutral",
    icon: <TrendingUp className="w-5 h-5" />,
    color: "from-amber-500 to-orange-500",
  },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface-raised rounded-2xl p-5 border border-border-subtle hover:border-accent/20 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
              {stat.icon}
            </div>
          </div>

          <div className="text-2xl font-bold text-text-primary mb-1">
            {stat.value}
          </div>
          <div className="text-sm text-text-secondary mb-2">{stat.label}</div>
          <div className={`text-xs font-medium ${
            stat.changeType === "up"
              ? "text-emerald-400"
              : stat.changeType === "down"
                ? "text-red-400"
                : "text-text-muted"
          }`}>
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  )
}
