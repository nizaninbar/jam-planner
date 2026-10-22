-- Safe, additive migration - run this once in the Supabase SQL Editor.
-- Adds per-event push reminders: an admin/member picks an exact date+time (`remind_at`) on an event,
-- and the `send-reminders` edge function (called every 5 minutes by pg_cron) pushes a notification to
-- every device that enabled notifications (`push_subscriptions`).
--
-- Before running the cron part (bottom), enable Database > Extensions: pg_cron and pg_net, and create
-- the vault secret described there. See docs/REMINDERS.md for the full setup.

alter table gigs add column if not exists remind_at timestamptz;
alter table gigs add column if not exists reminder_sent_at timestamptz;

-- One row per device (browser endpoint). A user may have several devices.
create table if not exists push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  band_id text not null references bands(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

-- Users manage only their own devices, and only for a band they belong to. The edge function reads
-- every row with the service role, which bypasses RLS.
create policy "own push select" on push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own push insert" on push_subscriptions for insert to authenticated
  with check (user_id = (select auth.uid()) and public.my_role(band_id) is not null);
create policy "own push update" on push_subscriptions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.my_role(band_id) is not null);
create policy "own push delete" on push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Scheduler (run after enabling the pg_cron and pg_net extensions)
-- ---------------------------------------------------------------------------------------------
-- 1. Store the shared secret the function checks (pick any long random string; use the SAME value
--    for `supabase secrets set CRON_SECRET=...`):
--      select vault.create_secret('<long-random-string>', 'reminders_cron_secret');
-- 2. Schedule the job. Replace <project-ref> with the 20-letter ref from your Supabase URL
--    (https://<ref>.supabase.co) - a leftover placeholder fails with "Couldn't resolve host name",
--    visible via: select * from net._http_response order by created desc limit 5;
--      select cron.schedule(
--        'send-reminders',
--        '*/5 * * * *',
--        $$ select net.http_post(
--             url := 'https://<project-ref>.supabase.co/functions/v1/send-reminders',
--             headers := jsonb_build_object(
--               'Content-Type', 'application/json',
--               'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_cron_secret')
--             ),
--             body := '{}'::jsonb
--           ) $$
--      );

-- Rollback, if ever needed (safe - nothing old was touched):
--   select cron.unschedule('send-reminders');
--   drop table push_subscriptions;
--   alter table gigs drop column remind_at;
--   alter table gigs drop column reminder_sent_at;
