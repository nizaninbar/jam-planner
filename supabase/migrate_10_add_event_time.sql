-- Safe, additive migration - run this once in the Supabase SQL Editor.
-- Adds an optional start time to events (stored in the table still named `gigs`). It is a plain
-- wall-clock time ("20:30") with no time zone, matching how `date` is a plain calendar day.
-- Existing events keep a null time and show exactly as before.

alter table gigs add column if not exists start_time time;

-- Rollback, if ever needed (safe - nothing old was touched):
--   alter table gigs drop column start_time;
