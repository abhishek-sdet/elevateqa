const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wbgxcadajmdjxfhsgose.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4');
async function get() {
  const { data, error } = await supabase.from('registrations').select('email, name').neq('status', 'cancelled');
  const index = data.findIndex(d => d.name && d.name.toLowerCase().includes('mukesh'));
  
  let output = '';
  for (let i = index + 1; i < data.length; i++) {
    output += data[i].name + ' <' + data[i].email + '>,\n';
  }
  
  fs.writeFileSync('C:\\Users\\abhishek.johri\\.gemini\\antigravity-ide\\brain\\bfbf79c7-4bbe-4736-b068-f680bd2bb3e6\\unsent_attendees.md', '# Unsent Attendees\n\nCopy and paste the below text into the **Custom Emails** text area to resume sending:\n\n```text\n' + output.trim().replace(/,$/, '') + '\n```');
  console.log('Saved to unsent_attendees.md. Remaining:', data.length - index - 1);
}
get();
