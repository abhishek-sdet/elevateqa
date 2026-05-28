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
        const { name, email, company, ticketId, designation, qrData } = JSON.parse(event.body);

        if (!email || !qrData || !ticketId) {
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

        // Generate QR code as a base64 Data URI
        const qrBase64 = await QRCode.toDataURL(qrData, {
            color: { dark: "#0b0b10", light: "#ffffff" },
            width: 300,
            margin: 2
        });
        
        // Extract the raw base64 string
        const base64Data = qrBase64.replace(/^data:image\/png;base64,/, "");

        const mailOptions = {
            from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🎟️ Your Official VIP Pass — Elevate QA 2026',
            html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Your Official Pass — Elevate QA 2026</title>
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
          <td align="center" bgcolor="#d4ff3a" style="background-color:#d4ff3a;padding:0;">
            <!-- Top accent stripe -->
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td height="5" bgcolor="#a8cc00" style="background-color:#a8cc00;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 32px 30px 28px 30px;">
                  <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:4px;font-weight:700;color:#3a4200;font-family:Arial,sans-serif;text-transform:uppercase;">SDET Technologies Presents</p>
                  <h1 style="margin:0;font-size:36px;font-weight:900;color:#050508;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:3px;line-height:1.1;">ELEVATE QA</h1>
                  <p style="margin:4px 0 0 0;font-size:26px;font-weight:900;color:#050508;font-family:Arial,sans-serif;letter-spacing:5px;">2026</p>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:14px auto 0 auto;">
                    <tr>
                      <td style="background-color:#050508;border-radius:30px;padding:6px 18px;">
                        <p style="margin:0;font-size:10px;font-weight:800;color:#d4ff3a;font-family:Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;">THE PROOF OF VALUE</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== WELCOME SECTION ===== -->
        <tr>
          <td class="content-td" style="padding:40px 38px 0 38px;background-color:#0d0d18;">
            <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:3px;font-weight:700;color:#6060a0;font-family:Arial,sans-serif;text-transform:uppercase;">Registration Confirmed ✓</p>
            <h2 class="hero-name" style="margin:10px 0 18px 0;font-size:24px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;line-height:1.35;">
              Welcome, <span style="color:#d4ff3a;">${name}!</span>
            </h2>
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.75;color:#b0b0cc;font-family:Arial,sans-serif;">
              We are truly privileged to have you as part of <strong style="color:#ffffff;">Elevate QA 2026</strong> — India's premier, invite-only Quality Engineering forum. Your expertise and presence make this event extraordinary.
            </p>
            <p style="margin:0 0 28px 0;font-size:15px;line-height:1.75;color:#b0b0cc;font-family:Arial,sans-serif;">
              Your exclusive <strong style="color:#d4ff3a;">VIP Entry Pass</strong> is ready. Present the QR code below at the registration desk for priority check-in.
            </p>
          </td>
        </tr>

        <!-- ===== VIP PASS CARD ===== -->
        <tr>
          <td style="padding:0 38px 32px 38px;background-color:#0d0d18;">
            <!-- Pass card outer -->
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-radius:14px;overflow:hidden;background-color:#13132a;border:1px solid #2a2a50;">
              
              <!-- Pass card header strip -->
              <tr>
                <td bgcolor="#1a1a35" style="background-color:#1a1a35;padding:14px 22px;">
                  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0;font-size:10px;letter-spacing:3px;font-weight:800;color:#6060a0;font-family:Arial,sans-serif;text-transform:uppercase;">VIP ENTRY PASS</p>
                      </td>
                      <td align="right">
                        <p style="margin:0;font-size:10px;letter-spacing:2px;font-weight:800;color:#6060a0;font-family:Arial,sans-serif;text-transform:uppercase;">ELEVATE QA 2026</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- QR Code Section -->
              <tr>
                <td align="center" style="padding:28px 20px 20px 20px;background-color:#13132a;">
                  <!-- White QR container -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;padding:14px;display:inline-table;">
                    <tr>
                      <td align="center">
                        <img src="cid:qrcode" alt="VIP Pass QR Code" width="185" height="185" style="display:block;border:0;" />
                      </td>
                    </tr>
                  </table>
                  <p style="margin:14px 0 0 0;font-size:11px;color:#5050a0;font-family:Arial,sans-serif;letter-spacing:1px;text-align:center;">SCAN AT THE REGISTRATION DESK</p>
                </td>
              </tr>

              <!-- Dashed divider -->
              <tr>
                <td style="padding:0 22px;">
                  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td height="1" style="border-top:1px dashed #2a2a50;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Attendee info -->
              <tr>
                <td style="padding:20px 22px 24px 22px;">
                  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td class="ticket-info-td" valign="top" style="padding-right:15px;">
                        <p style="margin:0 0 5px 0;font-size:9px;letter-spacing:2px;font-weight:800;color:#505070;font-family:Arial,sans-serif;text-transform:uppercase;">Pass Holder</p>
                        <p style="margin:0 0 4px 0;font-size:19px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;">${name}</p>
                        <p style="margin:0 0 3px 0;font-size:13px;font-weight:700;color:#d4ff3a;font-family:Arial,sans-serif;">${designation || ''}</p>
                        <p style="margin:0;font-size:13px;color:#7070a0;font-family:Arial,sans-serif;">${company || ''}</p>
                      </td>
                      <td class="ticket-id-td" valign="top" align="right" style="width:145px;text-align:right;">
                        <p style="margin:0 0 5px 0;font-size:9px;letter-spacing:2px;font-weight:800;color:#505070;font-family:Arial,sans-serif;text-transform:uppercase;">Pass ID</p>
                        <p style="margin:0 0 12px 0;font-size:14px;font-weight:800;color:#d4ff3a;font-family:'Courier New',Courier,monospace;letter-spacing:1px;">${ticketId}</p>
                        <p style="margin:0 0 3px 0;font-size:9px;letter-spacing:2px;font-weight:800;color:#505070;font-family:Arial,sans-serif;text-transform:uppercase;">Date</p>
                        <p style="margin:0;font-size:12px;font-weight:700;color:#9090b8;font-family:Arial,sans-serif;">Aug 8, 2026</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
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
                  <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">Holiday Inn, Mayur Vihar, New delhi</p>
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
            <p style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;line-height:1.4;">Thank you for being part of<br><span style="color:#d4ff3a;">Elevate QA 2026!</span></p>
            <p style="margin:12px 0 0 0;font-size:15px;color:#8080a8;font-family:Arial,sans-serif;line-height:1.7;">
              We are counting down the days to see you in person. Get ready for an incredible day filled with insights, connections, and inspiration. 
            </p>
            <p style="margin:14px 0 0 0;font-size:16px;font-weight:700;color:#d4ff3a;font-family:Arial,sans-serif;">See you at the event! 🚀</p>
          </td>
        </tr>

        <!-- ===== FOOTER ===== -->
        <tr>
          <td align="center" bgcolor="#07070f" style="background-color:#07070f;padding:24px 30px;border-top:1px solid #16162a;">
            <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#4040a0;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">ELEVATE QA 2026</p>
            <p style="margin:0;font-size:11px;color:#383860;font-family:Arial,sans-serif;line-height:1.6;">
              Please keep this email safe — it contains your unique entry QR code.<br>
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
</html>`,
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: base64Data,
                    encoding: 'base64',
                    cid: 'qrcode' // Matches the src="cid:qrcode" in HTML
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`[TICKET] Sent to ${email}`);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Ticket email sent successfully' }) };

    } catch (error) {
        console.error('[TICKET Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send ticket email.' }) };
    }
};
