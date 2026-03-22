import type { Configuration } from "electron-builder"

const config: Configuration = {
  appId: "com.artemys.talentclaw",
  productName: "TalentClaw",
  // Main process entry point (compiled by tsdown)
  directories: {
    buildResources: "desktop/resources",
    output: "release",
  },
  files: [
    "dist-electron/**/*",
    ".next/standalone/**/*",
    ".next/static/**/*",
    "skills/**/*",
    "persona/**/*",
    "public/**/*",
  ],
  mac: {
    target: [
      { target: "dmg", arch: ["arm64"] },
      { target: "zip", arch: ["arm64"] },
    ],
    category: "public.app-category.productivity",
    icon: "desktop/resources/icon.icns",
    darkModeSupport: true,
    hardenedRuntime: true,
    entitlements: "desktop/resources/entitlements.mac.plist",
    entitlementsInherit: "desktop/resources/entitlements.mac.plist",
  },
  dmg: {
    contents: [
      { x: 130, y: 220 },
      { x: 410, y: 220, type: "link", path: "/Applications" },
    ],
  },
  publish: {
    provider: "github",
    owner: "artemyshq",
    repo: "talentclaw",
  },
}

export default config
