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
- `src/types/band.ts` — the domain model: a `Band` has `Member[]`, `Event[]`, and `Availability[]` (member+date unavailability records — absence of a record means available). An `Event` is a dated gig or rehearsal (`EventType`), with an optional `location`. Events and availability are band-wide, not scoped to any date range. A `Band` also has `Song[]` (reusable; each with `Link[]`) and `Playlist[]` (ordered `entries` of song id + position, an `Event` optionally points to one playlist via `playlistId`; a playlist can be used by many events).
- `src/data/supabaseClient.ts` — the Supabase client, built from the env vars above.
- `src/data/bandService.ts` — `getBand(id)` and the mutation functions (availability, events, songs, links, playlists, playlist reordering) are the only functions that talk to Supabase; each mutation re-fetches `getBand`. New row ids come from `newId()` (`src/utils/id.ts`), not `crypto.randomUUID()`, which is missing on non-secure pages like the dev server opened from a phone; everything else works with the plain `Band` shape and doesn't know or care where the data comes from. (Events are stored in a table still named `gigs` — renaming a live table wasn't worth the risk; only the app-level name changed.)
- `src/utils/playlists.ts` — pure helpers: ordering, playlists containing a song, playlist for an event, http(s) URL check.
- `src/utils/calendar.ts` — pure functions deriving what a day looks like: `getDayStatus` (event / all-clear / missing-members) and `getMemberStatus`. Business logic lives here, not in components.
- `src/components/Calendar.tsx` — owns which month is currently visible (defaults to today) and renders one `MonthGrid` with prev/next/today navigation; free to browse any month, forward or back. Each `MonthGrid` renders `DayCell`s driven entirely by `getDayStatus`; clicking a day opens `DayEditorModal` (which also shows/creates/links the event's playlist).
- `src/App.tsx` — holds the `Band` and a simple `view` state (no router): `NavTabs` switches between the calendar, `PlaylistsView`/`PlaylistDetail` and `SongsView`/`SongDetail`. Views call the service and hand the resulting promise to `apply`, which sets the band and resolves to `true`/`false` (saved/failed); song and playlist fields feed that into `useSaveStatus` (`src/hooks/`) for the "שומר…/נשמר ✓" indicator. The header's `SettingsMenu` holds the Google-attach and reminders rows, theme toggle and sign-out (dot badge while something is pending); `Icon.tsx` is the shared inline-SVG icon set; `CalendarSkeleton` is the loading state. `SongDetail` is a read view by default with an edit toggle for admins. Only the initial load failing shows the full-screen error; mutation failures go to the `Toast` (`aria-live`, auto-dismiss). Availability toggles are optimistic (`patchAvailability`, reverted on error, the member's button disabled while pending).

Identity & access: `src/data/authService.ts` is the only caller of `supabase.auth` and the IAM RPCs (the auth twin of `bandService.ts`); `src/utils/permissions.ts` holds the pure role checks (`canEditContent`, `canEditAvailability`, `canManageAccess`) used to show/hide controls. Only admins edit content (events, reminders, songs, links, playlists); members edit just their own availability; viewers are read-only. The real enforcement is RLS in `supabase/migrate_06_add_iam.sql`, tightened to admin-only content by `migrate_08_admin_only_content.sql` (the open policies in `schema.sql` are dropped by it). Users sign in via a per-member invite link (`#/invite/<token>`, claimed through an anonymous session in `App.tsx`'s `loadSession`), then optionally attach Google. `App.tsx` gates on `AuthState`: no account shows `NoAccessScreen`; admins get the `MembersAdminView` tab. First admin: `supabase/bootstrap_first_admin.sql`. Dashboard needs anonymous sign-ins, manual linking and the Google provider enabled.

Reminders: an `Event` has an optional `remindAt` (set in `DayEditorModal`, saved via `setEventReminder`). Delivery is Web Push: `src/data/pushService.ts` (the only caller of the push APIs) subscribes the device into `push_subscriptions`; `supabase/functions/send-reminders` (run by pg_cron every 5 min) sends due reminders. PWA files live in `public/`. Setup and testing: `docs/REMINDERS.md`.

Product goals and the Playlists spec are in `docs/GOALS.md` — read it before proposing features.
The open UI/UX backlog (IDs UX-01…UX-27, in phases, with checkboxes) is in `docs/UX_REVIEW.md` —
work through it phase by phase and tick items off as they land.

The app currently renders a single band (`App.tsx` calls `getBand('main-band')`) even though the data model already supports multiple bands — see README's Future Vision and `docs/GOALS.md` for the roadmap (self-service editing, the Supabase migration, free calendar navigation and Playlists are done).
