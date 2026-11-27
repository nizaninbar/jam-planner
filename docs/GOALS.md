# Goals

## Global goal
Jam Planner is a **band management assistant**: one shared place where a band runs its day-to-day.
It started as, and remains, the fastest way to see at a glance who's free and when. That calendar
is the first feature; more are added one at a time.

## Features
| Feature | Status |
| --- | --- |
| Availability calendar (who's free, gigs, rehearsals) | Done - unchanged |
| Playlists (songs, links, ordered lists, event link) | Done |
| Band-wide links (header strip) | Done |
| Multiple bands (header switcher; players in both) | Done - run `migrate_13` |
| Anything beyond that | TBD |

## Audience
The author's own band first, plus a second band that shares some players (multi-band, see
`docs/TECHNICAL.md#multiple-bands`). Self-signup is not a goal right now.

## Principles
- The calendar stays a first-class, visual view.
- Mobile-friendly is a requirement (see `.claude/skills/mobile-ui-ux/SKILL.md`).
- Hebrew RTL UI, dark theme.
- Supabase is the single source of truth.
- Small increments, real feedback from the band.

## Non-goals (for now)
- Multi-band self-signup / in-app band creation (bands are added with SQL).
- Cross-band availability sharing or conflict warnings (availability is per band).
- A native app.
- Hosting or streaming audio - recordings are links only.

## Roadmap
Nothing is currently committed; Playlists (v1) shipped. A UI/UX pass is queued in
`docs/UX_REVIEW.md` (3 phases).

Ideas, not scheduled and unprioritized: member add/rename UI, a middle availability state
("prefer not"), rehearsal-time suggestions, rehearsal attendance
confirmation, setlist extras, a recordings library.

## Done
- Dynamic band members, free navigation to any month
- Modern React SPA, mobile-friendly
- Each member edits their own availability directly on the calendar
- Shared Supabase backend (no per-browser localStorage)
- Dates can be marked as a gig (with a location) or a rehearsal (guided or band-only), optionally with a start time
- Upcoming events: a read-only "קרובים" tab listing every event from today onward, grouped by month
  (type, date, time, location, playlist); tapping one opens that day in the calendar. Chose a tab
  over a "next event" card above the calendar so the whole schedule is visible, not just one event.
  No schema change.
- Calmer look (2026-11-24): the groovy sunset/sticker style was too loud. Now one indigo accent on
  neutral surfaces, 1px borders and soft shadows, no sunburst, a subtle indigo header gradient (kept
  a little character on purpose). Dark mode is true black (OLED, good on a stage tablet); light is a
  warm cream (the original surfaces, calmer accent). Status colours (ok/missing/event/rehearsal) stay distinct but muted. The logo is the
  original vinyl-on-sunburst logo with muted colours and no pick. Mouse-wheel scrolling in the song view broke once because `overscroll-behavior: contain` on the (overflow-x:auto) sheet trapped vertical wheel scroll; only the x axis is contained now.
- Rehearsal-safe song view: swipe-between-tabs was removed (it fired by accident while playing; tabs
  are the navigation). The chord sheet has A−/A+ buttons (70–240%, remembered per device in
  localStorage `sheetFontScale`). Pinch-zoom is blocked only on the sheet (`touch-action: pan-x pan-y`)
  and horizontal overscroll is disabled while a sheet is shown. We did not add `user-scalable=no`
  globally (accessibility). The back gesture can't be blocked; it already steps song → list via
  `useHistoryNav`, so it doesn't leave the app. Rejected: a full "performance mode" toggle (more UI
  for little gain over the A−/A+ buttons).
- Full-screen song mode (2026-11-24): a "מסך מלא" button in the sheet toolbar (beside transpose, so no scrolling to find it) opens a fixed overlay with
  one slim bar (exit, prev/next song, title and position) and the scrolling sheet with its sticky
  transpose / A−/A+ / direction controls. Also requests browser fullscreen and a screen wake lock
  (both best-effort; iPhone Safari lacks fullscreen, the overlay still covers the page). Esc or the
  close button exits. It stays on while moving between songs of a playlist. State is local to
  `SongDetail`, not in history, so the back gesture still goes song → list.
- Playlists: reusable songs with lyrics/chords/structure/links, ordered playlists, optional event link
- Identity & access: admin-created personal invite link per member, optional Google attach for
  sign-in from any device, roles admin / member / viewer enforced by RLS

## Identity & access
- **Roles:** `admin` (everything, plus member/account/invite management and future admin settings),
  `member` (create/edit/delete events, songs, links, playlists; edit only their own availability),
  `viewer` (read-only; may not be a band member). No account = no data.
- **Sign-in:** an admin creates a one-time, 7-day link per member (no need to know their Google
  account). Opening it creates an anonymous Supabase session bound to that member + role. The app
  then recommends attaching Google (`linkIdentity`, same user id) so any other device can use
  "Sign in with Google". A member may have several devices; claiming never kicks out another one.
- **Schema:** `member_accounts` (user -> band/member/role), `invites` (sha256 token hash), security
  definer functions `my_role`, `create_invite`, `claim_invite`, `admin_*`; see
  `supabase/migrate_06_add_iam.sql`. Client side: `src/data/authService.ts` (the only auth caller)
  and pure `src/utils/permissions.ts`.
- **Portability:** the Supabase-specific parts are that migration, `auth.uid()` in the policies and
  `authService.ts`; the rest of the app only sees an `Account { role, memberId }`.

## Playlists spec

### Entities
- **Playlist** - `name`, `description`, and an optional link to one **event** (a gig is the main
  use). One playlist per event: an event has at most one playlist, and a playlist has at most one
  event. Deleting the event unlinks the playlist; it is not deleted.
- **Song** - a standalone entity, reusable across playlists: `name`, `lyrics`, `chords`,
  `structure` (a text description of the song's structure), and a list of links. Edit it once and
  it changes everywhere it appears. A song also has an optional play-along `sheet` (see below);
  the older separate `chords`/`lyrics` fields stay and are shown when a song has no sheet.
- **Link** - belongs to a song, managed manually, any number per song: `description` (e.g.
  "Original", "Our rehearsal recording 2026-10") plus a `url`.
- **Playlist-song connection** - many-to-many: playlist + song + `position`. Every playlist is
  ordered, and the same song can sit at a different position in each list it belongs to.
  Reordering or removing a song in one playlist doesn't affect the others. Deleting a song removes
  it from all lists (with a confirmation).

All song fields except `name` are optional. URLs are validated as http(s).

### UX sketch
Playlists list -> playlist detail (ordered songs, reorder, add an existing song or create a new
one; the linked events come below the songs) -> song view/edit (properties and links). A song page shows which playlists it's in. From an
event's day editor, show/create/link that event's playlist. Mobile-first and RTL.

### Play-along sheet (chords above lyrics) — Done
- **Format**: one text block (`songs.sheet`, `migrate_11_add_song_sheet.sql`) whose lines strictly
  alternate: line 1 chords, line 2 lyrics, line 3 chords, ... Position alone decides the type (no
  chord detection). Two chord lines in a row = an empty lyrics line between them; an empty chord
  line = lyrics with no chords. Rendered monospace so chords stay above their words.
- **Direction**: a sheet containing Hebrew letters is laid out right-to-left as a whole (chords
  count from the right, so the first chord is over the first word); otherwise left-to-right. A
  button flips it manually (view and editor share it; not saved, resets per song).
- **Editing**: admins edit it in `SongDetail`'s edit mode; a one-tap button interleaves the legacy
  chords and lyrics fields into a starting sheet.
- **Transposition**: −/+ semitone buttons above the sheet shift every chord (root and slash bass),
  per viewer and not saved; the stored sheet is never changed. Chords keep their column so they stay
  above their words. Sharps/flats follow the sheet's own accidentals (neutral guitar spelling
  otherwise). Logic: `transposePairs` in `src/utils/chordSheet.ts`.

### Band-wide links — Done
- Same shape as song links (description + http(s) URL, opens in a new tab) but for the whole band:
  shared drive, group chat, rehearsal-room site. Table `band_links` (`migrate_12_band_links.sql`),
  `Band.links`, `addBandLink` / `deleteBandLink` in `bandService.ts`.
- **Placement**: a collapsible "🔗 קישורים" strip (`BandLinks.tsx`) right under the header, on every tab,
  collapsed by default. Chosen over a new nav tab (mobile nav is already 4–5 tabs) and over the
  settings menu (too hidden for something the whole band uses). Hidden when empty for non-admins.
- **Access**: everyone in the band reads; admins add/delete (RLS + `canEditContent`). No reordering
  or editing in place (delete and re-add), like song links.
- The link list + add form is the shared `LinkList.tsx`, also used by `SongDetail`.

### Out of scope for v1
Audio upload/playback, per-member parts, lyrics import, a saved per-song key.

### Implementation notes
- **Types** (`src/types/band.ts`): `Link { id, description, url }`,
  `Song { id, name, lyrics?, chords?, structure?, sheet?, links: Link[] }`,
  `Playlist { id, name, description, entries: { songId, position }[] }`. `Band` gains
  `songs` and `playlists`.
- **Schema** (new additive migration, like `supabase/migrate_01_*`):
  - `songs(id, band_id, name, lyrics, chords, structure)`
  - `song_links(id, song_id fk cascade, position, description, url)`
  - `playlists(id, band_id, name, description)`; events link to a playlist via
    `gigs.playlist_id` (fk, on delete set null) so one playlist can serve many events
    (the events table is still named `gigs`; see `supabase/migrate_05_*`)
  - `playlist_songs(playlist_id fk cascade, song_id fk cascade, position,
    primary key (playlist_id, song_id), unique (playlist_id, position) deferrable)`
  - RLS open like the other tables until auth exists.
- **Service**: `src/data/bandService.ts` stays the only Supabase caller. Add CRUD for
  songs/links/playlists and a reorder operation, re-fetching `getBand` as today. Use explicit FK
  hints in embeds - the new many-to-many paths make PostgREST embeds ambiguous (PGRST201).
- **Logic**: pure helpers (ordering, "playlists containing a song") live in `src/utils/`, not in
  components.
