import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

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
                            <p style="color: #b0b0cc; font-size: 15px; line-height: 1.7; margin-bottom: 30px;">
                                Please use the secure verification code below to log into the Admin Portal. This code expires in 10 minutes.
                            </p>
                            
                            <!-- OTP Display Box -->
                            <div style="background: #13132a; padding: 22px 30px; border-radius: 12px; display: inline-block; border: 1px dashed #2a2a50; margin-bottom: 32px;">
                                <h1 style="color: #ff5a36; font-size: 44px; letter-spacing: 12px; margin: 0; font-family: 'Courier New', Courier, monospace; font-weight: 800;">${otp}</h1>
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
