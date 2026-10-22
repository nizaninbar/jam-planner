# Database backup & restore

Supabase's free tier has **no** automatic backups, so we take our own.

## How it works
`.github/workflows/backup.yml` runs daily (03:17 UTC) and on demand (Actions -> "Backup database"
-> Run workflow). It `pg_dump`s the `public` schema (tables, constraints, RLS policies, all data),
gzips it, encrypts it with AES-256 (the repo is public, so artifacts must not be readable), and
uploads it as a workflow artifact kept for **90 days**. The daily DB connection also stops the free
project from auto-pausing after a week of inactivity. If a run fails, GitHub emails you.

## One-time setup
1. Supabase dashboard -> Connect -> **Session pooler** connection string (works over IPv4, which
   GitHub runners need; the "direct" one is IPv6-only). Put your DB password in it.
2. Repo -> Settings -> Secrets and variables -> Actions -> add:
   - `SUPABASE_DB_URL` — that connection string
   - `BACKUP_PASSPHRASE` — a long random passphrase. **Also store it in your password manager**;
     without it the backups are unreadable.
3. Run the workflow once manually and confirm the artifact appears.
4. Every month or so, download the newest artifact to your own machine/cloud drive — artifacts
   expire after 90 days and live in the same GitHub account as the code.

## Restore
Needs `gpg`, `gunzip` and `psql`. On Windows, Git for Windows ships the first two in
`C:\Program Files\Git\usr\bin` (not on PowerShell's PATH; call them by full path or use Git Bash).
If you don't have `psql`, run it through Docker instead (see step 2).

```sh
# 1. Download the artifact zip from the Actions run, unzip, then decrypt:
gpg -o backup.sql.gz --decrypt jam-planner-YYYY-MM-DD.sql.gz.gpg
gunzip backup.sql.gz

# 2. Load it (the dump drops and recreates the public tables first).
#    ON_ERROR_STOP makes it stop at the first error instead of half-restoring.
psql -v ON_ERROR_STOP=1 "<SUPABASE_DB_URL>" -f backup.sql

#    No psql installed? Same thing via Docker (bash syntax):
docker run --rm -i postgres:17 psql -v ON_ERROR_STOP=1 "<SUPABASE_DB_URL>" < backup.sql
```

Use the session-pooler connection string (same as the `SUPABASE_DB_URL` secret). To restore into a
**new** Supabase project, use that project's string. Then update the `SUPABASE_URL` /
`SUPABASE_ANON_KEY` repo secrets and `.env.local`.

### Restoring into plain Postgres (not Supabase)
The dump's RLS policies reference Supabase's roles, so create them first, otherwise the load fails:

```sql
create role anon; create role authenticated; create role service_role;
```

Plain Postgres has no PostgREST, so the policies are harmless but unused. The app itself talks to
Supabase's API, so pointing it at plain Postgres also needs changes to `src/data/bandService.ts`.

### Notes
- Restoring replaces everything in `public` with the backup's contents; changes made after the
  backup are lost.
- Tested: decrypt + load into a local Postgres 17 (Docker) restores all rows and policies. Not yet
  tested: loading into a Supabase project.
