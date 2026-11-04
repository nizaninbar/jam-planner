# Sign-in methods

Three ways in, all ending in the same thing: a Supabase auth user with a `member_accounts` row (band,
member, role). Roles and RLS are unchanged — see `supabase/migrate_06_add_iam.sql` and
`migrate_08_admin_only_content.sql`.

| Method | How it starts | Can sign in again later? |
| --- | --- | --- |
| Invite link | Admin creates a per-member link in the **ניהול** tab; opening it (`#/invite/<token>`) starts an anonymous session and claims the invite | Only on that device/browser. Signing out, clearing data or reinstalling loses it |
| Username + password | Settings → "הגדר שם משתמש וסיסמה" | Yes, from the login screen, on any device |
| Google | Settings → "צרף Google", or "כניסה עם Google" on the login screen | Yes |

A user can have both a password and Google (Settings shows "צרף Google" to a password account).

Why this exists: an iPhone app installed to the home screen has storage separate from Safari, so the
anonymous session from the invite link doesn't carry over and the user lands on "no access".

## Username + password

- Supabase password auth is email-based. A plain username becomes `<username>@users.jam-planner.app`
  (lowercased; the domain never receives mail). If the username contains `@` it is used as the email as
  written. Rules: no spaces, password at least 6 characters. Code: `usernameToEmail` /
  `validateCredentials` in `src/data/authService.ts`.
- **Setting credentials** calls the `set-credentials` edge function
  (`supabase/functions/set-credentials/index.ts`, JWT verification on). Upgrading the anonymous user in
  place doesn't work on Supabase (`auth.updateUser({ email })` → `Email address "" is invalid`;
  `admin.updateUserById` → HTTP 500), so the function:
  1. creates a normal, pre-confirmed user with the email and password,
  2. moves the caller's rows to it: `member_accounts.user_id`, `push_subscriptions.user_id`,
     `invites.claimed_by` and `invites.created_by` (undoing and deleting the new user if a move fails),
  3. deletes the old anonymous user.
  The client then signs in with the new credentials. The user id changes, but role, member and push
  reminders carry over.
- **Signing in** is `signInWithPassword` from the login screen (`NoAccessScreen`).
- There is no password reset (no real mailbox). If someone forgets it, an admin issues a new invite
  link and they set new credentials. If a new table gets a foreign key to `auth.users`, add it to
  `MOVES` in the edge function.

## Setup

1. Supabase → Authentication: anonymous sign-ins and manual linking on, Google provider configured,
   Email provider enabled.
2. Run `supabase/migrate_09_admin_accounts_login.sql` (admin list counts an email as a login).
3. Deploy the function (JWT verification stays **on**, unlike `send-reminders`):
   ```
   npx supabase login
   npx supabase link --project-ref <20-letter ref from the Supabase URL>
   npx supabase functions deploy set-credentials
   ```
   Redeploy after any change to the function; shipping the web app does not do it.

## Troubleshooting

- **"שם המשתמש תפוס"** — a user with that email exists. Check in the SQL editor:
  ```sql
  select u.id, u.email, u.is_anonymous, u.created_at,
         (select count(*) from public.member_accounts a where a.user_id = u.id) as has_access
  from auth.users u where u.email ilike '%name%' order by u.created_at;
  ```
  A row with `has_access = 0` is a leftover from a failed attempt and can be deleted (the `not exists
  (select 1 from public.member_accounts …)` guard keeps this from removing anyone with access).
  `has_access = 1` is a real account — don't delete it.
- **"Failed to set username: create/move …"** — the text names the failing step; the same details are
  in Dashboard → Edge Functions → set-credentials → Logs.
- **Login form missing** — it only shows when there is no account (signed out). Hard-refresh or
  reinstall the home-screen app if it looks stale.
