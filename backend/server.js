require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const app = express();
app.use(cors()); 
app.use(express.json());

const PORT = process.env.PORT || 3000;

const otpStore = {}; 

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ----------------------------------------------------
// OTP ENDPOINT
// ----------------------------------------------------
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const otp = generateOTP();
    
    otpStore[email] = {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

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

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[OTP] Sent to ${email}`);
        res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('[OTP Error]', error);
        res.status(500).json({ error: 'Failed to send OTP email. Check your SMTP settings.' });
    }
});

// ----------------------------------------------------
// OTP VERIFY ENDPOINT
// ----------------------------------------------------
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const record = otpStore[email];

    if (!record) {
        return res.status(400).json({ error: 'No OTP found for this email, or it has expired. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
        delete otpStore[email];
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.code === otp) {
        delete otpStore[email];
        return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } else {
        return res.status(400).json({ error: 'Invalid OTP' });
    }
});

// ----------------------------------------------------
// SEND FINAL TICKET / QR CODE ENDPOINT
// ----------------------------------------------------
app.post('/api/send-ticket', async (req, res) => {
    const { name, email, company, ticketId, designation, qrData } = req.body;

    if (!email || !qrData || !ticketId) {
        return res.status(400).json({ error: 'Missing required ticket data' });
    }

    try {
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
                                <div style="color: #ffffff; font-size: 15px;">8th August 2026 &middot; 09:00 AM</div>
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
        res.status(200).json({ success: true, message: 'Ticket email sent successfully' });

    } catch (error) {
        console.error('[TICKET Error]', error);
        res.status(500).json({ error: 'Failed to send ticket email.' });
    }
});

// ----------------------------------------------------
// SEND CUSTOM BULK EMAIL ENDPOINT
// ----------------------------------------------------
app.post('/api/send-custom-email', async (req, res) => {
    const { subject, message, targetEmails } = req.body;

    if (!subject || !message || !targetEmails || !Array.isArray(targetEmails) || targetEmails.length === 0) {
        return res.status(400).json({ error: 'Missing required email data (subject, message, or targetEmails array)' });
    }

    try {
        const mailOptions = {
            from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
            bcc: targetEmails, // Using bcc to protect privacy
            subject: subject,
            html: `
                <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                        
                        <!-- Header Section -->
                        <div style="background-color: #d4ff3a; padding: 30px; text-align: center;">
                            <h2 style="color: #0b0b10; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
                                Elevate QA 2026
                            </h2>
                            <p style="color: #0b0b10; margin: 10px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px;">
                                EVENT UPDATE
                            </p>
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
        res.status(200).json({ success: true, message: 'Custom email blast sent successfully' });

    } catch (error) {
        console.error('[CUSTOM EMAIL Error]', error);
        res.status(500).json({ error: 'Failed to send custom email.' });
    }
});

app.get('/', (req, res) => {
    res.send('Elevate QA Custom OTP & Ticket Backend is running.');
});

app.listen(PORT, () => {
    console.log(`OTP Backend Server running on port ${PORT}`);
});
