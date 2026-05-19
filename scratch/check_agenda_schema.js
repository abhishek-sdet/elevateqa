import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('--- CHECKING AGENDA SCHEMA ---');
  const { data, error } = await supabase.from('agenda').select('*').limit(1);
  if (error) {
    console.error('Schema Check Failed!', error);
  } else {
    console.log('Columns found:', Object.keys(data[0] || {}));
    console.log('Full first row:', data[0]);
  }
}

checkSchema();
