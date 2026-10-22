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
Needs `psql` (PostgreSQL client) and `gpg`.

```sh
# 1. Download the artifact zip from the Actions run, unzip, then decrypt:
gpg -o backup.sql.gz --decrypt jam-planner-YYYY-MM-DD.sql.gz.gpg
gunzip backup.sql.gz   # Windows: use 7-Zip, or Git Bash

# 2. Load it (the dump drops and recreates the public tables first):
psql "<SUPABASE_DB_URL>" -f backup.sql
```

To restore into a **new** Supabase project, just use that project's connection string. Then update
`SUPABASE_URL` / `SUPABASE_ANON_KEY` repo secrets and `.env.local`.

Restoring replaces everything in `public` with the backup's contents, so changes made after the
backup are lost. Test a restore into a throwaway Supabase project once, so you know it works before
you need it.
