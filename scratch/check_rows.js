import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRows() {
  const tables = ['branding', 'manifesto', 'site_content'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.log(`[${table}] Error:`, error.message);
    } else {
      console.log(`[${table}] Row count:`, data.length);
      console.log(`[${table}] Data:`, data);
    }
  }
}

checkRows();
