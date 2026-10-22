-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> Run).
-- Creates the tables backing jam-planner and seeds them with the current band's data.
--
-- If you already ran an earlier version of this file (with a `periods` table), use
-- supabase/migrate_01_add_band_id.sql (and later migrate_02_drop_periods_cleanup.sql)
-- instead to migrate in place without losing data.

create table if not exists bands (
  id text primary key,
  name text not null
);

create table if not exists members (
  id text primary key,
  band_id text not null references bands(id) on delete cascade,
  name text not null
);

create table if not exists gigs (
  id text primary key,
  band_id text not null references bands(id) on delete cascade,
  date date not null,
  label text not null,
  type text not null default 'gig' check (type in ('gig', 'rehearsal-guided', 'rehearsal-band-only')),
  location text,
  playlist_id text -- fk -> playlists, added below (playlists is created later)
);

create table if not exists availability (
  band_id text not null references bands(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  date date not null,
  status text not null check (status in ('available', 'unavailable')),
  primary key (band_id, member_id, date)
);

-- Playlists (see supabase/migrate_04_add_playlists.sql for the in-place migration)
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
  description text not null default ''
);

-- An event has at most one playlist; a playlist can be used by many events.
alter table gigs add constraint gigs_playlist_id_fkey
  foreign key (playlist_id) references playlists(id) on delete set null;

create table if not exists playlist_songs (
  playlist_id text not null references playlists(id) on delete cascade,
  song_id text not null references songs(id) on delete cascade,
  position integer not null,
  primary key (playlist_id, song_id),
  unique (playlist_id, position) deferrable initially deferred
);

create index if not exists songs_band_id_idx on songs(band_id);
create index if not exists song_links_song_id_idx on song_links(song_id);
create index if not exists playlists_band_id_idx on playlists(band_id);
create index if not exists playlist_songs_song_id_idx on playlist_songs(song_id);

alter table songs enable row level security;
alter table song_links enable row level security;
alter table playlists enable row level security;
alter table playlist_songs enable row level security;

create policy "public all songs" on songs for all using (true) with check (true);
create policy "public all song_links" on song_links for all using (true) with check (true);
create policy "public all playlists" on playlists for all using (true) with check (true);
create policy "public all playlist_songs" on playlist_songs for all using (true) with check (true);

-- RLS is enabled with fully open policies here. For a fresh install, run
-- supabase/migrate_06_add_iam.sql afterwards: it drops these open policies and adds
-- roles, invites and role-based policies (then run bootstrap_first_admin.sql).
alter table bands enable row level security;
alter table members enable row level security;
alter table gigs enable row level security;
alter table availability enable row level security;

create policy "public read bands" on bands for select using (true);
create policy "public read members" on members for select using (true);
create policy "public read gigs" on gigs for select using (true);
create policy "public read availability" on availability for select using (true);

create policy "public write availability" on availability
  for all using (true) with check (true);

create policy "public write gigs" on gigs for all using (true) with check (true);

-- Seed data, transcribed from src/data/seed.ts
insert into bands (id, name) values
  ('main-band', 'הלהקה')
on conflict (id) do nothing;

insert into members (id, band_id, name) values
  ('nitzan', 'main-band', 'ניצן'),
  ('dudu', 'main-band', 'דודו'),
  ('yaniv', 'main-band', 'יניב'),
  ('michal', 'main-band', 'מיכל'),
  ('alon', 'main-band', 'אלון'),
  ('liran', 'main-band', 'לירן'),
  ('amir', 'main-band', 'אמיר')
on conflict (id) do nothing;

insert into gigs (id, band_id, date, label) values
  ('gig-2026-10-08', 'main-band', '2026-10-08', 'הופעה!')
on conflict (id) do nothing;

insert into availability (band_id, member_id, date, status) values
  ('main-band', 'alon', '2026-09-04', 'unavailable'),
  ('main-band', 'alon', '2026-09-05', 'unavailable'),
  ('main-band', 'alon', '2026-09-06', 'unavailable'),
  ('main-band', 'michal', '2026-09-08', 'unavailable'),
  ('main-band', 'dudu', '2026-09-10', 'unavailable'),
  ('main-band', 'yaniv', '2026-09-18', 'unavailable'),
  ('main-band', 'dudu', '2026-09-27', 'unavailable'),
  ('main-band', 'dudu', '2026-09-28', 'unavailable'),
  ('main-band', 'dudu', '2026-09-29', 'unavailable'),
  ('main-band', 'nitzan', '2026-09-29', 'unavailable'),
  ('main-band', 'dudu', '2026-09-30', 'unavailable'),
  ('main-band', 'nitzan', '2026-09-30', 'unavailable'),
  ('main-band', 'dudu', '2026-10-01', 'unavailable'),
  ('main-band', 'nitzan', '2026-10-01', 'unavailable'),
  ('main-band', 'dudu', '2026-10-02', 'unavailable'),
  ('main-band', 'nitzan', '2026-10-02', 'unavailable'),
  ('main-band', 'nitzan', '2026-10-03', 'unavailable'),
  ('main-band', 'nitzan', '2026-10-04', 'unavailable')
on conflict (band_id, member_id, date) do nothing;
