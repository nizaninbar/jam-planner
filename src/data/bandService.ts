import type { AvailabilityStatus, Band } from '../types/band';
import { seedBand } from './seed';

const storageKey = (bandId: string) => `jam-planner:band:${bandId}`;

function loadBand(bandId: string): Band {
  try {
    const raw = localStorage.getItem(storageKey(bandId));
    if (raw) {
      return JSON.parse(raw) as Band;
    }
  } catch {
    // fall through to seed data
  }
  return seedBand;
}

function persistBand(band: Band): void {
  try {
    localStorage.setItem(storageKey(band.id), JSON.stringify(band));
  } catch (error) {
    console.warn('Failed to persist band data', error);
  }
}

export async function getBand(bandId: string): Promise<Band> {
  if (bandId !== seedBand.id) {
    throw new Error(`Unknown band: ${bandId}`);
  }
  return loadBand(bandId);
}

export async function setMemberAvailability(
  bandId: string,
  periodId: string,
  memberId: string,
  date: string,
  status: AvailabilityStatus,
): Promise<Band> {
  const band = loadBand(bandId);
  const periods = band.periods.map((period) => {
    if (period.id !== periodId) {
      return period;
    }

    const withoutRecord = period.availability.filter(
      (a) => !(a.memberId === memberId && a.date === date),
    );
    const availability =
      status === 'available' ? withoutRecord : [...withoutRecord, { memberId, date, status }];

    return { ...period, availability };
  });

  const updated: Band = { ...band, periods };
  persistBand(updated);
  return updated;
}
