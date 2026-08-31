# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Moodi** — 기분에 맞는 음악을 기록하면 AI가 무드 태그와 감성 코멘트를 붙여주고, 팔로우한 친구들과 실시간으로 음악 취향을 공유하는 소셜 음악 다이어리.

**Early build phase — Next.js is scaffolded; features are not written yet.** The authoritative specs live under `docs/`; read the relevant one before implementing:

| File | Contents |
|---|---|
| `docs/spec.md` | Full feature spec, DB schema, AI integration design notes |
| `docs/ci-cd.md` | CI/CD pipeline YAML, branch strategy, branch protection setup |
| `docs/adr/0001-folder-structure.md` | Why lightweight-FSD instead of full FSD (decision + trade-offs) |
| `docs/ui-plan.md` | Per-page UX principles and open design decisions |

When these docs and this file disagree, the docs are newer — reconcile before coding.
(The 1-month MVP schedule is kept in the author's local notes, not in the repo.)

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand (client state) + TanStack Query (server state / caching)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage) with Row Level Security
- **Music**: Spotify API — Client Credentials flow, server-side only
- **AI**: LLM API (OpenAI or Claude) — server-side only, called through Next.js Route Handlers

## Commands

The CI pipeline (`docs/ci-cd.md`) runs all of these on every PR, so keep each script working in `package.json`:

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # unit tests (Jest + Testing Library); CI runs: npm run test -- --ci
npm run test:watch # watch mode (local)
```

E2E (added week 2+, Chromium smoke only — login → record → view flow):
```bash
npx playwright test --project=chromium
```

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
LLM_API_KEY=              # OpenAI or Anthropic key — server-side only
```

Spotify uses Client Credentials flow (no user OAuth needed for search/preview).

## Architecture

### Page Routes
| Route | Single purpose |
|---|---|
| `/` | Realtime feed of followed users' records |
| `/record` | Capture today's music + mood fast (2–3 taps); includes AI mood suggestion |
| `/diary` | Personal music calendar, mood-colored, with AI daily comment |
| `/search` | Music search (Spotify) & user search (by nickname) |
| `/profile/[id]` | Public user profile — their record history |

### Database Schema (Supabase PostgreSQL)
```
users     — id (UUID), nickname, avatar_url
records   — id, user_id (→users), track_id, track_name, artist, album_art, preview_url,
            mood, mood_source ('user' | 'ai'), memo,
            ai_comment (nullable — filled asynchronously after insert),
            created_at
follows   — follower_id (→users), following_id (→users)   # one-directional
likes     — user_id (→users), record_id (→records)
```

`mood` enum: `exciting | calm | energetic | sad | focused` (설레는 | 차분한 | 신나는 | 우울한 | 집중되는)

RLS: records are publicly readable; all writes restricted to the authenticated owner.

### AI integration — the load-bearing design decision

Two LLM endpoints, deliberately split by sync vs async so the AI never blocks the core record-save flow:

- **`POST /api/ai/mood-suggest`** — `{ memo, trackName, artist } → { suggestedMood, reason }`
  - **Synchronous.** Called (debounced) while the user types the memo on `/record`, before save.
  - Result shows as an editable badge; user accepts it or picks a different mood.
  - On LLM failure: **silently skip** — user selects a mood manually.

- **`POST /api/ai/daily-comment`** — `{ trackName, artist, mood, memo } → { comment }`
  - **Asynchronous, fire-and-forget** after the record row is inserted. The insert must not await this.
  - Client shows a skeleton, then reconciles via TanStack Query `invalidateQueries` / optimistic update when the comment arrives.
  - On failure: surface a retry button.

- **API keys stay server-side.** The client always calls internal routes (`/api/...`), never the LLM or Spotify directly.
- `mood_source` records whether the stored mood came from the AI suggestion or a manual pick — kept as a product metric (adoption rate), not just a UI detail.

### Spotify
Client Credentials flow inside Route Handlers (`/api/spotify/search`). Fetch and cache the token server-side. The frontend never talks to Spotify directly.

### Auth
Supabase Auth email login/signup. On first login, redirect to profile setup (nickname + avatar). Route protection via middleware.

### Realtime (Phase 2)
Feed `/` subscribes to `records` inserts over Supabase Realtime WebSockets; like counts update live too. Keep UI consistent with TanStack Query invalidation or optimistic updates rather than manual cache surgery.

## Code Organization — lightweight FSD

Full Feature-Sliced Design is **intentionally not used** (only ~5 pages — the full layer stack adds folder overhead with no payoff; rationale in `docs/adr/0001-folder-structure.md`). Borrow only the feature-slice idea layered on App Router conventions:

```
app/                  Next.js routes + Route Handlers (/api/*)
features/<name>/       record, feed, diary, search, follow — UI + hooks + logic per feature
entities/<name>/       user, record — shared domain models & components
shared/ui/             reusable primitives (mood badge, record card, ...)
```

## CI/CD & Branching

Set up in **week 1, before feature work** — it's infrastructure used every commit, not a finishing step. Full detail in `docs/ci-cd.md`; deploy-strategy rationale in `docs/adr/0002-ci-cd-deploy-strategy.md`.

- **CI** — `.github/workflows/ci.yml`, job `verify` (lint → typecheck → test → build) on every PR and `main` push. `e2e` (Playwright smoke) added week 2+.
- **CD** — Vercel Git integration: PR → preview deploy, `main` merge → production deploy. No Actions deploy job, no approval gate (see ADR-0002 — Actions-triggered deploy was considered and dropped for MVP scope).
- Runtime env vars (Supabase / Spotify / LLM) go in **Vercel project → Environment Variables**; also add to GitHub Secrets once `npm run build` in CI needs them.
- **GitHub Flow**: `main` only, always deployable. Short-lived `feature/*` and `fix/*` branches. Branch protection requires a PR plus the `verify` status check before merge.
- **Split PRs small enough to merge before they're wired to a screen** (e.g. API/logic first, UI wiring in a later PR) — since `main` merge deploys straight to production.

## Development Order

**MVP (weeks 1–3, must-ship):**
1. Next.js/TS/Tailwind scaffold + lightweight-FSD folders + CI/CD pipeline + branch protection
2. Supabase project + schema/RLS migration
3. Auth (login/signup/profile setup)
4. Spotify search Route Handler
5. Record form + AI mood-tag suggestion (`/api/ai/mood-suggest`)
6. Calendar history (`/diary`) + AI daily comment (`/api/ai/daily-comment`, async UI)
7. Follow & user search (basic) + profile page

**Phase 2 (week 4, if time allows):** Realtime feed, realtime like reactions, UI polish, accessibility/perf pass.

**Cut order if time runs short:** (1) Realtime feed + likes, (2) Playwright e2e (keep lint/typecheck/build), (3) follow/user search. Weeks 1–2 scope (record + AI mood suggestion + calendar) must ship regardless.
