const SUPABASE_URL = window.SUPABASE_URL || 'https://jdianavibwqbxgjkzniq.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaWFuYXZpYndxYnhnamt6bmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjM4NTEsImV4cCI6MjA4MDc5OTg1MX0.qafIxFwH1w0c6zWb69G6226pyfUPINx7I4_idyiGPs8';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
