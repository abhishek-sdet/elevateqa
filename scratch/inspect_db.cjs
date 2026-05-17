
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['site_content', 'speakers', 'agenda', 'maturity_stages', 'pillars', 'branding', 'manifesto'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*');
    console.log(`${t}: ${data?.length} rows`);
  }
}
check();
