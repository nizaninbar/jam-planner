import type { Availability, AvailabilityStatus, Band, Event, Member } from '../types/band';

export type DayStatus =
  | { kind: 'event'; event: Event }
  | { kind: 'all-clear' }
  | { kind: 'missing'; missingMembers: Member[] };

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayStatus(
  band: Pick<Band, 'events' | 'availability'>,
  members: Member[],
  date: Date,
): DayStatus {
  const iso = toIsoDate(date);

  const event = band.events.find((e) => e.date === iso);
  if (event) {
    return { kind: 'event', event };
  }

  const unavailableIds = new Set(
    band.availability.filter((a) => a.date === iso && a.status === 'unavailable').map((a) => a.memberId),
  );

  if (unavailableIds.size === 0) {
    return { kind: 'all-clear' };
  }

  return { kind: 'missing', missingMembers: members.filter((m) => unavailableIds.has(m.id)) };
}

export function getMemberStatus(
  availability: Availability[],
  memberId: string,
  date: Date,
): AvailabilityStatus {
  const iso = toIsoDate(date);
  const isUnavailable = availability.some(
    (a) => a.memberId === memberId && a.date === iso && a.status === 'unavailable',
  );
  return isUnavailable ? 'unavailable' : 'available';
}
