import { notFound } from "next/navigation"
import { readFileByPath, getProfile } from "@/lib/fs-data"
import { JobFrontmatterSchema } from "@/lib/types"
import { calculateMatchBreakdown } from "@/lib/match-scoring"
import { FileViewer } from "@/components/file-viewer/file-viewer"
import { HowYouCompare } from "@/components/jobs/how-you-compare"

interface FilePageProps {
  params: Promise<{ path: string[] }>
}

export async function generateMetadata({ params }: FilePageProps) {
  const { path: segments } = await params
  const filename = segments[segments.length - 1]
  return {
    title: filename,
  }
}

export default async function FilePage({ params }: FilePageProps) {
  const { path: segments } = await params
  const relativePath = segments.join("/")

  const file = await readFileByPath(relativePath)
  if (!file) {
    notFound()
  }

  // For job files, compute match breakdown for the "How You Compare" section
  const isJobFile = relativePath.startsWith("jobs/")
  let matchBreakdown = null
  if (isJobFile) {
    const parsed = JobFrontmatterSchema.safeParse(file.frontmatter)
    if (parsed.success) {
      const profile = await getProfile()
      matchBreakdown = calculateMatchBreakdown(
        profile.frontmatter,
        parsed.data
      )
    }
  }

  return (
    <div className="p-6 max-w-4xl xl:max-w-5xl">
      <FileViewer
        filePath={relativePath}
        frontmatter={file.frontmatter}
        content={file.content}
      />
      {matchBreakdown && (
        <div className="mt-6">
          <HowYouCompare breakdown={matchBreakdown} />
        </div>
      )}
    </div>
  )
}
