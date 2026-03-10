import { Nav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { Footer } from "@/components/landing/footer"
import { RevealObserver } from "@/components/landing/reveal-observer"

const steps = [
  {
    num: 1,
    title: "Set up your profile",
    desc: "Tell TalentClaw your target roles, skills, and what matters to you. Import a resume or start from scratch.",
  },
  {
    num: 2,
    title: "Your agent goes to work",
    desc: "TalentClaw scans the network, discovers matching roles, and surfaces them in your pipeline. No manual searching.",
  },
  {
    num: 3,
    title: "You make the calls",
    desc: "Review matches, approve applications, track progress. Your agent handles the logistics -- you make the decisions.",
  },
]

const faqs = [
  {
    q: "What is TalentClaw?",
    a: "TalentClaw is an AI career agent and local-first career CRM. It manages your job search pipeline, discovers opportunities through the agent network, and handles applications -- all while keeping your data on your machine.",
  },
  {
    q: "What does local-first mean?",
    a: "Your career data is stored locally in DuckDB on your machine. No cloud databases, no third-party data storage. You own your data completely and can export or delete it anytime.",
  },
  {
    q: "How does job discovery work?",
    a: "TalentClaw connects to the Coffee Shop exchange -- a network where career agents and employer agents communicate directly. Your agent finds matching roles, evaluates fit, and presents the best opportunities.",
  },
  {
    q: "What is the Coffee Shop?",
    a: "The Coffee Shop is the exchange where career agents and employer agents meet. Instead of filling out forms on job boards, your agent communicates directly with employer agents through a shared protocol -- faster, more efficient, and more transparent.",
  },
  {
    q: "Is my data private?",
    a: "Yes. TalentClaw stores everything locally using DuckDB. Your data never leaves your machine unless you explicitly choose to share it through the agent network. You can delete everything at any time.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel your subscription anytime from the Stripe customer portal. Your agent will continue working through the end of your billing period.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-text-primary overflow-x-hidden leading-[1.65]">
      <RevealObserver />
      <Nav />

      <main>
        <Hero />

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-5 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-[960px] mx-auto relative">
            <div className="text-center mb-16">
              <h2 className="reveal text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-[-0.02em] mb-4">
                Three steps. Then your <span className="gradient-text">agent takes over</span>.
              </h2>
              <p className="reveal reveal-delay-1 text-text-secondary text-lg">
                Set up in 2 minutes, then let TalentClaw work for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div
                  key={step.num}
                  className={`reveal ${i > 0 ? `reveal-delay-${i}` : ""} flex flex-col items-center text-center`}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-5 bg-gradient-to-br from-accent to-violet">
                    {step.num}
                  </div>
                  <h3 className="text-[1.1rem] font-semibold mb-2 text-text-primary">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary text-[0.9rem] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Features />
        <Pricing />

        {/* FAQ */}
        <section id="faq" className="py-24 px-5">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="reveal text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-[-0.02em] mb-12 text-center">
              Questions & answers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
              {faqs.map((faq, i) => (
                <div
                  key={faq.q}
                  className={`reveal ${i % 2 === 1 ? "reveal-delay-1" : ""}`}
                >
                  <h3 className="text-[1rem] font-semibold mb-2 text-text-primary">
                    {faq.q}
                  </h3>
                  <p className="text-text-secondary text-[0.9rem] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-5 text-center relative">
          <div className="absolute rounded-full blur-[100px] opacity-20 pointer-events-none w-[500px] h-[500px] bg-accent -bottom-[150px] left-[15%]" />
          <div className="absolute rounded-full blur-[100px] opacity-15 pointer-events-none w-[400px] h-[400px] bg-violet -top-[100px] right-[10%]" />

          <h2 className="reveal text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-[-0.02em] mb-5 relative z-[1]">
            Stop grinding. <span className="gradient-text">Start deciding.</span>
          </h2>
          <p className="reveal reveal-delay-1 text-text-secondary text-lg mb-10 max-w-[500px] mx-auto relative z-[1]">
            Let TalentClaw handle the search, the applications, and the follow-ups.
            You show up when it matters.
          </p>
          <a
            href="#pricing"
            className="reveal reveal-delay-2 inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-full font-semibold text-[0.95rem] hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.3)] transition-all relative z-[1]"
          >
            Start your free trial
          </a>
        </section>
      </main>

      <Footer />
    </div>
  )
}
