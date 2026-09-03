-- PHASE A - safe, additive, reversible. Run this now.
-- Adds band_id to gigs/availability and backfills it from the existing period_id
-- link. Does NOT drop period_id or the periods table - old data stays put as a
-- safety net until the app is confirmed working, then
-- supabase/migrate_02_drop_periods_cleanup.sql removes it.

alter table gigs add column if not exists band_id text references bands(id);
alter table availability add column if not exists band_id text references bands(id);

update gigs set band_id = periods.band_id
  from periods where gigs.period_id = periods.id;

update availability set band_id = periods.band_id
  from periods where availability.period_id = periods.id;

alter table gigs alter column band_id set not null;
alter table availability alter column band_id set not null;

-- The new app code writes availability rows without a period_id (there's no period
-- concept anymore), so period_id can no longer be required on new rows.
alter table availability alter column period_id drop not null;

-- availability's primary key is still (period_id, member_id, date); the app now
-- upserts against (band_id, member_id, date) instead, so add that as a unique
-- constraint it can target. (Its primary key changes to this in Phase B.)
alter table availability add constraint availability_band_member_date_key unique (band_id, member_id, date);

-- Rollback for this file alone, if ever needed (nothing old was touched or made
-- required, so this is safe even after real use):
--   alter table availability drop constraint availability_band_member_date_key;
--   alter table availability alter column period_id set not null;
--   alter table gigs drop column band_id;
--   alter table availability drop column band_id;
