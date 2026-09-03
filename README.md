# jam-planner
Sync the groove: A smart rehearsal scheduling tool to help bands find the perfect time to jam.

A collaborative scheduling tool designed to help bands and musical ensembles sync their availability and plan rehearsals efficiently.

## Current State
Jam Planner is a React + TypeScript single-page app backed by a shared Supabase database. Any
band member can open the calendar, browse freely to any month, see everyone's availability at a
glance, and edit their own days directly — everyone sees the same live picture instead of a
static, manually-updated file. Dates can also be marked as a gig (with a location) or a rehearsal
(guided or band-only). It's mobile-friendly and deployed at:

**https://nizaninbar.github.io/jam-planner/**

For architecture, data model, and setup details, see [docs/TECHNICAL.md](docs/TECHNICAL.md).

## Future Vision
Jam Planner will always be, at its core, a visual availability calendar — the fastest way for a
band to see at a glance who's free and when. Longer-term, the direction is to grow it into a full
band app (playlists, past rehearsal/gig recordings, setlists, etc.) with this calendar as one
feature among several — not to generalize the scheduling piece into a standalone service for other
apps; there's no second consumer that would justify that yet, and it would trade away the tight
build-and-get-real-feedback loop that's worked well so far.

### Done
* Dynamic band members, with free navigation to any month (no more hardcoded date range)
* Modern React SPA, mobile-friendly
* Each member can edit their own availability directly on the calendar
* Shared, single source of truth via a Supabase backend (no more per-browser localStorage)
* Mark any date as a gig (with a location) or a rehearsal (guided or band-only)

### Next up
* User authentication for band members, so edits are attributed and each member can only change their own availability
* Replace the binary available / not-available status with a middle state (e.g. available, prefer not, not available)
* An upcoming-events list view (next gig/rehearsal at a glance, not just the calendar grid)
* Once there's real auth: consider whether a rehearsal needs its own attendance confirmation ("I'm coming to *this* one") separate from general availability — open question, not yet decided
* Automated optimal rehearsal time suggestions
* Setlist management

### Later (full band app)
* Playlists and past rehearsal/gig recordings
* This calendar becomes one feature among several, not the whole app

Stay tuned!
