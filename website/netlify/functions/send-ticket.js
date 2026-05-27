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
                <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                        
                        <!-- Header Section -->
                        <div style="background-color: #d4ff3a; padding: 30px; text-align: center;">
                            <h2 style="color: #0b0b10; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
                                Elevate QA 2026
                            </h2>
                            <p style="color: #0b0b10; margin: 10px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px;">
                                THE PROOF OF VALUE
                            </p>
                        </div>
                        
                        <!-- Body Section -->
                        <div style="padding: 40px;">
                            <h3 style="color: #ffffff; font-size: 22px; margin-top: 0; font-weight: 500;">
                                You're in, <span style="color: #ff5a36; font-weight: 600;">${name}</span>.
                            </h3>
                            <p style="color: #8b8b9b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                Your free pass has been officially generated. Please present the QR code below at the registration desk for seamless check-in.
                            </p>
                            
                            <!-- Ticket Card -->
                            <div style="background: #1a1a24; border: 1px solid #333344; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                                <div style="display: inline-block; background: #ffffff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                    <!-- Embedded QR Code -->
                                    <img src="cid:qrcode" alt="Your Pass QR Code" style="width: 200px; height: 200px; display: block;" />
                                </div>
                                <div style="text-align: left; border-top: 1px dashed #404050; padding-top: 20px; display: flex; justify-content: space-between;">
                                    <div style="flex: 1;">
                                        <div style="color: #555565; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">PASS HOLDER</div>
                                        <div style="color: #ffffff; font-size: 16px; font-weight: 600;">${name}</div>
                                        <div style="color: #8b8b9b; font-size: 13px;">${designation ? designation + ', ' : ''}${company}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="color: #555565; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">PASS ID</div>
                                        <div style="color: #d4ff3a; font-size: 16px; font-family: monospace;">${ticketId}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Details -->
                            <div style="background: rgba(255,90,54,0.1); border-left: 3px solid #ff5a36; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 10px;">
                                <div style="color: #ff5a36; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600;">WHEN</div>
                                <div style="color: #ffffff; font-size: 15px;">Saturday, 8th August 2026 &middot; 09:00 AM</div>
                            </div>
                            <div style="background: rgba(212,255,58,0.1); border-left: 3px solid #d4ff3a; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                                <div style="color: #d4ff3a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600;">WHERE</div>
                                <div style="color: #ffffff; font-size: 15px;">Noida, Delhi NCR</div>
                            </div>

                        </div>
                        
                        <!-- Footer -->
                        <div style="background: #0f0f13; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
                            <p style="color: #555565; font-size: 12px; margin: 0;">
                                Keep this email safe. We look forward to seeing you at the symposium.<br><br>
                                &copy; 2026 SDET Technologies.
                            </p>
                        </div>
                    </div>
                </div>
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
