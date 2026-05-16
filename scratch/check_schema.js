import { supabase } from '../src/scripts/supabase-config.js';

async function checkSchema() {
    const { data, error } = await supabase.from('site_content').select('*').limit(1).single();
    if (error) {
        console.error('Error fetching site_content:', error);
    } else {
        console.log('Site Content Keys:', Object.keys(data));
    }
}

checkSchema();
