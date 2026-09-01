import type { AvailabilityStatus, Band } from '../types/band';
import { supabase } from './supabaseClient';

interface RawGig {
  id: string;
  date: string;
  label: string;
}

interface RawAvailability {
  member_id: string;
  date: string;
  status: AvailabilityStatus;
}

interface RawPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gigs: RawGig[];
  availability: RawAvailability[];
}

interface RawBand {
  id: string;
  name: string;
  members: { id: string; name: string }[];
  periods: RawPeriod[];
}

function mapBand(raw: RawBand): Band {
  return {
    id: raw.id,
    name: raw.name,
    members: raw.members,
    periods: raw.periods.map((period) => ({
      id: period.id,
      name: period.name,
      startDate: period.start_date,
      endDate: period.end_date,
      gigs: period.gigs,
      availability: period.availability.map((a) => ({
        memberId: a.member_id,
        date: a.date,
        status: a.status,
      })),
    })),
  };
}

export async function getBand(bandId: string): Promise<Band> {
  const { data, error } = await supabase
    .from('bands')
    .select(
      'id, name, members(id,name), periods(id,name,start_date,end_date,gigs(id,date,label),availability(member_id,date,status))',
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
  periodId: string,
  memberId: string,
  date: string,
  status: AvailabilityStatus,
): Promise<Band> {
  if (status === 'available') {
    const { error } = await supabase
      .from('availability')
      .delete()
      .match({ period_id: periodId, member_id: memberId, date });

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }
  } else {
    const { error } = await supabase
      .from('availability')
      .upsert({ period_id: periodId, member_id: memberId, date, status });

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }
  }

  return getBand(bandId);
}
