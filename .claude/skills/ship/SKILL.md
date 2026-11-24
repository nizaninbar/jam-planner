---
name: ship
description: Ship the current changes to main as the private GitHub account (nizaninbar) - runs build and lint, commits, pushes a branch, opens a PR and squash-merges it. Use when the user says /ship or asks to ship, push and merge, or deploy their work.
---

# Ship

Runs `scripts/ship.ps1`, which switches `gh` to the `nizaninbar` account, runs `npm run build` and
`npm run lint`, branches off `main` if needed, commits pending changes, pushes, opens a PR and
squash-merges it. Merging to `main` triggers the GitHub Pages deploy.

## Steps

1. Run `git status` and `git diff --stat` so you know what will be shipped. If there is nothing to
   commit and no unpushed commits, say so and stop.
2. **Docs check (blocking).** Sessions are independent, so the docs are the only memory between
   them. Compare the diff against the rules in CLAUDE.md ("Documentation is the memory between
   sessions"): `CLAUDE.md`, `docs/GOALS.md`, `README.md`, any touched topic doc, and a documented
   `supabase/migrate_NN_*.sql` for schema changes. If any relevant doc is missing or stale, update
   it now (it ships in the same PR) before continuing. Do not run the script until this is done; in
   your report say which docs you updated or why none were needed.
3. Pick a short, imperative commit/PR title from the changes (or use the user's argument if given).
4. Run from the repo root:
   ```
   powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -Message "<title>"
   ```
   Add `-NoMerge` if the user only wants the PR opened.
5. Report the PR link and whether it merged. If a check fails, show the error and do not retry with
   `-SkipChecks` unless the user asks.
6. Remind the user of manual follow-ups the change needs (Supabase SQL migrations, `supabase
   functions deploy <name>`), since the script does not do those.

The commit message gets the `Co-Authored-By` trailer and the PR body the Claude Code footer.
