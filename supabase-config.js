// Supabase configuration
// NOTE: This is a static site, so process.env values are not available directly in browser JS.
// If needed, inject runtime vars before this file via window.SUPABASE_URL / window.SUPABASE_ANON_KEY.

const SUPABASE_URL =
  window.SUPABASE_URL ||
  window.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fwrnbfwzolplbmiaaeme.supabase.co";

const SUPABASE_ANON_KEY =
  window.SUPABASE_ANON_KEY ||
  window.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cm5iZnd6b2xwbGJtaWFhZW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjExMDIsImV4cCI6MjA4Njc5NzEwMn0.shOMW9NahKSMW3m5sYfUiBf2jsQW8HuVck5WXG7SzAw";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
