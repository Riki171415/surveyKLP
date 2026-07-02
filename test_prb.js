import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvpslcbhjthwmxgshfoe.supabase.co';
const supabaseKey = 'sb_publishable_368pEsST-qbiSYZFINgNpA_hCsJS9XJ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase.from('surveys').select('id, prb, fktp_name, nama_responden').limit(5);
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
    if (data.length > 0) {
      console.log('Type of PRB:', typeof data[0].prb);
    }
  }
}

checkData();
