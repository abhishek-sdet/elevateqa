import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

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
        const { name, email, company, ticketId, designation } = JSON.parse(event.body);

        if (!email || !ticketId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required ticket data' }) };
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

        const mailOptions = {
            from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '📝 Registration Received — Elevate QA 2026',
            html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Registration Received — Elevate QA 2026</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #07070f; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 620px) {
      .wrapper { width: 100% !important; padding: 15px !important; }
      .content-td { padding: 28px 20px !important; }
      .ticket-info-td { display: block !important; width: 100% !important; text-align: left !important; padding-right: 0 !important; padding-bottom: 15px !important; }
      .ticket-id-td { display: block !important; width: 100% !important; text-align: left !important; }
      h1.hero-name { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#07070f;">
<!-- Outer wrapper -->
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#07070f;">
  <tr>
    <td align="center" style="padding: 36px 16px;">

      <!-- Email Card: 600px max-width -->
      <!--[if mso]><table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:18px;overflow:hidden;background-color:#0d0d18;border:1px solid #1f1f30;">

        <!-- ===== HEADER ===== -->
        <tr>
          <td align="center" bgcolor="#050508" style="background-color:#050508;padding:0;">
            <!-- Top accent stripe (Lime Green) -->
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
                    AI-Led &bull; Quality Engineering &bull; Proof of Value
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== WELCOME SECTION ===== -->
        <tr>
          <td class="content-td" style="padding:40px 38px 0 38px;background-color:#0d0d18;">
            <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:3px;font-weight:700;color:#6060a0;font-family:Arial,sans-serif;text-transform:uppercase;">Registration Received ✓</p>
            <h2 class="hero-name" style="margin:10px 0 18px 0;font-size:24px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;line-height:1.35;">
              Welcome, <span style="color:#d4ff3a;">${name}!</span>
            </h2>
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.75;color:#b0b0cc;font-family:Arial,sans-serif;">
              We're absolutely thrilled to see your interest in the <strong style="color:#ffffff;">Elevate QA Tech Summit!</strong> We have successfully received your registration details.
            </p>
            <p style="margin:0 0 28px 0;font-size:15px;line-height:1.75;color:#b0b0cc;font-family:Arial,sans-serif;">
              We'll be reaching out to you personally very soon to share updates about your participation. We truly appreciate your patience and can't wait to connect!
            </p>
          </td>
        </tr>


        <!-- ===== EVENT DETAILS ===== -->
        <tr>
          <td style="padding:0 38px 32px 38px;background-color:#0d0d18;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <!-- WHEN -->
              <tr>
                <td style="background-color:#160d0a;border-left:4px solid #ff6b47;padding:15px 18px;border-radius:0 8px 8px 0;margin-bottom:12px;">
                  <p style="margin:0 0 4px 0;font-size:9px;letter-spacing:2.5px;font-weight:800;color:#ff6b47;font-family:Arial,sans-serif;text-transform:uppercase;">📅&nbsp;&nbsp;When</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">Saturday, 8th August 2026 &middot; 09:00 AM onwards</p>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              <!-- WHERE -->
              <tr>
                <td style="background-color:#111a0a;border-left:4px solid #d4ff3a;padding:15px 18px;border-radius:0 8px 8px 0;">
                  <p style="margin:0 0 4px 0;font-size:9px;letter-spacing:2.5px;font-weight:800;color:#d4ff3a;font-family:Arial,sans-serif;text-transform:uppercase;">📍&nbsp;&nbsp;Where</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">Crowne Plaza, Mayur Vihar, New Delhi</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== THANK YOU SECTION ===== -->
        <tr>
          <td align="center" style="padding:0 38px 40px 38px;background-color:#0d0d18;">
            <!-- Decorative line with diamond -->
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="border-top:1px solid #1f1f38;font-size:0;line-height:0;" width="45%">&nbsp;</td>
                <td align="center" width="10%" style="color:#d4ff3a;font-size:14px;font-family:Arial,sans-serif;padding:0 8px;">&#9670;</td>
                <td style="border-top:1px solid #1f1f38;font-size:0;line-height:0;" width="45%">&nbsp;</td>
              </tr>
            </table>
            <p style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;line-height:1.4;">Thank you for your interest in<br><span style="color:#d4ff3a;">Elevate QA 2026!</span></p>
            <p style="margin:12px 0 0 0;font-size:15px;color:#8080a8;font-family:Arial,sans-serif;line-height:1.7;">
              We look forward to confirming your participation. 
            </p>
            <p style="margin:14px 0 0 0;font-size:16px;font-weight:700;color:#d4ff3a;font-family:Arial,sans-serif;">Stay tuned! 🚀</p>
          </td>
        </tr>

        <!-- ===== FOOTER ===== -->
        <tr>
          <td align="center" bgcolor="#07070f" style="background-color:#07070f;padding:24px 30px;border-top:1px solid #16162a;">
            <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#4040a0;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">ELEVATE QA 2026</p>
            <p style="margin:0;font-size:11px;color:#383860;font-family:Arial,sans-serif;line-height:1.6;">
              Please keep this email safe. We will contact you soon.<br>
              &copy; 2026 SDET Technologies. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
      <!--[if mso]></td></tr></table><![endif]-->

    </td>
  </tr>
</table>
</body>
</html>`
        };

        await transporter.sendMail(mailOptions);
        console.log(`[TICKET] Sent to ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Ticket email sent successfully' }) };

    } catch (error) {
        console.error('[TICKET Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send ticket email.' }) };
    }
};
