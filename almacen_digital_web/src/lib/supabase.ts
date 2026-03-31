import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_LIVE;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_LIVE;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase environment variables. Please check VITE_SUPABASE_URL_LIVE and VITE_SUPABASE_ANON_KEY_LIVE.');
}

// Fallback to dummy values to prevent createClient from throwing and causing a blank screen
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder', 
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true
    }
  }
);
