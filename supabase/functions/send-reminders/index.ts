// Sends Web Push reminders. Two callers:
//  - pg_cron every 5 minutes (header `x-cron-secret`): pushes every event whose `remind_at` has passed
//    and wasn't sent yet, to all devices of that event's band.
//  - a signed-in user (`Authorization: Bearer <jwt>`, body `{"test": true}`): pushes a test message to
//    that user's own devices only.
// Deploy with --no-verify-jwt (the cron caller has no user JWT; auth is checked below).
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Done per request (not at startup) so a bad key becomes a readable error instead of a boot crash.
function configureVapid() {
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );
}

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface Payload {
  title: string;
  body: string;
  url: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  gig: 'הופעה',
  'rehearsal-guided': 'חזרה מודרכת',
  'rehearsal-band-only': 'חזרה של הלהקה',
};

// The app calls this from the browser (the test button), so it must answer CORS preflight requests.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Returns true if the subscription is dead (gone/expired) and should be removed.
async function push(sub: Subscription, payload: Payload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
    return false;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      return true;
    }
    console.error('push failed', status, (err as Error).message);
    return false;
  }
}

async function sendTo(subs: Subscription[], payload: Payload): Promise<number> {
  const dead: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      if (await push(sub, payload)) {
        dead.push(sub.endpoint);
      } else {
        sent += 1;
      }
    }),
  );
  if (dead.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', dead);
  }
  return sent;
}

async function handleTest(req: Request): Promise<Response> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return json({ error: 'unauthorized' }, 401);
  }
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth')
    .eq('user_id', data.user.id);
  const sent = await sendTo((subs ?? []) as Subscription[], {
    title: 'Jam Planner 🎸',
    body: 'התראת בדיקה — ההתראות עובדות!',
    url: './',
  });
  return json({ sent });
}

async function handleCron(): Promise<Response> {
  const { data: due, error } = await supabase
    .from('gigs')
    .select('id,band_id,date,label,type,location')
    .lte('remind_at', new Date().toISOString())
    .is('reminder_sent_at', null);
  if (error) {
    return json({ error: error.message }, 500);
  }

  let events = 0;
  let sent = 0;
  for (const ev of due ?? []) {
    // Claim first so an overlapping run can't send the same reminder twice.
    const { data: claimed } = await supabase
      .from('gigs')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', ev.id)
      .is('reminder_sent_at', null)
      .select('id');
    if (!claimed || claimed.length === 0) {
      continue;
    }
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint,p256dh,auth')
      .eq('band_id', ev.band_id);
    const [y, m, d] = (ev.date as string).split('-');
    const where = ev.location ? ` · 📍 ${ev.location}` : '';
    sent += await sendTo((subs ?? []) as Subscription[], {
      title: `${EVENT_TYPE_LABELS[ev.type] ?? 'אירוע'} - ${ev.label}`,
      body: `${d}/${m}/${y}${where}`,
      url: './',
    });
    events += 1;
  }
  return json({ events, sent });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    configureVapid();
    const secret = Deno.env.get('CRON_SECRET');
    if (secret && req.headers.get('x-cron-secret') === secret) {
      return await handleCron();
    }
    const body = await req.json().catch(() => ({}));
    if (body?.test) {
      return await handleTest(req);
    }
    return json({ error: 'unauthorized' }, 401);
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});
