
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('--- Checking RLS Policies ---');
  
  // Try to insert a dummy row
  const { data, error } = await supabase
    .from('registrations')
    .insert([{ name: 'Test User', email: 'test@example.com', company: 'Test Org' }]);

  if (error) {
    console.error('Insert Failed:', error.message);
    if (error.message.includes('row-level security')) {
      console.log('CRITICAL: RLS is blocking inserts.');
    }
  } else {
    console.log('Insert Succeeded! RLS is fine.');
  }
}

checkRLS();
