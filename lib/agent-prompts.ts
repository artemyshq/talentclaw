export function APPLY_PROMPT(
  jobSlug: string,
  jobTitle: string,
  company: string,
): string {
  return `I'd like to apply to the ${jobTitle} position at ${company}. The job slug is ${jobSlug}.
If a tailored resume variant exists for this job in resumes/variants/, export it to PDF (resumes/exports/) before submitting.
If no variant exists, create one from resumes/base.md first, then export and submit.`
}

export function TAILOR_RESUME_PROMPT(
  jobSlug: string,
  jobTitle: string,
  company: string,
  variantSlug: string,
): string {
  return `Please tailor my resume for the ${jobTitle} position at ${company}.
Read my base resume from the resumes/base.md file, then read the job details from jobs/${jobSlug}.md.
Create a tailored variant at resumes/variants/${variantSlug}.md that highlights relevant experience and skills for this role.
Preserve the structure and authenticity of the original — adjust emphasis and wording, don't fabricate.`
}

export function DRAFT_FOLLOWUP_PROMPT(
  applicationSlug: string,
  company: string,
): string {
  return `I need to follow up on my application to ${company} (${applicationSlug}). Please draft a professional follow-up message.`
}

export const OPTIMIZE_PROFILE_PROMPT =
  "Please review my profile and suggest improvements to make it more compelling for the roles I'm targeting."

// --- Onboarding prompts (display + agent) ---

const ONBOARDING_INSTRUCTIONS = `
Begin onboarding:
1. Read my resume from ~/.talentclaw/resumes/base.md
2. Extract ALL structured profile fields (display_name, headline, skills, experience, education, projects, experience_years) and save them to ~/.talentclaw/profile.md frontmatter. Quote all date strings.
3. Then start the career discovery conversation — acknowledge my background warmly, offer to help with any resume tweaks, and ask 2-3 targeted questions about what the resume can't tell you (target roles, compensation, location, remote preference, search mode, what's driving my search).
4. After I answer, complete the profile (career_arc_summary, core_strengths_summary, current_situation_summary in first person) and kick off a job search based on my preferences. Save discovered jobs to ~/.talentclaw/jobs/ and present the top matches, asking if I'd like to apply to any.

IMPORTANT:
- Do NOT show raw extracted data, code blocks, YAML, or file paths in your responses.
- Do NOT label anything as "draft" — commit to your work.
- Write all career summaries in first person ("I spent a decade..." not "Jeff spent a decade...").
- All file operations should be wrapped in <internal> tags — the user only sees the conversation.
- Lead with warmth and questions, not data dumps.`

export const RESUME_UPLOADED_DISPLAY = "I just uploaded my resume."
export const RESUME_UPLOADED_PROMPT = `I just uploaded my resume. It's been extracted and saved to ~/.talentclaw/resumes/base.md.\n${ONBOARDING_INSTRUCTIONS}`

export const RESUME_PASTED_DISPLAY = "I just pasted my resume."
export const RESUME_PASTED_PROMPT = `I just pasted my resume text. It's been saved to ~/.talentclaw/resumes/base.md.\n${ONBOARDING_INSTRUCTIONS}`
