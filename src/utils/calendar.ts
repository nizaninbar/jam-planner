import type { AvailabilityStatus, Gig, Member, Period } from '../types/band';

export interface MonthKey {
  year: number;
  month: number;
}

export type DayStatus =
  | { kind: 'outside-range' }
  | { kind: 'gig'; gig: Gig }
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

export function getMonthsInRange(startDate: string, endDate: string): MonthKey[] {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  const months: MonthKey[] = [];
  let year = start.getFullYear();
  let month = start.getMonth();

  while (year < end.getFullYear() || (year === end.getFullYear() && month <= end.getMonth())) {
    months.push({ year, month });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return months;
}

export function getDayStatus(period: Period, members: Member[], date: Date): DayStatus {
  const start = parseIsoDate(period.startDate);
  const end = parseIsoDate(period.endDate);

  if (date < start || date > end) {
    return { kind: 'outside-range' };
  }

  const iso = toIsoDate(date);

  const gig = period.gigs.find((g) => g.date === iso);
  if (gig) {
    return { kind: 'gig', gig };
  }

  const unavailableIds = new Set(
    period.availability
      .filter((a) => a.date === iso && a.status === 'unavailable')
      .map((a) => a.memberId),
  );

  if (unavailableIds.size === 0) {
    return { kind: 'all-clear' };
  }

  return { kind: 'missing', missingMembers: members.filter((m) => unavailableIds.has(m.id)) };
}

export function getMemberStatus(period: Period, memberId: string, date: Date): AvailabilityStatus {
  const iso = toIsoDate(date);
  const isUnavailable = period.availability.some(
    (a) => a.memberId === memberId && a.date === iso && a.status === 'unavailable',
  );
  return isUnavailable ? 'unavailable' : 'available';
}
