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
            subject: 'Your Official Pass — Elevate QA 2026',
            html: `
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050508; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0;">
                    <tr>
                        <td align="center" style="padding: 40px 20px; background-color: #050508;">
                            
                            <!-- Card Wrapper -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0b0b10; border-radius: 16px; border: 1.5px solid #22222d; overflow: hidden; border-collapse: separate;">
                                
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="background-color: #d4ff3a; padding: 36px 30px;">
                                        <h2 style="color: #050508; margin: 0; font-size: 30px; text-transform: uppercase; font-weight: 900; letter-spacing: 2px; font-family: Arial, sans-serif; line-height: 1.1;">
                                            Elevate QA 2026
                                        </h2>
                                        <p style="color: #050508; margin: 8px 0 0 0; font-size: 13px; font-weight: 700; opacity: 0.85; letter-spacing: 3px; text-transform: uppercase; font-family: Arial, sans-serif;">
                                            THE PROOF OF VALUE
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Body Section -->
                                <tr>
                                    <td style="padding: 40px 35px; background-color: #0b0b10;">
                                        
                                        <h3 style="color: #ffffff; font-size: 24px; margin-top: 0; font-weight: 700; font-family: Arial, sans-serif; line-height: 1.3;">
                                            We are honored to welcome you, <span style="color: #d4ff3a; font-weight: 800;">${name}</span>.
                                        </h3>
                                        
                                        <p style="color: #ccccdb; font-size: 15px; line-height: 1.65; margin-bottom: 24px; font-family: Arial, sans-serif;">
                                            Your presence as an esteemed leader in Quality Engineering is our absolute privilege. Elevate QA 2026 is an exclusive, invite-only forum dedicated to practitioner-led value, real-world case studies, and authentic connection.
                                        </p>
                                        
                                        <p style="color: #ccccdb; font-size: 15px; line-height: 1.65; margin-bottom: 32px; font-family: Arial, sans-serif;">
                                            Below is your official <strong>VIP Entry Pass</strong>. Please present this QR code at the desk for priority check-in and collection of your custom credentials.
                                        </p>
                                        
                                        <!-- Ticket Card -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #12121c; border: 1.5px solid #2e2e3f; border-radius: 12px; margin-bottom: 35px; border-collapse: separate;">
                                            <tr>
                                                <td align="center" style="padding: 30px 20px 20px 20px;">
                                                    <table border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 12px; border-radius: 8px;">
                                                        <tr>
                                                            <td align="center" valign="middle">
                                                                <img src="cid:qrcode" alt="Your Pass QR Code" width="180" height="180" style="display: block; border: 0;" />
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 25px 25px 25px;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px dashed #44445c; margin-bottom: 20px;">
                                                        <tr><td></td></tr>
                                                    </table>
                                                    
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td align="left" valign="top" style="padding-right: 15px;">
                                                                <div style="color: #a0a0b5; font-size: 10px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; font-weight: bold;">PASS HOLDER</div>
                                                                <div style="color: #ffffff; font-size: 18px; font-family: Arial, sans-serif; font-weight: 800; margin-bottom: 3px;">${name}</div>
                                                                <div style="color: #d4ff3a; font-size: 13px; font-family: Arial, sans-serif; font-weight: bold; margin-bottom: 2px;">${designation || ''}</div>
                                                                <div style="color: #8b8b9b; font-size: 13px; font-family: Arial, sans-serif;">${company}</div>
                                                            </td>
                                                            <td align="right" valign="top" style="width: 140px; text-align: right;">
                                                                <div style="color: #a0a0b5; font-size: 10px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; font-weight: bold;">PASS ID</div>
                                                                <div style="color: #d4ff3a; font-size: 15px; font-family: Courier, monospace; font-weight: bold; letter-spacing: 0.5px;">${ticketId}</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Details: WHEN (Using Solid HEX background) -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                                            <tr>
                                                <td style="background-color: #1d100d; border-left: 4px solid #ff5a36; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                                                    <div style="color: #ff5a36; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: bold; font-family: Arial, sans-serif;">WHEN</div>
                                                    <div style="color: #ffffff; font-size: 15px; font-family: Arial, sans-serif; font-weight: bold;">Saturday, 8th August 2026 &middot; 09:00 AM</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Details: WHERE (Using Solid HEX background) -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                            <tr>
                                                <td style="background-color: #141d0c; border-left: 4px solid #d4ff3a; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                                                    <div style="color: #d4ff3a; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: bold; font-family: Arial, sans-serif;">WHERE</div>
                                                    <div style="color: #ffffff; font-size: 15px; font-family: Arial, sans-serif; font-weight: bold;">Noida, Delhi NCR</div>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="background-color: #050508; padding: 25px; border-top: 1px solid #22222d;">
                                        <p style="color: #66667d; font-size: 12px; margin: 0; font-family: Arial, sans-serif; line-height: 1.55;">
                                            Keep this invitation safe. We look forward to welcome you in person.<br>
                                            &copy; 2026 SDET Technologies.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                </table>
            `,
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
