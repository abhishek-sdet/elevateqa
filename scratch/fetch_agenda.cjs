require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
(async () => {
    const { data } = await supabase.from('agenda').select('*');
    console.log(JSON.stringify(data, null, 2));
})();
