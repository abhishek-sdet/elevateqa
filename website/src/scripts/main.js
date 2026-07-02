/**
 * ELEVATE QA 2026 — MAIN ENTRY POINT
 * =====================================
 * This file is now a lean orchestrator. Business logic has been extracted to:
 *   - main-animations.js  → MagneticElement, startCountUp, initAnimations, initCursor
 *   - main-sync-ui.js     → syncEverything() — maps LocalStorage data to DOM
 *   - main-sync.js        → initCloudSync() — Supabase real-time connector
 *   - main-ui.js          → initNav(), DEFAULT_* constants
 */
import { initCloudSync } from './main-sync.js';
import { supabase } from './supabase-config.js';
import { sendAttendeeEmail, sendSpeakerEmail } from './email-service.js';
import { DEFAULT_MATURITY, DEFAULT_PILLARS, DEFAULT_AGENDA, DEFAULT_SPEAKERS, initNav } from './main-ui.js';
import { initAnimations, initCursor } from './main-animations.js';
import './main-sync-ui.js'; // registers window.syncEverything

// ── UTIL: HTML ESCAPE ────────────────────────────────────────────────────────
window.escapeHtml = window.escapeHtml || function(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

// ── CHOOSER FLOW ──────────────────────────────────────────────────────────────
function toggleFloatingCta(show) {
  const cta = document.querySelector('.floating-cta');
  if (cta) {
    if (show) {
      cta.style.opacity = '';
      cta.style.pointerEvents = '';
      cta.style.visibility = '';
    } else {
      cta.style.opacity = '0';
      cta.style.pointerEvents = 'none';
      cta.style.visibility = 'hidden';
    }
  }
}

window.openChooser = (e) => {
  if (e) e.preventDefault();
  const chooser = document.getElementById('chooserModal');
  if (chooser) { 
    chooser.classList.add('active'); 
    document.body.style.overflow = 'hidden'; 
    toggleFloatingCta(false);
  }
};

window.closeChooser = () => {
  const chooser = document.getElementById('chooserModal');
  if (chooser) { 
    chooser.classList.remove('active'); 
    document.body.style.overflow = ''; 
    toggleFloatingCta(true);
  }
};

window.openAttendFlow = () => { closeChooser(); setTimeout(() => window.openModal(), 120); };

window.openSpeakFlow = () => {
  closeChooser();
  setTimeout(() => window.openModal(null, 'speak'), 120);
};

// ── MODAL HELPERS ─────────────────────────────────────────────────────────────
function resetModalViews() {
  ['price-view','form-view','ticket-view','otp-view','speaker-form-view','speaker-success-view','attendee-success-view','processing-view'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('.otp-box').forEach(b => b.value = '');
  const otpErr = document.getElementById('otp-error');
  if (otpErr) otpErr.textContent = '';
}

window.openModal = (e, flowType = 'attend') => {
  if (e) e.preventDefault();
  const modal = document.getElementById('regModal');
  if (!modal) return;
  resetModalViews();
  const regForm = modal.querySelector('.reg-form');
  if (regForm) regForm.reset();
  
  if (flowType === 'attend') {
    const priceView = document.getElementById('price-view');
    if (priceView) priceView.style.display = 'block';
  } else if (flowType === 'speak') {
    const speakerView = document.getElementById('speaker-form-view');
    if (speakerView) speakerView.style.display = 'block';
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  toggleFloatingCta(false);
};

window.closeModal = () => {
  const modal = document.getElementById('regModal');
  if (modal) { 
    modal.classList.remove('active'); 
    document.body.style.overflow = ''; 
    resetModalViews(); 
    window.pendingRegistration = null; 
    toggleFloatingCta(true);
  }
};

window.proceedToForm = function() {
  const priceView = document.getElementById('price-view');
  const formView  = document.getElementById('form-view');
  if (priceView) priceView.style.display = 'none';
  if (formView)  formView.style.display  = 'block';
};

// ── TOAST ─────────────────────────────────────────────────────────────────────
window.showToast = function(message, type = 'error') {
  const existing = document.getElementById('eq-toast');
  if (existing) existing.remove();
  const icons  = { error: '⚠', success: '✓', info: '🔔' };
  const colors = {
    error:   { bg: '#1a0a08', border: '#ff5a36', glow: 'rgba(255,90,54,0.25)' },
    success: { bg: '#0a1208', border: '#d4ff3a', glow: 'rgba(212,255,58,0.2)' },
    info:    { bg: '#080d1a', border: '#5b8aff', glow: 'rgba(91,138,255,0.2)'  },
  };
  const c = colors[type] || colors.error;
  const toast = document.createElement('div');
  toast.id = 'eq-toast';
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;">
      <div style="width:36px;height:36px;border-radius:50%;background:${c.glow};border:1.5px solid ${c.border};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${icons[type] || icons.error}</div>
      <div style="flex:1;font-size:13.5px;line-height:1.55;color:#e8e8f0;font-family:'Manrope',sans-serif;">${message}</div>
      <button onclick="document.getElementById('eq-toast').remove()" style="background:none;border:none;cursor:pointer;padding:4px;color:#555570;font-size:18px;line-height:1;flex-shrink:0;" onmouseover="this.style.color='#aaa'" onmouseout="this.style.color='#555570'">✕</button>
    </div>
  `;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '28px', left: '50%',
    transform: 'translateX(-50%) translateY(20px)', zIndex: '99999',
    background: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.border}`,
    borderRadius: '10px', padding: '16px 20px',
    minWidth: '320px', maxWidth: 'min(480px, calc(100vw - 40px))',
    boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 24px ${c.glow}`,
    opacity: '0', transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', pointerEvents: 'all',
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; }));
  const timer = setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(10px)'; setTimeout(() => toast.remove(), 300); }, 5000);
  toast.querySelector('button').addEventListener('click', () => clearTimeout(timer));
};

// ── OTP & REGISTRATION ────────────────────────────────────────────────────────
window.pendingRegistration = null;
const BACKEND_URL = 'https://elevateqa.netlify.app/.netlify/functions';

window.generateTicket = async function(event) {
  if (event) event.preventDefault();
  const name        = document.getElementById('reg-name').value;
  const email       = document.getElementById('reg-email').value;
  const org         = document.getElementById('reg-org').value;
  const designation = document.getElementById('reg-designation').value;
  let linkedin      = document.getElementById('reg-linkedin').value.trim();
  if (linkedin && !/^https?:\/\//i.test(linkedin)) {
    linkedin = 'https://' + linkedin;
  }
  const phone       = document.getElementById('reg-phone')?.value || '';
  const btn = document.querySelector('#form-view button[type="submit"]');
  const originalBtnText = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Sending OTP...'; }
  try {
    const { count, error } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
    const limit = window.maxAttendeeLimit || 250;
    if (count !== null && count >= limit) {
      window.isWaitlisted = true;
    } else {
      window.isWaitlisted = false;
    }
  } catch(e) { console.warn('Registration limit check failed:', e); window.isWaitlisted = false; }

  try {
    const { data: existingUser } = await supabase.from('registrations').select('id').eq('email', email).limit(1);
    if (existingUser && existingUser.length > 0) {
      showToast('This email is already registered. Please use a different professional email.', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = originalBtnText; }
      return;
    }
  } catch(e) { console.warn('DB check failed or unavailable:', e); }
  try {
    const isLocalHostOrNetwork = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
    const baseUrl = isLocalHostOrNetwork ? '/.netlify/functions' : (typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'https://elevateqa.netlify.app/.netlify/functions');
    const response = await fetch(`${baseUrl}/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to send OTP');
    window.pendingRegistration = { type: 'attend', name, email, phone, org, designation, linkedin };
    window.lastSentEmail = email; // Store it as a bulletproof global fallback
    document.getElementById('form-view').style.display = 'none';
    const otpView = document.getElementById('otp-view');
    if (otpView) { otpView.querySelectorAll('.otp-box').forEach(b => b.value = ''); document.getElementById('otp-error').textContent = ''; otpView.style.display = 'flex'; }
    const targetEmail = document.getElementById('otp-target-email');
    if (targetEmail) targetEmail.textContent = email;
    window.initOTPInputs();
  } catch (error) {
    console.error('OTP Send Error:', error);
    showToast(error.message || 'Failed to send OTP. Please try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = originalBtnText; }
  }
};

window.resendOTP = function() {
  const email = (window.pendingRegistration && window.pendingRegistration.email) || 
                window.lastSentEmail || 
                (document.getElementById('reg-email') ? document.getElementById('reg-email').value.trim() : '');
                
  if (!email) {
    if (window.showToast) window.showToast('Email address not found. Please re-enter your details.', 'error');
    return;
  }
  
  const btn = document.getElementById('otp-resend-btn');
  const originalText = btn ? btn.innerHTML : 'Resend Code';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Sending...';
  }
  
  const isSpeaker = window.pendingRegistration && window.pendingRegistration.type === 'speaker';
  const endpoint = '/send-otp'; // using same for both
  const isLocalHostOrNetwork = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
  const baseUrl = isLocalHostOrNetwork ? '/.netlify/functions' : (typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'https://elevateqa.netlify.app/.netlify/functions');
  
  fetch(`${baseUrl}${endpoint}`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ email }) 
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => { throw new Error(err.error || 'Failed to resend code') });
    }
    return res.json();
  })
  .then(data => {
    if (window.showToast) window.showToast('A new verification code has been sent to your email.', 'success');
  })
  .catch((err) => {
    console.error('Resend OTP failure:', err);
    if (window.showToast) window.showToast(err.message || 'Error resending verification code. Please try again.', 'error');
  })
  .finally(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
};

window.initOTPInputs = function() {
  const boxes = Array.from(document.querySelectorAll('.otp-box'));
  if (!boxes.length) return;
  boxes.forEach((box, i) => { const fresh = box.cloneNode(true); box.parentNode.replaceChild(fresh, box); boxes[i] = fresh; });
  boxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
      box.value = box.value.replace(/\D/g, '').slice(-1);
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') { if (!box.value && i > 0) { boxes[i-1].value = ''; boxes[i-1].focus(); } }
      else if (e.key === 'ArrowLeft'  && i > 0)              boxes[i-1].focus();
      else if (e.key === 'ArrowRight' && i < boxes.length-1) boxes[i+1].focus();
      else if (e.key === 'Enter') window.verifyOTP();
    });
    box.addEventListener('focus', () => box.select());
  });
  boxes[0].addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((ch, idx) => { if (boxes[idx]) boxes[idx].value = ch; });
    boxes[Math.min(pasted.length, boxes.length-1)].focus();
  });
  setTimeout(() => boxes[0].focus(), 100);
};

window.verifyOTP = async function() {
  const inputs = Array.from(document.querySelectorAll('.otp-box'));
  const code   = inputs.map(i => i.value).join('');
  if (code.length < 6) { document.getElementById('otp-error').textContent = 'Please enter the full 6-digit code.'; return; }
  const btn = document.getElementById('otp-verify-btn');
  const originalText = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Verifying...';
  document.getElementById('otp-error').textContent = '';
  const { type, email, name, phone, org, designation, linkedin, topic, bio } = window.pendingRegistration;
  const isLocalHostOrNetwork = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
  const baseUrl = isLocalHostOrNetwork ? '/.netlify/functions' : (typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'https://elevateqa.netlify.app/.netlify/functions');
  
  try {
    const response = await fetch(`${baseUrl}/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: code }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Verification failed');
    
    if (type === 'speaker') {
      // Speaker flow
      const speakerData = { ...window.pendingRegistration, organization: org };
      
      // Save to localStorage for admin panel
      const apps = JSON.parse(localStorage.getItem('elevate_speaker_apps') || '[]');
      apps.push(speakerData);
      localStorage.setItem('elevate_speaker_apps', JSON.stringify(apps));

      // Save to Supabase speaker_applications table
      try {
        await supabase.from('speaker_applications').insert([{
          name: speakerData.name,
          email: speakerData.email,
          phone: speakerData.phone,
          company: speakerData.org || speakerData.organization,
          designation: speakerData.designation,
          topic: speakerData.topic,
          bio: speakerData.bio,
          linkedin: speakerData.linkedin,
          status: 'pending'
        }]);
      } catch (dbErr) {
        console.error('Failed to sync speaker application to Supabase:', dbErr);
      }

      document.getElementById('otp-view').style.display = 'none';
      const processingView = document.getElementById('processing-view');
      if (processingView) processingView.style.display = 'block';
      
      try {
        await sendSpeakerEmail(speakerData);
        if (processingView) processingView.style.display = 'none';
        document.getElementById('speaker-success-email').textContent = email;
        document.getElementById('speaker-success-view').style.display = 'block';
        
        // Reset form for next time
        const form = document.getElementById('speakerRegistrationForm');
        if (form) form.reset();
      } catch(e) {
        if (processingView) processingView.style.display = 'none';
        console.error('Failed to send speaker email:', e);
        if (window.showToast) window.showToast('Error sending confirmation email, but your application is received.', 'error');
        document.getElementById('speaker-success-email').textContent = email;
        document.getElementById('speaker-success-view').style.display = 'block';
      }
    } else {
      // Attendee flow
      let dbId = null, shortId = null;
      const { data, error } = await supabase.from('registrations').insert([{ name, email, phone, company: org, designation, linkedin, status: 'pending' }]).select();
      if (error) throw error;
      if (data && data.length > 0) { dbId = data[0].id; shortId = 'EQ26-' + String(dbId).split('-')[0].toUpperCase(); }
      
      const otpViewEl = document.getElementById('otp-view');
      if (otpViewEl) otpViewEl.style.display = 'none';
      const processingView = document.getElementById('processing-view');
      if (processingView) processingView.style.display = 'block';
      
      try {
        await sendAttendeeEmail({ name, email, company: org, ticketId: shortId, dbId, designation, linkedin });
        if (processingView) processingView.style.display = 'none';
        const emailEl = document.getElementById('attendee-success-email');
        if (emailEl) emailEl.textContent = email;
        const successDesc = document.getElementById('attendee-success-desc');
        if (successDesc) {
            if (window.isWaitlisted) {
                successDesc.innerHTML = `Thank you for showing your interest. We have reached full capacity for this year's summit, but we have received your details. Our team will contact you if any seats open up.`;
            } else {
                successDesc.innerHTML = `Thank you for showing your interest in attending the <strong style="color: #fff;">Elevate QA Tech Summit</strong>. We have received your details. Our team will confirm your participation 2 weeks prior to the event.`;
            }
        }
        const successView = document.getElementById('attendee-success-view');
        if (successView) {
            successView.style.display = 'block';
        } else {
            if (window.showToast) window.showToast('Registration successful! Check your email for details.', 'success');
            setTimeout(() => closeModal(), 2000);
        }
      } catch(e) {
        if (processingView) processingView.style.display = 'none';
        console.error('Failed to send email:', e);
        if (window.showToast) window.showToast('Registration received, but error sending email.', 'error');
        const emailEl = document.getElementById('attendee-success-email');
        if (emailEl) emailEl.textContent = email;
        const successView = document.getElementById('attendee-success-view');
        if (successView) {
            successView.style.display = 'block';
        } else {
            setTimeout(() => closeModal(), 2000);
        }
      }
    }
  } catch (error) {
    console.error('OTP Verification Error:', error);
    const otpErrEl = document.getElementById('otp-error');
    const msg = error.message || '';
    if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('no otp') || msg.toLowerCase().includes('not found')) {
      if (otpErrEl) otpErrEl.textContent = 'Code expired — click "Resend Code" to get a new one.';
      const resendBtn = document.getElementById('otp-resend-btn');
      if (resendBtn) { resendBtn.style.color = '#ff5a36'; resendBtn.style.fontWeight = '700'; setTimeout(() => { resendBtn.style.color = ''; resendBtn.style.fontWeight = ''; }, 3000); }
    } else {
      if (otpErrEl) otpErrEl.textContent = 'Incorrect code. Please check and try again.';
    }
    const otpInputs = document.getElementById('otp-inputs');
    if (otpInputs) { otpInputs.style.animation = 'none'; otpInputs.offsetHeight; otpInputs.style.animation = 'otpShake 0.4s ease'; }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  }
};

window.downloadPremiumTicket = function() {
  const badgeEl = document.querySelector('.ticket-box');
  if (!badgeEl) {
    if (window.showToast) window.showToast('Badge card element not found!', 'error');
    return;
  }
  
  const btn = document.getElementById('btn-download-ticket');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="email-spinner"></span> Creating Badge...';
  }
  
  // Temporarily strip dashed print border for a completely clean downloaded PNG
  const originalBorder = badgeEl.style.border;
  badgeEl.style.border = 'none';
  
  html2canvas(badgeEl, {
    scale: 3, // High resolution for perfect print crispness
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false
  }).then(canvas => {
    badgeEl.style.border = originalBorder;
    
    const name = window.pendingRegistration?.name || 'Attendee';
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const link = document.createElement('a');
    link.download = `ElevateQA2026-Badge-${cleanName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    if (window.showToast) window.showToast('Attendee Badge downloaded successfully!', 'success');
  }).catch(err => {
    badgeEl.style.border = originalBorder;
    console.error('Badge generation failure:', err);
    if (window.showToast) window.showToast('Failed to build image, downloading QR code instead.', 'error');
    
    // Fallback: download QR image only
    const qrImg = document.querySelector('#qrcode img');
    if (qrImg) {
      const link = document.createElement('a');
      link.href = qrImg.src;
      link.download = 'ElevateQA26-Pass-QR.png';
      link.click();
    } else {
      const qrCanvas = document.querySelector('#qrcode canvas');
      if (qrCanvas) {
        const link = document.createElement('a');
        link.href = qrCanvas.toDataURL();
        link.download = 'ElevateQA26-Pass-QR.png';
        link.click();
      }
    }
  }).finally(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
};

window.shareOnLinkedIn = function() {
  const nameVal = document.getElementById('ticket-name')?.textContent || '';
  const name = nameVal && nameVal !== '…' ? nameVal : (window.pendingRegistration?.name || '');
  
  const greeting = name ? `I am extremely excited to be a part of Elevate QA 2026! 🚀` : `I am excited to be a part of Elevate QA 2026! 🚀`;
  const shareText = `${greeting}\n\nLooking forward to joining 300+ Quality Engineering leaders this August at Crowne Plaza, Mayur Vihar, New Delhi for a day of real signal, deep insights on AI-led Quality Engineering, and the Proof of Value.\n\nIf you are a QE leader or practitioner, you should definitely claim your free spot before they sell out! 🎟️\n\nRegister here: https://elevateqa.sdettech.com/\n\n#ElevateQA2026 #QualityEngineering #SoftwareTesting #SDET #AIinQA #TechSummit #Leadership`;
  
  const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
  window.open(shareUrl, '_blank', 'width=800,height=600');
};

window.copyLink = function(e) {
  if (e) e.preventDefault();
  const btn = document.getElementById('copyLink') || (e ? e.currentTarget : null);
  const url = window.location.href;
  const applyFeedback = () => {
    if (btn) { 
      // If it's the card itself, let's target the inner link or the card itself
      const textEl = btn.id === 'copy-link-btn' || btn.id === 'copyLink' ? btn : (btn.querySelector('.link') || btn);
      const orig = textEl.textContent; 
      textEl.textContent = 'Copied! ✓'; 
      textEl.style.color = '#b8ff57'; 
      setTimeout(() => { textEl.textContent = orig; textEl.style.color = ''; }, 2500); 
    }
    if (window.showToast) {
      window.showToast('Event invite link copied to clipboard!', 'success');
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(applyFeedback).catch(() => {
      fallbackCopyTextToClipboard(url, applyFeedback);
    });
  } else {
    fallbackCopyTextToClipboard(url, applyFeedback);
  }
  
  function fallbackCopyTextToClipboard(text, cb) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    cb();
  }
};

// ── SPEAKER REGISTRATION LOGIC ────────────────────────────────────────────────
// ── SPEAKER REGISTRATION LOGIC ────────────────────────────────────────────────

window.toggleSpeakerTeam = function(radio) {
  const teamGroup = document.getElementById('speaker-team-group');
  const teamInput = document.getElementById('speaker-team');
  const topicLabel = document.getElementById('speaker-topic-label');
  const driveLabel = document.getElementById('speaker-drive-label');
  const specialLabel = document.getElementById('speaker-special-label');
  
  if (radio.value === 'Team') {
    teamGroup.style.display = 'block';
    teamInput.required = true;
    topicLabel.innerHTML = '10. Topic <span style="color:#ff4d4f">*</span>';
    driveLabel.innerHTML = '11. Share the drive link with uploaded files <span style="font-weight:normal; color:var(--ink-dim); font-size:12px;">(Provide access to <a href="mailto:elevateqa@sdettech.com" style="color:var(--accent);">elevateqa@sdettech.com</a>)</span> <span style="color:#ff4d4f">*</span>';
    specialLabel.innerHTML = '12. Any Special Requirements (AV, demo setup, etc.)';
  } else {
    teamGroup.style.display = 'none';
    teamInput.required = false;
    teamInput.value = '';
    topicLabel.innerHTML = '9. Topic <span style="color:#ff4d4f">*</span>';
    driveLabel.innerHTML = '10. Share the drive link with uploaded files <span style="font-weight:normal; color:var(--ink-dim); font-size:12px;">(Provide access to <a href="mailto:elevateqa@sdettech.com" style="color:var(--accent);">elevateqa@sdettech.com</a>)</span> <span style="color:#ff4d4f">*</span>';
    specialLabel.innerHTML = '11. Any Special Requirements (AV, demo setup, etc.)';
  }
};

window.submitSpeakerForm = async function(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('speaker-submit-btn');
  const emailInput = document.getElementById('speaker-email');
  const email = emailInput.value.trim();
  
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Sending OTP...';
  btn.disabled = true;

  const existingApps = JSON.parse(localStorage.getItem('elevate_speaker_apps') || '[]');
  if (existingApps.some(app => app.email.toLowerCase() === email.toLowerCase())) {
    if (window.showToast) {
      window.showToast('This email is already registered for speaker application.', 'error');
    } else {
      alert('This email is already registered for speaker application.');
    }
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  try {
    const speakerData = {
      type: 'speaker',
      name: document.getElementById('speaker-name').value,
      email: email,
      org: document.getElementById('speaker-org').value,
      designation: document.getElementById('speaker-designation').value,
      linkedin: document.getElementById('speaker-linkedin').value,
      topic: document.getElementById('speaker-topic').value,
      bio: document.getElementById('speaker-bio').value,
      phone: document.getElementById('speaker-mobile').value,
      applicantInfo: document.querySelector('input[name="applicantInfo"]:checked')?.value || 'Individual',
      teamDetails: document.getElementById('speaker-team').value,
      driveLink: document.getElementById('speaker-drive').value,
      specialReq: document.getElementById('speaker-special').value,
      date: new Date().toLocaleDateString()
    };

    window.pendingRegistration = speakerData;

    // Send OTP request
    const isLocalHostOrNetwork = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
    const baseUrl = isLocalHostOrNetwork ? '/.netlify/functions' : (typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'https://elevateqa.netlify.app/.netlify/functions');
    
    const response = await fetch(`${baseUrl}/send-otp`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email }) 
    });
    
    let result;
    try {
      result = await response.json();
    } catch (e) {
      if (!response.ok) throw new Error(`Server returned status ${response.status}`);
      throw e;
    }
    
    if (!response.ok) throw new Error(result.error || 'Failed to send OTP');

    // Transition to OTP view
    document.getElementById('speaker-form-view').style.display = 'none';
    const otpView = document.getElementById('otp-view');
    otpView.style.display = 'block';
    
    // Call UI setup for OTP
    if (window.initOTPInputs) window.initOTPInputs();
    
    let timeLeft = 600;
    const timerEl = document.getElementById('otp-timer');
    const resendBtn = document.getElementById('otp-resend-btn');
    if (resendBtn) resendBtn.disabled = true;
    
    if (window.otpInterval) clearInterval(window.otpInterval);
    window.otpInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(window.otpInterval);
        if (timerEl) timerEl.textContent = '';
        if (resendBtn) resendBtn.disabled = false;
      } else {
        const m = Math.floor(timeLeft / 60);
        const s = (timeLeft % 60).toString().padStart(2, '0');
        if (timerEl) timerEl.textContent = `(${m}:${s})`;
      }
    }, 1000);
    
  } catch (err) {
    console.error("Submission error:", err);
    if (window.showToast) window.showToast(err.message || 'Error initiating verification. Please try again.', 'error');
    else alert('An error occurred. Please try again.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};

// ── IMAGE CAROUSEL ─────────────────────────────────────────────────────────────
(function initCarousel() {
  const carousel = document.querySelector('.img-carousel');
  if (!carousel) return;
  const track   = document.getElementById('carousel-track');
  const slides  = carousel.querySelectorAll('.img-carousel-slide');
  const dots    = document.querySelectorAll('.carousel-dot');
  const btnPrev = document.getElementById('carousel-prev');
  const btnNext = document.getElementById('carousel-next');
  let current   = 0, autoTimer = null;
  const total   = slides.length;

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }
  function startAuto() { clearInterval(autoTimer); autoTimer = setInterval(next, 4500); }
  function stopAuto()  { clearInterval(autoTimer); }

  if (btnNext) btnNext.addEventListener('click', () => { next(); startAuto(); });
  if (btnPrev) btnPrev.addEventListener('click', () => { prev(); startAuto(); });
  dots.forEach(dot => dot.addEventListener('click', () => { goTo(+dot.dataset.index); startAuto(); }));
  carousel.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { prev(); startAuto(); } if (e.key === 'ArrowRight') { next(); startAuto(); } });
  let touchStartX = 0;
  carousel.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend',   e => { const diff = touchStartX - e.changedTouches[0].clientX; if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); startAuto(); } }, { passive: true });
  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  goTo(0); startAuto();
})();

// ── APP STARTUP ───────────────────────────────────────────────────────────────
const startApp = () => {
  initAnimations();
  initCursor();
  initNav();

  const dismissPreloader = () => {
    const preloader = document.getElementById('page-preloader');
    if (preloader && !preloader.classList.contains('fade-out')) {
      preloader.classList.add('fade-out');
      setTimeout(() => preloader.remove(), 800);
    }
  };

  if (typeof window.syncEverything === 'function') window.syncEverything();
  if (localStorage.getItem('elevate_site_content')) dismissPreloader();

  initCloudSync().then(() => dismissPreloader()).catch(() => dismissPreloader());

  let syncTimeout;
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('elevate_')) {
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => window.syncEverything(), 100);
    }
  });

  setTimeout(dismissPreloader, 5000);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
