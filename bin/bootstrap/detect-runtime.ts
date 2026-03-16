import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { log, which, cmdVersion } from "./utils.js";

export type Runtime = {
  name: string;
  cmd: string;
  version: string | null;
  skillDir: string;
};

const RUNTIMES: Array<{ name: string; cmd: string; skillSubpath: string }> = [
  { name: "OpenClaw", cmd: "openclaw", skillSubpath: ".openclaw/workspace/skills/talentclaw" },
  { name: "ZeroClaw", cmd: "zeroclaw", skillSubpath: ".zeroclaw/workspace/skills/talentclaw" },
  { name: "Claude Code", cmd: "claude", skillSubpath: "" },
];

function buildRuntime(entry: (typeof RUNTIMES)[number]): Runtime {
  const version = cmdVersion(entry.cmd);
  return {
    name: entry.name,
    cmd: entry.cmd,
    version,
    skillDir: entry.skillSubpath ? join(homedir(), entry.skillSubpath) : "",
  };
}

function promptChoice(runtimes: Runtime[]): Promise<Runtime> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("");
  runtimes.forEach((rt, i) => {
    const ver = rt.version ? ` (${rt.version})` : "";
    console.log(`  ${i + 1}) ${rt.name}${ver}`);
  });

  return new Promise((resolve) => {
    rl.question(`\n  Choose a runtime [1]: `, (answer) => {
      rl.close();
      const idx = answer.trim() ? parseInt(answer.trim(), 10) - 1 : 0;
      const selected = idx >= 0 && idx < runtimes.length ? runtimes[idx] : runtimes[0];
      log("  →", `Using ${selected.name}`);
      resolve(selected);
    });
  });
}

export async function detectRuntime(prefer?: string): Promise<Runtime | null> {
  log("◆", "Checking for agent runtimes...");

  const found: Runtime[] = [];
  for (const entry of RUNTIMES) {
    if (which(entry.cmd)) {
      const rt = buildRuntime(entry);
      log("  ✓", `${rt.name} detected${rt.version ? ` (${rt.version})` : ""}`);
      found.push(rt);
    }
  }

  if (found.length === 0) {
    log("  ⚠", "No agent runtime detected.");
    return null;
  }

  // --runtime flag: match by name or command (case-insensitive)
  if (prefer) {
    const match = found.find(
      (rt) =>
        rt.name.toLowerCase() === prefer.toLowerCase() ||
        rt.cmd.toLowerCase() === prefer.toLowerCase(),
    );
    if (match) {
      log("  →", `Using ${match.name} (--runtime)`);
      return match;
    }
    log("  ⚠", `Runtime "${prefer}" not found, prompting...`);
  }

  if (found.length === 1) {
    return found[0];
  }

  log("", "\n  Multiple runtimes detected. Which one should talentclaw use?");
  return promptChoice(found);
}
