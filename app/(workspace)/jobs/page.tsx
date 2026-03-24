import { listJobs, getProfile } from "@/lib/fs-data"
import { calculateMatchBreakdown } from "@/lib/match-scoring"
import { JobsList } from "./jobs-list"

export default async function JobsPage() {
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()])

  const jobListings = jobs.map((job) => {
    const breakdown = job.frontmatter.match_score != null
      ? calculateMatchBreakdown(profile.frontmatter, job.frontmatter)
      : null
    return {
      id: job.slug,
      title: job.frontmatter.title,
      company: job.frontmatter.company,
      location: job.frontmatter.location || "",
      remote: job.frontmatter.remote === "remote",
      compensationMin: job.frontmatter.compensation?.min ?? null,
      compensationMax: job.frontmatter.compensation?.max ?? null,
      skills: job.frontmatter.tags || [],
      matchScore: job.frontmatter.match_score ?? null,
      matchBreakdown: breakdown,
      postedDate: job.frontmatter.discovered_at || "",
      url: job.frontmatter.url || "",
      source: job.frontmatter.source,
      status: job.frontmatter.status,
    }
  })

  return (
    <div className="max-w-6xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-5 py-8">
      <JobsList jobs={jobListings} />
    </div>
  )
}
