import { createClient } from '@supabase/supabase-js';

// Use build-time fallback values to prevent 'next build' from crashing when environment variables are not yet set.
// At runtime, actual values from .env.local will be read.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-id.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (
  supabaseUrl.includes('placeholder-project-id') ||
  supabaseAnonKey === 'placeholder-anon-key'
) {
  console.warn(
    'Supabase credentials are using build-time placeholders. Please copy .env.example to .env.local and configure your actual project values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
