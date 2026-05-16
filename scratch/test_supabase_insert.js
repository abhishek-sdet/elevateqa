import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('--- TESTING SPEAKER INSERT ---');
  const testData = {
    name: 'TEST SPEAKER',
    role: 'TEST ROLE',
    status: 'TESTING',
    display_order: 99
  };

  const { data, error } = await supabase.from('speakers').insert([testData]).select();
  
  if (error) {
    console.error('Insert Failed!', error);
    if (error.code === '42501') {
      console.error('ERROR 42501: Row Level Security (RLS) is blocking the insert. You MUST run the SQL fix in the Supabase Editor.');
    }
  } else {
    console.log('Insert Success!', data);
    console.log('Deleting test speaker...');
    await supabase.from('speakers').delete().eq('id', data[0].id);
  }
}

testInsert();
