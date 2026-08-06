import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wbgxcadajmdjxfhsgose.supabase.co';
// Service role key — bypasses RLS. Required because the `otps` table denies
// anon access entirely (otherwise anyone with the public anon key could read
// pending OTP codes straight out of the table and log in without needing
// email access at all). This key must stay server-side only.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const MASTER_ADMINS = ['abhishekjohri150@gmail.com', 'elevateqa@sdettech.com', 'abhishek.johri@sdettech.com', 'mugdha.shah@sdettech.com'];

// The admin whitelist was previously only checked client-side (in admin-auth.js)
// before calling this endpoint, so anyone could POST an arbitrary email here
// directly and receive a real admin login OTP. This re-checks it server-side.
async function isWhitelistedAdmin(email) {
    const { data } = await supabase.from('site_content').select('hero_meta').single();
    let whitelist = [];
    if (data && data.hero_meta) {
        const meta = typeof data.hero_meta === 'string' ? JSON.parse(data.hero_meta) : data.hero_meta;
        if (meta.admin_whitelist && Array.isArray(meta.admin_whitelist)) {
            // Entries are either a plain email string (legacy) or {email, role} —
            // role only matters client-side for which tabs an admin can see, not
            // for whether they're allowed to log in at all.
            whitelist = meta.admin_whitelist.map(entry => typeof entry === 'string' ? entry : entry.email);
        }
    }
    whitelist = [...new Set([...whitelist, ...MASTER_ADMINS])].map(e => e.toLowerCase());
    return whitelist.includes(email.toLowerCase());
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
        let { email } = JSON.parse(event.body);
        if (!email) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
        }
        email = email.toLowerCase();

        if (!(await isWhitelistedAdmin(email))) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'This email is not authorized for admin access.' }) };
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        const { error: dbError } = await supabase
            .from('otps')
            .upsert({ email, code: otp, expires_at: expiresAt });

        if (dbError) throw dbError;

        const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false, 
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS
            },
            tls: { ciphers: 'SSLv3' }
        });

        const mailOptions = {
            from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Elevate QA Admin Portal - Login Code',
            html: `
                <div style="background-color: #07070f; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #0d0d18; border-radius: 16px; border: 1px solid #1f1f30; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.65);">
                        
                        <!-- Header Band -->
                        <div style="background-color: #050508; padding: 32px 24px; border-bottom: 2px solid #ff5a36;">
                            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #8e8e9a; letter-spacing: 3px; text-transform: uppercase;">
                                ELEVATE QA 2026 - ADMIN
                            </p>
                        </div>
                        
                        <!-- Main Content -->
                        <div style="padding: 40px 30px;">
                            <h2 style="color: #ffffff; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.01em;">Secure <span style="color: #ff5a36; font-style: italic;">Login</span></h2>
                            <p style="color: #d5d5d5; font-size: 15px; line-height: 1.7; margin-bottom: 30px;">
                                Please use the secure verification code below to log into the Admin Portal. This code expires in 10 minutes.
                            </p>
                            
                            <!-- OTP Display Box -->
                            <div style="background: #13132a; padding: 20px 24px; border-radius: 12px; display: inline-block; border: 1px dashed #2a2a50; margin-bottom: 32px; word-break: break-all;">
                                <h1 style="color: #ff5a36; font-size: 36px; letter-spacing: 6px; margin: 0; font-family: 'Courier New', Courier, monospace; font-weight: 800;">${otp}</h1>
                            </div>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Admin OTP sent successfully' }) };
    } catch (error) {
        console.error('[OTP Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send OTP email. ' + error.message }) };
    }
};
