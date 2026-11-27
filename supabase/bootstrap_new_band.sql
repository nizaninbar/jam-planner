-- Creates an additional band with its members and an admin invite. Run in the Supabase SQL Editor
-- AFTER migrate_13_multi_band.sql. Edit the values in the three marked places first.
--
-- Member ids are global primary keys, so they must differ from existing ones (the first band already
-- uses 'nitzan', 'dudu', ...): prefix them with the band id, e.g. 'band2-nitzan'.
--
-- A player who is in both bands has ONE login and a member row in each band. To add an existing user
-- to this band: they open the printed invite link while signed in to their existing account; it adds
-- the band to their account (use their member row's id below as the invite's member).
-- Everyone else gets an invite from the "ניהול" tab once the first admin is in.

-- 1. The band.
insert into bands (id, name) values ('band2', 'בית לקשישי')            -- <- band id + display name
on conflict (id) do nothing;

-- 2. Its members (one row per player, even if they also play in another band).
insert into members (id, band_id, name) values
  ('band2-nitzan', 'band2', 'ניצן'),                                      -- <- members
  ('band2-dudu',   'band2', 'דודו'), 
  ('band2-mati',    'band2', 'מתי'),
  ('band2-hagai',   'band2', 'חגי')
  
on conflict (id) do nothing;

-- 3. 7-day admin invite for the first admin; prints the part of the link to share.
with t as (
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') as token
),
ins as (
  insert into invites (band_id, member_id, role, token_hash, expires_at)
  select 'band2', 'band2-nitzan', 'admin',                                -- <- band id, member id of the admin
         encode(sha256(convert_to(token, 'UTF8')), 'hex'),
         now() + interval '7 days'
  from t
  returning id
)
select '#/invite/' || t.token as invite_path from t, ins;
