import { supabase } from '../website/src/scripts/supabase-config.js';

async function run() {
  const { data } = await supabase.from('agenda').select('*').order('display_order');
  console.log(JSON.stringify(data, null, 2));
}

run();
