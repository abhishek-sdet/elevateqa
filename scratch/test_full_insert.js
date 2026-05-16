import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullInsert() {
  console.log('--- TESTING FULL SPEAKER INSERT ---');
  const testData = {
    name: 'Kapil Dev',
    role: 'KEYNOTE',
    status: 'CONFIRMED',
    image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    display_order: 0
  };

  const { data, error } = await supabase.from('speakers').upsert([testData]).select();
  
  if (error) {
    console.error('Full Insert Failed!', error);
  } else {
    console.log('Full Insert Success!', data);
    // console.log('Deleting test speaker...');
    // await supabase.from('speakers').delete().eq('id', data[0].id);
  }
}

testFullInsert();
