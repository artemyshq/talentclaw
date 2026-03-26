"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Download,
  MapPin,
  Wifi,
  DollarSign,
  Building2,
} from "lucide-react"
import { CopyField } from "./copy-field"
import { markAsApplied, exportResumePdf } from "@/app/actions/apply-kit"
import { matchScoreClass } from "@/lib/ui-utils"
import type { ScreeningAnswer } from "@/lib/apply-kit"
import type { AtsCustomQuestion, AtsPlatform } from "@/lib/ats/types"

export interface ApplyKitData {
  jobSlug: string
  jobTitle: string
  company: string
  jobUrl: string | null
  matchScore: number | null
  location: string | null
  remote: string | null
  compensation: string | null
  tags: string[]

  // Contact info from profile
  displayName: string
  email: string
  phone: string
  linkedinUrl: string
  githubUrl: string
  websiteUrl: string

  // Headline & summary
  headline: string
  careerSummary: string

  // Cover letter (from application content or empty)
  coverLetter: string

  // Screening answers
  screeningAnswers: ScreeningAnswer[]

  // ATS
  atsPlatform: AtsPlatform | null
  atsCustomQuestions: AtsCustomQuestion[]

  // Resume
  resumeVariantSlug: string | null
  resumePdfExists: boolean

  // Application status
  alreadyApplied: boolean
}

export function ApplyKitPage({ data }: { data: ApplyKitData }) {
  const [applyState, setApplyState] = useState<"idle" | "loading" | "done" | "error">(
    data.alreadyApplied ? "done" : "idle"
  )
  const [applyError, setApplyError] = useState("")
  const [pdfExporting, setPdfExporting] = useState(false)

  async function handleMarkApplied() {
    setApplyState("loading")
    const result = await markAsApplied(data.jobSlug)
    if (result.error) {
      setApplyState("error")
      setApplyError(result.error)
    } else {
      setApplyState("done")
    }
  }

  async function handleExportPdf() {
    if (!data.resumeVariantSlug) return
    setPdfExporting(true)
    await exportResumePdf(data.resumeVariantSlug)
    setPdfExporting(false)
  }

  return (
    <div className="w-full max-w-[1080px] mx-auto px-8 py-8">
      {/* Back link */}
      <Link
        href="/pipeline"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Pipeline
      </Link>

      {/* Page heading */}
      <h1 className="font-prose text-2xl text-text-primary mb-8">
        Apply to {data.jobTitle}
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column: copyable fields */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Job header */}
          <section className="bg-surface-raised rounded-[14px] border border-border-subtle p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h2 className="font-prose text-xl text-text-primary">{data.jobTitle}</h2>
                <div className="flex items-center gap-3 text-sm text-text-secondary mt-1 flex-wrap">
                  {data.company && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-text-muted" />
                      {data.company}
                    </span>
                  )}
                  {data.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-text-muted" />
                      {data.location}
                    </span>
                  )}
                  {data.remote && (
                    <span className="flex items-center gap-1.5 text-accent">
                      <Wifi className="w-3.5 h-3.5" />
                      {data.remote === "remote" ? "Remote" : data.remote === "hybrid" ? "Hybrid" : "On-site"}
                    </span>
                  )}
                  {data.compensation && (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                      {data.compensation}
                    </span>
                  )}
                </div>
              </div>
              {data.matchScore !== null && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${matchScoreClass(data.matchScore)}`}
                >
                  {data.matchScore}% match
                </span>
              )}
            </div>
            {data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-surface-overlay text-text-secondary border border-border-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Contact Information */}
          <section>
            <h3 className="font-prose text-lg text-text-primary mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CopyField label="Full Name" value={data.displayName} placeholder="Set in profile" />
              <CopyField label="Email" value={data.email} placeholder="Set in profile" />
              <CopyField label="Phone" value={data.phone} placeholder="Set in profile" />
              <CopyField label="LinkedIn" value={data.linkedinUrl} placeholder="Set in profile" />
              <CopyField label="GitHub" value={data.githubUrl} placeholder="Set in profile" />
              <CopyField label="Website" value={data.websiteUrl} placeholder="Set in profile" />
            </div>
          </section>

          {/* Headline / Summary */}
          <section>
            <h3 className="font-prose text-lg text-text-primary mb-4">Headline & Summary</h3>
            <div className="space-y-4">
              <CopyField label="Headline" value={data.headline} placeholder="Set a headline in your profile" />
              <CopyField
                label="Career Summary"
                value={data.careerSummary}
                multiline
                placeholder="Add a career summary in your profile"
              />
            </div>
          </section>

          {/* Cover Letter */}
          <section>
            <h3 className="font-prose text-lg text-text-primary mb-4">Cover Letter</h3>
            <CopyField
              label="Cover Letter"
              value={data.coverLetter}
              multiline
              placeholder="Ask the agent to draft a cover letter for this role"
            />
          </section>

          {/* Screening Answers */}
          {data.screeningAnswers.length > 0 && (
            <section>
              <h3 className="font-prose text-lg text-text-primary mb-4">Screening Answers</h3>
              <div className="space-y-4">
                {data.screeningAnswers.map((qa) => (
                  <CopyField key={qa.source} label={qa.question} value={qa.answer} />
                ))}
              </div>
            </section>
          )}

          {/* ATS Custom Questions */}
          {data.atsCustomQuestions.length > 0 && (
            <section>
              <h3 className="font-prose text-lg text-text-primary mb-4">
                Custom Application Questions
              </h3>
              <div className="space-y-4">
                {data.atsCustomQuestions.map((q) => (
                  <div key={q.id}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm text-text-primary">{q.text}</span>
                      {q.required && (
                        <span className="text-xs text-red-500 font-medium">Required</span>
                      )}
                    </div>
                    {q.type === "select" && q.options && (
                      <div className="text-xs text-text-muted mt-1">
                        Options: {q.options.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column: sticky action sidebar */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="lg:sticky lg:top-8 space-y-4">
            {/* Open Application button */}
            {data.jobUrl && (
              <a
                href={data.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-[10px] bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Application
              </a>
            )}

            {/* Mark as Applied button */}
            <button
              type="button"
              onClick={handleMarkApplied}
              disabled={applyState === "loading" || applyState === "done"}
              className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-[10px] text-sm font-medium transition-colors cursor-pointer ${
                applyState === "done"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : applyState === "error"
                    ? "bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/15"
                    : "bg-surface-raised border border-border-default text-text-primary hover:border-accent/30"
              } disabled:cursor-not-allowed`}
            >
              {applyState === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              {applyState === "done" && <CheckCircle2 className="w-4 h-4" />}
              {applyState === "loading"
                ? "Saving..."
                : applyState === "done"
                  ? "Marked as Applied"
                  : applyState === "error"
                    ? "Retry"
                    : "Mark as Applied"}
            </button>
            {applyState === "error" && applyError && (
              <p className="text-xs text-red-500 px-1">{applyError}</p>
            )}

            {/* Resume section */}
            <div className="bg-surface-raised rounded-[10px] border border-border-subtle p-4">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                Resume
              </h4>
              {data.resumeVariantSlug ? (
                <div className="space-y-2">
                  {data.resumePdfExists ? (
                    <a
                      href={`/api/resume/${data.resumeVariantSlug}`}
                      download
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-[6px] bg-surface-overlay text-sm text-text-primary hover:bg-border-subtle transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={pdfExporting}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-[6px] bg-surface-overlay text-sm text-text-primary hover:bg-border-subtle transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {pdfExporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Export PDF
                        </>
                      )}
                    </button>
                  )}
                  <p className="text-xs text-text-muted">
                    Tailored variant: {data.resumeVariantSlug}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  No tailored resume variant found. Ask the agent to create one for this role.
                </p>
              )}
            </div>

            {/* ATS platform badge */}
            {data.atsPlatform && data.atsPlatform !== "unknown" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-surface-overlay border border-border-subtle">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                <span className="text-xs text-text-secondary">
                  Detected platform: <span className="font-medium capitalize">{data.atsPlatform}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
