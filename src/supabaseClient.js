import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvpslcbhjthwmxgshfoe.supabase.co';
const supabaseAnonKey = 'sb_publishable_368pEsST-qbiSYZFINgNpA_hCsJS9XJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
