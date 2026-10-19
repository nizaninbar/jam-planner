import type { AvailabilityStatus, Band, EventType } from '../types/band';
import { supabase } from './supabaseClient';
import { newId } from '../utils/id';

interface RawEvent {
  id: string;
  date: string;
  label: string;
  type: EventType;
  location: string | null;
}

interface RawAvailability {
  member_id: string;
  date: string;
  status: AvailabilityStatus;
}

interface RawSong {
  id: string;
  name: string;
  lyrics: string | null;
  chords: string | null;
  structure: string | null;
  song_links: { id: string; position: number; description: string; url: string }[];
}

interface RawPlaylist {
  id: string;
  name: string;
  description: string;
  event_id: string | null;
  playlist_songs: { song_id: string; position: number }[];
}

interface RawBand {
  id: string;
  name: string;
  members: { id: string; name: string }[];
  gigs: RawEvent[];
  availability: RawAvailability[];
  songs: RawSong[];
  playlists: RawPlaylist[];
}

function mapBand(raw: RawBand): Band {
  return {
    id: raw.id,
    name: raw.name,
    members: raw.members,
    events: raw.gigs.map((g) => ({
      id: g.id,
      date: g.date,
      type: g.type,
      label: g.label,
      location: g.location ?? undefined,
    })),
    availability: raw.availability.map((a) => ({
      memberId: a.member_id,
      date: a.date,
      status: a.status,
    })),
    songs: raw.songs.map((s) => ({
      id: s.id,
      name: s.name,
      lyrics: s.lyrics ?? undefined,
      chords: s.chords ?? undefined,
      structure: s.structure ?? undefined,
      links: [...s.song_links]
        .sort((a, b) => a.position - b.position)
        .map((l) => ({ id: l.id, description: l.description, url: l.url })),
    })),
    playlists: raw.playlists.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      eventId: p.event_id ?? undefined,
      entries: [...p.playlist_songs]
        .sort((a, b) => a.position - b.position)
        .map((e) => ({ songId: e.song_id, position: e.position })),
    })),
  };
}

export async function getBand(bandId: string): Promise<Band> {
  const { data, error } = await supabase
    .from('bands')
    .select(
      'id, name, members!members_band_id_fkey(id,name), gigs(id,date,label,type,location), availability(member_id,date,status), songs(id,name,lyrics,chords,structure,song_links(id,position,description,url)), playlists(id,name,description,event_id,playlist_songs(song_id,position))',
    )
    .eq('id', bandId)
    .single();

  if (error) {
    throw new Error(`Failed to load band "${bandId}": ${error.message}`);
  }

  return mapBand(data as RawBand);
}

export async function setMemberAvailability(
  bandId: string,
  memberId: string,
  date: string,
  status: AvailabilityStatus,
): Promise<Band> {
  if (status === 'available') {
    const { error } = await supabase
      .from('availability')
      .delete()
      .match({ band_id: bandId, member_id: memberId, date });

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }
  } else {
    const { error } = await supabase
      .from('availability')
      .upsert({ band_id: bandId, member_id: memberId, date, status }, { onConflict: 'band_id,member_id,date' });

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }
  }

  return getBand(bandId);
}

export async function createEvent(
  bandId: string,
  date: string,
  type: EventType,
  label: string,
  location?: string,
): Promise<Band> {
  const { error } = await supabase.from('gigs').insert({
    id: newId(),
    band_id: bandId,
    date,
    type,
    label,
    location: location || null,
  });

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }

  return getBand(bandId);
}

export async function deleteEvent(bandId: string, eventId: string): Promise<Band> {
  const { error } = await supabase.from('gigs').delete().match({ id: eventId, band_id: bandId });

  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }

  return getBand(bandId);
}

function fail(action: string, error: { message: string }): never {
  throw new Error(`Failed to ${action}: ${error.message}`);
}

export interface SongFields {
  name: string;
  lyrics?: string;
  chords?: string;
  structure?: string;
}

export async function createSong(
  bandId: string,
  fields: SongFields,
  id: string = newId(),
): Promise<Band> {
  const { error } = await supabase.from('songs').insert({
    id,
    band_id: bandId,
    name: fields.name,
    lyrics: fields.lyrics || null,
    chords: fields.chords || null,
    structure: fields.structure || null,
  });
  if (error) fail('create song', error);
  return getBand(bandId);
}

export async function updateSong(bandId: string, songId: string, fields: SongFields): Promise<Band> {
  const { error } = await supabase
    .from('songs')
    .update({
      name: fields.name,
      lyrics: fields.lyrics || null,
      chords: fields.chords || null,
      structure: fields.structure || null,
    })
    .match({ id: songId, band_id: bandId });
  if (error) fail('update song', error);
  return getBand(bandId);
}

export async function deleteSong(bandId: string, songId: string): Promise<Band> {
  const { error } = await supabase.from('songs').delete().match({ id: songId, band_id: bandId });
  if (error) fail('delete song', error);
  return getBand(bandId);
}

export async function addSongLink(
  bandId: string,
  songId: string,
  position: number,
  description: string,
  url: string,
): Promise<Band> {
  const { error } = await supabase
    .from('song_links')
    .insert({ id: newId(), song_id: songId, position, description, url });
  if (error) fail('add link', error);
  return getBand(bandId);
}

export async function deleteSongLink(bandId: string, linkId: string): Promise<Band> {
  const { error } = await supabase.from('song_links').delete().eq('id', linkId);
  if (error) fail('delete link', error);
  return getBand(bandId);
}

export async function createPlaylist(
  bandId: string,
  name: string,
  description = '',
  eventId?: string,
): Promise<Band> {
  const { error } = await supabase.from('playlists').insert({
    id: newId(),
    band_id: bandId,
    name,
    description,
    event_id: eventId ?? null,
  });
  if (error) fail('create playlist', error);
  return getBand(bandId);
}

export async function updatePlaylist(
  bandId: string,
  playlistId: string,
  fields: { name: string; description: string; eventId?: string },
): Promise<Band> {
  const { error } = await supabase
    .from('playlists')
    .update({ name: fields.name, description: fields.description, event_id: fields.eventId ?? null })
    .match({ id: playlistId, band_id: bandId });
  if (error) fail('update playlist', error);
  return getBand(bandId);
}

export async function deletePlaylist(bandId: string, playlistId: string): Promise<Band> {
  const { error } = await supabase.from('playlists').delete().match({ id: playlistId, band_id: bandId });
  if (error) fail('delete playlist', error);
  return getBand(bandId);
}

export async function addSongToPlaylist(
  bandId: string,
  playlistId: string,
  songId: string,
  position: number,
): Promise<Band> {
  const { error } = await supabase
    .from('playlist_songs')
    .insert({ playlist_id: playlistId, song_id: songId, position });
  if (error) fail('add song to playlist', error);
  return getBand(bandId);
}

export async function removeSongFromPlaylist(
  bandId: string,
  playlistId: string,
  songId: string,
): Promise<Band> {
  const { error } = await supabase
    .from('playlist_songs')
    .delete()
    .match({ playlist_id: playlistId, song_id: songId });
  if (error) fail('remove song from playlist', error);
  return getBand(bandId);
}

// Positions are rewritten with an upsert; the unique (playlist_id, position) constraint is
// deferred, so the intermediate states within the single statement don't conflict.
export async function reorderPlaylist(
  bandId: string,
  playlistId: string,
  orderedSongIds: string[],
): Promise<Band> {
  const { error } = await supabase.from('playlist_songs').upsert(
    orderedSongIds.map((songId, position) => ({ playlist_id: playlistId, song_id: songId, position })),
    { onConflict: 'playlist_id,song_id' },
  );
  if (error) fail('reorder playlist', error);
  return getBand(bandId);
}
