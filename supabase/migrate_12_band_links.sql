-- Band-wide links (name + URL), shown in a collapsible strip in the app header.
-- Read: any role in the band. Write: admin only (same as song_links after migrate_08).
-- Safe to re-run. Run in the Supabase SQL Editor after migrate_08.

create table if not exists band_links (
  id text primary key,
  band_id text not null references bands(id) on delete cascade,
  position integer not null,
  description text not null default '',
  url text not null check (url ~* '^https?://')
);

create index if not exists band_links_band_id_idx on band_links(band_id);

alter table band_links enable row level security;

drop policy if exists "band read band_links" on band_links;
drop policy if exists "admin insert band_links" on band_links;
drop policy if exists "admin update band_links" on band_links;
drop policy if exists "admin delete band_links" on band_links;

create policy "band read band_links" on band_links for select to authenticated
  using (public.my_role(band_id) is not null);
create policy "admin insert band_links" on band_links for insert to authenticated
  with check (public.my_role(band_id) = 'admin');
create policy "admin update band_links" on band_links for update to authenticated
  using (public.my_role(band_id) = 'admin') with check (public.my_role(band_id) = 'admin');
create policy "admin delete band_links" on band_links for delete to authenticated
  using (public.my_role(band_id) = 'admin');
