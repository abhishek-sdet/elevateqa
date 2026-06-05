import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';
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
