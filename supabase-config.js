// Supabase configuration
// These values can be set via environment variables at build time
// For Vercel, you can use NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

const SUPABASE_URL =
  window.SUPABASE_URL ||
  window.NEXT_PUBLIC_SUPABASE_URL ||
  'https://fwrnbfwzolplbmiaaeme.supabase.co';

const SUPABASE_ANON_KEY =
  window.SUPABASE_ANON_KEY ||
  window.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// Initialize Supabase client (supabase is loaded from CDN)
if (!SUPABASE_ANON_KEY) {
  console.warn('Supabase anon key missing in browser config. Set window.SUPABASE_ANON_KEY.');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
