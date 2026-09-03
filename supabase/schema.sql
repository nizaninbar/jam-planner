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
  location text
);

create table if not exists availability (
  band_id text not null references bands(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  date date not null,
  status text not null check (status in ('available', 'unavailable')),
  primary key (band_id, member_id, date)
);

-- RLS is enabled with fully open policies for now (no auth yet, same exposure as the
-- localStorage version it replaces). Auth will later tighten these policies without
-- needing a schema change.
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
