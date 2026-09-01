---
name: mobile-ui-ux
description: Design and review guidance for making jam-planner's UI genuinely usable on phone screens, not just "not broken" at a narrow width. Use whenever changing layout, adding a new view, or reviewing how something looks on mobile.
---

# Mobile UI/UX for jam-planner

This project's calendar is used by band members checking their phones, not just at a
desk. "It doesn't crash at 390px" is not the bar — it has to be as easy to read and use
on a phone as on a desktop.

## Design rules for this app

- **Never drop the thing that gives the view its structure.** The current mobile CSS
  collapses the 7-day week grid to 2 columns and hides the weekday header
  (`src/index.css` `@media (max-width: 768px)`). That breaks the one piece of context a
  calendar needs — which weekday a date falls on — and is the kind of "fix" to avoid:
  shrink cell padding/font size instead of restructuring the grid. Prefer a mobile
  layout that keeps a real 7-across week (or one row per day in a vertical list with the
  weekday name kept next to the date) over anything that removes structure to save space.
- **Respect RTL.** This is a Hebrew RTL app (`dir="rtl"` on `<html>`). Check that text
  doesn't get clipped, icons/arrows still point the right way, and flex/grid direction
  reads right-to-left at narrow widths too — RTL bugs often only show up once things
  wrap or stack.
- **Touch targets ≥ 44×44px.** Anything clickable (day cells, the modal's toggle
  buttons, close button) needs a comfortable tap size on a phone, not just a desktop
  hover target.
- **Reuse the existing tokens.** Colors, radii, and spacing live as CSS variables at the
  top of `src/index.css` (`--bg-hover`, `--accent-green/red/gold`, etc.). New mobile
  styles should reference those, not introduce new ad hoc values.

## Verifying a change

Don't eyeball a resized desktop browser window — resizing an already-loaded tab can hide
real issues (stale layout, missed reflow) and desktop Chrome doesn't reproduce mobile
Safari quirks anyway. Drive a real headless browser at phone-sized viewports and look at
the screenshot:

```js
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone-ish
await page.goto('http://localhost:5173');
await page.waitForSelector('.calendar-container');
await page.screenshot({ path: '.verify-mobile.png', fullPage: true });
await browser.close();
```

Check at least two widths (e.g. 360px and 430px) since layouts that work at one phone
size can still break at another. Use `page.evaluate(() => el.getBoundingClientRect())`
to check touch-target sizes when in doubt, not just a visual glance at the screenshot.
