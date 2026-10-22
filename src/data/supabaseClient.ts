import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.',
  );
}

// PKCE keeps OAuth results in ?code=... instead of the URL hash, which the app uses for invite links.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { flowType: 'pkce' } });
