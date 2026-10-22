# Event reminders (push notifications)

An admin/member sets a reminder date+time on an event (day editor → 🔔 תזכורת). At that time every
device that enabled notifications gets a push, like a phone-app notification.

How it works: the app is a PWA (`public/manifest.webmanifest`, `public/sw.js`). Each device subscribes
and is stored in `push_subscriptions`. `pg_cron` calls the `send-reminders` edge function every 5
minutes; it pushes events whose `remind_at` has passed and marks them sent. So a reminder arrives
within ~5 minutes of the chosen time.

## One-time setup

1. **VAPID keys**: `npx web-push generate-vapid-keys`. Keep the private key secret.
2. **GitHub repo secret** `VAPID_PUBLIC_KEY` (public key) — injected at build in `deploy.yml`. For local
   dev put it in `.env.local` as `VITE_VAPID_PUBLIC_KEY`.
3. **Supabase**: Database → Extensions → enable `pg_cron` and `pg_net`.
4. Run `supabase/migrate_07_add_reminders.sql` in the SQL Editor, then the two commented statements at
   its bottom (vault secret + `cron.schedule`, filling in `<project-ref>` and a random secret).
   `<project-ref>` must be the real 20-letter ref from your Supabase URL; to fix a wrong one, run
   `select cron.unschedule('send-reminders');` and schedule it again.
5. **Edge function** (Supabase CLI):
   ```
   npx supabase link --project-ref <20-letter ref from your Supabase URL, not the project name>
   npx supabase secrets set 'VAPID_PUBLIC_KEY=...' 'VAPID_PRIVATE_KEY=...' 'VAPID_SUBJECT=mailto:you@example.com' 'CRON_SECRET=<same random secret as the vault one>'
   npx supabase functions deploy send-reminders --no-verify-jwt
   ```
   Quote each `NAME=value` (PowerShell) and paste the keys exactly: no quotes inside, no `=`, no
   spaces. Add `--use-api` to the deploy if Docker isn't available. The public key here and in the
   GitHub secret must be the same one.
6. Push to `main` so GitHub Pages rebuilds with the public key. (The workflow runs only on push;
   there is no "Run workflow" button.)

## Installing & testing

- **Android Chrome**: menu ⋮ → *Install app* (or *Add to Home screen*).
- **iPhone (iOS 16.4+)**: Safari → Share → *Add to Home Screen*, then open it from the home screen
  (push doesn't work in a plain Safari tab).
- Open the app, tap **🔔 הפעל התראות** and allow. To test, set a reminder on an event ~5–10 minutes
  ahead; it should arrive within 5 minutes of that time.
- The in-app "send test" button was removed after setup. To bring it back, call `sendTestPush()` from
  `src/data/pushService.ts` (the function supports `{ "test": true }` for a signed-in user).

## Troubleshooting

- **"Failed to send a request to the Edge Function"**: the browser couldn't reach it. Probe it with
  `curl -X POST https://<ref>.supabase.co/functions/v1/send-reminders -d '{"test":true}'`:
  `{"error":"unauthorized"}` is healthy; a `WORKER_ERROR` means the function crashed; a JSON error
  names the problem (e.g. a malformed `VAPID_PUBLIC_KEY`).
- **Changed the VAPID keys**: update the Supabase secrets and the GitHub secret, redeploy the site, then
  on each phone tap 🔕 and **הפעל התראות** again (old subscriptions belong to the old key).
- **No "הפעל התראות" banner**: the site was built without `VAPID_PUBLIC_KEY`, or the app isn't running
  from the https site.
- **Test works but a scheduled reminder doesn't arrive** (stays "ממתינה"): run
  `select status_code, content, error_msg from net._http_response order by created desc limit 5;`.
  "Couldn't resolve host name" = wrong/placeholder `<project-ref>` in the cron job; `401` =
  `CRON_SECRET` doesn't match the vault secret `reminders_cron_secret`; no rows = `pg_net` or the job
  isn't set up (`select * from cron.job;`, `cron.job_run_details`).

Limits: reminders go to every subscribed device of the band; a device that hasn't enabled
notifications gets nothing. Editing the reminder time re-arms an already-sent reminder.
