-- Multi-band: one login can belong to several bands (a player who plays in two groups).
-- Safe to re-run. Run in the Supabase SQL Editor after migrate_12. No data is changed.
--
-- Before: member_accounts had one row per auth user (PK user_id), so a user was in exactly one band.
-- After:  one row per (user, band); each row carries that band's member + role. Availability, events,
--         songs, etc. stay strictly per band (a player enters availability separately in each band).

-- 1. member_accounts: primary key (user_id) -> (user_id, band_id).
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.member_accounts'::regclass and conname = 'member_accounts_pkey'
      and array_length(conkey, 1) = 1
  ) then
    alter table public.member_accounts drop constraint member_accounts_pkey;
    alter table public.member_accounts add constraint member_accounts_pkey primary key (user_id, band_id);
  end if;
end $$;

-- 2. claim_invite: a signed-in user may join an additional band. Still refuses a second account in the
--    SAME band (that would be a stale link or someone else's browser).
create or replace function public.claim_invite(p_token text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_invite public.invites;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select * into v_invite from public.invites
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and claimed_at is null and expires_at > now()
  for update;
  if not found then
    raise exception 'invalid or expired invite' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.member_accounts where user_id = v_uid and band_id = v_invite.band_id) then
    raise exception 'this browser is already signed in to that band; sign out first' using errcode = 'P0001';
  end if;

  insert into public.member_accounts (user_id, band_id, member_id, role)
  values (v_uid, v_invite.band_id, v_invite.member_id, v_invite.role);

  update public.invites set claimed_at = now(), claimed_by = v_uid where id = v_invite.id;
end $$;

revoke all on function public.claim_invite(text) from public, anon;
grant execute on function public.claim_invite(text) to authenticated;

-- push_subscriptions keeps one row per device; send-reminders now finds a band's devices through
-- member_accounts, so a device receives reminders for every band its user belongs to (no change needed here).
