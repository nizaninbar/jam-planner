-- Safe, additive migration - run this once in the Supabase SQL Editor.
-- Generalizes "gigs" into typed events (gig / rehearsal-guided / rehearsal-band-only)
-- with an optional location. The table stays named `gigs`; only the app-level name
-- changes to `Event`. Nothing existing is touched: the existing gig row gets
-- type = 'gig' automatically via the column default.

alter table gigs add column if not exists type text not null default 'gig'
  check (type in ('gig', 'rehearsal-guided', 'rehearsal-band-only'));
alter table gigs add column if not exists location text;

-- gigs only had a public *read* policy - fine while it was only ever seeded via SQL,
-- but the app now creates/deletes events from the UI, so it needs a write policy too
-- (same open-for-now pattern as availability's).
create policy "public write gigs" on gigs for all using (true) with check (true);

-- Rollback, if ever needed (safe - nothing old was touched):
--   drop policy "public write gigs" on gigs;
--   alter table gigs drop column type;
--   alter table gigs drop column location;
