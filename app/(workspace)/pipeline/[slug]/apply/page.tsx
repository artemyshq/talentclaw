import { notFound } from "next/navigation"
import {
  getJob,
  getProfile,
  getApplication,
  getVariant,
} from "@/lib/fs-data"
import {
  detectAtsPlatform,
  fetchLeverCustomQuestions,
  fetchGreenhouseCustomQuestions,
  fetchAshbyCustomQuestions,
} from "@/lib/ats"
import { buildScreeningAnswers } from "@/lib/apply-kit"
import { formatCompensation } from "@/lib/ui-utils"
import { ApplyKitPage } from "@/components/apply-kit/apply-kit-page"
import type { ApplyKitData } from "@/components/apply-kit/apply-kit-page"
import type { AtsCustomQuestion } from "@/lib/ats/types"

interface ApplyPageProps {
  params: Promise<{ slug: string }>
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { slug } = await params
  const [job, profile, existingApp, variant] = await Promise.all([
    getJob(slug),
    getProfile(),
    getApplication(`${slug}-app`),
    getVariant(slug),
  ])

  if (!job) {
    notFound()
  }

  // Detect ATS platform from job URL
  const atsInfo = job.frontmatter.url ? detectAtsPlatform(job.frontmatter.url) : null
  const atsPlatform = atsInfo?.platform ?? null

  // Fetch custom questions for supported ATS platforms
  let atsCustomQuestions: AtsCustomQuestion[] = []
  if (atsInfo && atsInfo.companySlug && atsInfo.postingId) {
    switch (atsInfo.platform) {
      case "lever":
        atsCustomQuestions = await fetchLeverCustomQuestions(atsInfo.companySlug, atsInfo.postingId)
        break
      case "greenhouse":
        atsCustomQuestions = await fetchGreenhouseCustomQuestions(atsInfo.companySlug, atsInfo.postingId)
        break
      case "ashby":
        atsCustomQuestions = await fetchAshbyCustomQuestions(atsInfo.companySlug, atsInfo.postingId)
        break
    }
  }

  const screeningAnswers = buildScreeningAnswers(profile.frontmatter)
  const comp = job.frontmatter.compensation
  const compensation = comp ? formatCompensation({ min: comp.min, max: comp.max }) : null
  const coverLetter = existingApp?.content || ""
  const fm = profile.frontmatter

  const data: ApplyKitData = {
    jobSlug: slug,
    jobTitle: job.frontmatter.title,
    company: job.frontmatter.company,
    jobUrl: job.frontmatter.url || null,
    matchScore: job.frontmatter.match_score ?? null,
    location: job.frontmatter.location || null,
    remote: job.frontmatter.remote || null,
    compensation,
    tags: job.frontmatter.tags || [],

    displayName: fm.display_name || "",
    email: fm.email || "",
    phone: fm.phone || "",
    linkedinUrl: fm.linkedin_url || "",
    githubUrl: fm.github_url || "",
    websiteUrl: fm.website_url || "",

    headline: fm.headline || "",
    careerSummary: fm.career_arc_summary || fm.core_strengths_summary || "",

    coverLetter,
    screeningAnswers,

    atsPlatform,
    atsCustomQuestions,

    resumeVariantSlug: variant ? slug : null,
    resumePdfExists: !!variant,

    alreadyApplied:
      job.frontmatter.status === "applied" ||
      job.frontmatter.status === "interviewing" ||
      job.frontmatter.status === "offer" ||
      job.frontmatter.status === "accepted" ||
      !!existingApp,
  }

  return <ApplyKitPage data={data} />
}
