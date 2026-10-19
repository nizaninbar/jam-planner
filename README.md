# jam-planner
Sync the groove: A band management assistant, starting with a smart rehearsal scheduling calendar that helps bands find the perfect time to jam.

A collaborative tool designed to help bands and musical ensembles sync their availability, plan rehearsals efficiently, and (next) manage what they play.

## Current State
Jam Planner is a React + TypeScript single-page app backed by a shared Supabase database. Any
band member can open the calendar, browse freely to any month, see everyone's availability at a
glance, and edit their own days directly — everyone sees the same live picture instead of a
static, manually-updated file. Dates can also be marked as a gig (with a location) or a rehearsal
(guided or band-only). It's mobile-friendly and deployed at:

**https://nizaninbar.github.io/jam-planner/**

For architecture, data model, and setup details, see [docs/TECHNICAL.md](docs/TECHNICAL.md).

## Future Vision
Jam Planner's global goal is to be a **band management assistant**. The availability calendar —
the fastest way for a band to see at a glance who's free and when — is the first feature and stays
a first-class view; more features are added one at a time. It is not meant to become a standalone
scheduling service for other apps.

The full goals, principles, non-goals and the Playlists spec live in [docs/GOALS.md](docs/GOALS.md).

### Done
* Dynamic band members, with free navigation to any month (no more hardcoded date range)
* Modern React SPA, mobile-friendly
* Each member can edit their own availability directly on the calendar
* Shared, single source of truth via a Supabase backend (no more per-browser localStorage)
* Mark any date as a gig (with a location) or a rehearsal (guided or band-only)

### Next up
* Playlists: ordered song lists (optionally tied to an event), with reusable songs carrying lyrics, chords, structure and links — see [docs/GOALS.md](docs/GOALS.md)

Anything beyond that is still TBD.
