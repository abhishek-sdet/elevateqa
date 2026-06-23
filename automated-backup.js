import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Note: To use this locally, ensure you have dotenv installed:
// npm install dotenv
import 'dotenv/config';

async function performBackup() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY; // or service role key if needed

  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables (.env file).');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
    realtime: { enabled: false }
  });

  console.log('--- SUPABASE AUTOMATED BACKUP ---');
  const dateStr = new Date().toISOString().split('T')[0];
  const backupDir = path.join(process.cwd(), 'backups', dateStr);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    // 1. Backup Registrations
    console.log('Fetching registrations...');
    const { data: attendees, error: attError } = await supabase.from('registrations').select('*');
    if (attError) throw attError;

    if (attendees) {
      const attPath = path.join(backupDir, 'registrations.json');
      fs.writeFileSync(attPath, JSON.stringify(attendees, null, 2));
      console.log(`Saved ${attendees.length} registrations to ${attPath}`);
    }

    // 2. Backup Speaker Applications
    console.log('Fetching speaker applications...');
    const { data: speakers, error: spkError } = await supabase.from('speaker_applications').select('*');
    if (spkError) throw spkError;

    if (speakers) {
      const spkPath = path.join(backupDir, 'speaker_applications.json');
      fs.writeFileSync(spkPath, JSON.stringify(speakers, null, 2));
      console.log(`Saved ${speakers.length} speaker applications to ${spkPath}`);
    }

    console.log(`Backup completed successfully at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('Backup failed:', err.message);
    process.exit(1);
  }
}

performBackup();
