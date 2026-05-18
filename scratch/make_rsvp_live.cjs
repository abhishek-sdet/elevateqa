const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('site_content').select('*').limit(1);
  if (error) {
    console.error('Error fetching site content:', error);
    return;
  }

  const row = data[0];
  const meta = JSON.parse(row.hero_meta || '{}');

  // Update Tickets & RSVP status
  meta.comingItem6Status = "✓ Live";

  // Update back
  const { error: updateError } = await supabase
    .from('site_content')
    .update({ hero_meta: JSON.stringify(meta) })
    .eq('id', row.id);

  if (updateError) {
    console.error('Error updating site content:', updateError);
  } else {
    console.log('Successfully updated Tickets & RSVP to ✓ Live!');
  }
}
run();
