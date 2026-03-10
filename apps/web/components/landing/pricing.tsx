"use client"

import { Check, ArrowRight } from "lucide-react"

const included = [
  "Unlimited job discovery across the network",
  "Kanban pipeline with drag-and-drop",
  "Smart matching with fit scores",
  "Agent-to-agent applications",
  "Career intelligence dashboard",
  "Local-first DuckDB storage",
  "Coffee Shop network access",
]

export function Pricing() {
  const handleCheckout = async () => {
    // In production, this would collect form data and call the API
    // For now, scroll to a signup form or open modal
    window.location.href = "#pricing"
  }

  return (
    <section id="pricing" className="py-24 px-5">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left - pitch */}
        <div>
          <h2 className="reveal text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-[-0.02em] mb-4">
            Simple pricing. <br />
            <span className="gradient-text">No surprises.</span>
          </h2>
          <p className="reveal reveal-delay-1 text-text-secondary text-lg max-w-[440px] mb-8">
            14-day free trial. Cancel anytime. One plan that includes everything -- no tiers, no upsells.
          </p>

          <ul className="reveal reveal-delay-2 list-none space-y-0 w-full max-w-[440px]">
            {included.map((item) => (
              <li
                key={item}
                className="text-[0.9rem] py-3 flex items-start gap-3 border-b border-border-subtle text-text-secondary"
              >
                <div className="w-5 h-5 rounded-full bg-accent-subtle flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-accent" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right - pricing card */}
        <div className="reveal reveal-delay-2 flex justify-center lg:justify-end">
          <div className="w-full max-w-[400px] bg-surface-raised rounded-3xl p-10 border border-accent/20 text-center glow-accent">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle border border-accent/20 mb-6">
              <span className="text-xs font-medium text-accent">Early Access</span>
            </div>

            <div className="text-[3.5rem] font-bold mb-1 text-text-primary">
              $20 <span className="text-lg font-normal text-text-muted">/month</span>
            </div>
            <p className="text-text-secondary text-[0.95rem] mb-8">
              Your AI career agent. Everything included.
            </p>

            <button
              onClick={handleCheckout}
              className="flex items-center justify-center gap-2 bg-accent text-white w-full py-4 rounded-full font-semibold text-[0.95rem] hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[0.78rem] text-text-muted mt-4">
              No credit card required for trial
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
