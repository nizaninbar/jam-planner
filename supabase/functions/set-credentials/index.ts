// Lets a signed-in anonymous user turn their access into a username/password login.
// Upgrading the anonymous user in place is unreliable on Supabase (auth.updateUser fails with
// "Email address "" is invalid"; admin.updateUserById returns a 500), so instead this creates a normal,
// confirmed user, moves the caller's access rows (member_accounts, push subscriptions, invite
// bookkeeping) over to it, and deletes the anonymous user. The browser then signs in with the new
// credentials. Only ever touches the caller's own user (identified by their JWT).
// Deploy: supabase functions deploy set-credentials   (JWT verification stays on)
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// [table, column] pairs that reference auth.users and must follow the member to the new user.
const MOVES: [string, string][] = [
  ['member_accounts', 'user_id'],
  ['push_subscriptions', 'user_id'],
  ['invites', 'claimed_by'],
  ['invites', 'created_by'],
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return json({ error: 'unauthorized' }, 401);
    }
    const oldId = data.user.id;
    if (data.user.email) {
      return json({ error: 'this account already has a login' }, 400);
    }
    const { email, password } = await req.json().catch(() => ({}));
    if (typeof email !== 'string' || !email.includes('@') || typeof password !== 'string' || password.length < 6) {
      return json({ error: 'invalid email or password' }, 400);
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) {
      const message = createError?.message ?? 'no user returned';
      console.error('createUser failed', message, createError?.status, createError?.code);
      return json({ error: `create: ${message} (code ${createError?.code})` }, 400);
    }
    const newId = created.user.id;

    // Move access over; if anything fails, undo and delete the new user so the anonymous one still works.
    const moved: [string, string][] = [];
    for (const [table, column] of MOVES) {
      const { error: moveError } = await supabase.from(table).update({ [column]: newId }).eq(column, oldId);
      if (moveError) {
        console.error('move failed', table, column, moveError.message);
        for (const [t, c] of moved) {
          await supabase.from(t).update({ [c]: oldId }).eq(c, newId);
        }
        await supabase.auth.admin.deleteUser(newId);
        return json({ error: `move ${table}.${column}: ${moveError.message}` }, 500);
      }
      moved.push([table, column]);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(oldId);
    if (deleteError) {
      // Harmless leftover: the old anonymous user no longer owns anything.
      console.error('deleting old anonymous user failed', deleteError.message);
    }
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});
