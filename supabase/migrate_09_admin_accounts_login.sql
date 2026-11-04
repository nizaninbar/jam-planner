-- admin_list_accounts: an account "has a login" if it has an email (username/password) or is not
-- anonymous (Google). Setting a password via the set-credentials function can leave is_anonymous true.
create or replace function public.admin_list_accounts(p_band_id text)
returns table (user_id uuid, member_id text, role text, is_anonymous boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if public.my_role(p_band_id) is distinct from 'admin' then
    raise exception 'admins only' using errcode = '42501';
  end if;
  return query
    select a.user_id, a.member_id, a.role, (u.is_anonymous and u.email is null), a.created_at
    from public.member_accounts a join auth.users u on u.id = a.user_id
    where a.band_id = p_band_id
    order by a.created_at;
end $$;
