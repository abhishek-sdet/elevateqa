import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectTable(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (data && data.length > 0) {
    console.log(`[${table}] Columns:`, Object.keys(data[0]));
    console.log(`[${table}] ID Type:`, typeof data[0].id);
  }
}

async function run() {
  await inspectTable('manifesto');
  await inspectTable('site_content');
  await inspectTable('branding');
}

run();
