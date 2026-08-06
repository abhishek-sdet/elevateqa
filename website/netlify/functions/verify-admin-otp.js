import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wbgxcadajmdjxfhsgose.supabase.co';
// Service role key — bypasses RLS. Required because the `otps` table denies
// anon access entirely (otherwise anyone with the public anon key could read
// pending OTP codes straight out of the table and log in without needing
// email access at all). This key must stay server-side only.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MASTER_ADMINS = ['abhishekjohri150@gmail.com', 'elevateqa@sdettech.com', 'abhishek.johri@sdettech.com', 'mugdha.shah@sdettech.com'];

// Defense in depth: send-admin-otp.js already gates who ever gets an OTP
// issued, but this endpoint is what actually grants admin access, so it
// re-checks the whitelist itself rather than trusting that gate alone.
//
// This is a SEPARATE endpoint from verify-otp.js on purpose — verify-otp.js
// is shared by the public attendee/speaker-application OTP flow (main.js),
// and any random visitor confirming their own registration email is not an
// "admin request," so it must never be gated by the admin whitelist.
async function isWhitelistedAdmin(email) {
    const { data } = await supabase.from('site_content').select('hero_meta').single();
    let whitelist = [];
    if (data && data.hero_meta) {
        const meta = typeof data.hero_meta === 'string' ? JSON.parse(data.hero_meta) : data.hero_meta;
        if (meta.admin_whitelist && Array.isArray(meta.admin_whitelist)) {
            whitelist = meta.admin_whitelist;
        }
    }
    whitelist = [...new Set([...whitelist, ...MASTER_ADMINS])].map(e => e.toLowerCase());
    return whitelist.includes(email.toLowerCase());
}

// Signed proof-of-admin-login handed to the client after a successful OTP
// verify. The bulk-send functions (send-custom-email, send-final-ticket)
// require this so they aren't wide open to anyone who finds the endpoint
// URL. Requires ADMIN_TOKEN_SECRET to be set in Netlify env vars; if it's
// not set yet, no token is issued and those functions fall back to their
// prior (unenforced) behavior rather than breaking admin email sending.
function mintAdminToken(email) {
    const secret = process.env.ADMIN_TOKEN_SECRET;
    if (!secret) return null;
    const expires = Date.now() + 12 * 60 * 60 * 1000; // 12h admin session
    const payload = `${Buffer.from(email).toString('base64url')}.${expires}`;
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return `${payload}.${sig}`;
}

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

        if (!(await isWhitelistedAdmin(email))) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'This email is not authorized for admin access.' }) };
        }

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
            const token = mintAdminToken(email);
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'OTP verified successfully', token }) };
        } else {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid OTP' }) };
        }
    } catch (error) {
        console.error('[OTP Verify Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
