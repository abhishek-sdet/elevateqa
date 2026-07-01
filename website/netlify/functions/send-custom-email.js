import nodemailer from 'nodemailer';

export const handler = async (event, context) => {
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
        const { subject, message, targetEmails, ccEmails, bccEmails } = JSON.parse(event.body);

        if (!subject || !message || !targetEmails || !Array.isArray(targetEmails) || targetEmails.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required email data (subject, message, or targetEmails array)' }) };
        }

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

        const combinedBcc = [...targetEmails, ...(Array.isArray(bccEmails) ? bccEmails : [])];
        const ccList = Array.isArray(ccEmails) ? ccEmails : [];

        const mailOptions = {
            from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
            bcc: combinedBcc, // Using bcc to protect privacy
            cc: ccList,
            subject: subject,
            html: `
                <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                        
                        <!-- Header Section -->
                        <div style="background-color: #050508; text-align: center;">
                            <div style="height: 5px; background-color: #d4ff3a;"></div>
                            <div style="padding: 36px 30px 30px 30px;">
                                <img src="https://elevateqa.sdettech.com/logo.png" alt="Elevate QA Logo" height="68" style="display:block;margin:0 auto 14px auto;border:0;pointer-events:none;" />
                                <p style="color: #8e8e9a; margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-family: Arial, sans-serif;">
                                    EVENT UPDATE
                                </p>
                            </div>
                        </div>
                        
                        <!-- Body Section -->
                        <div style="padding: 40px;">
                            <div style="color: #ffffff; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                ${message}
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background: #0f0f13; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
                            <p style="color: #555565; font-size: 12px; margin: 0;">
                                You are receiving this email because you are registered for Elevate QA 2026.<br><br>
                                &copy; 2026 SDET Technologies.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[CUSTOM EMAIL] Blast sent to ${targetEmails.length} recipients`);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Custom email blast sent successfully' }) };

    } catch (error) {
        console.error('[CUSTOM EMAIL Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send custom email.' }) };
    }
};
