"use client"

import {
  Kanban,
  Search,
  GitBranch,
  Network,
  Shield,
  BarChart3,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Feature {
  icon: LucideIcon
  title: string
  desc: string
  gradient: string
}

const features: Feature[] = [
  {
    icon: Kanban,
    title: "Career CRM",
    desc: "Track every opportunity from discovery to offer in a local-first pipeline. Drag, drop, and never lose track of where you stand.",
    gradient: "from-accent to-violet",
  },
  {
    icon: Search,
    title: "Job Discovery",
    desc: "Your agent scans the network and surfaces roles that match your skills, experience, and preferences. No noise, only signal.",
    gradient: "from-violet to-purple-500",
  },
  {
    icon: GitBranch,
    title: "Application Pipeline",
    desc: "Manage applications across stages -- from discovered to offer. See your next steps, deadlines, and match reasoning at a glance.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Network,
    title: "Agent-to-Agent Network",
    desc: "Connected to the Coffee Shop exchange where career agents meet employer agents. Direct protocol-level communication, not job board forms.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Shield,
    title: "Local-First Privacy",
    desc: "Your data lives on your machine in DuckDB. No cloud databases, no data selling. You own your career data completely.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Career Intelligence",
    desc: "Application stats, response rates, market positioning, and growth paths -- informed by your pipeline and live market data.",
    gradient: "from-teal-500 to-cyan-500",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 px-5">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="reveal text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-[-0.02em] mb-4">
            Everything you need to <span className="gradient-text">own your search</span>
          </h2>
          <p className="reveal reveal-delay-1 text-text-secondary text-lg max-w-[520px] mx-auto">
            Six capabilities that work together so you can focus on decisions, not logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className={`reveal ${
                  i % 3 === 1 ? "reveal-delay-1" : i % 3 === 2 ? "reveal-delay-2" : ""
                } group relative bg-surface-raised rounded-2xl p-7 border border-border-subtle hover:border-accent/30 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(99,102,241,0.08)] transition-all duration-300`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[1.1rem] font-semibold mb-2 text-text-primary">
                  {f.title}
                </h3>
                <p className="text-text-secondary text-[0.9rem] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
