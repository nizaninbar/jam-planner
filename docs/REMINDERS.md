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
5. **Edge function** (Supabase CLI):
   ```
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com CRON_SECRET=<same random secret as the vault one>
   supabase functions deploy send-reminders --no-verify-jwt
   ```
6. Push to `main` so GitHub Pages rebuilds with the public key.

## Installing & testing

- **Android Chrome**: menu ⋮ → *Install app* (or *Add to Home screen*).
- **iPhone (iOS 16.4+)**: Safari → Share → *Add to Home Screen*, then open it from the home screen
  (push doesn't work in a plain Safari tab).
- Open the app, tap **🔔 הפעל התראות** and allow, then **שלח בדיקה** — a notification should arrive
  immediately. To test a real reminder, set one on an event ~5–10 minutes ahead.

Limits: reminders go to every subscribed device of the band; a device that hasn't enabled
notifications gets nothing. Editing the reminder time re-arms an already-sent reminder.
