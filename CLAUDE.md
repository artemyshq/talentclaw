# talentclaw — Contributor Conventions

## Project Structure

Next.js web UI + TypeScript CLI. The CLI handles bootstrapping and server management. The web UI is the dashboard.

## Stack

- **CLI:** TypeScript — `bin/cli.ts`
- **Web:** Next.js 15, React 19, Tailwind CSS v4
- **Data:** Filesystem (local-first, `~/.talentclaw/` markdown + YAML frontmatter)
- **Runtime:** Bun + Node.js 22+ (for web UI dev and Next.js server)
- **Network:** Web search + browser-use (external tools, not project dependencies)

## Key Directories

| Path | What it is |
|------|-----------|
| `app/` | Next.js pages and routes |
| `components/` | React components |
| `lib/` | Data layer (types, filesystem I/O, utilities) |
| `bin/` | CLI entry point (TypeScript) |
| `skills/` | Agent skill definition + reference docs |
| `persona/` | Agent persona (SOUL.md) |

## Conventions

- **TypeScript** for web code, **Zod** for runtime validation
- **Tailwind v4** — use `@import "tailwindcss"` and `@theme` blocks, not `@tailwind` directives
- **Server components** by default in Next.js; add `"use client"` only when needed
- **Filesystem data** — career data lives in `~/.talentclaw/` as markdown with YAML frontmatter. Schema types in `lib/types.ts`, filesystem I/O in `lib/fs-data.ts`
- **No secrets in repo** — use `.env` files (see `.env.example`)
- **Skill files** — SKILL.md is the skill definition, references/ holds domain knowledge, scripts/setup.sh handles onboarding

## Commands

```bash
# Web UI
bun install          # install dependencies
bun run dev          # start web UI (localhost:3000)
bun run build        # Next.js production build (standalone output)
bun run test         # run vitest

# CLI
node bin/cli.ts         # scaffold + start web UI
node bin/cli.ts setup   # scaffold + register skill + MCP
```

## Testing

- **TypeScript tests:** live next to the code they test (`__tests__/` directories or `.test.ts` files)

## npm Distribution

The `talentclaw` npm package ships as a single package. `npx talentclaw` runs the TypeScript CLI directly.

## Filesystem Schema

Career data lives in `~/.talentclaw/` as markdown files with YAML frontmatter. Directory structure:

- `profile.md` — user's career profile
- `jobs/` — one `.md` file per opportunity (status field drives pipeline)
- `applications/` — one `.md` file per application
- `companies/` — company research notes
- `contacts/` — people in network
- `messages/` — conversation threads
- `resumes/` — resume versions and conversions (original uploads, `current.md`, `current.pdf`)
- `activity.log` — append-only JSONL activity feed
- `config.yaml` — UI preferences

Types defined in `lib/types.ts`. Read/write functions in `lib/fs-data.ts`.

## gstack

For all web browsing, use the `/browse` skill from gstack. Never use `mcp__claude-in-chrome__*` tools.

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.

Available skills:
- `/plan-ceo-review` — CEO/founder-mode plan review (scope expansion, strategic thinking)
- `/plan-eng-review` — Engineering manager plan review (architecture, tests, performance)
- `/plan-design-review` — Designer's eye plan review (visual audit, design dimensions)
- `/design-consultation` — Create a design system (DESIGN.md) from scratch
- `/design-review` — Visual QA: find and fix design issues on the live site
- `/review` — Pre-landing PR review (SQL safety, security, structural issues)
- `/ship` — Full ship workflow (merge, test, review, version bump, changelog, PR)
- `/browse` — Fast headless browser for QA testing and dogfooding (~100ms/command)
- `/qa` — Systematic QA testing + fix bugs found
- `/qa-only` — QA testing report only (no fixes)
- `/setup-browser-cookies` — Import cookies from real browser for authenticated testing
- `/retro` — Weekly engineering retrospective with trend tracking
- `/document-release` — Post-ship documentation sync

## Design System

Always read `DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
