# jam-planner
Sync the groove: A smart rehearsal scheduling tool to help bands find the perfect time to jam.

A collaborative scheduling tool designed to help bands and musical ensembles sync their availability and plan rehearsals efficiently.

## Current State
This project currently serves as a static, visual availability calendar built to coordinate a 7-piece band leading up to a specific gig. It allows band members to quickly see overlapping free days and missing personnel.

## Future Vision
Jam Planner will always be, at its core, a visual availability calendar — the fastest way for a band to see at a glance who's free and when. From there it will evolve in small, incremental steps toward a full rehearsal management system.

### Step 1 (current focus)
* Define the calendar's date range dynamically (no more hardcoded months)
* Define the band's members dynamically (no more names hardcoded into markup)
* Refactor into a modern React SPA (no more hand-written HTML/CSS per day)
* Shape the client-side data model to anticipate a future backend — multiple bands, each with its own members, availability, and periods/gigs — even though everything still runs client-side with no backend or auth yet

### Later steps
* Let each member edit their own availability directly (no more manual editing of the file)
* Replace the binary available / not-available status with a middle state (e.g. available, prefer not, not available)
* User authentication for band members
* Automated optimal rehearsal time suggestions
* Gig and setlist management

Stay tuned!
