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

  // Update coming soon fields
  meta.comingSectionNum = "06 / What's coming";
  meta.comingTitle = "Date. Venue. <em>Lineup.</em>";
  meta.comingDesc = "We're locking in the details that make a great event a memorable one. Watch this space — the full reveal is coming in waves over the next few weeks.";
  meta.comingVisualLabel = "8th August";
  meta.comingVisualSub = "2026";
  
  meta.comingItem1Label = "Theme & manifesto";
  meta.comingItem1Status = "✓ Live";
  
  meta.comingItem2Label = "Speaker submissions";
  meta.comingItem2Status = "✓ Open";
  
  meta.comingItem3Label = "Date announcement";
  meta.comingItem3Status = "8th August, 2026";
  
  meta.comingItem4Label = "Venue reveal";
  meta.comingItem4Status = "Delhi, NCR, India";
  
  meta.comingItem5Label = "Full lineup";
  meta.comingItem5Status = "Need to be announced";
  
  meta.comingItem6Label = "Tickets & RSVP";
  meta.comingItem6Status = "Open";

  // Update back
  const { error: updateError } = await supabase
    .from('site_content')
    .update({ hero_meta: JSON.stringify(meta) })
    .eq('id', row.id);

  if (updateError) {
    console.error('Error updating site content:', updateError);
  } else {
    console.log('Successfully updated site content with custom coming soon details!');
  }
}
run();
