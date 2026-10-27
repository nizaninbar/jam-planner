-- Content writes (events, songs, links, playlists) become admin-only. Members keep editing only
-- their own availability (policies from migrate_06 stay); viewers stay read-only.
-- Safe to re-run. Run in the Supabase SQL Editor after migrate_06.

-- gigs / songs / playlists carry band_id directly.
do $$
declare
  t text;
begin
  foreach t in array array['gigs', 'songs', 'playlists'] loop
    execute format('drop policy if exists "editors insert %1$s" on %1$I', t);
    execute format('drop policy if exists "editors update %1$s" on %1$I', t);
    execute format('drop policy if exists "editors delete %1$s" on %1$I', t);
    execute format('drop policy if exists "admin insert %1$s" on %1$I', t);
    execute format('drop policy if exists "admin update %1$s" on %1$I', t);
    execute format('drop policy if exists "admin delete %1$s" on %1$I', t);
    execute format('create policy "admin insert %1$s" on %1$I for insert to authenticated with check (public.my_role(band_id) = ''admin'')', t);
    execute format('create policy "admin update %1$s" on %1$I for update to authenticated using (public.my_role(band_id) = ''admin'') with check (public.my_role(band_id) = ''admin'')', t);
    execute format('create policy "admin delete %1$s" on %1$I for delete to authenticated using (public.my_role(band_id) = ''admin'')', t);
  end loop;
end $$;

-- song_links: band via songs.
drop policy if exists "editors insert song_links" on song_links;
drop policy if exists "editors update song_links" on song_links;
drop policy if exists "editors delete song_links" on song_links;
drop policy if exists "admin insert song_links" on song_links;
drop policy if exists "admin update song_links" on song_links;
drop policy if exists "admin delete song_links" on song_links;
create policy "admin insert song_links" on song_links for insert to authenticated
  with check (exists (select 1 from songs s where s.id = song_links.song_id and public.my_role(s.band_id) = 'admin'));
create policy "admin update song_links" on song_links for update to authenticated
  using (exists (select 1 from songs s where s.id = song_links.song_id and public.my_role(s.band_id) = 'admin'))
  with check (exists (select 1 from songs s where s.id = song_links.song_id and public.my_role(s.band_id) = 'admin'));
create policy "admin delete song_links" on song_links for delete to authenticated
  using (exists (select 1 from songs s where s.id = song_links.song_id and public.my_role(s.band_id) = 'admin'));

-- playlist_songs: band via playlists.
drop policy if exists "editors insert playlist_songs" on playlist_songs;
drop policy if exists "editors update playlist_songs" on playlist_songs;
drop policy if exists "editors delete playlist_songs" on playlist_songs;
drop policy if exists "admin insert playlist_songs" on playlist_songs;
drop policy if exists "admin update playlist_songs" on playlist_songs;
drop policy if exists "admin delete playlist_songs" on playlist_songs;
create policy "admin insert playlist_songs" on playlist_songs for insert to authenticated
  with check (exists (select 1 from playlists p where p.id = playlist_songs.playlist_id and public.my_role(p.band_id) = 'admin'));
create policy "admin update playlist_songs" on playlist_songs for update to authenticated
  using (exists (select 1 from playlists p where p.id = playlist_songs.playlist_id and public.my_role(p.band_id) = 'admin'))
  with check (exists (select 1 from playlists p where p.id = playlist_songs.playlist_id and public.my_role(p.band_id) = 'admin'));
create policy "admin delete playlist_songs" on playlist_songs for delete to authenticated
  using (exists (select 1 from playlists p where p.id = playlist_songs.playlist_id and public.my_role(p.band_id) = 'admin'));
