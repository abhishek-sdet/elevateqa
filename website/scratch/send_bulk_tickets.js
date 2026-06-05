import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';
const supabase = createClient(supabaseUrl, supabaseKey);

const NETLIFY_URL = 'https://elevateqa.netlify.app/.netlify/functions/send-ticket';

async function main() {
  console.log('Fetching registrations from Supabase...');
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('*');

  if (error) {
    console.error('Error fetching registrations:', error);
    return;
  }

  console.log(`Found ${registrations.length} registrations.`);

  for (let i = 0; i < registrations.length; i++) {
    const reg = registrations[i];
    const { id: dbId, name, email, company, designation } = reg;
    const ticketId = 'EQ26-' + dbId.split('-')[0].toUpperCase();
    const qrData = `ELEVATE-QA:${dbId}|${name}|${company}`;

    console.log(`[${i + 1}/${registrations.length}] Sending QR code to ${name} (${email})...`);

    try {
      const payload = {
        name,
        email,
        company: company || '',
        ticketId,
        designation: designation || '',
        qrData
      };

      const response = await fetch(NETLIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resJson = await response.json();
        console.log(`Successfully sent email to ${email}:`, resJson.message);
      } else {
        const text = await response.text();
        console.error(`Failed to send email to ${email}. Status: ${response.status}. Response: ${text}`);
      }
    } catch (err) {
      console.error(`Error sending email to ${email}:`, err);
    }

    // Sleep for 1.5 seconds to prevent rate limiting or hitting the SMTP servers too fast
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('Bulk email sending completed!');
}

main().catch(console.error);
