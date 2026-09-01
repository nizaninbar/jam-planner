import type { Band } from '../types/band';

const unavailable = (memberId: string, date: string) => ({
  memberId,
  date,
  status: 'unavailable' as const,
});

export const seedBand: Band = {
  id: 'main-band',
  name: 'הלהקה',
  members: [
    { id: 'nitzan', name: 'ניצן' },
    { id: 'dudu', name: 'דודו' },
    { id: 'yaniv', name: 'יניב' },
    { id: 'michal', name: 'מיכל' },
    { id: 'alon', name: 'אלון' },
    { id: 'liran', name: 'לירן' },
    { id: 'amir', name: 'אמיר' },
  ],
  periods: [
    {
      id: 'sep-oct-2026',
      name: 'הכנות להופעה - ספטמבר / אוקטובר 2026',
      startDate: '2026-09-01',
      endDate: '2026-10-08',
      gigs: [{ id: 'gig-2026-10-08', date: '2026-10-08', label: 'הופעה!' }],
      availability: [
        unavailable('alon', '2026-09-04'),
        unavailable('alon', '2026-09-05'),
        unavailable('alon', '2026-09-06'),
        unavailable('michal', '2026-09-08'),
        unavailable('dudu', '2026-09-10'),
        unavailable('yaniv', '2026-09-18'),
        unavailable('dudu', '2026-09-27'),
        unavailable('dudu', '2026-09-28'),
        unavailable('dudu', '2026-09-29'),
        unavailable('nitzan', '2026-09-29'),
        unavailable('dudu', '2026-09-30'),
        unavailable('nitzan', '2026-09-30'),
        unavailable('dudu', '2026-10-01'),
        unavailable('nitzan', '2026-10-01'),
        unavailable('dudu', '2026-10-02'),
        unavailable('nitzan', '2026-10-02'),
        unavailable('nitzan', '2026-10-03'),
        unavailable('nitzan', '2026-10-04'),
      ],
    },
  ],
};
