# Technical Overview

## Stack
- **React + TypeScript**, built with **Vite**.
- **Supabase** (hosted Postgres + PostgREST) as the backend — no custom server.
- **GitHub Pages** for hosting, deployed via **GitHub Actions**.
- Dark theme, RTL Hebrew UI (`src/index.css`), designed mobile-first (see [Mobile design](#mobile-design) below).

No test framework or linter beyond `oxlint` is set up yet.

## Data model
The domain model (`src/types/band.ts`) is the source of truth for shape:

```ts
Band { id, name, members: Member[], gigs: Gig[], availability: Availability[] }
Member { id, name }
Gig { id, date, label }
Availability { memberId, date, status: 'available' | 'unavailable' }
```

`gigs` and `availability` are band-wide — not scoped to any date range — which is what lets the
calendar navigate freely to any month. `availability` only stores records that deviate from the
default: a member with no record for a given date is assumed available. This keeps the common
case (everyone's free) cheap to store and render.

Supabase tables (`supabase/schema.sql`) mirror this almost 1:1: `bands`, `members`, `gigs`,
`availability`, using the same string ids as primary keys (e.g. `main-band`, `nitzan`). Postgres
`date` columns round-trip as plain `'YYYY-MM-DD'` strings through PostgREST, so no date parsing
happens at the network boundary.

There used to be a `Period` concept (a named date range gigs/availability belonged to) — it was
removed once the calendar became free-navigating, since nothing displayed a period's name/range
anymore and a member should be able to set availability for any date, not just inside some
predefined window. `supabase/migrate_01_add_band_id.sql` / `migrate_02_drop_periods_cleanup.sql`
document that migration as a safe, two-phase change (additive first, destructive cleanup only once
confirmed working) for removing a concept like this from a live database with real data without
losing a rollback window.

One schema gotcha worth knowing: PostgREST infers relationships from foreign keys, and because
`availability` has FKs to both `bands` and `members`, PostgREST also infers an implicit
many-to-many "bands via availability to members" path — which makes a plain `members(id,name)`
embed under `bands` ambiguous (PGRST201). `bandService.ts`'s query disambiguates with
`members!members_band_id_fkey(id,name)`, pointing PostgREST at the direct FK instead of letting it
guess.

The data model already supports multiple bands (each with its own members/gigs/availability), but
the app currently only ever renders one (`App.tsx` hardcodes `getBand('main-band')`). Multi-band UI
(e.g. a band switcher) isn't built yet.

## Data flow
- `src/data/supabaseClient.ts` — creates the Supabase client from env vars.
- `src/data/bandService.ts` — the *only* file that talks to Supabase. `getBand(bandId)` runs one
  nested PostgREST query (band → members, gigs, availability) and maps the snake_case rows into
  the `Band` shape above. `setMemberAvailability(...)` deletes the availability row when a member
  is set back to available (matching the "no record = available" convention) or upserts one
  otherwise (targeting the `(band_id, member_id, date)` unique constraint explicitly via
  `onConflict`), then re-fetches and returns the updated `Band`.
- `src/utils/calendar.ts` — pure functions that derive what a day looks like: `getDayStatus` (gig /
  all-clear / missing-members for a given date) and `getMemberStatus`. All the "what does this day
  look like" logic lives here, not scattered across components.
- `src/components/Calendar.tsx` — owns `visibleMonth` state (defaults to today's real month) and
  renders one `MonthGrid` at a time with `‹ הקודם` / `היום` / `הבא ›` navigation buttons. Each
  `MonthGrid` renders `DayCell`s driven entirely by `getDayStatus`; clicking a day opens
  `DayEditorModal`, which lists every member with an available/unavailable toggle for that date.

No component imports Supabase directly — swapping the backend again in the future should only
mean changing `bandService.ts`.

## Local development
1. Copy `.env.example` to `.env.local` and fill in your Supabase project's URL and anon/publishable
   key (Project Settings → API in the Supabase dashboard).
2. `npm install`
3. `npm run dev`

`npm run build` type-checks (`tsc -b`) and produces a static `dist/` via `vite build`.

## Security model
There is no authentication yet. Every table's Row Level Security policy (`supabase/schema.sql`) is
fully open — anyone with the anon key can read and write any row. This is the same exposure the
previous localStorage-only version had (anyone editing the page could change anyone's status); the
data is just shared now instead of siloed per browser.

The Supabase anon/publishable key is meant to be public — it ends up in the built JS bundle and is
visible to anyone who opens the site. RLS policies are the actual access control, not the key's
secrecy. When auth is added, each policy's `using (true)` / `with check (true)` gets replaced with
a real check (e.g. `auth.uid() = ...`), without needing a schema change.

## Deployment
`.github/workflows/deploy.yml` runs on every push to `main`: `npm ci && npm run build`, injecting
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from the repo secrets `SUPABASE_URL`/
`SUPABASE_ANON_KEY`, then publishes `dist/` via `actions/deploy-pages`. The repo's GitHub Pages
source is set to "GitHub Actions" (not "deploy from a branch" — the raw source can't run without a
build step, `vite.config.ts`'s `base: '/jam-planner/'` is what makes the built asset paths resolve
correctly on the `github.io/jam-planner/` project-pages URL).

Live at: **https://nizaninbar.github.io/jam-planner/**

## Mobile design
The project has a dedicated skill at `.claude/skills/mobile-ui-ux/SKILL.md` with the design rules
for this app (keep the real 7-day week grid instead of collapsing structure to save space, respect
RTL, real touch targets, verify at actual phone viewports). Worth knowing: a real bug was found and
fixed this way — plain `grid-template-columns: repeat(7, 1fr)` has no minimum track size, so text
content could force columns wider than the viewport and push the whole calendar off-screen below
~375px. The fix (`repeat(7, minmax(0, 1fr))` plus `min-width: 0` on the cells) is the reason that
pattern is used instead of a bare `1fr` anywhere grid columns hold text content.
