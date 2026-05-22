import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';
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
        const { email } = JSON.parse(event.body);
        if (!email) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
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
            subject: 'Your Elevate QA Verification Code',
            html: `
                <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; padding: 40px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <h2 style="color: #ffffff; margin-top: 0; font-size: 24px; font-weight: 600;">Confirm your <span style="color: #d4ff3a;">Access</span></h2>
                        <p style="color: #8b8b9b; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                            Please use the secure code below to authenticate your registration for Elevate QA 2026. This code expires in 10 minutes.
                        </p>
                        <div style="background: #1a1a24; padding: 20px; border-radius: 8px; display: inline-block; border: 1px dashed #404050; margin-bottom: 30px;">
                            <h1 style="color: #d4ff3a; font-size: 42px; letter-spacing: 8px; margin: 0; font-family: monospace;">${otp}</h1>
                        </div>
                        <p style="color: #555565; font-size: 13px; margin-bottom: 0;">
                            If you did not request this, please ignore this email.<br>
                            &copy; 2026 SDET Technologies.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'OTP sent successfully' }) };
    } catch (error) {
        console.error('[OTP Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send OTP email. ' + error.message }) };
    }
};
