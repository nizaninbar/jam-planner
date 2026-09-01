# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) and build to `dist/`
- `npm run lint` — run oxlint
- `npm run preview` — serve the production build locally

No test framework is set up yet.

## Environment
Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`) — copy to
`.env.local` for local dev. In CI these come from the repo secrets `SUPABASE_URL`/
`SUPABASE_ANON_KEY`, injected in `.github/workflows/deploy.yml`. The anon key is meant to end up in
the public bundle; Supabase Row Level Security is the actual access control, not key secrecy.

## Architecture
React + TypeScript SPA (Vite). RTL Hebrew UI, dark theme (`src/index.css`). Data lives in Supabase
(Postgres via PostgREST) — see `supabase/schema.sql` for the schema (tables mirror
`src/types/band.ts` almost 1:1) and its RLS policies (currently open to all, since there's no auth
yet; that's the seam where auth will later tighten each policy).

Data flows one direction:
- `src/types/band.ts` — the domain model: a `Band` has `Member[]` and `Period[]`; each `Period` has its own `Gig[]` and `Availability[]` (member+date unavailability records — absence of a record means available).
- `src/data/supabaseClient.ts` — the Supabase client, built from the env vars above.
- `src/data/bandService.ts` — `getBand(id)` / `setMemberAvailability(...)` are the only files that talk to Supabase; everything else works with the plain `Band` shape and doesn't know or care where the data comes from.
- `src/utils/calendar.ts` — pure functions deriving the calendar from a `Period`: `getMonthsInRange` (which months to render) and `getDayStatus` (gig / all-clear / missing-members / outside-range for a given date). Business logic lives here, not in components.
- `src/components/` — `Calendar` renders one `MonthGrid` per month, each `MonthGrid` renders `DayCell`s driven entirely by `getDayStatus`. No calendar data is hardcoded in JSX.

The app currently renders a single band (`App.tsx` calls `getBand('main-band')`) even though the data model already supports multiple bands — see README's Future Vision for the staged roadmap (self-service editing and this Supabase migration are done; auth is next).
