import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wbgxcadajmdjxfhsgose.supabase.co';
// Service role key — bypasses RLS. Required because the `otps` table denies
// anon access entirely (otherwise anyone with the public anon key could read
// pending OTP codes straight out of the table and log in without needing
// email access at all). This key must stay server-side only.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        let { email, otp } = JSON.parse(event.body);

        if (!email || !otp) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and OTP are required' }) };
        }
        email = email.toLowerCase();

        const { data: record, error: dbError } = await supabase
            .from('otps')
            .select('*')
            .eq('email', email)
            .single();

        if (dbError || !record) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'No OTP found for this email, or it has expired. Please request a new one.' }) };
        }

        if (Date.now() > new Date(record.expires_at).getTime()) {
            await supabase.from('otps').delete().eq('email', email);
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'OTP has expired. Please request a new one.' }) };
        }

        if (record.code.toString() === otp.toString()) {
            await supabase.from('otps').delete().eq('email', email);
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'OTP verified successfully' }) };
        } else {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid OTP' }) };
        }
    } catch (error) {
        console.error('[OTP Verify Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
