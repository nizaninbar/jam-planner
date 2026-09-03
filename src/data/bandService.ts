import type { AvailabilityStatus, Band, EventType } from '../types/band';
import { supabase } from './supabaseClient';

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

interface RawBand {
  id: string;
  name: string;
  members: { id: string; name: string }[];
  gigs: RawEvent[];
  availability: RawAvailability[];
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
  };
}

export async function getBand(bandId: string): Promise<Band> {
  const { data, error } = await supabase
    .from('bands')
    .select(
      'id, name, members!members_band_id_fkey(id,name), gigs(id,date,label,type,location), availability(member_id,date,status)',
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
    id: crypto.randomUUID(),
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
