import type { AtsPlatform, AtsUrlInfo } from "./types"

const UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

const PATTERNS: [RegExp, AtsPlatform][] = [
  [new RegExp(`^https?://jobs\\.lever\\.co/([^/]+)/(${UUID_PATTERN})(?:/apply)?/?$`, "i"), "lever"],
  [new RegExp(`^https?://(?:boards|job-boards)\\.greenhouse\\.io/([^/]+)/jobs/(\\d+)`, "i"), "greenhouse"],
  [new RegExp(`^https?://jobs\\.ashbyhq\\.com/([^/]+)/(${UUID_PATTERN})`, "i"), "ashby"],
]

export function detectAtsPlatform(url: string): AtsUrlInfo {
  for (const [re, platform] of PATTERNS) {
    const match = url.match(re)
    if (match) {
      return { platform, companySlug: match[1], postingId: match[2], originalUrl: url }
    }
  }
  return { platform: "unknown", companySlug: "", postingId: "", originalUrl: url }
}
