import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvpslcbhjthwmxgshfoe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_368pEsST-qbiSYZFINgNpA_hCsJS9XJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('test').select('*').limit(1);
    if (error) {
      console.error('Error connecting:', error.message);
    } else {
      console.log('Connected successfully!');
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

testConnection();
