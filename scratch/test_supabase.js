import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabase() {
  console.log('Testing site_content table...');
  const { data, error } = await supabase.from('site_content').upsert([
    {
      id: 1,
      hero_headline: "AI-Led|Quality Engineering|[[Proof of Value]]",
      event_date: "8th August 2026",
      event_venue: "Noida, Delhi NCR"
    }
  ]).select();

  if (error) {
    console.error('❌ Error saving to site_content:', error.message);
  } else {
    console.log('✅ Successfully saved to site_content:', data);
  }

  console.log('\nTesting pillars table...');
  const { data: pData, error: pError } = await supabase.from('pillars').select('*').limit(1);
  if (pError) {
    console.error('❌ Error fetching pillars:', pError.message);
  } else {
    console.log('✅ Successfully fetched pillars table.');
  }
}

testSupabase();
