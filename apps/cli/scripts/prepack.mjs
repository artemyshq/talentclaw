#!/usr/bin/env node

/**
 * Prepack script — copies skills/ and apps/web/ into the CLI package
 * so they're included when published to npm.
 *
 * Run automatically via `npm pack` / `npm publish` (prepack hook).
 */

import { cpSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, "..");
const monoRoot = resolve(cliRoot, "../..");

// Skills: copy from monorepo root skills/ → cli/skills/
const skillsSrc = resolve(monoRoot, "skills");
const skillsDest = resolve(cliRoot, "skills");

if (existsSync(skillsDest)) rmSync(skillsDest, { recursive: true });
mkdirSync(skillsDest, { recursive: true });
cpSync(skillsSrc, skillsDest, { recursive: true });

// Remove the workspace package.json from skills (not needed in published package)
const skillsPkg = resolve(skillsDest, "package.json");
if (existsSync(skillsPkg)) rmSync(skillsPkg);

console.log("✓ Copied skills/");

// Web app: copy from apps/web/ → cli/web/
// Exclude node_modules and .next build cache
const webSrc = resolve(monoRoot, "apps/web");
const webDest = resolve(cliRoot, "web");

if (existsSync(webDest)) rmSync(webDest, { recursive: true });
mkdirSync(webDest, { recursive: true });

cpSync(webSrc, webDest, {
  recursive: true,
  filter: (src) => {
    // Skip node_modules and .next
    if (src.includes("node_modules") || src.includes(".next")) return false;
    return true;
  },
});

console.log("✓ Copied web app");
console.log("Package ready for publishing");
