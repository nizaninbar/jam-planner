# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) and build to `dist/`
- `npm run lint` — run oxlint
- `npm run preview` — serve the production build locally

No test framework is set up yet.

## Architecture
React + TypeScript SPA (Vite). RTL Hebrew UI, dark theme (`src/index.css`).

Data flows one direction, in a shape meant to make a future backend swap-in painless:
- `src/types/band.ts` — the domain model: a `Band` has `Member[]` and `Period[]`; each `Period` has its own `Gig[]` and `Availability[]` (member+date unavailability records — absence of a record means available).
- `src/data/seed.ts` — static seed data for the one real band, until a backend exists.
- `src/data/bandService.ts` — `getBand(id)` is `async` and returns the seed data today; callers don't know or care that there's no real API yet, so this is the only file a future backend integration should need to change.
- `src/utils/calendar.ts` — pure functions deriving the calendar from a `Period`: `getMonthsInRange` (which months to render) and `getDayStatus` (gig / all-clear / missing-members / outside-range for a given date). Business logic lives here, not in components.
- `src/components/` — `Calendar` renders one `MonthGrid` per month, each `MonthGrid` renders `DayCell`s driven entirely by `getDayStatus`. No calendar data is hardcoded in JSX.

The app currently renders a single band (`App.tsx` calls `getBand('main-band')`) even though the data model already supports multiple bands — see README's Future Vision for the staged roadmap (Step 1 is this SPA + dynamic period/members; self-service editing, auth, and a real backend are later steps).
