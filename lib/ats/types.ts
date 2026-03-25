import { z } from "zod"

export const ATS_PLATFORMS = ["lever", "greenhouse", "ashby", "unknown"] as const
export const AtsPlatformSchema = z.enum(ATS_PLATFORMS)
export type AtsPlatform = z.infer<typeof AtsPlatformSchema>

export interface AtsUrlInfo {
  platform: AtsPlatform
  companySlug: string
  postingId: string
  originalUrl: string
}

export const ApplicantDataSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  org: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  source: z.string().default("talentclaw"),
})
export type ApplicantData = z.infer<typeof ApplicantDataSchema>

export interface AtsCustomQuestion {
  id: string
  text: string
  required: boolean
  type: "text" | "textarea" | "select" | "file"
  options?: string[]
}

export interface AtsSubmissionResult {
  success: boolean
  platform: AtsPlatform
  applicationId?: string
  error?: string
  submissionMethod: "ats_api"
}
