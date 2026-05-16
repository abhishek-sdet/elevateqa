import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
  console.log('--- Listing All Tables via OpenAPI ---');
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': supabaseKey }
    });
    const data = await resp.json();
    if (data.definitions) {
      console.log('Tables found:', Object.keys(data.definitions));
    } else {
      console.log('Definitions not found. Response:', data);
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

async function checkTable(table) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
        console.log(`[${table}] ERROR: ${error.message}`);
    } else {
        console.log(`[${table}] SUCCESS: Found table`);
    }
}

async function inspect() {
  const possibleCols = ['id', 'data', 'metadata', 'settings', 'content', 'config', 'hero_headline', 'headline'];
  console.log('--- Hunting Columns in branding ---');
  for (const col of possibleCols) {
    const { error } = await supabase.from('branding').select(col).limit(1);
    if (!error) {
      console.log(`[branding] SUCCESS: Found column '${col}'`);
    } else {
      console.log(`[branding] FAILED: Column '${col}' - ${error.message}`);
    }
  }

  console.log('\n--- Searching for any other table names ---');
  const commonNames = ['settings', 'config', 'site', 'event', 'summit', 'hero'];
  for (const name of commonNames) {
    const { error } = await supabase.from(name).select('*').limit(1);
    if (!error) {
      console.log(`[${name}] SUCCESS: Table exists!`);
    } else if (error.message.includes('not find')) {
      // 404
    } else {
      console.log(`[${name}] EXISTS but error: ${error.message}`);
    }
  }
}

inspect()
