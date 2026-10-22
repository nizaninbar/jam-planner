import type { Event, Playlist, PlaylistEntry, Song } from '../types/band';

export function sortedEntries(playlist: Playlist): PlaylistEntry[] {
  return [...playlist.entries].sort((a, b) => a.position - b.position);
}

export function getPlaylistSongs(playlist: Playlist, songs: Song[]): Song[] {
  const byId = new Map(songs.map((s) => [s.id, s]));
  return sortedEntries(playlist).flatMap((e) => {
    const song = byId.get(e.songId);
    return song ? [song] : [];
  });
}

export function getPlaylistsContainingSong(songId: string, playlists: Playlist[]): Playlist[] {
  return playlists.filter((p) => p.entries.some((e) => e.songId === songId));
}

export function getPlaylistForEvent(event: Event, playlists: Playlist[]): Playlist | undefined {
  return playlists.find((p) => p.id === event.playlistId);
}

export function getEventsForPlaylist(playlistId: string, events: Event[]): Event[] {
  return events.filter((e) => e.playlistId === playlistId).sort((a, b) => a.date.localeCompare(b.date));
}

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
