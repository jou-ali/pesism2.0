# Roadmap

Tick items off as they ship. Keep each phase shippable on its own.

## Phase 0: Scaffold ✅
- [x] npm workspaces monorepo (web, bot, core)
- [x] Core logic with tests: round robin fixtures, standings with tiebreakers, top scorers, `!r` parser
- [x] Supabase schema draft
- [x] Static landing design at `design/landing.html`

## Phase 1: Public site (static data)
- [x] Unslop `design/landing.html` into a TOURNAX-specific direction (WhatsApp result-flow hero moment, quieted glow/wash layer, removed invented sponsors/testimonials/teaser)
- [x] Port `design/landing.html` into Next.js components (split into sections under `apps/web/components`)
- [x] Keep Lenis smooth scroll, spring reveals, loader, menu overlay, modal (ported in `components/site-interactions.tsx`)
- [x] Pages: `/` landing, `/table`, `/fixtures`, `/players/[id]`
- [x] Data from a local `seed.ts` until Supabase is wired; standings/top scorers computed via `@tournax/core`, never hardcoded

## Phase 2: Backend + admin
Built as a Spring Boot API (`apps/backend`) over Supabase Postgres via Flyway migrations
(`V1`...`V16`), not the originally-planned Supabase-direct-from-Next.js approach — see
`ARCHITECTURE.md`.
- [x] Backend schema via Flyway (`apps/backend/src/main/resources/db/migration`)
- [x] Registration form (email OTP) writes to `players` + `tournament_players` (pending approval)
- [x] Admin auth (password-gated admin console session)
- [x] Admin: approve players, generate/schedule league fixtures, enter/edit results, grievances,
      fair play stats, audit log
- [x] Admin-only team management (Admin → Teams): team name + crest upload, no player-facing
      setup flow, no stored team colours (fallback crest colours are hash-derived from the name)
- [x] Admin Season Control: phase (draft/registration/league/knockout/finished), start/close
      matchday (blocks on missing team names for MD1, warns-only on missing crests)
- [x] Public table and top scorers computed with `@tournax/core`

## Phase 3: WhatsApp bot
- [ ] Baileys login on the spare number, persist `auth/`
- [ ] `!r` → result_claims, reaction confirm / dispute, timeout to disputed
- [ ] `bot_outbox` sender
- [ ] Deploy to an always on host

## Phase 4: Knockouts and extras
- [x] Knockout bracket *view* (quarter-finals → semi-finals → final) on the home page, built from
      whichever knockout-stage matches exist — admin creates them manually via the stage picker on
      the fixture-scheduling form. **Not done**: seeding/auto-generating the bracket from league
      standings, or advancing winners automatically — a deliberate scope cut, see
      `.claude/plans/delightful-bouncing-ritchie.md` for the reasoning.
- [ ] `!table`, `!fixtures`, deadline reminders
- [ ] Shareable result / table images (OG image route)
- [ ] Player login with WhatsApp OTP, "My matches" confirm / dispute buttons
- [ ] Season archive and hall of fame
