# Goals

## Global goal
Jam Planner is a **band management assistant**: one shared place where a band runs its day-to-day.
It started as, and remains, the fastest way to see at a glance who's free and when. That calendar
is the first feature; more are added one at a time.

## Features
| Feature | Status |
| --- | --- |
| Availability calendar (who's free, gigs, rehearsals) | Done - unchanged |
| Playlists | Next |
| Anything beyond that | TBD |

## Audience
The author's own band first. The data model already supports multiple bands, but multi-band UI and
self-signup are not goals right now.

## Principles
- The calendar stays a first-class, visual view.
- Mobile-friendly is a requirement (see `.claude/skills/mobile-ui-ux/SKILL.md`).
- Hebrew RTL UI, dark theme.
- Supabase is the single source of truth.
- Small increments, real feedback from the band.

## Non-goals (for now)
- Multi-band self-signup.
- A native app.
- Hosting or streaming audio - recordings are links only.

## Roadmap
**Playlists only.** Nothing else is committed.

Ideas, not scheduled and unprioritized: user authentication, a middle availability state
("prefer not"), an upcoming-events list, rehearsal-time suggestions, rehearsal attendance
confirmation, setlist extras, a recordings library.

## Done
- Dynamic band members, free navigation to any month
- Modern React SPA, mobile-friendly
- Each member edits their own availability directly on the calendar
- Shared Supabase backend (no per-browser localStorage)
- Dates can be marked as a gig (with a location) or a rehearsal (guided or band-only)

## Playlists spec

### Entities
- **Playlist** - `name`, `description`, and an optional link to one **event** (a gig is the main
  use). One playlist per event: an event has at most one playlist, and a playlist has at most one
  event. Deleting the event unlinks the playlist; it is not deleted.
- **Song** - a standalone entity, reusable across playlists: `name`, `lyrics`, `chords`,
  `structure` (a text description of the song's structure), and a list of links. Edit it once and
  it changes everywhere it appears. Chords are plain text for now; how they're displayed is
  deferred.
- **Link** - belongs to a song, managed manually, any number per song: `description` (e.g.
  "Original", "Our rehearsal recording 2026-10") plus a `url`.
- **Playlist-song connection** - many-to-many: playlist + song + `position`. Every playlist is
  ordered, and the same song can sit at a different position in each list it belongs to.
  Reordering or removing a song in one playlist doesn't affect the others. Deleting a song removes
  it from all lists (with a confirmation).

All song fields except `name` are optional. URLs are validated as http(s).

### UX sketch
Playlists list -> playlist detail (ordered songs, reorder, add an existing song or create a new
one) -> song view/edit (properties and links). A song page shows which playlists it's in. From an
event's day editor, show/create/link that event's playlist. Mobile-first and RTL.

### Out of scope for v1
Audio upload/playback, chord display and transposition, per-member parts, lyrics import.

### Implementation notes
- **Types** (`src/types/band.ts`): `Link { id, description, url }`,
  `Song { id, name, lyrics?, chords?, structure?, links: Link[] }`,
  `Playlist { id, name, description, eventId?, entries: { songId, position }[] }`. `Band` gains
  `songs` and `playlists`.
- **Schema** (new additive migration, like `supabase/migrate_01_*`):
  - `songs(id, band_id, name, lyrics, chords, structure)`
  - `song_links(id, song_id fk cascade, position, description, url)`
  - `playlists(id, band_id, name, description, event_id unique null fk -> gigs on delete set null)`
    (the events table is still named `gigs`)
  - `playlist_songs(playlist_id fk cascade, song_id fk cascade, position,
    primary key (playlist_id, song_id), unique (playlist_id, position) deferrable)`
  - RLS open like the other tables until auth exists.
- **Service**: `src/data/bandService.ts` stays the only Supabase caller. Add CRUD for
  songs/links/playlists and a reorder operation, re-fetching `getBand` as today. Use explicit FK
  hints in embeds - the new many-to-many paths make PostgREST embeds ambiguous (PGRST201).
- **Logic**: pure helpers (ordering, "playlists containing a song") live in `src/utils/`, not in
  components.
