import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4'

const supabase = createClient(supabaseUrl, supabaseKey)

// A standard UUID string
const DUMMY_UUID = '00000000-0000-0000-0000-000000000001';

async function seedInitialData() {
  console.log('Seeding branding table...');
  const { error: err1 } = await supabase.from('branding').upsert([
    {
      id: DUMMY_UUID,
      primary_color: '#d4ff3a',
      logo_url: ''
    }
  ]);
  if (err1) console.error('Error seeding branding:', err1.message);
  else console.log('✅ Branding seeded.');

  console.log('Seeding manifesto table...');
  const { error: err2 } = await supabase.from('manifesto').upsert([
    {
      id: DUMMY_UUID,
      content: ''
    }
  ]);
  if (err2) console.error('Error seeding manifesto:', err2.message);
  else console.log('✅ Manifesto seeded.');
}

seedInitialData();
