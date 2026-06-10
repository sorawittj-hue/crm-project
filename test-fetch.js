import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', 'demo@novapipeline.com');

  console.log("Profile data:", data);
  console.log("Error:", error);
}
testFetch();
