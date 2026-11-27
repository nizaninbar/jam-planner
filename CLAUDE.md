# CLAUDE.md

## Commands
`npm install` · `npm run dev` (Vite) · `npm run build` (`tsc -b` + build) · `npm run lint` (oxlint) · `npm run preview`. No test framework.

## Environment
Needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`, copy to `.env.local`); CI injects them from repo secrets in `.github/workflows/deploy.yml`. The anon key ships in the public bundle on purpose — Supabase RLS is the access control.

## Architecture
React + TypeScript SPA (Vite), RTL Hebrew UI, mobile-first (use the `mobile-ui-ux` skill for UI work), styles in `src/index.css`. Data in Supabase; schema in `supabase/schema.sql` + `supabase/migrate_NN_*.sql` (RLS: admin-only content after `migrate_08`). Data flows one way:
- `src/types/band.ts` — domain model: `Band` → `Member[]`, `Event[]` (dated gig/rehearsal, optional location, `time`, `remindAt`, `playlistId`), `Availability[]` (unavailability only; no record = available), `Song[]` (with `Link[]`, optional play-along `sheet`), `Playlist[]` (ordered `entries`; many events can share one).
- `src/data/bandService.ts` — only caller of Supabase for band data: `getBand(id)` + mutations, each re-fetches `getBand`. Ids from `newId()` (`src/utils/id.ts`), not `crypto.randomUUID()` (missing on non-secure pages, e.g. dev server on a phone). Events live in a table still named `gigs` (renaming a live table wasn't worth the risk).
- `src/data/authService.ts` — only caller of `supabase.auth` and IAM RPCs; `src/data/pushService.ts` — only caller of push APIs.
- `src/utils/` — pure logic, not in components: `calendar.ts` (`getDayStatus`, `getMemberStatus`), `playlists.ts`, `events.ts` (default reminder = 5h before start, `getUpcomingEvents`, shared type labels/icons used by `UpcomingView`), `permissions.ts` (`canEditContent`, `canEditAvailability`, `canManageAccess`), `chordSheet.ts` (sheet parsing, transposition).
- `src/App.tsx` — holds `Band` and a `view` state (no router); `AuthState` gates the app (no account → `NoAccessScreen`; admins get `MembersAdminView`). Views pass mutation promises to `apply` (sets band, resolves true/false); `useSaveStatus` drives the save indicator; failures go to `Toast`, only the initial load failing is full-screen. Availability toggles are optimistic. `AppHeader` greets the member (`account.memberId`); `SettingsMenu` holds Google/reminders/theme/sign-out.
- Calendar: `Calendar.tsx` (visible month, free navigation) → `MonthGrid` → `DayCell` (driven by `getDayStatus`); a day click opens `DayEditorModal` (event + reminder + its playlist).
- Band links: `Band.links` (table `band_links`, `migrate_12`) shown by `BandLinks.tsx`, a collapsible strip under `AppHeader`; list+add form is shared `LinkList.tsx` (also used by `SongDetail`).
- Songs: `SongDetail` is a read view with an admin edit toggle. The `sheet` is plain text whose lines strictly alternate chords/lyrics; `ChordSheet.tsx` renders it with per-viewer transpose, an RTL/LTR toggle (state in `SongDetail`; Hebrew defaults RTL) and A−/A+ font size. Legacy `chords`/`lyrics` show when there's no sheet. `SongDetail` has a full-screen play mode, so `App.tsx` must not give it a `key`; swipe-between-tabs was removed on purpose. Spec: `docs/GOALS.md`.

Roles: only admins edit content; members edit only their own availability; viewers read-only. Enforced by RLS, mirrored in `permissions.ts` to hide controls.

## Detail lives in docs (read the relevant one before changing that area)
- `docs/AUTH.md` — sign-in (invite link, username+password via `set-credentials` edge function, Google), setup, troubleshooting. First admin: `supabase/bootstrap_first_admin.sql`.
- `docs/REMINDERS.md` — Web Push reminders, `send-reminders` function, pg_cron, setup/testing.
- `docs/GOALS.md` — product goals, Playlists and play-along sheet specs; read before proposing features.
- `docs/UX_REVIEW.md` — UI/UX backlog (UX-01…UX-27) with checkboxes; tick items off as they land.
- `docs/TECHNICAL.md`, `docs/BACKUP.md` — technical notes, backups.
- Shipping: `/ship-prod` (`scripts/ship.ps1`, GitHub account `nizaninbar`, squash-merges to `main`). It does NOT run SQL or deploy Supabase functions.
- Multi-band (`migrate_13`, spec in `docs/GOALS.md`): a login has one `member_accounts` row per band (PK `(user_id, band_id)`); `getMyAccounts()` → `App.tsx` shows the remembered/first band and `AppHeader` has a band `<select>` when there are 2+. Everything else (members, availability, events, songs) is strictly per band; a player in two bands has a member row in each. New bands are created in SQL (`supabase/bootstrap_new_band.sql`), not in the app.

## Documentation is the memory between sessions
Each feature is built in a separate session, so the docs are all the next session knows. **Before every `/ship-prod` or commit, update the docs in the same PR:**
- `CLAUDE.md` — only the concise map (new files, data flow, roles). Put long detail in `docs/` and link it; don't let this file grow.
- `docs/GOALS.md` — the feature's spec, decisions, Done/out-of-scope. `README.md` — user-facing Done list.
- Topic docs (`AUTH.md`, `REMINDERS.md`, …) when touched; tick `UX_REVIEW.md` items.
- Schema change: new idempotent `supabase/migrate_NN_*.sql` (never edit applied ones), document it, and tell the user to run it / deploy any edge function.
Record the non-obvious *why* (rejected alternatives, constraints), not just what.
