# TOURNAX — Architecture

A living reference for how the pieces fit together. `CLAUDE.md` has the rules and conventions;
this doc has the shape of the system. Update it when the shape changes.

## System overview

```
┌──────────────────┐        REST, admin-key auth        ┌──────────────────┐
│   apps/web         │ ──────────────────────────────────▶ │   apps/backend     │
│   Next.js site      │ ◀────────────────────────────────── │   Spring Boot API  │
│   + admin panel      │              JSON                   │                    │
└──────────────────┘                                       └─────────┬──────────┘
                                                                       │ JPA + Flyway
                                                                       ▼
                                                             ┌──────────────────┐
                                                             │  Supabase Postgres │
                                                             │  (pooled, pgbouncer)│
                                                             └──────────────────┘
         ▲
         │ imports (no I/O, pure functions)
┌──────────────────┐
│  packages/core      │  standings, fixtures, top scorers, `!r` command parsing
└──────────────────┘
```

The web app **never talks to Postgres directly** — every read and write goes through the Spring
Boot API (`apps/backend`), which holds the service role / database credentials. Admin-only
endpoints are gated by a single shared `ADMIN_API_KEY` header, checked by one filter
(`AdminApiKeyFilter`); the key lives only in server-side env vars (`apps/web`'s server actions and
`lib/tournax-api.ts`), never shipped to the browser. Public reads (registration window, the
competition snapshot, a single match's detail) are unauthenticated `GET`s.

The WhatsApp bot (`apps/bot`) is still Phase 3 — **not yet wired to this schema**. The original
`bot_outbox` polling table was dropped in migration `V5` when registration moved from WhatsApp OTP
to email OTP; if the bot gets built, its integration point needs to be redesigned against the
current schema rather than assumed from this diagram's earlier draft.

All tournament math — standings, tiebreakers, top scorers, round-robin fixture generation, `!r`
score-command parsing — lives in `packages/core`, is pure (no I/O), and is unit tested. Both the
web app and the (future) bot import it; neither reimplements it.

## Repo layout

```
apps/web        Next.js 16 (App Router, TypeScript): public site + admin panel
apps/backend    Spring Boot 3 (Java 21) REST API: the only thing that talks to Postgres
apps/bot        Node + Baileys WhatsApp bot scaffold (Phase 3, not yet integrated)
packages/core   Pure TS tournament logic shared by web and bot. No I/O. Fully tested.
design/         landing.html — the original static design draft (no longer the color source of truth)
docs/           roadmap.md (phases/checklist), whatsapp-bot.md (bot command spec)
.claude/skills  project-scoped Claude Code skills (design/review tooling, checked in on purpose)
```

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Web | Next.js 16, App Router, TypeScript strict | Server components by default, server actions for mutations |
| Styling | Plain CSS custom properties (no Tailwind on the public site; shadcn/ui + Tailwind in the admin console only) | `tokens.css` + `globals.css`, see Design system below |
| API | Spring Boot 3, Java 21 | `apps/backend`; layered `domain` → `application` → `web`; Flyway-versioned schema |
| Database | Supabase Postgres, behind PgBouncer (transaction pooler) | Reached only from `apps/backend`; JDBC uses `prepareThreshold=0` — the pooler doesn't support server-side prepared statement caching across pooled connections |
| Bot | Node + Baileys (scaffold only, Phase 3) | WhatsApp Web protocol client; persists login in `apps/bot/auth/` (gitignored) |
| Shared logic | `packages/core`, plain TypeScript | `node:test` via `tsx`, no framework |
| Hosting | Vercel (web), Railway (backend), Supabase (db) | |

## Data model (`apps/backend/src/main/resources/db/migration`, Flyway `V1`...`V15`)

```
players              — one row per person (identity = email + WhatsApp number); gaming username,
                        eFootball username, city, avatar_url, email_verified_at
tournaments           — a season; status (draft/registration/league/knockout/finished), points
                        rule, knockout_qualifiers, registration window, current_matchday
tournament_players    — join table; pending → approved per tournament; also owns the team identity:
                        team_name, crest_url, primary_color, secondary_color
team_setup_tokens     — one-time, expiring links an admin issues so a player (registered before
                        team names existed) can set theirs — only while the tournament is still
                        in `registration`
matchdays             — groups matches into rounds; stage (league/quarter_final/semi_final/
                        third_place/grand_final); opens_at/deadline_at once started
matches               — homeId/awayId, stage, scores, status
match_stats           — optional per-match score-sheet stats (possession, shots, fouls, ...)
grievances            — player-raised disputes/issues, with threaded comments
registration_intents  — pending email-OTP registrations (payload + code hash) before a player row exists
registration_audit    — append-only log of registration-flow events (IP/UA included) for abuse review
audit_log             — every admin override (team edits, season-control changes, match results,
                        fixture scheduling), append-only
```

Match status lifecycle (`packages/core/src/types.ts`):

```
scheduled → pending_confirmation → confirmed        (normal path: both players agree)
                                 → disputed → resolved  (👎, timeout, or an admin closing the
                                                          matchday with it unplayed)
                        (admin can also directly set) → forfeit
```

**Only `confirmed`, `resolved` and `forfeit` matches count** toward standings/top scorers.
Standings are **always computed from matches**, never stored — `computeStandings()` and
`topScorers()` in `packages/core` are the only place this math happens, and only over
league-stage matches (knockout-stage matches are excluded before they ever reach those functions).

## Frontend architecture (`apps/web`)

- **Pages** (all in `app/(site)/`): `/` (landing, phase-aware section after the hero), `/table`
  (standings + top scorers), `/fixtures` (matchday-by-matchday schedule and scores), `/matches/[id]`
  (a single match's crests/score/stats), `/players/[id]` (profile + match history), `/team-setup/[token]`
  (the one-time team-name-setup link a player opens), `/rules`, `/grievances`.
- **Data**: every page fetches from the Spring Boot API via `lib/season-competition.ts`
  (`fetchSeasonCompetition`, `fetchMatchDetail`) and `lib/registration-window.ts` — no local seed
  data in production. `computeStandings`/`topScorers` run over whatever `matches` come back, so the
  frontend never knows or cares where the numbers came from.
- **Components** (`components/*.tsx`): one component per landing section, in page order — `hero`,
  `matchday-section` (phase-aware: branches on the tournament's own `status` — registration,
  league's **Matchday Hub** with tabs/match cards/mini table, knockout's bracket, finished's
  champion reveal — falling back to a last-season recap for `draft` or if the status is
  unrecognised), `format`, `quote-divider`, `standings-section`, `players-carousel`, `cta`,
  `footer`, plus header/menu/modal chrome. `match-card.tsx` and `team-crest.tsx` are shared across
  the matchday hub, bracket, match detail page, league table, Golden Boot list, fixtures and player
  cards — one crest-rendering component, used everywhere a crest appears. Server components by
  default; nothing is a client component except what truly needs interactivity.
- **Dev-only phase preview**: `/?phase=registration|league|knockout|finished&md=N` overrides the
  real tournament status for local QA (`phase` is stripped in production builds; `md` is a real,
  always-on matchday tab selector for the league hub).
- **`site-interactions.tsx`** (~540 lines) is the one client component that owns *all* imperative,
  vanilla-JS-style behavior in one place:
  - Lenis smooth scroll (lazy-loaded, degrades to native scroll if it fails to load)
  - A tiny spring-physics engine driving the reveal-on-scroll animations (`data-reveal`,
    `data-split`), run off one shared `requestAnimationFrame` loop (`ticks` set)
  - The intro loader (with a rotating status line), the fullscreen menu, the registration modal,
    the players carousel, the header's scrolled-state and active-nav-link spy
  - Every effect is written to be inert with JS disabled or `prefers-reduced-motion: reduce` set —
    content is visible by default; motion is opt-in once a script confirms it can run
- **Live updates**: `live-competition-refresh.tsx` polls every 10s and calls `router.refresh()`
  (pausing on a hidden tab, an open modal, or a focused admin input) — this re-runs the whole
  server component tree, so any phase-aware section picks up new results without a dedicated
  revalidation path per feature.
- **Icons**: a single inline `<svg><defs>` sprite (`icon-sprite.tsx`) holds the brand gradient and
  reusable `<symbol>`s (including the emblem mark used as the wordmark and the loader mark); the
  hero's trophy is a plain `next/image` (`public/hero/trophy.png`), not an SVG symbol; one-off
  icons are inline path strings via the `Icon` component. Crests without an uploaded image fall
  back to a generated SVG shield (`lib/crest.ts`) from the team's own colours + initials.
- **Admin console** (`app/admin/`): a separate design surface from the public site — shadcn/ui +
  Tailwind, Onest body font (vs. the public site's Helvetica-family stack) — password-gated via a
  signed session cookie, calling the Spring Boot admin endpoints through `lib/tournax-api.ts` and
  server actions in `app/admin/actions.ts`.

## Design system

Brand v2 ("athletic-poster"): deep purple-black, mustard yellow + violet accents, wine-magenta tag
chips, oversized uppercase display type, spring reveals. Full detail and the exact hex/oklch values
are in `apps/web/app/tokens.css` (brand tokens) — that file plus `globals.css`'s "legacy aliases"
block are the single source of truth for every color and font in the app; nothing past that block
uses a literal value.

- **Display/headline font**: Furore (`apps/web/app/fonts/furore/Furore.otf`), a caps-only
  industrial sans. Loaded via `next/font/local`, exposed as `--font-headline`. **License note**:
  it's a freeware release by Jovanny Lemonad with no formal license grant (see
  `apps/web/app/fonts/furore/LICENSE.txt`) — fine for this non-commercial community tournament,
  but revisit if TOURNAX ever needs airtight commercial licensing.
- **Body/UI font** (public site): Sofia Sans (Google Font via `next/font/google`), falling back to
  Helvetica Neue. The admin console keeps Onest separately via `--font-onest`.
- **Status color is deliberately separate from the brand accent**: `--color-success` (green) is
  used only for "confirmed"/"open" states; the brand's mustard yellow is never reused for status,
  so the two meanings don't collide visually.
- A dedicated `landing-page-design` Claude Code skill (checked into `.claude/skills/`) carries the
  spacing/states/accessibility/copy rules; brand choices above override that skill's defaults
  where they conflict.

## Current phase

See `docs/roadmap.md` for the full checklist. Phase 2 (backend + admin, including teams and season
control) is largely built. Phase 3 (the WhatsApp bot) hasn't started against the current schema —
see the bot_outbox note above. Phase 4 has a knockout bracket *view*, but not bracket
generation/seeding (a deliberate scope cut — see
`.claude/plans/delightful-bouncing-ritchie.md` if it still exists in the repo's plan history).

## Open decisions (ask the organiser)

- Top scorer: participant's total goals (current assumption) or in-game footballer goals?
- What's the "something big" surprise, and should a section stay hidden until it's announced?
- Real tournament dates and slot count are still placeholders on the landing page. Entry is
  confirmed free — no entry fee, no prize pool; the tournament doesn't generate money and the
  public site makes no mention of prize money.
