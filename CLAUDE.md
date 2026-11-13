# TOURNAX: project brief for Claude Code

TOURNAX is a community **eFootball tournament** run over a WhatsApp group, now in **Season 3**.
This repo is the website (registration, fixtures, live table, top scorers, admin panel) plus a
WhatsApp bot that lets players report scores straight from the group.

Tone of the brand: competitive, playful banter. "Find out who's actually good at eFootball and
who's just good at talking." Every win counts. Every goal matters. Every defeat will be remembered.

## Repo layout
```
apps/web        Next.js (App Router, TypeScript): public site + admin panel
apps/bot        Node + Baileys WhatsApp bot (always-on process)
packages/core   Pure TS tournament logic shared by web and bot. No I/O. Fully tested.
supabase/       SQL migrations (Postgres on Supabase)
design/         landing.html = the original static design draft (no longer the source of truth
                for color — the live site's tokens are, see ARCHITECTURE.md)
docs/           roadmap.md (phases and checklist), whatsapp-bot.md (bot spec)
.claude/skills  landing-page-design skill (see Design below for overrides)
```

See `ARCHITECTURE.md` for how the pieces fit together (data flow, data model, frontend structure).

## Commands
```
npm install          # once, from the repo root
npm run dev          # web on http://localhost:3000 (the real site: /, /table, /fixtures, /players/[id])
npm test             # core logic tests (node:test via tsx)
npm run typecheck    # all workspaces
npm run bot          # WhatsApp bot (needs apps/bot/.env, prints a QR to scan on first run)
```

## Current phase
Check `docs/roadmap.md`, work on the first unchecked phase, tick items as you finish them.

## Domain rules (do not change without asking)
- **Format**: league stage (round robin, everyone plays everyone), then the top N
  (`knockout_qualifiers`, default 8) go to knockouts: quarter-finals → semi-finals → final, all
  single matches. The number is always a tournament setting — never hardcode it in copy.
- **Points**: win 3, draw 1, loss 0 (configurable per tournament).
- **Tiebreakers**: points, goal difference, goals scored, head to head. Implemented in `packages/core/src/standings.ts`.
- **Standings and top scorers are always computed, never stored.** Use `computeStandings` and `topScorers`.
- **Only `confirmed`, `resolved` and `forfeit` matches count.** `pending_confirmation` and `disputed` never do.
- **Both players must confirm a result.** The reporter counts as one confirmation, the opponent's
  👍 (bot) or Confirm button (site) is the second. 👎 or no answer within 12 hours goes to the admin dispute queue.
- **Admins** can enter or override any result directly. Every admin change writes to `audit_log`.
- **Identity** is the WhatsApp number (digits only). Never expose phone numbers publicly
  (use the `public_players` view).
- **Teams**: the player picks their team name at registration (required, ≤30 chars); the admin
  owns the crest and two team colours. The team name locks once the tournament leaves
  `registration` — except admins, who can always override it. Players who registered before team
  names existed get a one-time, 7-day "complete your team" link from the admin Teams panel. No
  crest yet → a generated SVG shield from the team's colours + initials, so nothing ever looks
  broken.
- Scores are reported sender first: `!r 3-1 @opp` means sender 3, opponent 1.

## Tech decisions
- Next.js App Router, server components by default, server actions for mutations.
- Supabase: Postgres + RLS on every table. Public reads only where needed; writes with the
  service role key on the server or in the bot. Never ship the service role key to the browser.
- All tournament math lives in `packages/core` with tests. Web and bot import it, never reimplement it.
- The bot never gets called by the web app. The web app inserts rows into `bot_outbox`, the bot sends them.
- The site must fully work without the bot (admin entry + "Share to WhatsApp" link fallback).
- Free tiers: Vercel (web), Supabase (db), Railway or a small VM (bot).

## Design
- Brand v2 (athletic-poster pivot): deep purple-black (`#1E0825`/`#27092F`), mustard yellow accent
  (`#DED002`) and violet accent (`#9938D4`), wine-magenta tag chips (`#830D5C`), Furore for
  display/headline type (the big oversized uppercase moments — hero title, section headlines,
  format numerals, footer mega-wordmark), Sofia Sans (Google Font, falling back to Helvetica Neue)
  for everything else on the public site (body copy, buttons, nav, card/panel subheadings) — the
  admin console is a separate design surface and keeps Onest; spring reveals, Lenis smooth scroll.
  A dedicated semantic green (`--color-success`) is kept separate from the brand yellow for
  "confirmed"/"open" status states — never reuse the yellow accent for status.
- Header wordmark is "TOURNAX" (Furore) with "PESISM 2.0" as the small accent-yellow subtitle beneath it.
- Tokens live in `apps/web/app/tokens.css` (brand) and `apps/web/app/globals.css` (legacy aliases +
  components). `design/landing.html` is the original static draft and is no longer the source of truth
  for color — the live site's tokens are authoritative.
- Display/headline face is "Furore" (caps-only industrial sans, freeware by Jovanny Lemonad —
  files in `apps/web/app/fonts/furore/`, source at the Behance post linked in project history).
  The license is an informal freeware statement, not a formal grant — revisit if this ever needs
  airtight commercial licensing. The earlier "Aougtron"/"Roughtron" font (`/aougtron/` folder) is
  a demo-only redistribution that watermarks every digit — do not use it.
- Use the `landing-page-design` skill for spacing, states (hover, focus, loading, empty, error),
  accessibility, copy rules and motion. **Brand overrides win over the skill**: Onest instead of
  Geist, weights up to 800, uppercase headings, brand gradients on headings are allowed.
- Mobile first: most visitors open links from WhatsApp on a phone. Check every page at 360px.
- No Konami logos, fonts or artwork. "eFootball" is Konami's trademark; keep the footer disclaimer.

## Conventions
- TypeScript strict. No `any` unless commented why.
- Add or update tests in `packages/core/test` for any logic change.
- Small, focused commits with conventional messages (`feat:`, `fix:`, `chore:`, `docs:`).
- Never commit `.env*` files or `apps/bot/auth/`.
- Ask before adding a new dependency that isn't already listed here.

## Open questions for the organiser (Adhil)
- Entry is free (no entry fee — the tournament doesn't generate money; there is no prize pool and
  the public site makes no mention of one). Real dates and number of slots are still placeholders
  on the landing page.
- Top scorer: participant's total goals (current assumption) or in game footballer goals?
- Knockouts: resolved — top 8, single matches, quarter-finals → semi-finals → final.
- What is the "something big" surprise, and should a section stay hidden until it's announced?
