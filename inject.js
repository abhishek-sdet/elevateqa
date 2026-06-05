const fs = require('fs');
const p = 'backend/server.js';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('/api/send-final-ticket')) {
    const finalTicketHtml = `
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
                                Welcome, <span style="color: #d4ff3a; font-weight: 600;">\${name}</span>!
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
                            <p style="color: #8b8b9b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">TICKET ID: \${ticketId}</p>
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
    `;

    const rejectionHtml = `
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
                                Hi <span style="color: #d4ff3a; font-weight: 600;">\${name}</span>!
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
    `;

    const codeToInject = `
app.post('/api/send-final-ticket', async (req, res) => {
    const { name, email, company, ticketId, designation, qrData } = req.body;
    if (!email || !ticketId || !qrData) return res.status(400).json({ error: 'Missing data' });
    try {
        const qrBuffer = await QRCode.toBuffer(qrData, { errorCorrectionLevel: 'H', margin: 2, width: 300, color: { dark: '#000000', light: '#ffffff' } });
        const mailOptions = {
            from: '"Elevate QA 2026" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: '🎫 Your Official Pass — Elevate QA 2026',
            html: \`${finalTicketHtml}\`,
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
            html: \`${rejectionHtml}\`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Rejection sent' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

app.listen(PORT`;
    
    s = s.replace(/app\.listen\(PORT/, codeToInject);
    fs.writeFileSync(p, s);
    console.log('Endpoints injected!');
} else {
    console.log('Endpoints already exist!');
}
