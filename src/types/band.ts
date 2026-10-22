export type AvailabilityStatus = 'available' | 'unavailable';

export type EventType = 'gig' | 'rehearsal-guided' | 'rehearsal-band-only';

export interface Member {
  id: string;
  name: string;
}

export interface Event {
  id: string;
  date: string;
  type: EventType;
  label: string;
  location?: string;
  playlistId?: string;
}

export interface Availability {
  memberId: string;
  date: string;
  status: AvailabilityStatus;
}

export interface Link {
  id: string;
  description: string;
  url: string;
}

export interface Song {
  id: string;
  name: string;
  lyrics?: string;
  chords?: string;
  structure?: string;
  links: Link[];
}

export interface PlaylistEntry {
  songId: string;
  position: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  entries: PlaylistEntry[];
}

export type Role = 'admin' | 'member' | 'viewer';

/** What the signed-in user is allowed to be in the band; memberId is absent for e.g. a viewer. */
export interface Account {
  bandId: string;
  role: Role;
  memberId?: string;
}

export interface Band {
  id: string;
  name: string;
  members: Member[];
  events: Event[];
  availability: Availability[];
  songs: Song[];
  playlists: Playlist[];
}
