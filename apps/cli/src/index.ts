#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, exec } from "node:child_process";

// ---------------------------------------------------------------------------
// 1. Check Node.js version >= 22
// ---------------------------------------------------------------------------
const [major] = process.versions.node.split(".").map(Number);
if (major < 22) {
  console.error(
    `\nTalentClaw requires Node.js 22 or later (you have ${process.versions.node}).` +
      `\nInstall the latest LTS from https://nodejs.org or use a version manager like fnm / nvm.\n`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Ensure ~/.talentclaw/ exists
// ---------------------------------------------------------------------------
const dataDir = join(homedir(), ".talentclaw");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log(`Created ${dataDir}`);
}

// ---------------------------------------------------------------------------
// 3. Initialize DuckDB with career schema
// ---------------------------------------------------------------------------
const dbPath = join(dataDir, "data.db");

// Dynamic import so the shebang + version check run first
const duckdb = await import("duckdb");
const db = new duckdb.Database(dbPath);
const conn = db.connect();

const schema = `
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  url TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'discovered',
  compensation_min INTEGER,
  compensation_max INTEGER,
  remote BOOLEAN,
  location TEXT,
  skills TEXT,
  notes TEXT,
  coffeeshop_job_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id),
  status TEXT DEFAULT 'discovered',
  applied_at TIMESTAMP,
  coffeeshop_application_id TEXT,
  match_reasoning TEXT,
  next_step TEXT,
  next_step_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  size TEXT,
  industry TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  linkedin TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  sender TEXT,
  content TEXT,
  sent_at TIMESTAMP,
  coffeeshop_message_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

await new Promise<void>((resolve, reject) => {
  conn.exec(schema, (err: Error | null) => {
    if (err) reject(err);
    else resolve();
  });
});

console.log(`Database ready at ${dbPath}`);

// ---------------------------------------------------------------------------
// 4. Check for Coffee Shop API key
// ---------------------------------------------------------------------------
let apiKey: string | undefined = process.env.COFFEESHOP_API_KEY;

if (!apiKey) {
  const configPath = join(dataDir, "config.json");
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      apiKey = config.apiKey;
    } catch {
      // Malformed config — ignore
    }
  }
}

if (apiKey) {
  console.log("Coffee Shop API key found.");
} else {
  console.log(
    "\nNo Coffee Shop API key detected." +
      "\nTo connect to the Coffee Shop network, either:" +
      "\n  1. Run: coffeeshop register" +
      "\n  2. Set the COFFEESHOP_API_KEY environment variable" +
      "\n  3. Add { \"apiKey\": \"...\" } to ~/.talentclaw/config.json" +
      "\n\nContinuing in offline mode...\n"
  );
}

// ---------------------------------------------------------------------------
// 5. Start Next.js dev server at localhost:3100
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(__dirname, "../../web");

console.log("Starting TalentClaw at http://localhost:3100 ...\n");

const nextProcess = spawn("npx", ["next", "dev", "--port", "3100"], {
  cwd: webDir,
  stdio: "inherit",
  shell: true,
});

nextProcess.on("error", (err) => {
  console.error("Failed to start Next.js dev server:", err.message);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// 6. Open browser after a short delay
// ---------------------------------------------------------------------------
setTimeout(() => {
  const url = "http://localhost:3100";
  const openCmd =
    platform() === "darwin"
      ? "open"
      : platform() === "win32"
        ? "start"
        : "xdg-open";

  exec(`${openCmd} ${url}`, (err) => {
    if (err) {
      console.log(`Open ${url} in your browser to get started.`);
    }
  });
}, 3000);

// ---------------------------------------------------------------------------
// 7. Graceful shutdown on SIGINT
// ---------------------------------------------------------------------------
process.on("SIGINT", () => {
  console.log("\nShutting down TalentClaw...");
  nextProcess.kill("SIGINT");
  db.close();
  process.exit(0);
});
