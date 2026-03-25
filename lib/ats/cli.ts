#!/usr/bin/env bun

import { detectAtsPlatform } from "./detect"
import type { ApplicantData } from "./types"

function exitJson(data: unknown, code = 0): never {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n")
  process.exit(code)
}

function exitError(message: string): never {
  exitJson({ error: message }, 1)
}

function getFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag)
  if (idx === -1 || idx + 1 >= args.length) return undefined
  return args[idx + 1]
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    exitError("Usage: cli.ts <detect|questions|submit> <url> [options]")
  }

  if (command === "detect") {
    const url = args[1]
    if (!url) exitError("Usage: cli.ts detect <url>")
    exitJson(detectAtsPlatform(url))
  }

  if (command === "questions") {
    const url = args[1]
    if (!url) exitError("Usage: cli.ts questions <url>")

    const info = detectAtsPlatform(url)
    if (info.platform !== "lever") {
      exitError(`Custom questions only supported for Lever (detected: ${info.platform})`)
    }

    const { fetchLeverCustomQuestions } = await import("./lever")
    const questions = await fetchLeverCustomQuestions(info.companySlug, info.postingId)
    exitJson(questions)
  }

  if (command === "submit") {
    const url = args[1]
    const resumePath = args[2]
    if (!url || !resumePath) {
      exitError("Usage: cli.ts submit <url> <resume-path> [--name ...] [--email ...]")
    }

    const info = detectAtsPlatform(url)
    if (info.platform !== "lever") {
      exitError(`Submission only supported for Lever (detected: ${info.platform})`)
    }

    const name = getFlag(args, "--name")
    const email = getFlag(args, "--email")
    if (!name || !email) {
      exitError("--name and --email are required for submission")
    }

    const applicant: ApplicantData = {
      name,
      email,
      phone: getFlag(args, "--phone"),
      org: getFlag(args, "--org"),
      linkedinUrl: getFlag(args, "--linkedin"),
      githubUrl: getFlag(args, "--github"),
      websiteUrl: getFlag(args, "--website"),
      coverLetter: getFlag(args, "--cover-letter"),
      source: getFlag(args, "--source") ?? "talentclaw",
    }

    let customAnswers: Record<string, string> | undefined
    const answersJson = getFlag(args, "--answers")
    if (answersJson) {
      try {
        customAnswers = JSON.parse(answersJson)
      } catch {
        exitError("--answers must be valid JSON")
      }
    }

    const { submitLeverApplication } = await import("./lever")
    const result = await submitLeverApplication(
      info.companySlug,
      info.postingId,
      applicant,
      resumePath,
      customAnswers
    )

    exitJson(result, result.success ? 0 : 1)
  }

  exitError(`Unknown command: ${command}`)
}

main()
