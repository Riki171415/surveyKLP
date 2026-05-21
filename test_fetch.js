import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvpslcbhjthwmxgshfoe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_368pEsST-qbiSYZFINgNpA_hCsJS9XJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testFetch() {
  const { data, error } = await supabase.from('app_users').select('*').limit(5);
  if (error) {
    console.error('Error fetching users:', error.message);
  } else {
    console.log('Users fetched successfully:', data);
  }
}

testFetch();
