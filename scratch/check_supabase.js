import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('--- CHECKING SUPABASE DATA ---');

  const { data: site, error: siteErr } = await supabase.from('site_content').select('*').single();
  if (siteErr) console.error('Site Content Error:', siteErr);
  else {
    console.log('Hero Headline:', site.hero_headline);
    const meta = typeof site.hero_meta === 'string' ? JSON.parse(site.hero_meta) : site.hero_meta;
    console.log('Hero BG exists:', !!meta?.heroBg);
    if (meta?.heroBg) console.log('Hero BG starts with:', meta.heroBg.substring(0, 50));
  }

  const { data: speakers, error: spkErr } = await supabase.from('speakers').select('*');
  if (spkErr) console.error('Speakers Error:', spkErr);
  else {
    console.log(`Found ${speakers.length} speakers.`);
    speakers.forEach((s, i) => {
      console.log(`Speaker ${i+1}: ${s.name} | Photo exists: ${!!s.image_url}`);
      if (s.image_url) console.log(`   Photo starts with: ${s.image_url.substring(0, 50)}`);
    });
  }
}

checkData();
