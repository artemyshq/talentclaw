/**
 * Dependency detection helpers for the CLI onboarding flow.
 *
 * Extracted from bin/cli.ts so they can be unit-tested without
 * triggering the CLI's top-level side effects (server start, etc.).
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Return true if `cmd` is found on PATH. */
export function which(cmd: string): boolean {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Return the first python binary >= 3.11 found on PATH, or null.
 * Checks versioned binaries first (python3.13, python3.12, python3.11)
 * because Homebrew on macOS installs these without overriding the
 * system `python3` (which is often 3.9).
 */
export function findPython311(): string | null {
  for (const cmd of ["python3.13", "python3.12", "python3.11", "python3", "python"]) {
    if (!which(cmd)) continue;
    try {
      const out = execFileSync(cmd, ["-c", "import sys; print(sys.version_info >= (3, 11))"], {
        stdio: "pipe",
        timeout: 5000,
      }).toString().trim();
      if (out === "True") return cmd;
    } catch { /* version too old or broken install */ }
  }
  return null;
}

/**
 * Check if browser-use is available.
 * Checks the known venv path first (cheap existsSync), then falls back
 * to a PATH scan via `which`. The install script may only update .bashrc,
 * not .zshrc, so the venv check catches that case.
 */
export function hasBrowserUseBin(): boolean {
  if (existsSync(join(homedir(), ".browser-use-env", "bin", "browser-use"))) return true;
  return which("browser-use");
}
