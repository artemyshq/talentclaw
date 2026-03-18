# TODOS

## P2 — Deployable Mode
**What:** Make the Next.js app deployable to Vercel/Fly.io with environment-based data directory config, basic auth (password or token), and HTTPS.
**Why:** Enables mobile access, multi-device usage, and opens the path to a hosted SaaS version. Currently TalentClaw only runs on localhost:3100.
**Pros:** Unlocks mobile, sharing with career coaches, multi-device access. Opens SaaS revenue path.
**Cons:** Filesystem-first architecture needs adaptation (data dir can't be `~/` on a server). Auth adds complexity.
**Context:** The filesystem data layer (`~/.talentclaw/`) works locally but needs an abstraction for remote deployment. Options: mount a volume, use S3-backed storage, or add a DB adapter. The simplest path is Fly.io with a persistent volume.
**Effort:** M (human) → S (CC)
**Depends on:** Core features (self-serve UI, inbox, analytics) being solid.

## P2 — Architecture Documentation
**What:** Create ARCHITECTURE.md documenting data flow, component hierarchy, deployment model, and agent integration patterns.
**Why:** Makes the project accessible to new contributors. CLAUDE.md covers conventions but not architecture.
**Pros:** Faster onboarding for contributors, reduces knowledge concentration risk.
**Cons:** Needs maintenance as architecture evolves.
**Context:** Key flows to document: bootstrap sequence, data mutation path (server actions → fs-data → filesystem → revalidate), agent communication (chat API → OpenClaw gateway → SSE stream), and npm distribution (Rust binary → platform packages → JS shim).
**Effort:** S (human) → S (CC)
**Depends on:** Nothing — can be done anytime.

## P3 — Keyboard Shortcuts
**What:** Add vim-style keyboard navigation: `j`/`k` for list navigation, `s` save, `a` apply, `/` focus search, `Esc` close panels, `?` shortcut reference overlay.
**Why:** Power users (developers, frequent job seekers) navigate faster with keyboard. Makes the product feel professional.
**Pros:** Power user satisfaction, accessibility improvement, professional feel.
**Cons:** Complexity of managing focus state and preventing conflicts with text input.
**Context:** Needs a keyboard shortcut provider at the layout level that tracks active page and input focus. Should be disabled when typing in forms or chat input. Reference: GitHub's keyboard shortcut system.
**Effort:** S (human) → S (CC)
**Depends on:** Core UI features complete (self-serve forms, inbox).
