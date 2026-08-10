import nodemailer from 'nodemailer';
import crypto from 'crypto';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// Names/free text come from admin-authored fields and attendee records, not
// trusted HTML/XML — escape before dropping them into any markup so a stray
// "<" in someone's name can't break the layout.
const escapeHtml = (str) => String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Decoded once per warm invocation and reused
let certificateBaseImageBuffer = null;
async function getCertificateBaseImage() {
    if (!certificateBaseImageBuffer) {
        const { CERT_IMAGE_BASE64 } = await import('./cert-image-data.js');
        certificateBaseImageBuffer = Buffer.from(CERT_IMAGE_BASE64, 'base64');
    }
    return certificateBaseImageBuffer;
}

// See verify-otp.js's mintAdminToken — this endpoint sends arbitrary
// subject/message content to an arbitrary-sized recipient list, making it
// the most dangerous one to leave open to unauthenticated callers. If
// ADMIN_TOKEN_SECRET isn't configured yet, this falls back to allowing the
// request through (matches prior behavior) rather than breaking email
// sending in production.
function isValidAdminToken(token) {
    const secret = process.env.ADMIN_TOKEN_SECRET;
    if (!secret) return true;
    if (!token || token.split('.').length !== 3) return false;
    const [emailB64, expires, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(`${emailB64}.${expires}`).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
    return Date.now() <= Number(expires);
}

export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    if (!isValidAdminToken(event.headers['x-admin-token'])) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized. Please log in again.' }) };
    }

    try {
        const { subject, message, targetEmails, ccEmails, bccEmails, attachments, includeQrForRecipients, templateType } = JSON.parse(event.body);
        const mailAttachments = Array.isArray(attachments) ? attachments : [];

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
            // Reuse one connection across the whole batch instead of a fresh
            // TCP+TLS handshake per email — with several recipients per
            // invocation and a per-email pacing delay already in place, the
            // extra handshake time was pushing close to Netlify's function
            // execution limit.
            pool: true,
            maxConnections: 1,
            tls: { ciphers: 'SSLv3' }
        });

        const extraBccList = Array.isArray(bccEmails) ? bccEmails : [];
        const ccList = Array.isArray(ccEmails) ? ccEmails : [];

        // Admins type plain text with blank lines between paragraphs (the UI
        // says "HTML is supported for bold, links, etc." but doesn't require
        // it), and HTML collapses bare newlines/whitespace — so without this,
        // every paragraph break the admin typed disappears in the sent email.
        const withLineBreaks = (msgContent) => String(msgContent || '').replace(/\n/g, '<br>');

        // Letter (thank-you message) + the certificate image (already baked
        // per-recipient by generateCertificatePng, referenced here purely via
        // cid — no CSS positioning of any kind, so no client-specific
        // rendering quirks are possible).
        const getCertificateEmailHtml = (letterMessage, certId, name) => `
                <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 640px; margin: 0 auto;">

                        <div style="background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8); margin-bottom: 28px;">
                            <div style="background: linear-gradient(180deg, #101017 0%, #050508 100%); text-align: center; border-bottom: 1px solid #1a1a24;">
                                <div style="height: 4px; background: linear-gradient(90deg, #a8ff1a, #d4ff3a, #eaff80); box-shadow: 0 2px 15px rgba(212, 255, 58, 0.4);"></div>
                                <div style="padding: 40px 30px 32px 30px;">
                                    <img src="https://elevateqa.sdettech.com/logo.png" alt="Elevate QA Logo" height="90" style="display:block;margin:0 auto 20px auto;border:0;pointer-events:none;" />
                                    <div style="display: inline-block; padding: 6px 16px; background-color: rgba(212, 255, 58, 0.05); border: 1px solid rgba(212, 255, 58, 0.15); border-radius: 50px;">
                                        <p style="color: #d4ff3a; margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase;">🏆 CERTIFICATE ENCLOSED</p>
                                    </div>
                                </div>
                            </div>
                            <div style="padding: 40px;">
                                <div style="color: #ffffff; font-size: 16px; line-height: 1.7;">${withLineBreaks(letterMessage)}</div>
                            </div>
                        </div>

                        <div style="margin-bottom: 12px; text-align: center;">
                            <div style="position: relative; display: inline-block; text-align: center; max-width: 640px; width: 100%;">
                                <img src="cid:certificate@elevateqa" width="640" style="width:100%; max-width:640px; height:auto; display:block; margin:0 auto; border-radius:6px;" alt="Certificate of Participation" />
                                <div style="position: absolute; top: 52%; left: 0; right: 0; text-align: center; font-size: 28px; font-weight: bold; font-family: 'Georgia', serif; color: #E7C979; margin: 0 auto; width: 100%;">
                                    ${escapeHtml(name)}
                                </div>
                            </div>
                        </div>
                        ${certId ? `<p style="color: #55555f; font-size: 10px; letter-spacing: 1px; text-align: center; margin: 0 0 24px 0;">CERTIFICATE ID: ${escapeHtml(certId)}</p>` : ''}

                        <p style="color: #8e8e9a; font-size: 13px; text-align: center; margin: 0 0 24px 0;">
                            📎 Your certificate is also attached to this email as a downloadable image — save it for your records.
                        </p>
                        <p style="color: #555565; font-size: 12px; text-align: center; margin: 0;">
                            You are receiving this email because you are registered for Elevate QA 2026.<br><br>
                            &copy; 2026 SDET Technologies.
                        </p>
                    </div>
                </div>
        `;

        const getHtml = (msgContent) => `
                <div style="background-color: #0b0b10; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #121217; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                        
                        <!-- Header Section -->
                        <div style="background: linear-gradient(180deg, #101017 0%, #050508 100%); text-align: center; border-bottom: 1px solid #1a1a24;">
                            <div style="height: 4px; background: linear-gradient(90deg, #a8ff1a, #d4ff3a, #eaff80); box-shadow: 0 2px 15px rgba(212, 255, 58, 0.4);"></div>
                            <div style="padding: 45px 30px 40px 30px;">
                                <img src="https://elevateqa.sdettech.com/logo.png" alt="Elevate QA Logo" height="100" style="display:block;margin:0 auto 20px auto;border:0;pointer-events:none;" />
                                <div style="display: inline-block; padding: 6px 16px; background-color: rgba(212, 255, 58, 0.05); border: 1px solid rgba(212, 255, 58, 0.15); border-radius: 50px;">
                                    <p style="color: #d4ff3a; margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                                        EVENT UPDATE
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Body Section -->
                        <div style="padding: 40px;">
                            <div style="color: #ffffff; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                ${withLineBreaks(msgContent)}
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
        `;

        let successCount = 0;
        let failCount = 0;

        // Send one at a time with a short pause between each, instead of
        // firing the whole batch at once — a burst of identical emails going
        // out simultaneously from one account is exactly what Office365 (and
        // most receiving mail servers) flag as spam/abuse and start
        // throttling or blocking. The client also sends smaller batches with
        // its own pause between requests (see admin-ui.js sendCustomEmail).
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const SEND_DELAY_MS = 350;

        // Falls back to a Title-Cased guess from the email's local part (e.g.
        // "priya.sharma@x.com" -> "Priya Sharma") when no name reaches this
        // function — same derivation already used for ad-hoc "Custom Email(s)"
        // recipients in the admin composer — so a {{Name}}/[Name] placeholder
        // never renders as a bare "Hi ," in the sent email.
        const deriveNameFromEmail = (email) => {
            const localPart = String(email || '').split('@')[0];
            if (!localPart) return '';
            return localPart.split(/[._-]/).filter(Boolean)
                .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                .join(' ');
        };

        let lastError = null; // Store the exact error message for debugging

        for (const recipient of targetEmails) {
            const email = typeof recipient === 'object' ? recipient.email : recipient;
            const rawName = typeof recipient === 'object' ? recipient.name : '';
            const name = (rawName && String(rawName).trim()) || deriveNameFromEmail(email);
            const id = typeof recipient === 'object' ? recipient.id : null;

            // Replace [First Name]/{{first name}} with just the first token of
            // the name, and [Name]/{{name}} with the full name. The plain
            // "name" pattern requires only whitespace between the brackets and
            // "name", so it never matches "[First Name]" — order between the
            // two replaces doesn't matter for correctness, but running the
            // "first name" one first keeps intent obvious.
            const firstName = String(name || '').trim().split(/\s+/)[0] || '';
            let finalMessage = message
                .replace(/\{\{\s*first\s*name\s*\}\}|\[\s*first\s*name\s*\]/gi, firstName)
                .replace(/\{\{\s*name\s*\}\}|\[\s*name\s*\]/gi, name || '');

            // Each attendee's QR encodes their own registration id — never
            // reuse one recipient's QR image for another, so this is
            // generated fresh per recipient rather than passed in as a
            // shared attachment.
            let recipientAttachments = mailAttachments;
            if (includeQrForRecipients && id) {
                try {
                    const qrBuffer = await QRCode.toBuffer(`ELEVATE-QA:${id}|${name}|${email}`, {
                        errorCorrectionLevel: 'H',
                        margin: 4,
                        width: 500,
                        color: { dark: '#000000', light: '#ffffff' }
                    });
                    recipientAttachments = [
                        ...mailAttachments,
                        { filename: 'entry-qr.png', content: qrBuffer, cid: 'entryqr@elevateqa' }
                    ];
                    finalMessage += `<br><br><div style="text-align:center;"><div style="background:#ffffff;padding:12px;border-radius:12px;display:inline-block;"><img src="cid:entryqr@elevateqa" width="200" height="200" style="display:block;border:0;"></div><p style="color:#8e8e9a;font-size:12px;margin-top:10px;">QR code is required at the registration desk.</p></div>`;
                } catch (err) {
                    console.error('[CUSTOM EMAIL] QR generation failed for', email, err.message);
                }
            }

            // Certificate ID gives the download a bit of "official document"
            // weight and, being derived from the registration id, doubles as
            // a way to trace a downloaded certificate back to its recipient.
            const certId = (templateType === 'certificate' && id) ? `EQ26-CERT-${String(id).split('-')[0].toUpperCase()}` : '';
            if (templateType === 'certificate') {
                try {
                    const certPng = await getCertificateBaseImage();
                    const safeName = String(name || 'Certificate').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'Certificate';
                    recipientAttachments = [
                        ...mailAttachments,
                        { filename: 'certificate.png', content: certPng, cid: 'certificate@elevateqa' },
                        { filename: `ElevateQA-2026-Certificate-${safeName}.png`, content: certPng }
                    ];
                } catch (err) {
                    console.error('[CUSTOM EMAIL] Certificate generation failed for', email, err.message);
                    lastError = `Cert Error: ${err.message}`;
                    failCount++;
                    await sleep(SEND_DELAY_MS);
                    continue;
                }
            }

            const mailOptions = {
                from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: subject,
                html: templateType === 'certificate'
                    ? getCertificateEmailHtml(finalMessage, certId, name)
                    : getHtml(finalMessage),
                attachments: recipientAttachments
            };
            try {
                await transporter.sendMail(mailOptions);
                successCount++;
            } catch (err) {
                console.error('[CUSTOM EMAIL] Failed to send to', email, err.message);
                lastError = `SMTP Error: ${err.message}`;
                failCount++;
            }
            await sleep(SEND_DELAY_MS);
        }

        // Send a single copy to CC and BCC if provided, so they aren't spammed
        if (ccList.length > 0 || extraBccList.length > 0) {
            const ccMessage = message
                .replace(/\{\{\s*first\s*name\s*\}\}|\[\s*first\s*name\s*\]/gi, 'Team')
                .replace(/\{\{\s*name\s*\}\}|\[\s*name\s*\]/gi, 'Team');
            let ccAttachments = mailAttachments;
            let ccHtml = getHtml(ccMessage);
            if (templateType === 'certificate') {
                try {
                    const certPng = await getCertificateBaseImage();
                    ccAttachments = [...mailAttachments, { filename: 'certificate.png', content: certPng, cid: 'certificate@elevateqa' }];
                    ccHtml = getCertificateEmailHtml(ccMessage, '', 'Team');
                } catch (err) {
                    console.error('[CUSTOM EMAIL] Certificate generation failed for CC/BCC copy', err.message);
                }
            }
            await transporter.sendMail({
                from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER, // Send to self
                cc: ccList,
                bcc: extraBccList,
                subject: `[CC/BCC Copy] ${subject}`,
                html: ccHtml,
                attachments: ccAttachments
            });
        }

        console.log(`[CUSTOM EMAIL] Blast sent. Success: ${successCount}, Failed: ${failCount}`);
        if (successCount === 0 && failCount > 0) {
            return { statusCode: 502, headers, body: JSON.stringify({ error: `All ${failCount} email(s) in this batch failed to send.`, details: lastError, successCount, failCount }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, successCount, failCount, message: `Blast sent. (${successCount} succeeded, ${failCount} failed)` }) };

    } catch (error) {
        console.error('[CUSTOM EMAIL Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send custom email.' }) };
    }
};
