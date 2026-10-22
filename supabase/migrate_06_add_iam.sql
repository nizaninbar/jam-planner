-- Identity & access management: roles (admin / member / viewer), invite links, and real RLS.
-- Run once in the Supabase SQL Editor, AFTER the new frontend is deployed.
--
-- WARNING: this drops the fully open policies. Until you run bootstrap_first_admin.sql and open the
-- link it prints, nobody (including you) can read the band's data through the app.
--
-- Dashboard prerequisites (Authentication -> Sign In / Providers):
--   * Allow anonymous sign-ins            (invite links create an anonymous session)
--   * Allow manual linking                (members attach their Google account later)
--   * Google provider enabled             (Google Cloud OAuth client)

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

-- One row per auth user (= per device until a member attaches Google, then their one permanent
-- user). Several rows may point at the same member.
create table if not exists member_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  band_id text not null references bands(id) on delete cascade,
  member_id text references members(id) on delete cascade,
  role text not null check (role in ('admin', 'member', 'viewer')),
  created_at timestamptz not null default now()
);

create index if not exists member_accounts_band_id_idx on member_accounts(band_id);
create index if not exists member_accounts_member_id_idx on member_accounts(member_id);

-- Only the sha256 of the token is stored; the raw token exists once, in the link the admin copies.
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  band_id text not null references bands(id) on delete cascade,
  member_id text references members(id) on delete cascade,
  role text not null check (role in ('admin', 'member', 'viewer')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists invites_band_id_idx on invites(band_id);

alter table member_accounts enable row level security;
alter table invites enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Helpers used by the policies
-- ---------------------------------------------------------------------------------------------

create or replace function public.my_role(p_band_id text) returns text
language sql stable security definer set search_path = '' as $$
  select role from public.member_accounts
  where user_id = (select auth.uid()) and band_id = p_band_id
$$;

create or replace function public.my_member_id(p_band_id text) returns text
language sql stable security definer set search_path = '' as $$
  select member_id from public.member_accounts
  where user_id = (select auth.uid()) and band_id = p_band_id
$$;

-- Raises unless the caller would still leave at least one admin in the band.
create or replace function public.assert_admin_remains(p_band_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.member_accounts where band_id = p_band_id and role = 'admin') then
    raise exception 'the band must keep at least one admin' using errcode = 'P0001';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Invites & account management (all callable only by signed-in users; admin checks inside)
-- ---------------------------------------------------------------------------------------------

-- Returns the raw token ONCE. p_member_id may be null (e.g. a viewer who isn't a band member).
create or replace function public.create_invite(p_band_id text, p_member_id text, p_role text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_token text;
begin
  if public.my_role(p_band_id) is distinct from 'admin' then
    raise exception 'admins only' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'member', 'viewer') then
    raise exception 'invalid role' using errcode = 'P0001';
  end if;
  if p_member_id is not null and not exists (
    select 1 from public.members where id = p_member_id and band_id = p_band_id
  ) then
    raise exception 'unknown member' using errcode = 'P0001';
  end if;

  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.invites (band_id, member_id, role, token_hash, expires_at, created_by)
  values (
    p_band_id, p_member_id, p_role,
    encode(sha256(convert_to(v_token, 'UTF8')), 'hex'),
    now() + interval '7 days',
    (select auth.uid())
  );
  return v_token;
end $$;

-- Binds the calling (anonymous) user to the invite's member + role. Single use.
create or replace function public.claim_invite(p_token text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_invite public.invites;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if exists (select 1 from public.member_accounts where user_id = v_uid) then
    raise exception 'this browser is already signed in; sign out first' using errcode = 'P0001';
  end if;

  select * into v_invite from public.invites
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and claimed_at is null and expires_at > now()
  for update;
  if not found then
    raise exception 'invalid or expired invite' using errcode = 'P0001';
  end if;

  insert into public.member_accounts (user_id, band_id, member_id, role)
  values (v_uid, v_invite.band_id, v_invite.member_id, v_invite.role);

  update public.invites set claimed_at = now(), claimed_by = v_uid where id = v_invite.id;
end $$;

-- Admin view of who has access. is_anonymous = false means a Google account is attached.
create or replace function public.admin_list_accounts(p_band_id text)
returns table (user_id uuid, member_id text, role text, is_anonymous boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if public.my_role(p_band_id) is distinct from 'admin' then
    raise exception 'admins only' using errcode = '42501';
  end if;
  return query
    select a.user_id, a.member_id, a.role, u.is_anonymous, a.created_at
    from public.member_accounts a join auth.users u on u.id = a.user_id
    where a.band_id = p_band_id
    order by a.created_at;
end $$;

-- Changes the role of every device of a member (or of one account for members-less viewers).
create or replace function public.admin_set_role(p_band_id text, p_member_id text, p_user_id uuid, p_role text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.my_role(p_band_id) is distinct from 'admin' then
    raise exception 'admins only' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'member', 'viewer') then
    raise exception 'invalid role' using errcode = 'P0001';
  end if;
  update public.member_accounts set role = p_role
  where band_id = p_band_id
    and ((p_member_id is not null and member_id = p_member_id) or (p_user_id is not null and user_id = p_user_id));
  perform public.assert_admin_remains(p_band_id);
end $$;

-- Removes access: one account (device), or every device of a member.
create or replace function public.admin_revoke(p_band_id text, p_member_id text, p_user_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.my_role(p_band_id) is distinct from 'admin' then
    raise exception 'admins only' using errcode = '42501';
  end if;
  delete from public.member_accounts
  where band_id = p_band_id
    and ((p_member_id is not null and member_id = p_member_id) or (p_user_id is not null and user_id = p_user_id));
  perform public.assert_admin_remains(p_band_id);
end $$;

revoke all on function public.my_role(text), public.my_member_id(text), public.assert_admin_remains(text),
  public.create_invite(text, text, text), public.claim_invite(text), public.admin_list_accounts(text),
  public.admin_set_role(text, text, uuid, text), public.admin_revoke(text, text, uuid)
  from public, anon;
grant execute on function public.my_role(text), public.my_member_id(text),
  public.create_invite(text, text, text), public.claim_invite(text), public.admin_list_accounts(text),
  public.admin_set_role(text, text, uuid, text), public.admin_revoke(text, text, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Policies: drop the open ones, then role-based ones.
-- ---------------------------------------------------------------------------------------------

drop policy if exists "public read bands" on bands;
drop policy if exists "public read members" on members;
drop policy if exists "public read gigs" on gigs;
drop policy if exists "public read availability" on availability;
drop policy if exists "public write availability" on availability;
drop policy if exists "public write gigs" on gigs;
drop policy if exists "public all songs" on songs;
drop policy if exists "public all song_links" on song_links;
drop policy if exists "public all playlists" on playlists;
drop policy if exists "public all playlist_songs" on playlist_songs;

-- Read: any role in the band.
create policy "band read bands" on bands for select to authenticated
  using (public.my_role(id) is not null);
create policy "band read members" on members for select to authenticated
  using (public.my_role(band_id) is not null);
create policy "band read gigs" on gigs for select to authenticated
  using (public.my_role(band_id) is not null);
create policy "band read availability" on availability for select to authenticated
  using (public.my_role(band_id) is not null);
create policy "band read songs" on songs for select to authenticated
  using (public.my_role(band_id) is not null);
create policy "band read playlists" on playlists for select to authenticated
  using (public.my_role(band_id) is not null);
create policy "band read song_links" on song_links for select to authenticated
  using (exists (select 1 from songs s where s.id = song_links.song_id and public.my_role(s.band_id) is not null));
create policy "band read playlist_songs" on playlist_songs for select to authenticated
  using (exists (select 1 from playlists p where p.id = playlist_songs.playlist_id and public.my_role(p.band_id) is not null));

-- Write content (events, songs, links, playlists): admin or member.
create policy "editors insert gigs" on gigs for insert to authenticated
  with check (public.my_role(band_id) in ('admin', 'member'));
create policy "editors update gigs" on gigs for update to authenticated
  using (public.my_role(band_id) in ('admin', 'member'))
  with check (public.my_role(band_id) in ('admin', 'member'));
create policy "editors delete gigs" on gigs for delete to authenticated
  using (public.my_role(band_id) in ('admin', 'member'));

create policy "editors insert songs" on songs for insert to authenticated
  with check (public.my_role(band_id) in ('admin', 'member'));
create policy "editors update songs" on songs for update to authenticated
  using (public.my_role(band_id) in ('admin', 'member'))
  with check (public.my_role(band_id) in ('admin', 'member'));
create policy "editors delete songs" on songs for delete to authenticated
  using (public.my_role(band_id) in ('admin', 'member'));

create policy "editors insert playlists" on playlists for insert to authenticated
  with check (public.my_role(band_id) in ('admin', 'member'));
create policy "editors update playlists" on playlists for update to authenticated
  using (public.my_role(band_id) in ('admin', 'member'))
  with check (public.my_role(band_id) in ('admin', 'member'));
create policy "editors delete playlists" on playlists for delete to authenticated
  using (public.my_role(band_id) in ('admin', 'member'));

create policy "editors insert song_links" on song_links for insert to authenticated
  with check (exists (select 1 from songs s where s.id = song_links.song_id and public.my_role(s.band_id) in ('admin', 'member')));
create policy "editors update song_links" on song_links for update to authenticated
  using (exists (select 1 from songs s where s.id = song_links.song_id and public.my_role(s.band_id) in ('admin', 'member')))
  with check (exists (select 1 from songs s where s.id = song_links.song_id and public.my_role(s.band_id) in ('admin', 'member')));
create policy "editors delete song_links" on song_links for delete to authenticated
  using (exists (select 1 from songs s where s.id = song_links.song_id and public.my_role(s.band_id) in ('admin', 'member')));

create policy "editors insert playlist_songs" on playlist_songs for insert to authenticated
  with check (exists (select 1 from playlists p where p.id = playlist_songs.playlist_id and public.my_role(p.band_id) in ('admin', 'member')));
create policy "editors update playlist_songs" on playlist_songs for update to authenticated
  using (exists (select 1 from playlists p where p.id = playlist_songs.playlist_id and public.my_role(p.band_id) in ('admin', 'member')))
  with check (exists (select 1 from playlists p where p.id = playlist_songs.playlist_id and public.my_role(p.band_id) in ('admin', 'member')));
create policy "editors delete playlist_songs" on playlist_songs for delete to authenticated
  using (exists (select 1 from playlists p where p.id = playlist_songs.playlist_id and public.my_role(p.band_id) in ('admin', 'member')));

-- Availability: admin edits anyone; a member edits only their own.
create policy "own insert availability" on availability for insert to authenticated
  with check (public.my_role(band_id) = 'admin'
    or (public.my_role(band_id) = 'member' and member_id = public.my_member_id(band_id)));
create policy "own update availability" on availability for update to authenticated
  using (public.my_role(band_id) = 'admin'
    or (public.my_role(band_id) = 'member' and member_id = public.my_member_id(band_id)))
  with check (public.my_role(band_id) = 'admin'
    or (public.my_role(band_id) = 'member' and member_id = public.my_member_id(band_id)));
create policy "own delete availability" on availability for delete to authenticated
  using (public.my_role(band_id) = 'admin'
    or (public.my_role(band_id) = 'member' and member_id = public.my_member_id(band_id)));

-- Members: admin only (the app has no member editing UI yet; this is the seam for it).
create policy "admin insert members" on members for insert to authenticated
  with check (public.my_role(band_id) = 'admin');
create policy "admin update members" on members for update to authenticated
  using (public.my_role(band_id) = 'admin') with check (public.my_role(band_id) = 'admin');
create policy "admin delete members" on members for delete to authenticated
  using (public.my_role(band_id) = 'admin');

-- Accounts & invites: a user reads their own account row; admins read/withdraw pending invites.
-- Everything else goes through the security-definer functions above.
create policy "read own account" on member_accounts for select to authenticated
  using (user_id = (select auth.uid()));
create policy "admin read invites" on invites for select to authenticated
  using (public.my_role(band_id) = 'admin');
create policy "admin delete invites" on invites for delete to authenticated
  using (public.my_role(band_id) = 'admin');
