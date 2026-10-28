# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Moodi** — 기분에 맞는 음악을 기록하면 AI가 무드 태그와 감성 코멘트를 붙여주고, 팔로우한 친구들과 실시간으로 음악 취향을 공유하는 소셜 음악 다이어리.

**Current scope:** the core loop is built and deployed — auth, record (+ AI mood suggestion, editing today's record), diary (+ AI daily comment), music search, and the weekly-poster home (`/`). Not built yet: follow / user search, `/profile/[id]`, realtime feed & likes, Playwright e2e. Specs and decisions live under `docs/`; read the relevant one before implementing:

| File | Contents |
|---|---|
| `docs/spec.md` | Full feature spec, implementation status, DB schema, AI integration design notes |
| `docs/ci-cd.md` | CI/CD pipeline YAML, branch strategy, branch protection, DB migration procedure |
| `docs/adr/` | Decision records, one per file: 0001 folder structure · 0002 CI/CD deploy · 0003 iTunes · 0004 Supabase · 0005 Gemini · 0006 AI comment policy · 0007 one record per day |
| `docs/ui-plan.md` | Per-page UX decisions (resolved) and open questions |
| `docs/design/home-mockup.html` | Interactive mockup of the `/` home (open in a browser) |
| `docs/design/record-mockup.html` | Interactive mockup of `/record` (poster preview + form) |
| `docs/design/diary-mockup.html` | Interactive mockups of `/diary` — three variants; variant A (Mood Tide) is the one built |

When these docs and this file disagree, the docs are newer — reconcile before coding.
(The 1-month MVP schedule is kept in the author's local notes, not in the repo.)

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **State**: TanStack Query (server state / caching); everything else is local `useState` / `useActionState` plus one React context (`features/nav/RightPanel`). Zustand is installed but **unused** — no shared client state has been needed yet.
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage) with Row Level Security
- **Music**: iTunes Search API (Apple) — no auth/key; called server-side via a Route Handler for caching + rate-limit
- **AI**: LLM API (currently Gemini Flash-Lite free tier; swappable behind `MoodSuggester`, e.g. Claude Haiku — `docs/adr/0005-llm-provider-gemini.md`) — server-side only, called through Next.js Route Handlers

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

E2E is **not set up yet**: Playwright is not a dependency and CI has no `e2e` job. Planned: a Chromium smoke test (login → record → view).

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
LLM_API_KEY=              # LLM provider key (Gemini API key for now) — server-side only
```

The iTunes Search API needs no key — nothing to configure for music search.

## Architecture

### Page Routes
| Route | Single purpose |
|---|---|
| `/` | The user's last 7 days as a weekly poster carousel (KST, today selected) with a "selected day" detail panel; today's record can be edited from there |
| `/record` | Capture today's music + mood fast: live poster preview on the left, form (memo → mood → save) on the right; includes AI mood suggestion. `?edit=1` opens today's record for editing (saving replaces it) |
| `/diary` | Mood-colored month calendar (tiles tinted by the day's mood, month mood-distribution bar) with the selected day's detail beside it (below on narrow screens) incl. AI daily comment; defaults to today's record, else the latest recorded day; can't navigate past the current month |
| `/search` | Music search (iTunes). User search by nickname is not built |
| `/login`, `/signup` | Public auth pages — the only public routes |
| `/profile/setup` | First-login nickname + avatar setup |
| `/profile/[id]` | Public user profile — **not built yet** |

### Database Schema (Supabase PostgreSQL)
```
users     — id (UUID), nickname, avatar_url
records   — id, user_id (→users), track_id, track_name, artist, album_art, preview_url,
            mood, mood_source ('user' | 'ai'), memo,
            ai_comment (nullable — filled asynchronously after save),
            created_at,
            record_date (generated: created_at as a KST date) — unique (user_id, record_date)
follows   — follower_id (→users), following_id (→users)   # one-directional
likes     — user_id (→users), record_id (→records)
```

`mood` enum: `exciting | calm | energetic | sad | focused` (설레는 | 차분한 | 신나는 | 우울한 | 집중되는)

**One record per user per KST day** (`docs/adr/0007-one-record-per-day.md`): saving again the same day replaces today's row (refreshes `created_at`, clears and regenerates `ai_comment`); past days are never replaced. Day boundaries always come from `shared/lib/date/kst.ts` — never the browser's local time zone.

RLS: records are publicly readable; all writes restricted to the authenticated owner.

### AI integration — the load-bearing design decision

Two LLM endpoints, deliberately split by sync vs async so the AI never blocks the core record-save flow:

- **`POST /api/ai/mood-suggest`** — `{ memo, trackName, artist } → { suggestedMood, reason }`
  - **Synchronous.** Called (debounced) while the user types the memo on `/record`, before save.
  - Result shows as an editable badge; user accepts it or picks a different mood.
  - On LLM failure: **silently skip** — user selects a mood manually.

- **`POST /api/ai/daily-comment`** — `{ recordId } → { comment }`
  - **Asynchronous.** `saveRecord` starts generation with Next's `after()` once the row is saved (the save never awaits it); this endpoint is the retry path. The server reads the record from the DB, so clients can't forge content; ownership is checked in the route (`docs/adr/0006-ai-comment-policy.md`).
  - Client shows a skeleton, polls while generating, and reconciles via TanStack Query invalidation when the comment arrives.
  - On failure: surface a retry button.

- **API keys stay server-side.** The client always calls internal routes (`/api/...`), never the LLM or the music API directly.
- `mood_source` records whether the stored mood came from the AI suggestion or a manual pick — kept as a product metric (adoption rate), not just a UI detail.

### Music (iTunes Search API)
The frontend never calls iTunes directly — it hits `/api/music/search`, a Route Handler that wraps a `MusicProvider` implementation (`shared/lib/music/`) and returns a normalized response (`trackId`, `trackName`, `artist`, `albumArt`, `previewUrl`). No auth or API key. A short server-side cache absorbs the iTunes Search API rate limit (~20 req/min); the client debounces search input. Swapping providers later = a new `MusicProvider` impl + one wiring change. Rationale: `docs/adr/0003-music-provider-itunes.md`.

### Auth
Supabase Auth email login/signup. On first login, redirect to profile setup (nickname + avatar). Access is **login-only, default-deny**: only `/login` and `/signup` are public; everything else requires a session, and `/api/*` answers 401 without one. Enforced in `proxy.ts` (Next 16 renamed middleware) — rules in `features/auth/protected-paths.ts`.

### Realtime (Phase 2) — not started
`/` is now the user's own weekly view. Friends' records will become a new section in its right panel once follow exists, subscribing to `records` inserts over Supabase Realtime (like counts live too). Keep UI consistent with TanStack Query invalidation or optimistic updates rather than manual cache surgery.

## Conventions

- **A "day" is a KST day** (ADR-0007). Use `shared/lib/date/kst.ts` for ranges, keys, and times.
- **Next 16:** `searchParams` is a Promise (type pages with `PageProps<"/route">`); route protection lives in `proxy.ts`.
- **Lint enforces React purity:** no `Date.now()` in render, no `setState` directly in an effect — derive state instead.

## Code Organization — lightweight FSD

Full Feature-Sliced Design is **intentionally not used** (only ~5 pages — the full layer stack adds folder overhead with no payoff; rationale in `docs/adr/0001-folder-structure.md`). Borrow only the feature-slice idea layered on App Router conventions:

```
app/                  Next.js routes + Route Handlers (/api/*)
features/<name>/       auth, comment, diary, home, nav, profile-setup, record, search — UI + hooks + logic per feature
entities/<name>/       user, record — shared domain models & helpers (record also holds the `PosterFace` card used by both `/` and `/record`)
shared/ui/             reusable primitives (AlbumArt, Avatar, Drawer, icons, ...)
shared/lib/            Supabase clients, music/AI providers, date/kst, shared hooks
```

## CI/CD & Branching

Set up in **week 1, before feature work** — it's infrastructure used every commit, not a finishing step. Full detail in `docs/ci-cd.md`; deploy-strategy rationale in `docs/adr/0002-ci-cd-deploy-strategy.md`.

- **CI** — `.github/workflows/ci.yml`, job `verify` (lint → typecheck → test → build) on every PR and `main` push. An `e2e` job is planned but not added yet.
- **CD** — Vercel Git integration: PR → preview deploy, `main` merge → production deploy. No Actions deploy job, no approval gate (see ADR-0002 — Actions-triggered deploy was considered and dropped for MVP scope).
- Runtime env vars (Supabase / LLM) go in **Vercel project → Environment Variables**; also add to GitHub Secrets once `npm run build` in CI needs them.
- **GitHub Flow**: `main` only, always deployable. Short-lived `feature/*` and `fix/*` branches. Branch protection requires a PR plus the `verify` status check before merge.
- **DB migrations are not part of CI/CD.** Apply them by hand to the Supabase project right around the merge — procedure in `docs/ci-cd.md`.
- **Split PRs small enough to merge before they're wired to a screen** (e.g. API/logic first, UI wiring in a later PR) — since `main` merge deploys straight to production.

## Development Order

**MVP — status as of 2026-10-28:**
1. ✅ Next.js/TS/Tailwind scaffold + lightweight-FSD folders + CI/CD pipeline + branch protection
2. ✅ Supabase project + schema/RLS migration
3. ✅ Auth (login/signup/profile setup)
4. ✅ iTunes search Route Handler (`/api/music/search`)
5. ✅ Record form + AI mood-tag suggestion (`/api/ai/mood-suggest`)
6. ✅ Calendar history (`/diary`) + AI daily comment (`/api/ai/daily-comment`, async UI)
7. ⏸ Follow & user search (basic) + profile page — not started (cut from the September scope)

Also shipped: one-record-per-day replace-on-save (ADR-0007), global sidebar / top-bar shell, the weekly-poster home with record editing, the `/record` poster-preview layout (#57), and the `/diary` Mood Tide redesign (#61 calendar, #62 detail panel).

**Next candidates:** unify the top spacing of `/`, `/diary`, `/record`, `/search` in `AppShell` (each page sets its own top padding today); mobile layouts for `/record` and `/diary`.

**Phase 2:** Realtime feed, realtime like reactions, UI polish, accessibility/perf pass — not started.

**Cut order if time runs short:** (1) Realtime feed + likes, (2) Playwright e2e (keep lint/typecheck/build), (3) follow/user search. Weeks 1–2 scope (record + AI mood suggestion + calendar) must ship regardless.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
