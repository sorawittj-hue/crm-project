import { createClient } from '@supabase/supabase-js';

// Validate environment variables - throw clear error if missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Throw error early to prevent silent failures in production
if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. ' +
    'Please create a .env file with VITE_SUPABASE_URL=your-supabase-url'
  );
}

if (!supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_KEY environment variable. ' +
    'Please create a .env file with VITE_SUPABASE_KEY=your-anon-key'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
