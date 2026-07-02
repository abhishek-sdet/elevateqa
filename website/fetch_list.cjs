const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wbgxcadajmdjxfhsgose.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4');
const fs = require('fs');

async function getList() {
  const { data, error } = await supabase.from('registrations').select('id, email, name, created_at').neq('status', 'cancelled').order('id', { ascending: true });
  if (error) { console.error(error); return; }
  
  let output = '=== ALL REGISTRATIONS ===\n\n';
  data.forEach((r, i) => {
    output += `${i + 1}. ${r.name} <${r.email}>\n`;
  });
  
  fs.writeFileSync('attendee_list.txt', output);
  console.log('Total attendees:', data.length);
}
getList();
