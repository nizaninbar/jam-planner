<#
.SYNOPSIS
  Ships the current work to main as the private GitHub account: checks, commit, push, PR, merge.
.EXAMPLE
  ./scripts/ship.ps1 -Message "Add username login"
  ./scripts/ship.ps1 -Message "WIP" -NoMerge     # stop after opening the PR
#>
param(
  [Parameter(Mandatory = $true)][string]$Message,
  [string]$Account = 'nizaninbar',
  [switch]$NoMerge,
  [switch]$SkipChecks
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Run([string]$what, [scriptblock]$cmd) {
  & $cmd
  if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)" }
}

$trailer = 'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>'
# Built from a code point: Windows PowerShell 5.1 reads BOM-less files as ANSI and would garble the emoji.
$prFooter = [char]::ConvertFromUtf32(0x1F916) + ' Generated with [Claude Code](https://claude.com/claude-code)'

# 1. Right GitHub account (the machine also has a work account).
Run 'gh auth switch' { gh auth switch --user $Account }

# 2. Checks.
if (-not $SkipChecks) {
  Run 'build' { npm run build }
  Run 'lint' { npm run lint }
}

# 3. Branch: never commit straight to main.
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -eq 'main') {
  $slug = ($Message.ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
  if ($slug.Length -gt 40) { $slug = $slug.Substring(0, 40).Trim('-') }
  $branch = "ship/$slug"
  Run 'create branch' { git checkout -b $branch }
}

# 4. Commit whatever is pending.
if (git status --porcelain) {
  Run 'git add' { git add -A }
  Run 'git commit' { git commit -m $Message -m $trailer }
}

# 5. Push and open (or reuse) the PR.
Run 'git push' { git push -u origin $branch }
$pr = gh pr list --head $branch --base main --state open --json number --jq '.[0].number'
if (-not $pr) {
  Run 'gh pr create' { gh pr create --base main --head $branch --title $Message --body "$Message`n`n$prFooter" }
}

# 6. Merge, then return to an up-to-date main.
if ($NoMerge) {
  gh pr view $branch --web 2>$null
  Write-Host "PR opened for $branch. Not merged (-NoMerge)."
  exit 0
}
Run 'gh pr merge' { gh pr merge $branch --squash --delete-branch }
Run 'checkout main' { git checkout main }
Run 'pull main' { git pull }
Write-Host "Shipped to main. GitHub Pages deploys from main via .github/workflows/deploy.yml."
