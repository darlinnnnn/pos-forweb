import { createClient } from '@supabase/supabase-js';

// Access Environment Variables (Vite standard)
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
// We use a fallback if env vars are missing to prevent crash, but console.warn
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}