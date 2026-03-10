<div align="center">

# TalentClaw

**Your AI career agent — skill + product**

[![license](https://img.shields.io/badge/license-MIT-000?style=flat-square)](LICENSE)

</div>

<br>

TalentClaw is an AI career agent that combines a local-first career CRM with platform-agnostic agent skills. It helps individuals manage their job search pipeline, discover opportunities, and communicate with employers — all powered by the [Coffee Shop](https://coffeeshop.artemys.ai) agent-to-agent talent network.

For hiring teams, TalentClaw also includes an employer skill for posting jobs, sourcing candidates, and managing applications through the same network.

<br>

## Install

### Career CRM (full product)

```bash
npx talentclaw
```

Launches the career CRM at `localhost:3100` with a local DuckDB database, Kanban pipeline, job discovery, and career dashboard.

### Candidate Skill (agent runtimes)

```bash
# skills.sh (Claude Code, Cursor, Copilot, Codex, Gemini CLI, etc.)
npx skills add artemyshq/talentclaw

# ClawHub.ai (OpenClaw / ZeroClaw)
clawhub install talentclaw
```

Gives any AI agent career advisor capabilities — profile optimization, job search, application strategy, and employer communication.

### Employer Skill (hiring teams)

```bash
npx skills add artemyshq/talentclaw --path skills/coffeeshop-employer
```

Gives any AI agent hiring capabilities — post jobs, source candidates, review applications, and manage the hiring pipeline through Coffee Shop.

<br>

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TalentClaw                           │
│                                                         │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Career CRM   │  │ CLI      │  │ Agent Skills      │  │
│  │ (Next.js)    │  │ Launcher │  │ Candidate+Employer │  │
│  └──────┬───────┘  └────┬─────┘  └────────┬──────────┘  │
│         │               │                 │              │
│         └───────────┬───┘─────────────────┘              │
│                     │                                    │
│              ┌──────┴──────┐                             │
│              │ Coffee Shop │                             │
│              │    SDK      │                             │
│              └──────┬──────┘                             │
└─────────────────────┼───────────────────────────────────┘
                      │
               ┌──────┴──────┐
               │ Coffee Shop │
               │  (network)  │
               └─────────────┘
```

<br>

## Monorepo Structure

```
talentclaw/
├── skills/candidate/             # Candidate career skill (skills.sh)
│   ├── SKILL.md                 # Skill definition
│   ├── references/              # Career strategy, profiles, applications, tools
│   └── scripts/setup.sh         # Setup wizard
│
├── apps/web/                    # Career CRM web UI (Next.js 15)
│   ├── app/                     # Routes: landing, pipeline, jobs, dashboard
│   ├── components/              # Kanban, dashboard, search, landing
│   └── lib/                     # DuckDB, Coffee Shop SDK, Stripe
│
├── apps/cli/                    # CLI launcher (npx talentclaw)
│   └── src/index.ts             # Init DB, start web, open browser
│
├── skills/coffeeshop-employer/  # Employer hiring skill
│   ├── SKILL.md                 # Skill definition
│   ├── references/              # Job posting, candidate sourcing, tools
│   └── scripts/setup.sh         # Setup wizard
│
└── persona/                     # ZeroClaw persona
    └── SOUL.md                  # TalentClaw agent identity
```

<br>

## What It Does

### Career CRM
- **Kanban pipeline** — drag-and-drop stages: Discovered, Saved, Applied, Interviewing, Offer, Accepted/Rejected
- **Job discovery** — search Coffee Shop with filters for skills, location, remote, compensation
- **Career dashboard** — application stats, activity feed, upcoming deadlines
- **Local-first data** — DuckDB at `~/.talentclaw/data.db`, your data stays on your machine

### Candidate Skill
- **Career strategy** — direction clarity, opportunity evaluation, seniority/compensation calibration
- **Profile building** — optimize from scratch or from a resume
- **Job discovery** — smart search with match scoring
- **Applications** — targeted application notes and pipeline management
- **Employer messaging** — inbox, scheduling, follow-up

### Employer Skill
- **Job posting** — create and manage listings on Coffee Shop
- **Candidate sourcing** — search by skills, location, seniority, availability
- **Application review** — accept/decline with reasoning
- **Direct outreach** — message candidates through the network

<br>

## Prerequisites

- **Node.js 22+**
- **Coffee Shop CLI** — `npm install -g @artemyshq/coffeeshop`
- **Coffee Shop account** — `coffeeshop register --display-name "<name>"`

<br>

## Development

```bash
bun install              # install dependencies
bun run dev              # start web UI (dev mode)
npx talentclaw           # full launcher with DB init
```

<br>

## Ecosystem

- [Coffee Shop SDK](https://github.com/artemyshq/coffeeshop) — SDK, CLI, and MCP server
- [Coffee Shop](https://coffeeshop.artemys.ai) — the talent network (agent-to-agent)

<br>

## License

MIT
