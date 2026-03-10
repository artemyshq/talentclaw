# TalentClaw: Provisioning Plan

How to get from "user pays on the website" to "user talking to their TalentClaw agent on Telegram."

Each TalentClaw customer gets their own ZeroClaw instance running on Fly.io — configured with SOUL.md (persona), TalentClaw skill, and a Coffee Shop connection. This document covers the three remaining phases to make that happen automatically.

---

## Phase 1: Telegram Router

**Goal:** A single always-on Fly Machine that owns the shared Telegram bot and routes messages to per-user ZeroClaw instances.

### Architecture

```
Telegram Bot API
       │
       ▼
┌──────────────────────┐
│   Telegram Router    │  Always-on Fly Machine
│   @ArtemysHQBot      │  Long polling
│                      │
│   Routing table:     │
│   chat_id → machine  │
└──────┬───────────────┘
       │ HTTP
       ▼
┌──────────┐ ┌──────────┐
│ User A   │ │ User B   │  Per-user Fly Machines
│ ZeroClaw │ │ ZeroClaw │  Auto-stop / auto-start
└──────────┘ └──────────┘
```

### How it works

1. **Inbound:** Bot receives message → look up `chat_id` in routing table → if Machine is stopped, start it (~3s) → forward message via HTTP POST to Machine
2. **Outbound:** ZeroClaw instance sends response via HTTP POST to Router → Router sends via Bot API to user's chat
3. **Unknown users:** Reply with "Visit talentclaw.dev to sign up"
4. **Cold start:** Show "typing" indicator while Machine boots (~3s). Timeout after 15s with error message.

### Routing table

Start simple: in-memory Map + JSON file on Fly Volume for persistence. Move to SQLite/Redis later if needed.

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/routes` | Add routing entry `{ chat_id, machine_id }` |
| `DELETE` | `/routes/:chat_id` | Remove routing entry |
| `GET` | `/routes` | List all routes (admin) |
| `POST` | `/outbound` | ZeroClaw instance sends message to user |

### Deployment

- Fly app: `talentclaw-router`
- Always-on (`min_machines_running = 1`)
- 256MB RAM, shared-cpu-1x
- Volume for routing table persistence
- Env vars: `TELEGRAM_BOT_TOKEN`, `FLY_API_TOKEN`

### Stack

Node.js + Telegraf (or raw Bot API) + Fastify for HTTP endpoints. ~200 lines.

---

## Phase 2: Per-User ZeroClaw Machines

**Goal:** A Fly Machine image that runs one ZeroClaw instance per customer.

### What each Machine contains

```
/app/
├── zeroclaw                    # ZeroClaw binary
├── config.toml                 # Generated from env vars at boot
├── workspace/
│   ├── SOUL.md                 # TalentClaw persona (from persona/SOUL.md)
│   └── skills/
│       └── talentclaw/         # TalentClaw skill (from packages/skill/)
│           ├── SKILL.md
│           ├── references/
│           └── scripts/
└── data/                       # Persistent volume mount
    └── memory/                 # ZeroClaw memory store
```

### Per-user config via env vars

| Env Var | Purpose |
|---------|---------|
| `ANTHROPIC_API_KEY` | Claude API access |
| `COFFEESHOP_AGENT_ID` | This user's agent ID on Coffee Shop |
| `COFFEESHOP_API_KEY` | API key for Coffee Shop |
| `DISPLAY_NAME` | User's name for personalization |
| `TELEGRAM_ROUTER_URL` | URL of the shared Router (Fly internal) |
| `TELEGRAM_USER_CHAT_ID` | This user's Telegram chat ID |

### Machine config

- Auto-stop after idle (Fly `auto_stop: "stop"`)
- Auto-start on inbound request (`auto_start: true`)
- 1GB persistent volume at `/data` for memory store
- Restart on failure (max 3 retries)

### Dockerfile sketch

```dockerfile
FROM node:22-slim
RUN npm install -g zeroclaw
WORKDIR /app
COPY persona/SOUL.md workspace/SOUL.md
COPY packages/skill/ workspace/skills/talentclaw/
COPY boot.sh .
ENTRYPOINT ["./boot.sh"]
```

`boot.sh` generates `config.toml` from env vars, then runs `zeroclaw daemon`.

---

## Phase 3: Automated Provisioning

**Goal:** Wire the Stripe webhook to automatically provision a full TalentClaw instance when someone pays.

### Provisioning flow (on `checkout.session.completed`)

```
Stripe webhook fires
       │
       ▼
1. Register agent with Coffee Shop
   └─ coffeeshop register → returns agent_id + api_key
       │
       ▼
2. Create Fly Volume (1GB)
   └─ POST /apps/talentclaw-instances/volumes
       │
       ▼
3. Create Fly Machine
   └─ POST /apps/talentclaw-instances/machines
   └─ image: registry.fly.io/talentclaw-instance:latest
   └─ env: COFFEESHOP_AGENT_ID, COFFEESHOP_API_KEY, etc.
   └─ volume attached, auto_stop/auto_start enabled
       │
       ▼
4. Store subscription record
   └─ { stripe_customer_id, machine_id, agent_id, status: "active" }
       │
       ▼
5. Resolve Telegram routing (see below)
       │
       ▼
6. Send welcome notification
```

### Telegram chat_id resolution

The signup form collects `telegram_username` optionally. Two paths:

**User provided username:**
- Can't resolve username → chat_id until user messages the bot
- Store username in subscription record as "pending"
- When user first messages @ArtemysHQBot, Router checks if username matches a pending subscription
- If match: create route, start Machine, send welcome message

**User didn't provide username:**
- Success page shows "Open Telegram and message @ArtemysHQBot"
- Same first-message flow triggers route creation

### Stripe lifecycle handlers

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Full provisioning flow above |
| `invoice.payment_succeeded` | If suspended → start Machine, set status `active` |
| `invoice.payment_failed` | Log warning. After 3 days: stop Machine, set status `suspended`, notify via Telegram |
| `customer.subscription.deleted` | Stop Machine, set status `suspended`, schedule teardown in 30 days |

**Teardown (30 days after cancellation):**
- Delete Fly Machine + Volume
- Deregister agent from Coffee Shop
- Remove Router route
- Set status `torn_down`

### Signup form fields

Collected at checkout (passed as Stripe metadata):

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Display name for persona |
| `email` | Yes | Stripe customer, notifications |
| `current_role` | No | Seed career profile |
| `target_roles` | No | Seed career profile |
| `location` | No | Job search defaults |
| `remote_preference` | No | Job search defaults |
| `telegram_username` | No | Route resolution |

### Implementation location

The provisioning logic lives in `apps/web/app/api/stripe-webhook/route.ts`, calling:

| Dependency | Purpose |
|------------|---------|
| `@artemyshq/coffeeshop` SDK | Register agent, get credentials |
| Fly Machines REST API | Create/start/stop/delete Machines + Volumes |
| Telegram Router HTTP API | Add/remove routing entries |

Extract to `apps/web/lib/provisioning.ts` when the webhook handler gets complex.

### Additional env vars needed

```
FLY_API_TOKEN=
FLY_APP_NAME=talentclaw-instances
FLY_REGION=iad
COFFEESHOP_API_URL=https://coffeeshop.artemys.dev
COFFEESHOP_ADMIN_API_KEY=
ANTHROPIC_API_KEY=
TELEGRAM_ROUTER_INTERNAL_URL=http://talentclaw-router.internal:3000
```

---

## Cost Model

| Users | Compute (~4h/day active) | Storage (1GB/user) | Router | Total/mo | Revenue/mo |
|-------|--------------------------|--------------------| -------|----------|------------|
| 10    | $25                      | $1.50              | $5     | ~$32     | $150       |
| 50    | $125                     | $7.50              | $5     | ~$138    | $750       |
| 100   | $250                     | $15                | $10    | ~$275    | $1,500     |

At $15/mo per user, break-even is ~3 users. Healthy margin from ~10 users onward.

Auto-stop/auto-start is critical — users aren't chatting 24/7, so Machines sleep most of the time. Fly only bills for running time.

---

## Execution Order

```
Phase 1: Telegram Router     ← build + deploy first (standalone)
Phase 2: ZeroClaw image      ← build + push to Fly registry
Phase 3: Provisioning        ← wire Stripe webhook to Phases 1 + 2
```

Each phase is independently testable before moving to the next.
