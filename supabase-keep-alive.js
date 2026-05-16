import { createClient } from '@supabase/supabase-js';

async function keepAlive() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log('--- SUPABASE KEEP ALIVE ---');
  try {
    // Perform a simple count query on registrations to trigger database activity
    const { count, error } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`Success! Activity logged at ${new Date().toISOString()}. Current registrations: ${count}`);
  } catch (err) {
    console.error('Keep alive failed:', err.message);
    process.exit(1);
  }
}

keepAlive();
