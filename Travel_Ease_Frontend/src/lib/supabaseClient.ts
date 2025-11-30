import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase environment variables not set. Google OAuth will not work.\n" +
    "To enable authentication:\n" +
    "1. Copy .env.example to .env\n" +
    "2. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase dashboard"
  );
}

// Create client only if configured, otherwise create a placeholder that won't crash
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);

