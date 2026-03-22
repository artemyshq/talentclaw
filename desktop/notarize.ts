// desktop/notarize.ts — Apple notarization afterSign hook for electron-builder
//
// Called automatically by electron-builder after code signing on macOS.
//
// Required environment variables (set in CI or local .env):
//   APPLE_ID                    — Apple ID email used for notarization
//   APPLE_APP_SPECIFIC_PASSWORD — App-specific password (generate at appleid.apple.com)
//   APPLE_TEAM_ID               — Apple Developer Team ID
//
// When these env vars are absent (local dev), notarization is silently skipped.

import { notarize } from "@electron/notarize"

export default async function notarizeApp(context: any): Promise<void> {
  // Only notarize macOS builds
  if (context.electronPlatformName !== "darwin") return

  // Skip if credentials aren't set (local dev)
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.log("Skipping notarization — APPLE_ID not set")
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${context.appOutDir}/${appName}.app`

  console.log(`Notarizing ${appPath}...`)

  await notarize({
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID!,
  })

  console.log("Notarization complete")
}
