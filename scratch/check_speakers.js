import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSpeakers() {
  const { data, error } = await supabase.from('speakers').select('*');
  if (error) {
    console.error('Error fetching speakers:', error);
    return;
  }
  console.log('Current Speakers:');
  data.forEach(s => {
    console.log(`- ${s.name} (${s.role}): ${s.title || 'No Title'}`);
  });
}

checkSpeakers();
