# TODOS

## P2 — Deployable Mode
**What:** Make the Next.js app deployable to Vercel/Fly.io with environment-based data directory config, basic auth (password or token), and HTTPS.
**Why:** Enables mobile access, multi-device usage, and opens the path to a hosted SaaS version. Currently TalentClaw only runs on localhost:3100.
**Pros:** Unlocks mobile, sharing with career coaches, multi-device access. Opens SaaS revenue path.
**Cons:** Filesystem-first architecture needs adaptation (data dir can't be `~/` on a server). Auth adds complexity.
**Context:** The filesystem data layer (`~/.talentclaw/`) works locally but needs an abstraction for remote deployment. Options: mount a volume, use S3-backed storage, or add a DB adapter. The simplest path is Fly.io with a persistent volume.
**Effort:** M (human) → S (CC)
**Depends on:** Core features (self-serve UI, inbox, analytics) being solid.

## P1 — Architecture Documentation (ship with Phase 1)
**What:** Create ARCHITECTURE.md documenting data flow, component hierarchy, deployment model, agent integration patterns, and the new graph index layer.
**Why:** Phase 1 adds significant architecture (graph index, generic CRUD, application workflow state machine, bidirectional graph). A new engineer needs to understand these layers. CLAUDE.md covers conventions but not architecture.
**Pros:** Faster onboarding for contributors, reduces knowledge concentration risk. Graph index pattern (derived .graph.json from source markdown) needs documentation because the "why" isn't obvious from code alone.
**Cons:** Needs maintenance as architecture evolves.
**Context:** Key flows to document: bootstrap sequence, data mutation path (server actions → fs-data → filesystem → revalidate), graph index lifecycle (dirty flag → lazy rebuild → atomic write → query), application workflow state machine (queued → review → approved → submitted/failed), generic CRUD pattern (listEntities<T>), agent communication (chat API → OpenClaw gateway → SSE stream), and npm distribution (Rust binary → platform packages → JS shim). Include ASCII diagrams for graph index lifecycle and workflow state machine.
**Effort:** S (human) → S (CC)
**Depends on:** Phase 1 core (graph index) shipping first — document what exists.

## P3 — Keyboard Shortcuts
**What:** Add vim-style keyboard navigation: `j`/`k` for list navigation, `s` save, `a` apply, `/` focus search, `Esc` close panels, `?` shortcut reference overlay.
**Why:** Power users (developers, frequent job seekers) navigate faster with keyboard. Makes the product feel professional.
**Pros:** Power user satisfaction, accessibility improvement, professional feel.
**Cons:** Complexity of managing focus state and preventing conflicts with text input.
**Context:** Needs a keyboard shortcut provider at the layout level that tracks active page and input focus. Should be disabled when typing in forms or chat input. Reference: GitHub's keyboard shortcut system.
**Effort:** S (human) → S (CC)
**Depends on:** Core UI features complete (self-serve forms, inbox).

## P2 — Authenticated Site Applying
**What:** Add cookie-based authentication for browser applying on LinkedIn, Greenhouse, Lever, and other sites that require login.
**Why:** Phase 1.5 launches with public sites only (per CEO review security decision, 2026-03-19). Authenticated sites have the best jobs but require credential handling.
**Pros:** Dramatically expands the set of jobs the agent can apply to. Unlocks LinkedIn, Greenhouse, Lever — where most senior engineering roles live.
**Cons:** Security surface (credential storage or cookie import), site-specific form handling, higher maintenance burden as sites change their forms.
**Context:** Decision from /plan-ceo-review Section 3: deferred to build trust with public sites first. Cookie import via /setup-browser-cookies is the likely approach — reuse existing browser session, no credential storage. Each site needs a form adapter (form field detection + mapping).
**Effort:** M (human) → S (CC)
**Depends on:** Phase 1.5 browser bridge shipping and proving value with public sites.

## P3 — Incremental Graph Index Updates
**What:** Replace full graph rebuild with incremental updates — track which file changed and update only affected edges in `.graph.json`.
**Why:** Full rebuild is O(n) where n = all files. Fine at 100 files (<100ms) but sluggish at 1000+ files (~500ms-1s per rebuild).
**Pros:** Graph stays fast as career data grows. Writes don't trigger expensive full scans.
**Cons:** More complex invalidation logic — need to track which edges belong to which source file.
**Context:** Decision from /plan-ceo-review Section 1: lazy rebuild (dirty flag) is the Phase 1 approach. Incremental is the optimization when performance demands it. The dirty flag pattern means rebuilds only happen on reads, not writes, so the urgency is lower.
**Effort:** S (human) → S (CC)
**Depends on:** Phase 1 graph index shipping and reaching ~500+ career files.

## P3 — Graph Visualization Virtualization
**What:** Add virtualization or node clustering to the career context graph visualization for users with 200+ nodes.
**Why:** The D3 career-graph component renders all nodes in the DOM. Senior engineers with 20+ years of experience may have 200-300 nodes (skills + companies + contacts + jobs).
**Pros:** Smooth interaction even with large career graphs. Enables zoom-to-cluster exploration.
**Cons:** Virtual scrolling adds complexity to D3 force-directed layout. Clustering algorithm needed for semantic grouping.
**Context:** First users are senior engineers (3-15 years experience). A 10-year career could easily produce 50+ companies, 100+ skills, 50+ contacts = 200+ nodes. Current D3 component handles this fine for rendering but force simulation gets expensive.
**Effort:** S (human) → S (CC)
**Depends on:** Phase 1 graph visualization shipping.
