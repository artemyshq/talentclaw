import { describe, it, expect, vi, beforeEach } from "vitest";
import { join } from "node:path";
import { homedir } from "node:os";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

import { which, findPython311, hasBrowserUseBin } from "../deps";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const mockExecFileSync = vi.mocked(execFileSync);
const mockExistsSync = vi.mocked(existsSync);

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// which()
// ---------------------------------------------------------------------------

describe("which", () => {
  it("returns true when command exists", () => {
    mockExecFileSync.mockReturnValue(Buffer.from("/usr/bin/node"));
    expect(which("node")).toBe(true);
    expect(mockExecFileSync).toHaveBeenCalledWith("which", ["node"], { stdio: "ignore" });
  });

  it("returns false when command does not exist", () => {
    mockExecFileSync.mockImplementation(() => { throw new Error("not found"); });
    expect(which("nonexistent-tool-xyz")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// findPython311()
// ---------------------------------------------------------------------------

// findPython311 calls execFileSync twice per candidate that exists on PATH:
//   1. which(cmd) → execFileSync("which", [cmd], ...)
//   2. execFileSync(cmd, ["-c", "import sys; ..."], ...)
// For candidates not on PATH, only the which call happens (and throws).

describe("findPython311", () => {
  /** Make the next which() call succeed, then the version check return `output`. */
  function mockCandidate(output: string) {
    // which(cmd) succeeds
    mockExecFileSync.mockReturnValueOnce(Buffer.from(""));
    // version check
    mockExecFileSync.mockReturnValueOnce(Buffer.from(output));
  }

  /** Make the next which() call fail (command not on PATH). */
  function mockMissing() {
    mockExecFileSync.mockImplementationOnce(() => { throw new Error("not found"); });
  }

  it("returns versioned binary when it satisfies >= 3.11", () => {
    mockCandidate("True\n"); // python3.13
    expect(findPython311()).toBe("python3.13");
  });

  it("skips versioned binaries that don't exist and finds python3", () => {
    mockMissing(); // python3.13
    mockMissing(); // python3.12
    mockMissing(); // python3.11
    mockCandidate("True\n"); // python3
    expect(findPython311()).toBe("python3");
  });

  it("skips python3 when it is < 3.11 (macOS system python)", () => {
    mockMissing(); // python3.13
    mockMissing(); // python3.12
    mockMissing(); // python3.11
    mockCandidate("False\n"); // python3 — too old
    mockMissing(); // python
    expect(findPython311()).toBeNull();
  });

  it("returns null when no python is available at all", () => {
    mockExecFileSync.mockImplementation(() => { throw new Error("not found"); });
    expect(findPython311()).toBeNull();
  });

  it("prefers python3.13 over python3.12", () => {
    mockCandidate("True\n"); // python3.13
    expect(findPython311()).toBe("python3.13");
    // which + version check = 2 calls total, no further candidates checked
    expect(mockExecFileSync).toHaveBeenCalledTimes(2);
  });

  it("falls through to python3.12 when python3.13 version check fails", () => {
    mockCandidate("False\n"); // python3.13 — exists but reports False
    mockCandidate("True\n"); // python3.12
    expect(findPython311()).toBe("python3.12");
  });
});

// ---------------------------------------------------------------------------
// hasBrowserUseBin()
// ---------------------------------------------------------------------------

// hasBrowserUseBin checks existsSync (venv path) first, then which() as fallback.

describe("hasBrowserUseBin", () => {
  const venvPath = join(homedir(), ".browser-use-env", "bin", "browser-use");

  it("returns true via venv path (checked first)", () => {
    mockExistsSync.mockReturnValueOnce(true);
    expect(hasBrowserUseBin()).toBe(true);
    // Should not spawn a subprocess since existsSync found it
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });

  it("falls back to which() when venv doesn't exist", () => {
    mockExistsSync.mockReturnValueOnce(false);
    // which("browser-use") succeeds
    mockExecFileSync.mockReturnValueOnce(Buffer.from("/usr/local/bin/browser-use"));
    expect(hasBrowserUseBin()).toBe(true);
    expect(mockExistsSync).toHaveBeenCalledWith(venvPath);
  });

  it("returns false when neither venv nor PATH has it", () => {
    mockExistsSync.mockReturnValue(false);
    mockExecFileSync.mockImplementation(() => { throw new Error("not found"); });
    expect(hasBrowserUseBin()).toBe(false);
  });
});
