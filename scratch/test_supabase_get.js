import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGet() {
  console.log('--- TESTING SPEAKER GET WITH ORDER ---');
  
  const { data, error } = await supabase
    .from('speakers')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('Get Failed!', error);
  } else {
    console.log('Get Success!', data.length, 'speakers found.');
    if (data.length > 0) console.log('First Speaker:', data[0].name);
  }
}

testGet();
