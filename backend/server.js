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
    let { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    email = email.toLowerCase();

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
                    <div style="background: #1a1a24; padding: 20px 24px; border-radius: 8px; display: inline-block; border: 1px dashed #404050; margin-bottom: 30px; word-break: break-all;">
                        <h1 style="color: #d4ff3a; font-size: 36px; letter-spacing: 6px; margin: 0; font-family: monospace;">${otp}</h1>
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
// SPEAKER OTP ENDPOINT
// ----------------------------------------------------
app.post('/api/send-speaker-otp', async (req, res) => {
    let { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    email = email.toLowerCase();

    const otp = generateOTP();
    
    otpStore[email] = {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    const mailOptions = {
        from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Speaker Verification Code',
        html: `
            <div style="background-color: #07070f; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
                <div style="max-width: 500px; margin: 0 auto; background-color: #0d0d18; border-radius: 16px; border: 1px solid #1f1f30; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.65);">
                    
                    <!-- Header Band -->
                    <div style="background-color: #050508; padding: 32px 24px; border-bottom: 2px solid #d4ff3a;">
                        <img src="https://elevateqa.sdettech.com/logo.png" alt="Elevate QA Logo" height="60" style="display: block; margin: 0 auto 12px auto; border: 0; pointer-events: none;" />
                        <p style="margin: 0; font-size: 10.5px; font-weight: 700; color: #8e8e9a; letter-spacing: 2px; text-transform: uppercase; line-height: 1.5;">
                            CALL FOR SPEAKERS 2026
                        </p>
                    </div>
                    
                    <!-- Main Content -->
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.01em;">Confirm your <span style="color: #d4ff3a; font-style: italic;">Submission</span></h2>
                        <p style="color: #b0b0cc; font-size: 14.5px; line-height: 1.7; margin-bottom: 30px;">
                            Thank you for your interest in speaking at Elevate QA. Please use the secure verification code below to authenticate your professional email. This code expires in 10 minutes.
                        </p>
                        
                        <!-- OTP Display Box -->
                        <div style="background: #13132a; padding: 20px 24px; border-radius: 12px; display: inline-block; border: 1px dashed #2a2a50; margin-bottom: 32px; word-break: break-all;">
                            <h1 style="color: #d4ff3a; font-size: 36px; letter-spacing: 6px; margin: 0; font-family: 'Courier New', Courier, monospace; font-weight: 800;">${otp}</h1>
                        </div>
                        
                        <hr style="border: 0; border-top: 1px solid #1f1f30; margin-bottom: 24px;" />
                        
                        <p style="color: #505070; font-size: 12px; line-height: 1.6; margin-bottom: 0; font-family: monospace;">
                            If you did not request this code, please ignore this email.<br />
                            &copy; 2026 SDET Technologies. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[SPEAKER OTP] Sent to ${email}`);
        res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('[SPEAKER OTP Error]', error);
        res.status(500).json({ error: 'Failed to send OTP email. Check your SMTP settings.' });
    }
});

// ----------------------------------------------------
// ADMIN OTP ENDPOINT
// ----------------------------------------------------
app.post('/api/send-admin-otp', async (req, res) => {
    let { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    email = email.toLowerCase();

    const otp = generateOTP();
    
    otpStore[email] = {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    const mailOptions = {
        from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Elevate QA Admin Portal - Login Code',
        html: `
            <div style="background-color: #07070f; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
                <div style="max-width: 500px; margin: 0 auto; background-color: #0d0d18; border-radius: 16px; border: 1px solid #1f1f30; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.65);">
                    <div style="background-color: #050508; padding: 32px 24px; border-bottom: 2px solid #ff5a36;">
                        <p style="margin: 0; font-size: 10.5px; font-weight: 700; color: #8e8e9a; letter-spacing: 2px; text-transform: uppercase; line-height: 1.5;">
                            ELEVATE QA 2026 - ADMIN
                        </p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.01em;">Secure <span style="color: #ff5a36; font-style: italic;">Login</span></h2>
                        <p style="color: #b0b0cc; font-size: 14.5px; line-height: 1.7; margin-bottom: 30px;">
                            Please use the secure verification code below to log into the Admin Portal. This code expires in 10 minutes.
                        </p>
                        <div style="background: #13132a; padding: 20px 24px; border-radius: 12px; display: inline-block; border: 1px dashed #2a2a50; margin-bottom: 32px; word-break: break-all;">
                            <h1 style="color: #ff5a36; font-size: 36px; letter-spacing: 6px; margin: 0; font-family: 'Courier New', Courier, monospace; font-weight: 800;">${otp}</h1>
                        </div>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[ADMIN OTP] Sent to ${email}`);
        res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('[ADMIN OTP Error]', error);
        res.status(500).json({ error: 'Failed to send Admin OTP email.' });
    }
});

// ----------------------------------------------------
// OTP VERIFY ENDPOINT
// ----------------------------------------------------
app.post('/api/verify-otp', (req, res) => {
    let { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }
    email = email.toLowerCase();

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

    if (!email || !ticketId) {
        return res.status(400).json({ error: 'Missing required ticket data' });
    }

    try {

        const mailOptions = {
            from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '📝 Registration Received — Elevate QA 2026',
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
                            <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:3px;font-weight:700;color:#6060a0;text-transform:uppercase;">Registration Received ✓</p>
                            <h3 style="color: #ffffff; font-size: 22px; margin-top: 10px; font-weight: 500;">
                                Welcome, <span style="color: #ff5a36; font-weight: 600;">${name}</span>!
                            </h3>
                            <p style="color: #8b8b9b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                Thank you for showing your interest in attending the <strong style="color:#ffffff;">Elevate QA Tech Summit</strong>. We have received your details.
                            </p>
                            <p style="color: #8b8b9b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                Our team will confirm your participation 2 weeks prior to the event.
                            </p>

                            <!-- Details -->
                            <div style="background: rgba(255,90,54,0.1); border-left: 3px solid #ff5a36; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 10px;">
                                <div style="color: #ff5a36; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600;">WHEN</div>
                                <div style="color: #ffffff; font-size: 15px;">8th August 2026 &middot; 09:00 AM</div>
                            </div>
                            <div style="background: rgba(212,255,58,0.1); border-left: 3px solid #d4ff3a; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                                <div style="color: #d4ff3a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600;">WHERE</div>
                                <div style="color: #ffffff; font-size: 15px;">Crowne Plaza, Mayur Vihar, New Delhi</div>
                            </div>

                        </div>
                        
                        <!-- Footer -->
                        <div style="background: #0f0f13; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
                            <p style="color: #555565; font-size: 12px; margin: 0;">
                                Please keep this email safe. We will contact you soon.<br><br>
                                &copy; 2026 SDET Technologies.
                            </p>
                        </div>
                    </div>
                </div>
            `
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
    const { subject, message, targetEmails, ccEmails, bccEmails } = req.body;

    if (!subject || !message || !targetEmails || !Array.isArray(targetEmails) || targetEmails.length === 0) {
        return res.status(400).json({ error: 'Missing required email data (subject, message, or targetEmails array)' });
    }

    try {
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

// ----------------------------------------------------
// SEND SPEAKER EMAIL ENDPOINT
// ----------------------------------------------------
app.post('/api/send-speaker-email', async (req, res) => {
    const { name, email, organization, topic } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: 'Missing required speaker data' });
    }

    try {
        const mailOptions = {
            from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Application Received — Call for Speakers (Elevate QA 2026)',
            html: `
                <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                        
                        <!-- Header Section -->
                        <div style="background-color: #d4ff3a; padding: 30px; text-align: center;">
                            <h2 style="color: #0b0b10; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
                                Elevate QA 2026
                            </h2>
                            <p style="color: #0b0b10; margin: 10px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px;">
                                CALL FOR SPEAKERS
                            </p>
                        </div>
                        
                        <!-- Body Section -->
                        <div style="padding: 40px;">
                            <h3 style="color: #ffffff; font-size: 22px; margin-top: 0; font-weight: 500;">
                                Thank you, <span style="color: #d4ff3a; font-weight: 600;">${name}</span>.
                            </h3>
                            <p style="color: #8b8b9b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                We have successfully received your speaker application for Elevate QA 2026. Our review committee is currently evaluating submissions and will get back to you shortly.
                            </p>
                            
                            <div style="background: #1a1a24; border: 1px solid #333344; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                                <div style="color: #555565; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">YOUR TOPIC</div>
                                <div style="color: #ffffff; font-size: 16px; font-weight: 600;">${topic || 'Speaker Application'}</div>
                                <div style="color: #8b8b9b; font-size: 13px; margin-top: 5px;">${organization || 'N/A'}</div>
                            </div>
                            
                            <p style="color: #8b8b9b; font-size: 14px; line-height: 1.6;">
                                If you have any questions in the meantime, feel free to reply directly to this email or contact <a href="mailto:elevateqa@sdettech.com" style="color: #d4ff3a; text-decoration: none;">elevateqa@sdettech.com</a>.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background: #0f0f13; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
                            <p style="color: #555565; font-size: 12px; margin: 0;">
                                &copy; 2026 SDET Technologies.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SPEAKER EMAIL] Sent to ${email}`);
        res.status(200).json({ success: true, message: 'Speaker email sent successfully' });

    } catch (error) {
        console.error('[SPEAKER EMAIL Error]', error);
        res.status(500).json({ error: 'Failed to send speaker email.' });
    }
});

app.get('/', (req, res) => {
    res.send('Elevate QA Custom OTP & Ticket Backend is running.');
});


app.post('/api/send-final-ticket', async (req, res) => {
    const { name, email, company, ticketId, designation, qrData } = req.body;
    if (!email || !ticketId || !qrData) return res.status(400).json({ error: 'Missing data' });
    try {
        const qrBuffer = await QRCode.toBuffer(qrData, { errorCorrectionLevel: 'H', margin: 2, width: 300, color: { dark: '#000000', light: '#ffffff' } });
        const mailOptions = {
            from: '"Elevate QA 2026" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: '🎫 Your Official Pass — Elevate QA 2026',
            html: `
                <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                        <div style="background-color: #d4ff3a; padding: 30px; text-align: center;">
                            <h2 style="color: #0b0b10; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
                                Elevate QA 2026
                            </h2>
                            <p style="color: #0b0b10; margin: 10px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px;">
                                THE PROOF OF VALUE
                            </p>
                        </div>
                        <div style="padding: 40px;">
                            <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:3px;font-weight:700;color:#6060a0;text-transform:uppercase;">Registration Confirmed ✓</p>
                            <h3 style="color: #ffffff; font-size: 22px; margin-top: 10px; font-weight: 500;">
                                Welcome, <span style="color: #d4ff3a; font-weight: 600;">${name}</span>!
                            </h3>
                            <p style="color: #8b8b9b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                Your spot at the <strong style="color:#ffffff;">Elevate QA Tech Summit</strong> is confirmed. Please present this QR code at the registration desk.
                            </p>
                            <div style="background: rgba(255,90,54,0.1); border-left: 3px solid #ff5a36; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 10px;">
                                <div style="color: #ff5a36; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600;">WHEN</div>
                                <div style="color: #ffffff; font-size: 15px;">8th August 2026 &middot; 09:00 AM</div>
                            </div>
                            <div style="background: rgba(212,255,58,0.1); border-left: 3px solid #d4ff3a; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                                <div style="color: #d4ff3a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600;">WHERE</div>
                                <div style="color: #ffffff; font-size: 15px;">Crowne Plaza, Mayur Vihar, New Delhi</div>
                            </div>
                        </div>
                        <div style="background: #07070f; border-top: 1px dashed #2a2a3e; padding: 30px; text-align: center;">
                            <p style="color: #8b8b9b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">TICKET ID: ${ticketId}</p>
                            <img src="cid:qrcode@elevateqa" alt="QR Code" width="150" height="150" style="display:inline-block; border: 4px solid #fff; border-radius: 8px;">
                            <p style="color: #555565; font-size: 13px; margin-top: 15px;">Keep this email handy. This QR code is your entry ticket.</p>
                        </div>
                        <div style="background: #0f0f13; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
                            <p style="color: #555565; font-size: 12px; margin: 0;">
                                &copy; 2026 SDET Technologies.
                            </p>
                        </div>
                    </div>
                </div>
    `,
            attachments: [{ filename: 'ticket-qr.png', content: qrBuffer, cid: 'qrcode@elevateqa' }]
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Final ticket sent' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/send-rejection', async (req, res) => {
    const { name, email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing data' });
    try {
        const mailOptions = {
            from: '"Elevate QA 2026" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: 'Updates Regarding Your Registration — Elevate QA 2026',
            html: `
                <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                        <div style="background-color: #d4ff3a; padding: 30px; text-align: center;">
                            <h2 style="color: #0b0b10; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
                                Elevate QA 2026
                            </h2>
                            <p style="color: #0b0b10; margin: 10px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px;">
                                EVENT UPDATE
                            </p>
                        </div>
                        <div style="padding: 40px;">
                            <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:3px;font-weight:700;color:#6060a0;text-transform:uppercase;">Registration Update</p>
                            <h3 style="color: #ffffff; font-size: 22px; margin-top: 10px; font-weight: 500;">
                                Hi <span style="color: #d4ff3a; font-weight: 600;">${name}</span>!
                            </h3>
                            <p style="color: #8b8b9b; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                Thank you for showing your interest in attending the <strong style="color:#ffffff;">Elevate QA Tech Summit</strong>.
                            </p>
                            <p style="color: #8b8b9b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                Due to overwhelming response, we have reached full capacity for this year's summit and cannot accommodate more attendees at this time.
                            </p>
                            <p style="margin:14px 0 0 0;font-size:16px;font-weight:700;color:#d4ff3a;">Stay tuned for next time! 🚀</p>
                        </div>
                        <div style="background: #0f0f13; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
                            <p style="color: #555565; font-size: 12px; margin: 0;">
                                &copy; 2026 SDET Technologies.
                            </p>
                        </div>
                    </div>
                </div>
    `
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Rejection sent' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

app.listen(PORT, () => {
    console.log(`OTP Backend Server running on port ${PORT}`);
});
