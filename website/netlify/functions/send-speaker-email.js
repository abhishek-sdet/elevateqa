import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

async function fetchEmailTemplate(type) {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.from('site_content').select('hero_meta').eq('id', 1).single();
        if (error || !data) return {};
        const meta = (typeof data.hero_meta === 'string') ? JSON.parse(data.hero_meta) : (data.hero_meta || {});
        return (meta.emailTemplates && meta.emailTemplates[type]) ? meta.emailTemplates[type] : {};
    } catch (e) { console.warn('[fetchEmailTemplate]', e.message); return {}; }
}

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
        const { name, email, organization, topic, bio } = JSON.parse(event.body);

        if (!email || !name) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required speaker data' }) };
        }

        const tpl = await fetchEmailTemplate('speaker');
        const subject  = tpl.subject || '🎤️ Application Received — Elevate QA 2026 Speaker';
        const bodyPara1 = tpl.body1   || `Your application to speak at <strong style="color:#ffffff;">Elevate QA 2026</strong> has been successfully received with the topic: <strong style="color:#d4ff3a;">"${topic || 'Not specified'}"</strong>.`;
        const bodyPara2 = tpl.body2   || "Our curation team is currently reviewing all submissions. We will get back to you shortly with further details and next steps. In the meantime, sit tight and keep innovating!";
        const contactLine = tpl.contact || 'If you have any questions, feel free to reply to this email at <strong style="color:#ffffff;">elevateqa@sdettech.com</strong>.';

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
            subject: subject,
            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Application Received — Elevate QA</title>
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body { margin: 0; padding: 0; background-color: #07070f; }
    table { border-spacing: 0; }
    td { border-collapse: collapse; }
    .bg-page  { background-color: #07070f; }
    .bg-card  { background-color: #0d0d18; }
    .bg-panel { background-color: #07070f; }
    .text-white  { color: #ffffff; }
    .text-dim    { color: #d5d5d5; }
    .text-accent { color: #d4ff3a; }
    @media (prefers-color-scheme: dark) {
      .bg-page  { background-color: #07070f !important; }
      .bg-card  { background-color: #0d0d18 !important; }
      .bg-panel { background-color: #07070f !important; }
      .text-white  { color: #ffffff !important; }
      .text-dim    { color: #d5d5d5 !important; }
      .text-accent { color: #d4ff3a !important; }
    }
    [data-ogsc] .bg-page  { background-color: #07070f !important; }
    [data-ogsc] .bg-card  { background-color: #0d0d18 !important; }
    [data-ogsc] .bg-panel { background-color: #07070f !important; }
    [data-ogsc] .text-white  { color: #ffffff !important; }
    [data-ogsc] .text-dim    { color: #d5d5d5 !important; }
    [data-ogsc] .text-accent { color: #d4ff3a !important; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .wrapper { width: 100% !important; padding: 15px !important; }
      .content-td { padding: 28px 20px !important; }
    }
    a, a[x-apple-data-detectors], .aBn {
      color: #d4ff3a !important;
      text-decoration: none !important;
      border-bottom: none !important;
    }
  </style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:#07070f;">
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="bg-page" style="background-color:#07070f;">
  <tr>
    <td align="center" class="bg-page" style="padding: 36px 16px;background-color:#07070f;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="bg-card" style="max-width:600px;border-radius:18px;overflow:hidden;background-color:#0d0d18;border:1px solid #1f1f30;">
        
        <!-- Header -->
        <tr>
          <td align="center" bgcolor="#050508" style="background-color:#050508;padding:0;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td height="5" bgcolor="#d4ff3a" style="background-color:#d4ff3a;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 36px 30px 30px 30px;">
                  <img src="https://elevateqa.sdettech.com/logo.png" alt="Elevate QA Logo" height="68" style="display:block;margin:0 auto 14px auto;border:0;pointer-events:none;" />
                  <p style="margin:0;font-size:11px;font-family:Arial,sans-serif;color:#8e8e9a;letter-spacing:2px;text-transform:uppercase;line-height:1.5;text-align:center;font-weight:700;">
                    CALL FOR SPEAKERS 2026
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td class="content-td bg-card" style="padding:40px 38px 40px 38px;background-color:#0d0d18;">
            <p class="text-accent" style="margin:0 0 4px 0;font-size:12px;letter-spacing:3px;font-weight:700;color:#d4ff3a;font-family:Arial,sans-serif;text-transform:uppercase;">Application Received ✓</p>
            <h2 class="text-white" style="margin:10px 0 18px 0;font-size:24px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;line-height:1.35;">
              Thank you, <span class="text-accent" style="color:#d4ff3a;">${name}!</span>
            </h2>
            <p class="text-dim" style="margin:0 0 16px 0;font-size:15px;line-height:1.75;color:#d5d5d5;font-family:Arial,sans-serif;">
              ${bodyPara1}
            </p>
            <p class="text-dim" style="margin:0 0 28px 0;font-size:15px;line-height:1.75;color:#d5d5d5;font-family:Arial,sans-serif;">
              ${bodyPara2}
            </p>
            
            <div style="background: #1a1a24; border: 1px solid #333344; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                <div style="color: #555565; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">YOUR TOPIC</div>
                <div style="color: #ffffff; font-size: 16px; font-weight: 600;">${topic || 'Speaker Application'}</div>
                <div style="color: #8b8b9b; font-size: 13px; margin-top: 5px;">${organization || 'N/A'}</div>
            </div>

            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="border-top:1px solid #1f1f38;font-size:0;line-height:0;" width="45%">&nbsp;</td>
                <td align="center" width="10%" style="color:#d4ff3a;font-size:14px;font-family:Arial,sans-serif;padding:0 8px;">&#9670;</td>
                <td style="border-top:1px solid #1f1f38;font-size:0;line-height:0;" width="45%">&nbsp;</td>
              </tr>
            </table>
            
            <p class="text-dim" style="margin:0;font-size:15px;color:#d5d5d5;font-family:Arial,sans-serif;line-height:1.7;">
              ${contactLine}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" bgcolor="#07070f" class="bg-panel" style="background-color:#07070f;padding:24px 30px;border-top:1px solid #16162a;">
            <p class="text-accent" style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#d4ff3a;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">ELEVATE QA 2026</p>
            <p style="margin:0;font-size:11px;color:#8a8a8a;font-family:Arial,sans-serif;line-height:1.6;">
              &copy; 2026 SDET Technologies. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SPEAKER EMAIL] Sent to ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Speaker email sent successfully' }) };

    } catch (error) {
        console.error('[SPEAKER EMAIL Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send speaker email.' }) };
    }
};
