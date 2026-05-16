import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLargeInsert() {
  console.log('--- TESTING LARGE IMAGE INSERT ---');
  
  // Create a ~2MB dummy base64 string
  const largeBase64 = 'data:image/png;base64,' + 'A'.repeat(2 * 1024 * 1024);
  
  const testData = {
    name: 'LARGE IMAGE TEST',
    role: 'TEST',
    image_url: largeBase64,
    display_order: 999
  };

  const { data, error } = await supabase.from('speakers').insert([testData]).select();
  
  if (error) {
    console.error('Large Insert Failed!', error);
  } else {
    console.log('Large Insert Success! Data length:', data[0].image_url.length);
    console.log('Deleting test speaker...');
    await supabase.from('speakers').delete().eq('id', data[0].id);
  }
}

testLargeInsert();
