-- Run once in the Supabase SQL Editor, right after migrate_06_add_iam.sql.
-- Creates a 7-day admin invite for the member below and prints the part of the link to share.
--
-- Open   https://<your-site>/jam-planner/#/invite/<token>   (or http://localhost:5173/jam-planner/#/invite/<token>)
-- in your own browser, then use the "ניהול" tab to invite everyone else and attach your Google account.
--
-- Change 'main-band' / 'nitzan' to the band and member that should become the first admin.

with t as (
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') as token
),
ins as (
  insert into invites (band_id, member_id, role, token_hash, expires_at)
  select 'main-band', 'nitzan', 'admin',
         encode(sha256(convert_to(token, 'UTF8')), 'hex'),
         now() + interval '7 days'
  from t
  returning id
)
select '#/invite/' || t.token as invite_path from t, ins;
