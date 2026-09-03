export type AvailabilityStatus = 'available' | 'unavailable';

export interface Member {
  id: string;
  name: string;
}

export interface Gig {
  id: string;
  date: string;
  label: string;
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
  gigs: Gig[];
  availability: Availability[];
}
