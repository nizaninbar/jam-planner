-- Run this once in the Supabase SQL Editor, BEFORE deploying the matching app version.
-- Lets one playlist be used by many events: the link moves from playlists.event_id (unique,
-- so one event per playlist) to gigs.playlist_id (an event still has at most one playlist).
-- Existing links are carried over. The events table is still named `gigs`.

alter table gigs
  add column if not exists playlist_id text references playlists(id) on delete set null;

update gigs
set playlist_id = p.id
from playlists p
where p.event_id = gigs.id;

create index if not exists gigs_playlist_id_idx on gigs(playlist_id);

alter table playlists drop column event_id;

-- Make PostgREST pick up the new column immediately.
notify pgrst, 'reload schema';
