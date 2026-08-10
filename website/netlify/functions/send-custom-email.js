import nodemailer from 'nodemailer';
import crypto from 'crypto';
import QRCode from 'qrcode';

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
        const { subject, message, targetEmails, ccEmails, bccEmails, attachments, includeQrForRecipients, templateType, certificateTitle, closingTitle, participationLine } = JSON.parse(event.body);
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

        // Names/free text come from admin-authored fields and attendee records,
        // not trusted HTML — escape before dropping them into the certificate
        // markup so a stray "<" in someone's name can't break the layout.
        const escapeHtml = (str) => String(str || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        // The certificate card — brand-green foil frame (never gold: this is
        // Elevate QA's signature #d4ff3a, not a generic "certificate" color),
        // the actual Elevate QA wordmark as the letterhead (a real <img>, not
        // a text monogram standing in for it), and laurel branches flanking
        // "CERTIFICATE" — the one motif that reads as "certificate" on sight.
        // A faint diagonal hairline texture + outer glow keep it from reading
        // as a flat HTML box. Factored out so the exact same markup can be
        // (a) embedded inline below the thank-you letter, and (b) shipped as
        // a standalone downloadable .html attachment (getCertificateStandaloneDoc
        // below) — one design, no risk of the two ever drifting apart.
        const getCertificateCardHtml = (name, certTitle, participation, signOff, certId) => {
            const titleWords = String(certTitle || 'CERTIFICATE OF PARTICIPATION').trim().split(/\s+/);
            const titleMain = titleWords[0] || 'CERTIFICATE';
            const titleSub = titleWords.slice(1).join(' ');
            // A short ornamental rule with a centered diamond — used both under
            // the heading and under the name — built from inline-block spans
            // (not flex/table) so it survives Outlook's limited CSS support.
            const ornamentRule = (width) => `
                <span style="display:inline-block; width:${width}px; height:1px; background:#8fae1a; vertical-align:middle;"></span>
                <span style="display:inline-block; margin:0 10px; color:#d4ff3a; font-size:10px; vertical-align:middle;">&#9670;</span>
                <span style="display:inline-block; width:${width}px; height:1px; background:#8fae1a; vertical-align:middle;"></span>
            `;
            // A stylised laurel branch — six leaves shrinking toward the tip —
            // mirrored via CSS transform for the opposite side, so only one
            // shape has to be hand-tuned. Purely decorative: if an email
            // client strips inline SVG the heading still reads fine without it.
            const laurelBranch = `<svg width="52" height="82" viewBox="0 0 52 82" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 80 C 20 58, 28 40, 44 6" stroke="#5f7d1a" stroke-width="2" fill="none" stroke-linecap="round"/>
                <ellipse cx="22" cy="70" rx="7.5" ry="3.4" transform="rotate(-25 22 70)" fill="#d4ff3a"/>
                <ellipse cx="20" cy="56" rx="7.5" ry="3.4" transform="rotate(-8 20 56)" fill="#8fae1a"/>
                <ellipse cx="25" cy="43" rx="7" ry="3.2" transform="rotate(-32 25 43)" fill="#d4ff3a"/>
                <ellipse cx="32" cy="30" rx="6.5" ry="3" transform="rotate(-15 32 30)" fill="#8fae1a"/>
                <ellipse cx="38" cy="18" rx="6" ry="2.8" transform="rotate(-36 38 18)" fill="#d4ff3a"/>
                <ellipse cx="43" cy="8" rx="5" ry="2.4" transform="rotate(-18 43 8)" fill="#8fae1a"/>
            </svg>`;
            return `
            <div style="background:#8fae1a; background: linear-gradient(135deg, #eaff80, #a8d600, #4d6b0f, #a8d600, #eaff80); padding: 3px; border-radius: 10px; box-shadow: 0 25px 70px rgba(212,255,58,0.14), 0 8px 24px rgba(0,0,0,0.6);">
                <div style="background:#0b0b0f; border-radius: 8px; padding: 2px; box-shadow: inset 0 0 0 1px rgba(212,255,58,0.35);">
                    <div style="border: 1px solid rgba(212,255,58,0.22); border-radius: 6px; padding: 50px 44px 44px 44px; text-align: center; position: relative; overflow: hidden; background: radial-gradient(ellipse at center, #14141b 0%, #0b0b0f 78%);">

                        <div style="position:absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(212,255,58,0.025) 0px, rgba(212,255,58,0.025) 1px, transparent 1px, transparent 13px); pointer-events:none;"></div>

                        <div style="position:absolute; top:14px; left:14px; width:16px; height:16px; border-top:2px solid #8fae1a; border-left:2px solid #8fae1a;"></div>
                        <div style="position:absolute; top:14px; right:14px; width:16px; height:16px; border-top:2px solid #8fae1a; border-right:2px solid #8fae1a;"></div>
                        <div style="position:absolute; bottom:14px; left:14px; width:16px; height:16px; border-bottom:2px solid #8fae1a; border-left:2px solid #8fae1a;"></div>
                        <div style="position:absolute; bottom:14px; right:14px; width:16px; height:16px; border-bottom:2px solid #8fae1a; border-right:2px solid #8fae1a;"></div>

                        <div style="position:relative;">
                            <img src="https://elevateqa.sdettech.com/logo.png" alt="Elevate QA" height="64" style="display:block; margin:0 auto 20px auto; border:0;" />

                            <div style="display:inline-block; padding:5px 18px; border:1px solid rgba(212,255,58,0.3); border-radius:100px; margin:0 0 30px 0;">
                                <p style="color:#d4ff3a; font-size:10px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; margin:0;">2026 Edition &middot; Crowne Plaza, New Delhi</p>
                            </div>

                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                <tr>
                                    <td style="padding:0 12px; vertical-align:middle;">${laurelBranch}</td>
                                    <td style="vertical-align:middle;">
                                        <p style="color:#f5f7ee; font-size:34px; font-weight:700; letter-spacing:3px; text-transform:uppercase; font-family: Georgia, 'Times New Roman', serif; margin:0; white-space:nowrap;">${escapeHtml(titleMain)}</p>
                                    </td>
                                    <td style="padding:0 12px; vertical-align:middle; transform:scaleX(-1);">${laurelBranch}</td>
                                </tr>
                            </table>
                            ${titleSub ? `<p style="color: #d4ff3a; font-size: 13px; font-weight: 700; letter-spacing: 6px; text-transform: uppercase; margin: 6px 0 28px 0;">${escapeHtml(titleSub)}</p>` : ''}

                            <div style="margin: 0 0 26px 0;">${ornamentRule(50)}</div>

                            <p style="color: #9a9aa4; font-size: 14px; font-style: italic; margin: 0 0 16px 0;">This is to certify that</p>
                            <p style="color: #ffffff; font-size: 36px; font-weight: 700; font-family: Georgia, 'Times New Roman', serif; margin: 0 0 16px 0;">
                                ${escapeHtml(name)}
                            </p>
                            <div style="margin: 0 0 32px 0;">${ornamentRule(30)}</div>

                            <p style="color: #b0b0ba; font-size: 14px; line-height: 1.75; max-width: 440px; margin: 0 auto 46px auto;">
                                ${withLineBreaks(escapeHtml(participation))}
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="50%" style="text-align: center;">
                                        <p style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 22px; color: #f5f7ee; margin: 0 0 8px 0;">${escapeHtml(signOff || 'Team Elevate QA')}</p>
                                        <div style="width: 150px; height: 1px; background: rgba(212,255,58,0.4); margin: 0 auto 8px auto;"></div>
                                        <p style="color: #d4ff3a; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Organizing Committee</p>
                                    </td>
                                    <td width="50%" style="text-align: center;">
                                        <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #f5f7ee; margin: 0 0 8px 0;">8 Aug 2026</p>
                                        <div style="width: 150px; height: 1px; background: rgba(212,255,58,0.4); margin: 0 auto 8px auto;"></div>
                                        <p style="color: #d4ff3a; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Crowne Plaza, New Delhi</p>
                                    </td>
                                </tr>
                            </table>
                            ${certId ? `<p style="color: #55555f; font-size: 10px; letter-spacing: 1px; margin: 34px 0 0 0;">CERTIFICATE ID: ${escapeHtml(certId)}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        };

        // A self-contained HTML document wrapping the same card — this is what
        // gets attached to the email so the attendee can download/save/print
        // the certificate independently of the message around it.
        const getCertificateStandaloneDoc = (name, certTitle, participation, signOff, certId) => `<!doctype html>
<html><head><meta charset="utf-8"><title>Certificate of Participation — ${escapeHtml(name)}</title></head>
<body style="margin:0;background:#0b0b10;">
<div style="background-color:#0b0b10;padding:40px 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;">
        ${getCertificateCardHtml(name, certTitle, participation, signOff, certId)}
    </div>
</div>
</body></html>`;

        // Letter (thank-you message) + certificate card in one email — the
        // certificate is deliberately its own gold-framed block below the
        // letter rather than folded into getHtml's plain "EVENT UPDATE" card.
        const getCertificateEmailHtml = (name, letterMessage, certTitle, participation, signOff, certId) => `
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

                        <div style="margin-bottom: 24px;">
                            ${getCertificateCardHtml(name, certTitle, participation, signOff, certId)}
                        </div>

                        <p style="color: #8e8e9a; font-size: 13px; text-align: center; margin: 0 0 24px 0;">
                            📎 Your certificate is also attached to this email as a downloadable file — save it for your records.
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
                const certDoc = getCertificateStandaloneDoc(name, certificateTitle, participationLine, closingTitle, certId);
                const safeName = String(name || 'Certificate').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'Certificate';
                recipientAttachments = [
                    ...mailAttachments,
                    { filename: `ElevateQA-2026-Certificate-${safeName}.html`, content: Buffer.from(certDoc, 'utf-8'), contentType: 'text/html' }
                ];
            }

            const mailOptions = {
                from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: subject,
                html: templateType === 'certificate'
                    ? getCertificateEmailHtml(name, finalMessage, certificateTitle, participationLine, closingTitle, certId)
                    : getHtml(finalMessage),
                attachments: recipientAttachments
            };
            try {
                await transporter.sendMail(mailOptions);
                successCount++;
            } catch (err) {
                console.error('[CUSTOM EMAIL] Failed to send to', email, err.message);
                failCount++;
            }
            await sleep(SEND_DELAY_MS);
        }

        // Send a single copy to CC and BCC if provided, so they aren't spammed
        if (ccList.length > 0 || extraBccList.length > 0) {
            const ccMessage = message
                .replace(/\{\{\s*first\s*name\s*\}\}|\[\s*first\s*name\s*\]/gi, 'Team')
                .replace(/\{\{\s*name\s*\}\}|\[\s*name\s*\]/gi, 'Team');
            await transporter.sendMail({
                from: `"Elevate QA 2026" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER, // Send to self
                cc: ccList,
                bcc: extraBccList,
                subject: `[CC/BCC Copy] ${subject}`,
                html: templateType === 'certificate'
                    ? getCertificateEmailHtml('Team', ccMessage, certificateTitle, participationLine, closingTitle, '')
                    : getHtml(ccMessage),
                attachments: mailAttachments
            });
        }

        console.log(`[CUSTOM EMAIL] Blast sent. Success: ${successCount}, Failed: ${failCount}`);
        if (successCount === 0 && failCount > 0) {
            return { statusCode: 502, headers, body: JSON.stringify({ error: `All ${failCount} email(s) in this batch failed to send.`, successCount, failCount }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, successCount, failCount, message: `Blast sent. (${successCount} succeeded, ${failCount} failed)` }) };

    } catch (error) {
        console.error('[CUSTOM EMAIL Error]', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send custom email.' }) };
    }
};
