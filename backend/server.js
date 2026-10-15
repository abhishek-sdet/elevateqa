require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db.js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 3000;

// ----------------------------------------------------
// UPLOADS STORAGE & STATIC FILES
// ----------------------------------------------------
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for local image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webp';
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${cleanBase}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ----------------------------------------------------
// EMAIL TRANSPORTER
// ----------------------------------------------------
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

// In-memory fallback for OTPs
const otpStore = {};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ----------------------------------------------------
// PUBLIC REST API ENDPOINTS (DECOUPLED FROM FRONTEND)
// ----------------------------------------------------

// 1. Get Site Content, Branding, Manifesto, Stages, Pillars
app.get('/api/site-content', async (req, res) => {
  try {
    const [scRes, brRes, mfRes, stRes, plRes] = await Promise.all([
      db.query('SELECT * FROM site_content WHERE id = 1 LIMIT 1'),
      db.query('SELECT * FROM branding LIMIT 1'),
      db.query('SELECT * FROM manifesto LIMIT 1'),
      db.query('SELECT * FROM maturity_stages ORDER BY display_order ASC'),
      db.query('SELECT * FROM pillars ORDER BY display_order ASC')
    ]);

    res.json({
      site_content: scRes.rows[0] || null,
      branding: brRes.rows[0] || null,
      manifesto: mfRes.rows[0] || null,
      maturity_stages: stRes.rows || [],
      pillars: plRes.rows || []
    });
  } catch (err) {
    console.error('[API Error /api/site-content]', err);
    res.status(500).json({ error: 'Failed to fetch site content' });
  }
});

// 2. Get Speakers
app.get('/api/speakers', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM speakers ORDER BY display_order ASC, name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('[API Error /api/speakers]', err);
    res.status(500).json({ error: 'Failed to fetch speakers' });
  }
});

// 3. Get Agenda
app.get('/api/agenda', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM agenda ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('[API Error /api/agenda]', err);
    res.status(500).json({ error: 'Failed to fetch agenda' });
  }
});

// 4. Registration Count
app.get('/api/registrations/count', async (req, res) => {
  try {
    const result = await db.query('SELECT count(*) FROM registrations');
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('[API Error /api/registrations/count]', err);
    res.status(500).json({ error: 'Failed to get registration count' });
  }
});

// 5. Check if email is already registered
app.get('/api/registrations/check', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email parameter required' });

    const result = await db.query('SELECT id, name, email, status FROM registrations WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    if (result.rows.length > 0) {
      return res.json({ exists: true, user: result.rows[0] });
    }
    res.json({ exists: false, user: null });
  } catch (err) {
    console.error('[API Error /api/registrations/check]', err);
    res.status(500).json({ error: 'Failed to check registration' });
  }
});

// 6. Submit Registration
app.post('/api/registrations', async (req, res) => {
  try {
    const { name, email, phone, company, designation, linkedin, role, status } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanStatus = status || 'confirmed';

    const insertQuery = `
      INSERT INTO registrations (name, email, phone, company, designation, linkedin, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const result = await db.query(insertQuery, [
      name.trim(),
      cleanEmail,
      phone || null,
      company || null,
      designation || null,
      linkedin || null,
      role || 'Attendee',
      cleanStatus
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[API Error /api/registrations]', err);
    res.status(500).json({ error: 'Failed to save registration' });
  }
});

// 7. Submit Speaker Application
app.post('/api/speaker-applications', async (req, res) => {
  try {
    const { name, email, phone, company, designation, topic, bio, linkedin } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const insertQuery = `
      INSERT INTO speaker_applications (name, email, phone, company, designation, topic, bio, linkedin, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *;
    `;
    const result = await db.query(insertQuery, [
      name.trim(),
      email.trim().toLowerCase(),
      phone || null,
      company || null,
      designation || null,
      topic || null,
      bio || null,
      linkedin || null
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[API Error /api/speaker-applications]', err);
    res.status(500).json({ error: 'Failed to submit speaker application' });
  }
});

// ----------------------------------------------------
// OTP SYSTEM
// ----------------------------------------------------
app.post('/api/send-otp', async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  email = email.trim().toLowerCase();

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore[email] = { code: otp, expiresAt };

  // Also persist to DB otps table
  try {
    await db.query(`
      INSERT INTO otps (email, code, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at;
    `, [email, otp, expiresAt]);
  } catch (e) {
    console.warn('[DB OTP persist warning]', e.message);
  }

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
            If you did not request this, please ignore this email.<br>&copy; 2026 SDET Technologies.
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
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
});

app.post('/api/send-speaker-otp', async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  email = email.trim().toLowerCase();

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore[email] = { code: otp, expiresAt };

  try {
    await db.query(`
      INSERT INTO otps (email, code, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at;
    `, [email, otp, expiresAt]);
  } catch (e) {}

  const mailOptions = {
    from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Speaker Verification Code',
    html: `
      <div style="background-color: #07070f; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #0d0d18; border-radius: 16px; border: 1px solid #1f1f30; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.65);">
          <div style="background-color: #050508; padding: 32px 24px; border-bottom: 2px solid #d4ff3a;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #8e8e9a; letter-spacing: 2px; text-transform: uppercase;">
              CALL FOR SPEAKERS 2026
            </p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 800;">Confirm your <span style="color: #d4ff3a;">Submission</span></h2>
            <p style="color: #b0b0cc; font-size: 14.5px; line-height: 1.7; margin-bottom: 30px;">
              Please use the verification code below to authenticate your email. This code expires in 10 minutes.
            </p>
            <div style="background: #13132a; padding: 20px 24px; border-radius: 12px; display: inline-block; border: 1px dashed #2a2a50; margin-bottom: 32px;">
              <h1 style="color: #d4ff3a; font-size: 36px; letter-spacing: 6px; margin: 0; font-family: monospace;">${otp}</h1>
            </div>
            <p style="color: #505070; font-size: 12px; line-height: 1.6; margin-bottom: 0;">
              &copy; 2026 SDET Technologies.
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
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
});

app.post('/api/send-admin-otp', async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  email = email.trim().toLowerCase();

  // Check admin whitelist from database
  try {
    const scRes = await db.query('SELECT hero_meta FROM site_content WHERE id = 1 LIMIT 1');
    const MASTER_ADMINS = ['abhishekjohri150@gmail.com', 'elevateqa@sdettech.com', 'abhishek.johri@sdettech.com', 'mugdha.shah@sdettech.com'];
    let whitelist = [];
    if (scRes.rows[0] && scRes.rows[0].hero_meta) {
      const meta = typeof scRes.rows[0].hero_meta === 'string' ? JSON.parse(scRes.rows[0].hero_meta) : scRes.rows[0].hero_meta;
      if (meta.admin_whitelist && Array.isArray(meta.admin_whitelist)) {
        whitelist = meta.admin_whitelist;
      }
    }
    whitelist = [...new Set([
      ...whitelist.map(e => (typeof e === 'string' ? e : (e && e.email) || '')),
      ...MASTER_ADMINS
    ])].filter(Boolean).map(e => e.toLowerCase());

    if (!whitelist.includes(email)) {
      return res.status(403).json({ error: 'Unauthorized: Your email is not in the Admin list.' });
    }
  } catch (err) {
    console.error('[Admin Whitelist Check Error]', err);
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore[email] = { code: otp, expiresAt };

  try {
    await db.query(`
      INSERT INTO otps (email, code, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at;
    `, [email, otp, expiresAt]);
  } catch (e) {}

  const mailOptions = {
    from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Elevate QA Admin Portal - Login Code',
    html: `
      <div style="background-color: #07070f; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #0d0d18; border-radius: 16px; border: 1px solid #1f1f30; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.65);">
          <div style="background-color: #050508; padding: 32px 24px; border-bottom: 2px solid #ff5a36;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #8e8e9a; letter-spacing: 2px; text-transform: uppercase;">
              ELEVATE QA 2026 - ADMIN
            </p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 800;">Secure <span style="color: #ff5a36;">Login</span></h2>
            <p style="color: #b0b0cc; font-size: 14.5px; line-height: 1.7; margin-bottom: 30px;">
              Please use the verification code below to log into the Admin Portal. This code expires in 10 minutes.
            </p>
            <div style="background: #13132a; padding: 20px 24px; border-radius: 12px; display: inline-block; border: 1px dashed #2a2a50; margin-bottom: 32px;">
              <h1 style="color: #ff5a36; font-size: 36px; letter-spacing: 6px; margin: 0; font-family: monospace;">${otp}</h1>
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

// Verify OTP (Generic / Admin / Attendee)
app.post('/api/verify-otp', async (req, res) => {
  let { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
  email = email.trim().toLowerCase();
  otp = otp.trim();

  // Check memory store first
  let record = otpStore[email];

  // If not found in memory, check database
  if (!record) {
    try {
      const dbOtp = await db.query('SELECT code, expires_at FROM otps WHERE LOWER(email) = LOWER($1)', [email]);
      if (dbOtp.rows.length > 0) {
        record = {
          code: dbOtp.rows[0].code,
          expiresAt: parseInt(dbOtp.rows[0].expires_at, 10)
        };
      }
    } catch (e) {}
  }

  if (!record) {
    return res.status(400).json({ error: 'No OTP found or it has expired. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    try { await db.query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [email]); } catch (e) {}
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  if (record.code === otp) {
    delete otpStore[email];
    try { await db.query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [email]); } catch (e) {}
    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
});

app.post('/api/verify-admin-otp', (req, res) => {
  // Alias to verify-otp
  req.url = '/api/verify-otp';
  return app._router.handle(req, res);
});

// ----------------------------------------------------
// TICKET / EMAIL ACTIONS
// ----------------------------------------------------
app.post('/api/send-ticket', async (req, res) => {
  const { name, email, company, ticketId, designation, qrData } = req.body;
  if (!email || !ticketId) return res.status(400).json({ error: 'Missing required ticket data' });

  try {
    const mailOptions = {
      from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '📝 Registration Received — Elevate QA 2026',
      html: `
        <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
            <div style="background-color: #d4ff3a; padding: 30px; text-align: center;">
              <h2 style="color: #0b0b10; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Elevate QA 2026</h2>
              <p style="color: #0b0b10; margin: 10px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px;">THE PROOF OF VALUE</p>
            </div>
            <div style="padding: 40px;">
              <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:3px;font-weight:700;color:#6060a0;text-transform:uppercase;">Registration Received ✓</p>
              <h3 style="color: #ffffff; font-size: 22px; margin-top: 10px; font-weight: 500;">
                Welcome, <span style="color: #ff5a36; font-weight: 600;">${name}</span>!
              </h3>
              <p style="color: #8b8b9b; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Thank you for showing your interest in attending the <strong style="color:#ffffff;">Elevate QA Tech Summit</strong>. We have received your details.
              </p>
              <div style="background: rgba(255,90,54,0.1); border-left: 3px solid #ff5a36; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 10px;">
                <div style="color: #ff5a36; font-size: 12px; text-transform: uppercase; font-weight: 600;">WHEN</div>
                <div style="color: #ffffff; font-size: 15px;">8th August 2026 &middot; 09:00 AM</div>
              </div>
              <div style="background: rgba(212,255,58,0.1); border-left: 3px solid #d4ff3a; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                <div style="color: #d4ff3a; font-size: 12px; text-transform: uppercase; font-weight: 600;">WHERE</div>
                <div style="color: #ffffff; font-size: 15px;">Crowne Plaza, Mayur Vihar, New Delhi</div>
              </div>
            </div>
            <div style="background: #0f0f13; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
              <p style="color: #555565; font-size: 12px; margin: 0;">&copy; 2026 SDET Technologies.</p>
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

app.post('/api/send-final-ticket', async (req, res) => {
  const { name, email, company, ticketId, designation, qrData } = req.body;
  if (!email || !ticketId || !qrData) return res.status(400).json({ error: 'Missing data' });
  try {
    const qrBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: { dark: '#000000', light: '#ffffff' }
    });
    const mailOptions = {
      from: '"Elevate QA 2026" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: '🎫 Your Official Pass — Elevate QA 2026',
      html: `
        <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
            <div style="background-color: #d4ff3a; padding: 30px; text-align: center;">
              <h2 style="color: #0b0b10; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 800;">Elevate QA 2026</h2>
              <p style="color: #0b0b10; margin: 10px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px;">THE PROOF OF VALUE</p>
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
                <div style="color: #ff5a36; font-size: 12px; text-transform: uppercase; font-weight: 600;">WHEN</div>
                <div style="color: #ffffff; font-size: 15px;">8th August 2026 &middot; 09:00 AM</div>
              </div>
              <div style="background: rgba(212,255,58,0.1); border-left: 3px solid #d4ff3a; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                <div style="color: #d4ff3a; font-size: 12px; text-transform: uppercase; font-weight: 600;">WHERE</div>
                <div style="color: #ffffff; font-size: 15px;">Crowne Plaza, Mayur Vihar, New Delhi</div>
              </div>
            </div>
            <div style="background: #07070f; border-top: 1px dashed #2a2a3e; padding: 30px; text-align: center;">
              <p style="color: #8b8b9b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">TICKET ID: ${ticketId}</p>
              <img src="cid:qrcode@elevateqa" alt="QR Code" width="150" height="150" style="display:inline-block; border: 4px solid #fff; border-radius: 8px;">
              <p style="color: #555565; font-size: 13px; margin-top: 15px;">Keep this email handy. This QR code is your entry ticket.</p>
            </div>
            <div style="background: #0f0f13; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
              <p style="color: #555565; font-size: 12px; margin: 0;">&copy; 2026 SDET Technologies.</p>
            </div>
          </div>
        </div>
      `,
      attachments: [{ filename: 'ticket-qr.png', content: qrBuffer, cid: 'qrcode@elevateqa' }]
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Final ticket sent' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send final ticket' });
  }
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
              <h2 style="color: #0b0b10; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 800;">Elevate QA 2026</h2>
              <p style="color: #0b0b10; margin: 10px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px;">EVENT UPDATE</p>
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
              <p style="color: #555565; font-size: 12px; margin: 0;">&copy; 2026 SDET Technologies.</p>
            </div>
          </div>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Rejection sent' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send rejection email' });
  }
});

app.post('/api/send-custom-email', async (req, res) => {
  const { subject, message, targetEmails, ccEmails, bccEmails, attachments } = req.body;
  if (!subject || !message || !targetEmails || !Array.isArray(targetEmails) || targetEmails.length === 0) {
    return res.status(400).json({ error: 'Missing required email data' });
  }
  try {
    const combinedBcc = [...targetEmails, ...(Array.isArray(bccEmails) ? bccEmails : [])];
    const ccList = Array.isArray(ccEmails) ? ccEmails : [];
    const attachmentList = Array.isArray(attachments) ? attachments : [];

    const mailOptions = {
      from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
      bcc: combinedBcc,
      cc: ccList,
      subject,
      attachments: attachmentList,
      html: `
        <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
            <div style="background-color: #d4ff3a; padding: 30px; text-align: center;">
              <h2 style="color: #0b0b10; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 800;">Elevate QA 2026</h2>
              <p style="color: #0b0b10; margin: 10px 0 0 0; font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px;">EVENT UPDATE</p>
            </div>
            <div style="padding: 40px;">
              <div style="color: #ffffff; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                ${message}
              </div>
            </div>
            <div style="background: #0f0f13; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
              <p style="color: #555565; font-size: 12px; margin: 0;">&copy; 2026 SDET Technologies.</p>
            </div>
          </div>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log(`[CUSTOM EMAIL] Sent to ${targetEmails.length} recipients`);
    res.status(200).json({ success: true, message: 'Custom email blast sent successfully' });
  } catch (error) {
    console.error('[CUSTOM EMAIL Error]', error);
    res.status(500).json({ error: 'Failed to send custom email.' });
  }
});

// ----------------------------------------------------
// SCANNER VERIFICATION (ATOMIC CHECK-IN)
// ----------------------------------------------------
app.post('/api/scanner/verify', async (req, res) => {
  try {
    let { raw, ticketId } = req.body;
    if (raw && !ticketId) {
      if (!raw.startsWith('ELEVATE-QA:')) {
        return res.json({ status: 'invalid', message: 'Unrecognized ticket format' });
      }
      ticketId = raw.replace('ELEVATE-QA:', '').split('|')[0].trim();
    }

    if (!ticketId) {
      return res.status(400).json({ status: 'error', message: 'Ticket ID required' });
    }

    // 1. Look up user
    const userRes = await db.query('SELECT * FROM registrations WHERE id = $1 LIMIT 1', [ticketId]);
    if (userRes.rows.length === 0) {
      return res.json({ status: 'not_found', message: 'Ticket does not exist' });
    }
    const user = userRes.rows[0];

    // 2. Atomic update to PRESENT
    const updateRes = await db.query(`
      UPDATE registrations
      SET status = 'PRESENT'
      WHERE id = $1 AND (status IS NULL OR status != 'PRESENT')
      RETURNING *;
    `, [ticketId]);

    if (updateRes.rows.length === 0) {
      // Already admitted earlier
      return res.json({
        status: 'already_present',
        user: {
          name: user.name,
          role: user.role || 'ATTENDEE',
          company: user.company || user.email
        }
      });
    }

    // Newly admitted
    res.json({
      status: 'admitted',
      user: {
        name: user.name,
        role: user.role || 'ATTENDEE',
        company: user.company || user.email
      }
    });
  } catch (err) {
    console.error('[Scanner Verify Error]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ----------------------------------------------------
// ADMIN PORTAL API (FULL CRUD & MANAGEMENT)
// ----------------------------------------------------

// Admin All Data Fetch
app.get('/api/admin/all-data', async (req, res) => {
  try {
    const [sc, br, mf, sp, ag, ms, pl, rg, sa] = await Promise.all([
      db.query('SELECT * FROM site_content WHERE id = 1 LIMIT 1'),
      db.query('SELECT * FROM branding LIMIT 1'),
      db.query('SELECT * FROM manifesto LIMIT 1'),
      db.query('SELECT * FROM speakers ORDER BY display_order ASC'),
      db.query('SELECT * FROM agenda ORDER BY display_order ASC'),
      db.query('SELECT * FROM maturity_stages ORDER BY display_order ASC'),
      db.query('SELECT * FROM pillars ORDER BY display_order ASC'),
      db.query('SELECT * FROM registrations ORDER BY created_at ASC'),
      db.query('SELECT * FROM speaker_applications ORDER BY created_at ASC')
    ]);

    res.json({
      site_content: sc.rows[0] || null,
      branding: br.rows[0] || null,
      manifesto: mf.rows[0] || null,
      speakers: sp.rows || [],
      agenda: ag.rows || [],
      maturity_stages: ms.rows || [],
      pillars: pl.rows || [],
      registrations: rg.rows || [],
      speaker_applications: sa.rows || []
    });
  } catch (err) {
    console.error('[Admin All Data Error]', err);
    res.status(500).json({ error: 'Failed to load admin data' });
  }
});

// Admin Attendance / Polling Updates
app.get('/api/admin/attendance-updates', async (req, res) => {
  try {
    const [rg, sa] = await Promise.all([
      db.query('SELECT * FROM registrations ORDER BY created_at ASC'),
      db.query('SELECT * FROM speaker_applications ORDER BY created_at ASC')
    ]);
    res.json({
      registrations: rg.rows || [],
      speaker_applications: sa.rows || []
    });
  } catch (err) {
    console.error('[Admin Attendance Updates Error]', err);
    res.status(500).json({ error: 'Failed to load updates' });
  }
});

// Admin Image Upload
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const publicUrl = `/uploads/${req.file.filename}`;
  console.log(`[Upload] File saved: ${publicUrl}`);
  res.json({ success: true, url: publicUrl });
});

// Save Site Content
app.post('/api/admin/save-site-content', async (req, res) => {
  try {
    const { heroHeadline, heroTagline, heroEyebrow, heroEdition, eventDate, eventVenue, heroFormat, heroAudience, hero_meta } = req.body;
    const metaJson = typeof hero_meta === 'object' ? JSON.stringify(hero_meta) : hero_meta;

    await db.query(`
      INSERT INTO site_content (id, hero_headline, hero_tagline, hero_eyebrow, hero_edition, event_date, event_venue, hero_format, hero_audience, hero_meta)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        hero_headline = EXCLUDED.hero_headline,
        hero_tagline = EXCLUDED.hero_tagline,
        hero_eyebrow = EXCLUDED.hero_eyebrow,
        hero_edition = EXCLUDED.hero_edition,
        event_date = EXCLUDED.event_date,
        event_venue = EXCLUDED.event_venue,
        hero_format = EXCLUDED.hero_format,
        hero_audience = EXCLUDED.hero_audience,
        hero_meta = EXCLUDED.hero_meta;
    `, [heroHeadline, heroTagline, heroEyebrow, heroEdition, eventDate, eventVenue, heroFormat, heroAudience, metaJson]);

    res.json({ success: true });
  } catch (err) {
    console.error('[Save Site Content Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Save Branding
app.post('/api/admin/save-branding', async (req, res) => {
  try {
    const { id, logo_url, logo_height, hero_bg_url, strip_img_1, strip_img_2, strip_img_3, strip_cap_1, strip_cap_2, strip_cap_3, primary_color, accent_color } = req.body;
    const brandingId = id || '00000000-0000-0000-0000-000000000001';

    await db.query(`
      INSERT INTO branding (id, logo_url, logo_height, hero_bg_url, strip_img_1, strip_img_2, strip_img_3, strip_cap_1, strip_cap_2, strip_cap_3, primary_color, accent_color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        logo_url = EXCLUDED.logo_url,
        logo_height = EXCLUDED.logo_height,
        hero_bg_url = EXCLUDED.hero_bg_url,
        strip_img_1 = EXCLUDED.strip_img_1,
        strip_img_2 = EXCLUDED.strip_img_2,
        strip_img_3 = EXCLUDED.strip_img_3,
        strip_cap_1 = EXCLUDED.strip_cap_1,
        strip_cap_2 = EXCLUDED.strip_cap_2,
        strip_cap_3 = EXCLUDED.strip_cap_3,
        primary_color = EXCLUDED.primary_color,
        accent_color = EXCLUDED.accent_color;
    `, [brandingId, logo_url, logo_height || 48, hero_bg_url, strip_img_1, strip_img_2, strip_img_3, strip_cap_1, strip_cap_2, strip_cap_3, primary_color, accent_color]);

    res.json({ success: true });
  } catch (err) {
    console.error('[Save Branding Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Save Manifesto
app.post('/api/admin/save-manifesto', async (req, res) => {
  try {
    const { content } = req.body;
    await db.query(`
      INSERT INTO manifesto (id, content, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000001', $1, NOW())
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();
    `, [content]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Save Manifesto Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Save Speaker (Upsert)
app.post('/api/admin/save-speaker', async (req, res) => {
  try {
    const { id, name, role, company, image_url, bio, display_order, status, title } = req.body;
    if (id) {
      await db.query(`
        INSERT INTO speakers (id, name, role, company, image_url, bio, display_order, status, title, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          company = EXCLUDED.company,
          image_url = EXCLUDED.image_url,
          bio = EXCLUDED.bio,
          display_order = EXCLUDED.display_order,
          status = EXCLUDED.status,
          title = EXCLUDED.title,
          updated_at = NOW();
      `, [id, name, role, company, image_url, bio, display_order || 0, status || 'confirmed', title]);
    } else {
      await db.query(`
        INSERT INTO speakers (name, role, company, image_url, bio, display_order, status, title, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());
      `, [name, role, company, image_url, bio, display_order || 0, status || 'confirmed', title]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Save Speaker Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Save Agenda Item (Upsert)
app.post('/api/admin/save-agenda', async (req, res) => {
  try {
    const { id, time_slot, title, speaker_name, display_order } = req.body;
    if (id) {
      await db.query(`
        INSERT INTO agenda (id, time_slot, title, speaker_name, display_order, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO UPDATE SET
          time_slot = EXCLUDED.time_slot,
          title = EXCLUDED.title,
          speaker_name = EXCLUDED.speaker_name,
          display_order = EXCLUDED.display_order,
          updated_at = NOW();
      `, [id, time_slot, title, speaker_name, display_order || 0]);
    } else {
      await db.query(`
        INSERT INTO agenda (time_slot, title, speaker_name, display_order, updated_at)
        VALUES ($1, $2, $3, $4, NOW());
      `, [time_slot, title, speaker_name, display_order || 0]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Save Agenda Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Save Maturity Stage
app.post('/api/admin/save-stage', async (req, res) => {
  try {
    const { id, name, pct, desc, display_order, color } = req.body;
    await db.query(`
      INSERT INTO maturity_stages (id, name, pct, "desc", display_order, color)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        pct = EXCLUDED.pct,
        "desc" = EXCLUDED."desc",
        display_order = EXCLUDED.display_order,
        color = EXCLUDED.color;
    `, [id, name, pct, desc, display_order || 0, color || null]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Save Stage Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Save Pillar
app.post('/api/admin/save-pillar', async (req, res) => {
  try {
    const { id, title, desc, display_order } = req.body;
    await db.query(`
      INSERT INTO pillars (id, title, "desc", display_order)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        "desc" = EXCLUDED."desc",
        display_order = EXCLUDED.display_order;
    `, [id, title, desc, display_order || 0]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Save Pillar Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Add / Upsert Attendee
app.post('/api/admin/attendee', async (req, res) => {
  try {
    const { id, name, email, phone, company, designation, linkedin, role, status } = req.body;
    if (id) {
      await db.query(`
        INSERT INTO registrations (id, name, email, phone, company, designation, linkedin, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          company = EXCLUDED.company,
          designation = EXCLUDED.designation,
          linkedin = EXCLUDED.linkedin,
          role = EXCLUDED.role,
          status = EXCLUDED.status;
      `, [id, name, email.toLowerCase(), phone || null, company || null, designation || null, linkedin || null, role || 'Attendee', status || 'confirmed']);
    } else {
      await db.query(`
        INSERT INTO registrations (name, email, phone, company, designation, linkedin, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [name, email.toLowerCase(), phone || null, company || null, designation || null, linkedin || null, role || 'Attendee', status || 'confirmed']);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin Attendee Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Registration Status
app.post('/api/admin/update-status', async (req, res) => {
  try {
    const { id, status } = req.body;
    await db.query('UPDATE registrations SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Update Status Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Registration Role
app.post('/api/admin/update-role', async (req, res) => {
  try {
    const { id, role } = req.body;
    await db.query('UPDATE registrations SET role = $1 WHERE id = $2', [role, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Update Role Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Registration Arbitrary Field (safe whitelist)
app.post('/api/admin/update-field', async (req, res) => {
  try {
    const { id, field, value } = req.body;
    const allowedFields = [
      'certificate_sent_at', 'keynote_thanks_sent_at', 'food_email_sent_at',
      'location_email_sent_at', 'entry_reminder_sent_at', 'status', 'role',
      'phone', 'designation', 'company'
    ];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Disallowed field update' });
    }

    await db.query(`UPDATE registrations SET ${field} = $1 WHERE id = $2`, [value, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Update Field Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Generic Delete Row
app.delete('/api/admin/delete-row', async (req, res) => {
  try {
    const table = req.query.table || req.body.table;
    const id = req.query.id || req.body.id;
    const allowedTables = ['speakers', 'agenda', 'maturity_stages', 'pillars', 'registrations', 'speaker_applications'];

    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Disallowed table deletion' });
    }

    await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Delete Row Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Purge All Registrations
app.post('/api/admin/purge-registrations', async (req, res) => {
  try {
    await db.query('DELETE FROM registrations');
    res.json({ success: true });
  } catch (err) {
    console.error('[Purge Registrations Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk Restore Data
app.post('/api/admin/restore-data', async (req, res) => {
  try {
    const { table, dataArray } = req.body;
    const allowedTables = ['speakers', 'agenda', 'maturity_stages', 'pillars', 'registrations', 'speaker_applications'];
    if (!allowedTables.includes(table) || !Array.isArray(dataArray)) {
      return res.status(400).json({ error: 'Invalid table or data format' });
    }

    // Delete existing and insert batch
    await db.query(`DELETE FROM ${table}`);
    for (const item of dataArray) {
      const keys = Object.keys(item);
      const values = Object.values(item);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const cols = keys.map(k => `"${k}"`).join(', ');
      await db.query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, values);
    }

    res.json({ success: true, count: dataArray.length });
  } catch (err) {
    console.error('[Restore Data Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// FRONTEND STATIC HOSTING & CLIENT-SIDE ROUTING
// ----------------------------------------------------
const WEBSITE_DIR = path.join(__dirname, '../website');
const DIST_DIR = path.join(WEBSITE_DIR, 'dist');

// Serve compiled dist if available, else website directory
const staticBase = fs.existsSync(DIST_DIR) ? DIST_DIR : WEBSITE_DIR;
console.log(`[Static Files] Serving frontend from: ${staticBase}`);
app.use(express.static(staticBase));

// Route shortcuts
app.get('/admin', (req, res) => {
  const p = path.join(staticBase, 'admin.html');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.sendFile(path.join(WEBSITE_DIR, 'admin.html'));
});

app.get('/scanner', (req, res) => {
  const p = path.join(staticBase, 'scanner.html');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.sendFile(path.join(WEBSITE_DIR, 'scanner.html'));
});

app.get('/speaker', (req, res) => {
  const p = path.join(staticBase, 'speaker.html');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.sendFile(path.join(WEBSITE_DIR, 'speaker.html'));
});

// Fallback to index.html for single-page routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  const idx = path.join(staticBase, 'index.html');
  if (fs.existsSync(idx)) return res.sendFile(idx);
  res.sendFile(path.join(WEBSITE_DIR, 'index.html'));
});

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  ELEVATE QA LOCAL SERVER RUNNING ON PORT ${PORT} `);
  console.log(`  - Main Website:  http://localhost:${PORT}/        `);
  console.log(`  - Admin Portal:  http://localhost:${PORT}/admin   `);
  console.log(`  - Ticket Scanner:http://localhost:${PORT}/scanner `);
  console.log(`  - Speaker Call:  http://localhost:${PORT}/speaker `);
  console.log(`====================================================`);
});
