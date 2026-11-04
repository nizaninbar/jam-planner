// Lets a signed-in (usually anonymous) user give themselves an email/username + password.
// The browser can't do this reliably with auth.updateUser (anonymous users hit "Email address "" is
// invalid" or a confirmation mail that never arrives), so it's done here with the service role,
// marking the email confirmed. Only ever touches the caller's own user (identified by their JWT).
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
    const { email, password } = await req.json().catch(() => ({}));
    if (typeof email !== 'string' || !email.includes('@') || typeof password !== 'string' || password.length < 6) {
      return json({ error: 'invalid email or password' }, 400);
    }
    const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
      email,
      password,
      email_confirm: true,
    });
    if (updateError) {
      return json({ error: updateError.message }, 400);
    }
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});
