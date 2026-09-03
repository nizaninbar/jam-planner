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
}

export interface Availability {
  memberId: string;
  date: string;
  status: AvailabilityStatus;
}

export interface Band {
  id: string;
  name: string;
  members: Member[];
  events: Event[];
  availability: Availability[];
}
