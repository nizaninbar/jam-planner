# jam-planner
Sync the groove: A band management assistant, starting with a smart rehearsal scheduling calendar that helps bands find the perfect time to jam.

A collaborative tool designed to help bands and musical ensembles sync their availability, plan rehearsals efficiently, and manage what they play.

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
* Playlists: ordered song lists (optionally tied to an event), with reusable songs carrying lyrics, chords, structure and links
* Play-along view: a song's chords shown above its lyrics (Hebrew right-to-left supported), with chord transposition (run `supabase/migrate_11_add_song_sheet.sql`)
* Upcoming events tab: all events from today onward, grouped by month, tap to open the day
* Calmer look: single indigo accent, true-black dark mode, muted vinyl logo (no pick); swipe-between-tabs removed and A−/A+ font buttons added to the play-along sheet
* Band-wide links (name + URL) in a collapsible strip under the header, admins edit (run `supabase/migrate_12_band_links.sql`)
* Full-screen song mode for playing: prev/next song, transpose, font size, screen stays awake
* The header greets the signed-in member by name
* Multiple bands: a header switcher for players in more than one band, each band fully separate (run `supabase/migrate_13_multi_band.sql`, add a band with `supabase/bootstrap_new_band.sql`)

* Access control: personal invite links, optional username/password or Google sign-in (see `docs/AUTH.md`), and admin / member / viewer roles enforced by Supabase RLS (see below)

### Access setup (one time)
1. In Supabase -> Authentication: allow **anonymous sign-ins** and **manual linking**, and enable the **Google** provider (Google Cloud OAuth client; allow the site URL as a redirect).
2. Deploy the frontend, then run `supabase/migrate_06_add_iam.sql` in the SQL Editor. This drops the open policies, so the app is locked until the next step.
3. Run `supabase/bootstrap_first_admin.sql`. Open `<site>/#/invite/<token>` it prints to become the first admin.
4. In the app's **ניהול** tab, create a personal link per member. Opening it signs that person in; they are then prompted to attach a Google account for one-tap sign-in on other devices.

### Next up
Nothing is committed yet; ideas are listed in [docs/GOALS.md](docs/GOALS.md).
