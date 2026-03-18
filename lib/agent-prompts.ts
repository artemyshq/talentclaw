export function APPLY_PROMPT(
  jobSlug: string,
  jobTitle: string,
  company: string,
): string {
  return `I'd like to apply to the ${jobTitle} position at ${company}. The job slug is ${jobSlug}. Please draft an application note and submit it.`
}

export function DRAFT_FOLLOWUP_PROMPT(
  applicationSlug: string,
  company: string,
): string {
  return `I need to follow up on my application to ${company} (${applicationSlug}). Please draft a professional follow-up message.`
}

export const OPTIMIZE_PROFILE_PROMPT =
  "Please review my profile and suggest improvements to make it more compelling for the roles I'm targeting."
