import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsertEmptyId() {
  console.log('--- TESTING SPEAKER UPSERT WITH EMPTY ID ---');
  const testData = {
    id: '', // THIS MIGHT BE THE PROBLEM
    name: 'EMPTY ID TEST',
    role: 'TEST',
    status: 'TEST',
    display_order: 100
  };

  const { data, error } = await supabase.from('speakers').upsert([testData]).select();
  
  if (error) {
    console.error('Upsert Failed!', error);
  } else {
    console.log('Upsert Success!', data);
    await supabase.from('speakers').delete().eq('id', data[0].id);
  }
}

testUpsertEmptyId();
