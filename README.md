# jam-planner
Sync the groove: A smart rehearsal scheduling tool to help bands find the perfect time to jam.

A collaborative scheduling tool designed to help bands and musical ensembles sync their availability and plan rehearsals efficiently.

## Current State
Jam Planner is a React + TypeScript single-page app backed by a shared Supabase database. Any
band member can open the calendar, see everyone's availability at a glance, and edit their own
days directly — everyone sees the same live picture instead of a static, manually-updated file.
It's mobile-friendly and deployed at:

**https://nizaninbar.github.io/jam-planner/**

For architecture, data model, and setup details, see [docs/TECHNICAL.md](docs/TECHNICAL.md).

## Future Vision
Jam Planner will always be, at its core, a visual availability calendar — the fastest way for a band to see at a glance who's free and when. From there it's evolving in small, incremental steps toward a full rehearsal management system.

### Done
* Dynamic date range and band members (no more hardcoded data)
* Modern React SPA, mobile-friendly
* Each member can edit their own availability directly on the calendar
* Shared, single source of truth via a Supabase backend (no more per-browser localStorage)

### Next up
* User authentication for band members, so edits are attributed and each member can only change their own availability
* Replace the binary available / not-available status with a middle state (e.g. available, prefer not, not available)
* Automated optimal rehearsal time suggestions
* Gig and setlist management

Stay tuned!
