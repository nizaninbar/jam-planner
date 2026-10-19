-- Safe, additive migration - run this once in the Supabase SQL Editor.
-- Adds Playlists: songs (reusable across playlists), per-song links, playlists (optionally
-- tied to one event), and the ordered playlist <-> song connection.
-- Nothing existing is touched. The events table is still named `gigs`.

create table if not exists songs (
  id text primary key,
  band_id text not null references bands(id) on delete cascade,
  name text not null,
  lyrics text,
  chords text,
  structure text
);

create table if not exists song_links (
  id text primary key,
  song_id text not null references songs(id) on delete cascade,
  position integer not null,
  description text not null default '',
  url text not null check (url ~* '^https?://')
);

create table if not exists playlists (
  id text primary key,
  band_id text not null references bands(id) on delete cascade,
  name text not null,
  description text not null default '',
  -- unique => an event has at most one playlist; deleting the event unlinks the playlist.
  event_id text unique references gigs(id) on delete set null
);

create table if not exists playlist_songs (
  playlist_id text not null references playlists(id) on delete cascade,
  song_id text not null references songs(id) on delete cascade,
  position integer not null,
  primary key (playlist_id, song_id),
  -- deferrable so a reorder can renumber positions within one transaction
  unique (playlist_id, position) deferrable initially deferred
);

create index if not exists songs_band_id_idx on songs(band_id);
create index if not exists song_links_song_id_idx on song_links(song_id);
create index if not exists playlists_band_id_idx on playlists(band_id);
create index if not exists playlist_songs_song_id_idx on playlist_songs(song_id);

-- Open policies, same as the other tables, until auth exists.
alter table songs enable row level security;
alter table song_links enable row level security;
alter table playlists enable row level security;
alter table playlist_songs enable row level security;

create policy "public all songs" on songs for all using (true) with check (true);
create policy "public all song_links" on song_links for all using (true) with check (true);
create policy "public all playlists" on playlists for all using (true) with check (true);
create policy "public all playlist_songs" on playlist_songs for all using (true) with check (true);

-- Rollback, if ever needed (safe - nothing old was touched; drops all playlist/song data):
--   drop table playlist_songs;
--   drop table playlists;
--   drop table song_links;
--   drop table songs;
