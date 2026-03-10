"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"

const messages = [
  {
    from: "agent",
    text: "Good morning! I found 3 new roles that match your profile.",
    time: "9:02 AM",
  },
  {
    from: "agent",
    text: "**Staff Engineer** at Figma - Remote, $200-260k, 95% fit.\n**Senior Frontend** at Linear - SF, $180-220k, 87% fit.\n**Product Engineer** at Vercel - Remote, $160-200k, 82% fit.",
    time: "9:02 AM",
  },
  {
    from: "user",
    text: "The Figma one looks great. Apply for me?",
    time: "9:14 AM",
  },
  {
    from: "agent",
    text: "On it. I'll tailor your resume to highlight your design systems work and submit through the network.",
    time: "9:14 AM",
  },
  {
    from: "agent",
    text: "Applied to Figma - Staff Engineer. Your application is in their pipeline. I'll notify you when there's movement.",
    time: "9:15 AM",
  },
]

function AgentPreview() {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    messages.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 800 + i * 1000))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="w-full max-w-[480px]">
      <div className="bg-surface-raised rounded-2xl overflow-hidden border border-border-default glow-accent">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-surface-overlay border-b border-border-subtle">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-text-primary text-sm font-medium">TalentClaw Agent</div>
            <div className="text-accent text-xs">active</div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-2.5 min-h-[380px]">
          {messages.slice(0, visibleCount).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              style={{ animation: "chat-appear 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-[0.82rem] leading-[1.55] ${
                  msg.from === "user"
                    ? "bg-accent/20 text-text-primary rounded-br-sm border border-accent/30"
                    : "bg-surface-overlay text-text-primary rounded-bl-sm border border-border-subtle"
                }`}
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent-hover">$1</strong>')
                      .replace(/\n/g, "<br />"),
                  }}
                />
                <span className="text-[0.6rem] text-text-muted ml-2 float-right mt-1">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {visibleCount > 0 && visibleCount < messages.length && (
            <div className="flex justify-start">
              <div className="bg-surface-overlay px-4 py-2.5 rounded-xl rounded-bl-sm flex gap-[5px] items-center border border-border-subtle">
                {[0, 0.2, 0.4].map((delay) => (
                  <div
                    key={delay}
                    className="w-[6px] h-[6px] rounded-full bg-text-muted"
                    style={{
                      animation: "typing-dot 1.2s ease-in-out infinite",
                      animationDelay: `${delay}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="px-5 pt-24 pb-20 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-violet/5 blur-[120px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left - copy */}
        <div className="flex flex-col items-start text-left">
          <div className="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-subtle border border-accent/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">AI-Powered Career Agent</span>
          </div>

          <h1 className="reveal reveal-delay-1 text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-[1.08] tracking-[-0.03em] max-w-[560px] mb-6">
            Your career, <br />
            <span className="gradient-text">on autopilot.</span>
          </h1>

          <p className="reveal reveal-delay-2 text-text-secondary text-[clamp(1rem,2vw,1.15rem)] max-w-[480px] mb-8 leading-relaxed">
            TalentClaw discovers jobs, manages your pipeline, and handles applications
            so you can focus on what matters -- making decisions, not doing busywork.
          </p>

          <div className="reveal reveal-delay-3 flex flex-col sm:flex-row gap-3">
            <a
              href="https://github.com/artemyshq/talentclaw#install"
              className="inline-flex items-center justify-center gap-2 bg-accent text-white px-8 py-3.5 rounded-full font-semibold text-[0.95rem] hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.3)] transition-all"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 text-text-secondary px-6 py-3.5 rounded-full font-medium text-[0.95rem] hover:text-text-primary border border-border-default hover:border-border-subtle transition-all"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Right - agent preview */}
        <div className="reveal reveal-delay-2 flex justify-center lg:justify-end">
          <AgentPreview />
        </div>
      </div>
    </section>
  )
}
