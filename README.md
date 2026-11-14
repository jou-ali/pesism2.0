# TOURNAX

Website, admin panel and WhatsApp score bot for the TOURNAX eFootball tournament.

> Season 3 is on the horizon. Every win counts. Every goal matters. Every defeat will be remembered.

## Stack
- **Web**: Next.js + TypeScript (`apps/web`), deployed on Vercel — public site + admin panel
- **API**: Spring Boot 3 / Java 21 (`apps/backend`), deployed on Railway — the only thing that
  talks to Postgres; schema is Flyway-versioned (`apps/backend/src/main/resources/db/migration`)
- **Database**: Supabase Postgres, behind PgBouncer, reached only from `apps/backend`
- **Bot**: Node + Baileys WhatsApp bot (`apps/bot`), always on host — scaffold only, not yet wired up
- **Core**: shared tournament logic with tests (`packages/core`)

## Getting started
```bash
npm install
npm test            # core logic tests
npm run dev         # web on http://localhost:3000
npm run bot         # WhatsApp bot (needs apps/bot/.env)
```
Run the backend separately from `apps/backend` (`./gradlew bootRun`) — the web app expects it on
`http://localhost:8080` by default. The site (`/`, `/table`, `/fixtures`, `/players/[id]`,
`/matches/[id]`) is a real Next.js app under `apps/web`. `design/landing.html` is kept as the
original static design reference only (no longer the source of truth for color — see
`ARCHITECTURE.md`).

Copy `.env.example` to `apps/web/.env.local`, `apps/backend/.env` and `apps/bot/.env` when you
connect Supabase and the bot.

## Docs
- `CLAUDE.md`: project brief and rules (read by Claude Code)
- `ARCHITECTURE.md`: how the pieces fit together — data flow, data model, frontend structure, design system
- `docs/roadmap.md`: phases and checklist
- `docs/whatsapp-bot.md`: bot commands and confirmation flow

---
eFootball™ is a trademark of KONAMI. TOURNAX is an independent community tournament and is not affiliated with KONAMI.
