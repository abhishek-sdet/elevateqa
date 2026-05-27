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
import { sendAttendeeEmail } from './email-service.js';
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
window.openChooser = (e) => {
  if (e) e.preventDefault();
  const chooser = document.getElementById('chooserModal');
  if (chooser) { chooser.classList.add('active'); document.body.style.overflow = 'hidden'; }
};

window.closeChooser = () => {
  const chooser = document.getElementById('chooserModal');
  if (chooser) { chooser.classList.remove('active'); document.body.style.overflow = ''; }
};

window.openAttendFlow = () => { closeChooser(); setTimeout(() => window.openModal(), 120); };

window.openSpeakFlow = () => {
  window.open('https://forms.office.com/r/eNjZMN831G', '_blank');
  closeChooser();
};

// ── MODAL HELPERS ─────────────────────────────────────────────────────────────
function resetModalViews() {
  ['price-view','form-view','ticket-view','otp-view'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('.otp-box').forEach(b => b.value = '');
  const otpErr = document.getElementById('otp-error');
  if (otpErr) otpErr.textContent = '';
}

window.openModal = (e) => {
  if (e) e.preventDefault();
  const modal = document.getElementById('regModal');
  if (!modal) return;
  resetModalViews();
  const regForm = modal.querySelector('.reg-form');
  if (regForm) regForm.reset();
  const priceView = document.getElementById('price-view');
  if (priceView) priceView.style.display = 'block';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeModal = () => {
  const modal = document.getElementById('regModal');
  if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; resetModalViews(); window.pendingRegistration = null; }
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
    const { data: existingUser } = await supabase.from('registrations').select('id').eq('email', email).limit(1);
    if (existingUser && existingUser.length > 0) {
      showToast('This email is already registered. Please use a different professional email.', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = originalBtnText; }
      return;
    }
  } catch(e) { console.warn('DB check failed or unavailable:', e); }
  try {
    const response = await fetch(`${BACKEND_URL}/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to send OTP');
    window.pendingRegistration = { type: 'attend', name, email, phone, org, designation, linkedin };
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
  if (window.pendingRegistration && window.pendingRegistration.email) {
    fetch(`${BACKEND_URL}/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: window.pendingRegistration.email }) })
      .then(res => res.json()).then(data => {
        if (data.success) showToast('A new code has been sent to your email.', 'success');
        else showToast('Failed to resend code: ' + data.error, 'error');
      }).catch(() => showToast('Error resending OTP. Please try again.', 'error'));
  }
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
  try {
    const response = await fetch(`${BACKEND_URL}/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: code }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Verification failed');
    
    // Attend flow
    let dbId = null, shortId = null;
    const { data, error } = await supabase.from('registrations').insert([{ name, email, phone, company: org, designation, linkedin, status: 'confirmed' }]).select();
    if (error) throw error;
    if (data && data.length > 0) { dbId = data[0].id; shortId = 'EQ26-' + dbId.split('-')[0].toUpperCase(); }
    document.getElementById('ticket-name').textContent = name;
    document.getElementById('ticket-org').textContent  = org;
    const idDisplay = document.getElementById('ticket-id-val') || document.getElementById('ticket-id-display');
    if (idDisplay) idDisplay.textContent = `PASS ID: ${shortId}`;
    const qrEl = document.getElementById('qrcode');
    if (qrEl) {
      qrEl.innerHTML = '';
      if (typeof QRCode !== 'undefined') new QRCode(qrEl, { text: `ELEVATE-QA:${dbId}|${name}|${org}`, width: 160, height: 160, colorDark: '#0b0b10', colorLight: '#ffffff' });
    }
    document.getElementById('otp-view').style.display    = 'none';
    document.getElementById('ticket-view').style.display = 'block';
    try {
      await sendAttendeeEmail({ name, email, company: org, ticketId: shortId, dbId, designation, linkedin });
      const statusWrap = document.getElementById('email-status-wrap');
      if (statusWrap) statusWrap.innerHTML = '<div class="email-status success">✓ Ticket sent to ' + escapeHtml(email) + '</div>';
    } catch(e) {
      console.error('Failed to send email:', e);
      const statusWrap = document.getElementById('email-status-wrap');
      if (statusWrap) statusWrap.innerHTML = '<div class="email-status error" style="color:var(--accent-red)">⚠ Error sending email</div>';
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
  const qrImg = document.querySelector('#qrcode img');
  if (qrImg) { const link = document.createElement('a'); link.href = qrImg.src; link.download = 'ElevateQA26-Pass.png'; link.click(); }
  else {
    const qrCanvas = document.querySelector('#qrcode canvas');
    if (qrCanvas) { const link = document.createElement('a'); link.href = qrCanvas.toDataURL(); link.download = 'ElevateQA26-Pass.png'; link.click(); }
  }
};

window.shareOnLinkedIn = function() {
  const url = encodeURIComponent('https://elevateqa.sdettech.com/');
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=600');
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
