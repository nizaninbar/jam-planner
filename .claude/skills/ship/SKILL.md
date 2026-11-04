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
2. Pick a short, imperative commit/PR title from the changes (or use the user's argument if given).
3. Run from the repo root:
   ```
   powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -Message "<title>"
   ```
   Add `-NoMerge` if the user only wants the PR opened.
4. Report the PR link and whether it merged. If a check fails, show the error and do not retry with
   `-SkipChecks` unless the user asks.
5. Remind the user of manual follow-ups the change needs (Supabase SQL migrations, `supabase
   functions deploy <name>`), since the script does not do those.

The commit message gets the `Co-Authored-By` trailer and the PR body the Claude Code footer.
