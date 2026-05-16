import { supabase } from '../src/scripts/supabase-config.js';

async function listTables() {
    // This is a hack to get table names if we don't have direct access
    // But usually we can just check what we know
    const tables = ['branding', 'manifesto', 'speakers', 'agenda', 'site_content', 'maturity_stages', 'pillars', 'registrations'];
    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (data && data[0]) {
            console.log(`Table ${t} columns:`, Object.keys(data[0]));
        }
    }
}

listTables();
