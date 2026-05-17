import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDb() {
  const tables = ['site_content', 'branding', 'manifesto', 'speakers', 'agenda', 'maturity_stages', 'pillars'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.log(`[${table}] ERROR:`, error.message);
    } else {
      console.log(`[${table}] ROWS:`, data.length);
      if (data.length > 0) {
        console.log(`[${table}] SAMPLE:`, JSON.stringify(data[0]).substring(0, 100));
      }
    }
  }
}

checkDb();
