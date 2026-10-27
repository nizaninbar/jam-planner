# UI/UX review (2026-10-24)

A full review of every view, `src/index.css` and `index.html`, made against `docs/GOALS.md` and
`.claude/skills/mobile-ui-ux/SKILL.md`. The core use case is a band member on a phone asking "am I
needed / who's missing / what's next". Items are ranked by how much they hurt that.

How to use this file: implement one phase at a time (see "Implementation phases" below), roughly
in ID order. For every phase:
1. Read the phase's items, `CLAUDE.md` and `.claude/skills/mobile-ui-ux/SKILL.md` first.
2. Implement each item and commit it separately, with its ID in the message (e.g.
   `UX-02: confirm before deleting an event`).
3. Tick `[x]` on each item in this file as it lands.
4. Run the checks in "Verifying each phase" and fix anything that fails.
5. Update the docs the phase affects: `CLAUDE.md` (architecture and permissions), `README.md`,
   `docs/GOALS.md`, and setup steps for any new migration.
6. Under the phase's heading, add a one-line progress note: done date, anything deferred, and
   any manual step left for the owner (e.g. "run migrate_08 in the Supabase SQL editor").
7. Commit the docs and progress update, then `git push`. Stop after the phase and report what
   was done and what still needs manual action.

Ground rules for every item:
- Keep the 7-column week grid (see the mobile skill). Shrink things, don't restructure them.
- Reuse the CSS tokens in `:root` (`src/index.css`). Don't add ad hoc colours.
- Touch targets must be at least 44×44px. RTL must still read correctly once things wrap.
- Business logic goes in `src/utils/`, Supabase calls go in `src/data/`, components stay thin.

## Findings

### 🔴 Critical: lockout, data loss, broken flows

- [x] **UX-01: Signing out of an invite-only session is a permanent lockout.**
  `AppHeader.tsx` signs out on one tap of an unclear ⎋ glyph. A member without Google attached
  has only an anonymous session, so once signed out they can't get back in without a new invite.
  **Fix:** pass `googleLinked` to `AppHeader`. Always confirm before signing out. When Google is
  not linked, the warning should say so plainly ("you'll need a new invite link, so attach Google
  first"). Give the button a clearer icon and text.

- [x] **UX-02: Deleting an event takes one tap and has no confirmation.**
  In `DayEditorModal.tsx` the delete control is a ✕ with the same `.modal-close` style as the
  close-modal ✕ just above it. "Remove reminder" is a third identical ✕. A mis-tap deletes the
  event along with its playlist link and reminder.
  **Fix:** a text button "מחק אירוע" plus `window.confirm`, following the
  `PlaylistDetail.handleDelete` pattern. Give "remove reminder" its own small labelled button.

- [x] **UX-03: Any failed mutation replaces the whole app with an error screen.**
  In `App.tsx`, `apply`, `handleToggle`, `handleCreateEvent` and the others all call `setError`,
  and that renders only "שגיאה בטעינת הנתונים". A single network blip wipes the UI and needs a
  reload.
  **Fix:** keep the full-screen error for the initial load only. Mutation errors go to a
  dismissible toast: a new small `Toast` component with an `aria-live` region and auto-dismiss.

- [x] **UX-04: Saving gives no feedback, and a double tap toggles twice.**
  Each mutation re-fetches the whole band, so an availability tap shows nothing for about 0.5–1s.
  **Fix:** make availability optimistic. In `handleToggle`, patch `band.availability` locally,
  then `setBand(result)`, or revert and show a toast on error. Track the pending `memberId` and
  disable that button until the save finishes.

### 🟠 High: calendar readability on phones

- [ ] **UX-05: Text in mobile day cells is too small to read.**
  At 360px a cell is about 41px wide. `.missing-names`, `.status-text` and `.gig-label` are
  `0.6rem` (about 9.6px), and the day names are full words at `0.65rem`.
  **Fix:** at ≤600px a cell shows the date, the coloured state and one compact indicator: a
  missing-count badge (e.g. "‑2") or the event icon. Names and labels stay in the modal. Use
  short day names on mobile (א׳ ב׳ ג׳ ד׳ ה׳ ו׳ ש׳), rendered as a second span that CSS swaps in.
  Desktop keeps the current layout.

- [ ] **UX-06: There's no "today" marker, and past days look the same as future days.**
  **Fix:** add pure `isToday(date)` and `isPast(date)` helpers to `src/utils/calendar.ts`.
  `DayCell` adds `is-today` (accent ring) and `is-past` (dimmed) classes. `getDayStatus` stays
  as it is.

- [ ] **UX-07: Day cells are `<div onClick>`.**
  They can't be reached with the keyboard, and screen readers don't announce them as controls.
  **Fix:** make them `<button type="button">` in `DayCell.tsx`, with an `aria-label` such as
  "24 באוקטובר, חסרים: דני" or "…, הופעה: <label>". Reset the button's default styles in CSS.

- [x] **UX-08: The hover lift sticks after a tap on touch screens.**
  **Fix:** wrap `.day-cell:not(.empty):hover` in `@media (hover: hover)`.

- [ ] **UX-09: The month header takes too much height and doesn't follow the usual pattern.**
  The prev / today / next / ⓘ row sits above a separate bordered `h2` month title
  (`Calendar.tsx` + `MonthGrid.tsx`).
  **Fix:** one row with `‹prev  אוקטובר 2026  next›`, "היום" as a small chip, and ⓘ at the end.
  That saves about 70px on a phone. Confirm the arrows point the right way in RTL.

- [ ] **UX-10: The icons don't match each other.**
  The legend shows only 🎤 for rehearsals, but band-only rehearsals use 🎶 (`DayCell`
  `EVENT_DISPLAY`). 🎸 currently means the brand, the Songs tab and a gig.
  **Fix:** the gig keeps 🎸, the Songs tab becomes 🎼 (`NavTabs.tsx`), and `Legend.tsx` lists
  both rehearsal kinds with the same icons `EVENT_DISPLAY` uses.

### 🟡 Medium: the day editor, the main place people edit

- [ ] **UX-11: The modal isn't a proper dialog.**
  It has no `role="dialog"`, `aria-modal` or `aria-labelledby`. Focus isn't moved into it or
  returned when it closes, and the page behind it still scrolls. On mobile it's a centred card
  with `max-height: 80vh`, which is unreliable on iOS.
  **Fix:** add the dialog semantics, focus the first control on open, restore focus on close,
  and lock body scroll while it's open. At ≤600px, render it as a bottom sheet (full width,
  rounded top, `max-height: 85dvh`, `env(safe-area-inset-bottom)` padding). Desktop stays
  centred.

- [ ] **UX-12: Your own availability is hard to find.**
  Every member gets a row, and other people's rows show disabled buttons that look just like
  your enabled one.
  **Fix:** pass `account.memberId` in. Put the current user's row first, with a large toggle.
  Show the other members as read-only status chips, unless `canEditAvailability` is true for
  them (admin).

- [ ] **UX-13: The event form relies on placeholders only.**
  The labels disappear once you type, an empty title fails with no message, and "ביטול" reuses
  `.modal-close`.
  **Fix:** visible labels, the same pattern as `.form-stack label`. Show an inline error when the
  title is empty. Use proper primary and secondary button styles.

- [x] **UX-14: iOS zooms in when a modal input gets focus.**
  `.event-form select, .event-form input` are `0.9rem`, under 16px.
  **Fix:** make them `1rem` with `min-height: 44px`, as the `.page-container` inputs already are.

- [ ] **UX-15: An event can't be edited, only deleted and recreated.**
  This is a feature gap, not a UI fix. Note it on the roadmap and leave it out of these phases.

### 🟡 Medium: playlists, songs, admin

- [ ] **UX-16: Song detail always opens as an edit form.**
  At rehearsal people read lyrics and chords, and textareas are a poor reader on a phone: they
  scroll inside the page scroll, and the text is small.
  **Fix:** in `SongDetail.tsx`, a read view by default (large `pre-wrap` lyrics, LTR monospace
  chords, structure as text), with a "✏️ ערוך" toggle shown when `canEdit` is true.

- [ ] **UX-17: Blur-to-save gives no feedback.**
  The song and playlist fields save silently.
  **Fix:** show a small "שומר…" / "נשמר ✓" status near the field, driven by the promise passed
  to `apply`.

- [ ] **UX-18: Dates appear as raw ISO strings.**
  `PlaylistDetail.tsx` shows `2026-10-24` in the event rows and in the link-to-event select.
  **Fix:** add a shared `formatEventDate` helper in `src/utils/calendar.ts` using `he-IL`
  (e.g. "יום ו׳, 24.10").

- [ ] **UX-19: The playlist reorder rows are cramped.**
  ▲ ▼ ✕ take 3×44px plus gaps, which leaves about 150px for the song title at 360px.
  **Fix:** the default rows show only the title. A "ערוך סדר" toggle shows the reorder and
  remove controls.

- [ ] **UX-20: Sharing an invite link takes too many steps.**
  "העתק קישור" makes the admin switch to WhatsApp and paste.
  **Fix:** in `MembersAdminView.tsx`, use `navigator.share({ url })` when it's available and
  fall back to copying.

- [ ] **UX-21: The admin viewer rows are cramped.**
  Text, a select and ✕ all share one `.order-row`.
  **Fix:** reuse the `.member-card` layout for viewers.

### 🟢 Low: polish

- [ ] **UX-22: Banners stack above the calendar.**
  `GoogleBanner` and `NotificationsBanner` can take about 120px on a phone, on every visit.
  **Fix:** move both into a small account/settings menu in `AppHeader`, with a dot badge until
  each one is done.

- [ ] **UX-23: The icons are inconsistent emoji.**
  Emoji render differently on each OS, and ⎋ and ⓘ are obscure. For now, keep one consistent set.
  Longer term, replace them with an inline SVG icon set.

- [x] **UX-24: Custom buttons have no `:focus-visible` style.**
  **Fix:** add a global `:focus-visible { outline: 2px solid var(--accent-blue); outline-offset: 2px; }`.

- [x] **UX-25: The PWA theme colour doesn't match the background.**
  `index.html` `theme-color` is `#0f1117`, but `--bg-main` is `#121212`. **Fix:** use `#121212`.

- [ ] **UX-26: The loading state is plain "טוען…" text.**
  **Fix:** show a skeleton month grid instead.

- [ ] **UX-27 (optional, ask before building): there's no "what's next" view.**
  The most common phone question is "when is the next rehearsal or gig?". A compact
  "האירוע הבא" card above the calendar would answer it. It's on the GOALS roadmap as an
  upcoming-events list.

### 🔐 Permissions (added 2026-10-27)

Members may change only their own availability. All other data CRUD (events, reminders, songs,
links, playlists) is admin-only. Viewers stay read-only. Admins can still do everything.

- [x] **PERM-01: RLS.** Add `supabase/migrate_08_admin_only_content.sql`. Drop the `"editors …"`
  policies on `gigs`, `songs`, `song_links`, `playlists` and `playlist_songs` (from
  `migrate_06_add_iam.sql`) and recreate them as `my_role(band_id) = 'admin'`. The link and
  entry tables use the existing `exists (select … songs/playlists …)` pattern. The availability
  policies already match and stay as they are. `push_subscriptions` stays per-user. Use
  `drop policy if exists` so the migration can be re-run.
- [x] **PERM-02: UI gating.** `canEditContent` in `src/utils/permissions.ts` returns
  `role === 'admin'`. Check that the songs, playlists and reminder controls are all gated through
  it.
- [x] **PERM-03: Member view of the day editor.** Event info is read-only. Your own availability
  row comes first, with a large toggle, and the other members show as status chips. This pulls
  UX-12 forward.

### 🎨 Style: groovy rock'n'roll party look (added 2026-10-27)

Direction: a 70s rock-poster party vibe. The accents use a sunset palette (hot pink, tangerine,
mustard, teal, purple). The status colours (available / missing / event) stay semantic and easy
to tell apart. The dark theme uses a deep plum/ink background with neon accents. The light theme
uses warm cream with saturated accents. Readability in day cells and the mobile skill's rules
come first.

- [x] **STY-01: Semantic colour tokens.** Replace every hard-coded colour in `src/index.css` with
  tokens (`--bg-*`, `--text-*`, `--border-color`, `--status-ok/missing/event`, `--accent-1…4`,
  `--shadow`, `--focus-ring`). Keep the old names as aliases while migrating.
- [x] **STY-02: Light and dark themes.** `:root` holds the dark values and
  `:root[data-theme="light"]` the light values. With no stored choice, follow
  `prefers-color-scheme`. Set `color-scheme` per theme.
- [x] **STY-03: Theme toggle.** Add a pure `src/utils/theme.ts` and a 44px `ThemeToggle`
  (☀️/🌙, with `aria-label`) in `AppHeader`. It moves into the settings menu with UX-22. Save the
  choice in `localStorage` inside try/catch. An inline script in `index.html` sets `data-theme`
  before first paint and updates `<meta name="theme-color">`.
- [x] **STY-04: Contrast.** Text and status colours meet WCAG AA in both themes.
- [ ] **STY-05: Groovy palette.** Apply the direction above to both themes.
- [ ] **STY-06: Typography.** Use Hebrew-capable Google Fonts: a chunky display face for
  headings and the brand (Secular One or Suez One) and Rubik for body text, replacing Heebo.
- [ ] **STY-07: Visual details.** Add a gradient header band, "sticker" cards with offset
  shadows, pill-shaped tabs and chips, and a subtle CSS-only sunburst/wave background. Add
  playful motion only under `prefers-reduced-motion: no-preference` and `(hover: hover)`.
- [ ] **STY-08: Logo.** Design 2–3 SVG options (sunburst + vinyl/guitar pick + "Jam" lettering)
  and pick one. It becomes `src/assets/logo.svg` (inline in `AppHeader`, replacing 🎸) and
  `public/favicon.svg`. Regenerate `icon-192.png`, `icon-512.png`, a maskable icon and
  `apple-touch-icon.png` from it.
- [ ] **STY-09: PWA.** Update the manifest colours, list separate `any` and `maskable` icons,
  and add the icon links to `index.html`.

## Implementation phases

### Phase A: permissions (PERM-01–03)
Done 2026-10-27. Owner step: run `supabase/migrate_08_admin_only_content.sql` in the Supabase SQL editor, then test with admin/member/viewer accounts (a member's direct insert into `gigs`/`songs` must be rejected). Not yet tested against a live DB.
Files: new `supabase/migrate_08_admin_only_content.sql`, `utils/permissions.ts`,
`DayEditorModal.tsx`, the song and playlist views. Update CLAUDE.md's identity paragraph. Test
with an admin, a member and a viewer account. As a member, a direct insert into `gigs` or `songs`
must be rejected by RLS.

### Phase B: safety and feedback (UX-01–04, 08, 14, 24, 25)
Done 2026-10-27. Nothing deferred; no manual steps. Not yet checked on a device or throttled network (no Playwright run). `theme-color` is `#121212` for now; Phase C makes it follow the theme.
Small, low-risk changes that remove the lockout, data-loss and dead-end cases.
Files: `AppHeader.tsx`, `DayEditorModal.tsx`, `App.tsx` (split the load error from the mutation
toast, optimistic availability), a new `Toast.tsx`, `index.css`, `index.html`. For UX-25, match
`--bg-main` for now. Phase C makes the theme colour follow the active theme.

### Phase C: theme foundation and light/dark toggle (STY-01–04)
Done 2026-10-27. Not yet checked in a browser or on a device (no Playwright run, no screenshots in either theme); contrast values were chosen by hand, not measured with a tool. Status colours have separate `--status-*-text` tokens so text stays AA in light mode. The `theme-color` meta follows the theme.
Comes before the calendar work, so new UI is built on the tokens.
Files: `index.css`, `utils/theme.ts`, a new `ThemeToggle.tsx`, `AppHeader.tsx`, `index.html`.

### Phase D: calendar and day editor (UX-05–07, 09–13)
Files: `utils/calendar.ts` (`isToday`, `isPast`), `DayCell.tsx`, `MonthGrid.tsx`,
`Calendar.tsx`, `Legend.tsx`, `NavTabs.tsx`, `DayEditorModal.tsx` (dialog semantics, bottom
sheet, labelled form; current user first is mostly done in PERM-03), `index.css`.

### Phase E: content views and polish (UX-16–23, 26)
Files: `SongDetail.tsx` (read/edit mode), `PlaylistDetail.tsx` (dates, reorder mode, saved
status), `MembersAdminView.tsx` (share, viewer cards), `AppHeader.tsx` with the banners and the
theme toggle moved into a menu, and the loading skeleton. Draw the UX-23 SVG icons in the
logo's line style.

### Phase F: groovy visual pass and logo (STY-05–09)
Files: `index.css`, `index.html`, `AppHeader.tsx`, `src/assets/logo.svg`, `public/` icons and
manifest. Render the PNG icons with a throwaway script in a scratch dir, not the repo.

UX-15 and UX-27 are features. Ask before starting either.

## Verifying each phase
- `npm run build` and `npm run lint` pass.
- Following the mobile skill, run `npm run dev` and screenshot with headless Playwright (script
  in a scratch dir, not the repo): the calendar, the open day modal, song detail and playlist
  detail, at **360×780** and **430×932**, plus 1280px desktop. Use `getBoundingClientRect` to
  check that day cells, modal buttons and nav tabs are at least 44px tall. Check the arrow
  direction in RTL.
- Manual checks:
  - Tab through the calendar with the keyboard: cells take focus, Enter opens the modal, Esc
    closes it, and focus comes back to the cell.
  - Toggle availability on a throttled network: the change is optimistic and a double tap
    doesn't toggle twice.
  - Make a mutation fail while offline: a toast appears and the app stays usable.
  - The sign-out warning differs when Google isn't linked.
- From Phase C on, take the screenshots in **both themes**. Reload with each stored theme, and
  with no stored theme under both system settings. Check there's no flash of the wrong theme,
  the choice persists, and `theme-color` updates.
- Phase F: check the favicon, the installed PWA icon and the maskable crop.
