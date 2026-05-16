/**
 * ELEVATE QA 2026 - ADMIN AUTH MODULE
 * Handles OTP login, sessions, lockout protection, and security overlays.
 */

// ─── CONFIG ────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;
const ATTEMPT_KEY = 'admin_otp_attempts';
const LOCKOUT_KEY = 'admin_otp_lockout_until';

// ─── UTILS ─────────────────────────────────────────────────────────────────
function getAttempts() {
  return parseInt(sessionStorage.getItem(ATTEMPT_KEY) || '0', 10);
}
function setAttempts(n) {
  sessionStorage.setItem(ATTEMPT_KEY, String(n));
}
function clearAttempts() {
  sessionStorage.removeItem(ATTEMPT_KEY);
  sessionStorage.removeItem(LOCKOUT_KEY);
}
function getLockoutRemaining() {
  const until = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
  if (!until) return 0;
  const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
  if (remaining === 0) sessionStorage.removeItem(LOCKOUT_KEY);
  return remaining;
}
function startLockout() {
  sessionStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_SECONDS * 1000));
}

function setOtpError(message) {
  const el = document.getElementById('otp-error-msg');
  if (el) {
    el.textContent = message || '';
    el.classList.toggle('error', !!message);
  }
  const inputs = document.querySelectorAll('.otp-input');
  inputs.forEach(i => i.setAttribute('aria-invalid', message ? 'true' : 'false'));
}

function updateLockoutDisplay() {
  const msg = document.getElementById('otp-lockout-msg');
  const btn = document.getElementById('btn-verify-otp');
  const inputs = document.querySelectorAll('.otp-input');
  const remaining = getLockoutRemaining();

  if (remaining > 0) {
    if (msg) {
      msg.style.display = 'block';
      msg.textContent = `Too many invalid attempts. Try again in ${remaining}s.`;
      msg.classList.add('error');
    }
    inputs.forEach(i => { i.disabled = true; });
    if (btn) btn.disabled = true;
    setTimeout(updateLockoutDisplay, 1000);
  } else {
    if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
    inputs.forEach(i => { i.disabled = false; });
    if (btn) btn.disabled = false;
  }
}

// 1. Session Security
function checkSession() {
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'none';
    const main = document.getElementById('admin-main');
    if (main) main.classList.add('authorized');
  }
  // Resume lockout state if active
  if (getLockoutRemaining() > 0) updateLockoutDisplay();
}

let currentOTP = null;

// 2. OTP Delivery
function sendOTP(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('login-number');
  if (!emailInput) return;

  // Honeypot check
  const honeypot = document.getElementById('login-website');
  if (honeypot && honeypot.value) {
    console.warn('[ElevateQA] Bot detected via honeypot.');
    return;
  }

  const email = emailInput.value.trim();
  const btn = document.getElementById('btn-send-otp');
  const msg = document.getElementById('login-email-msg');

  if (!email) {
    emailInput.setAttribute('aria-invalid', 'true');
    if (msg) { msg.textContent = 'Please enter your email.'; msg.classList.add('error'); }
    emailInput.focus();
    return;
  }
  emailInput.setAttribute('aria-invalid', 'false');
  if (msg) { msg.textContent = ''; msg.classList.remove('error'); }

  // Generate random 6-digit code
  currentOTP = Math.floor(100000 + Math.random() * 900000).toString();

  btn.innerHTML = '<span class="spinner"></span> Sending Secure Code...';
  btn.disabled = true;

  // console.log(`[ElevateQA] SECURE AUTH: Code for ${email} is ${currentOTP}`);

  if (window.emailjs) {
    // window.emailjs.send("service_id", "otp_template", { to_email: email, otp_code: currentOTP });
  }

  setTimeout(() => {
    document.getElementById('auth-step-1').style.display = 'none';
    document.getElementById('auth-step-2').style.display = 'block';
    const target = document.getElementById('otp-target-email');
    if (target) target.textContent = email;

    const firstInput = document.querySelector('.otp-input');
    if (firstInput) firstInput.focus();
    btn.innerHTML = 'Send Access Code';
    btn.disabled = false;

    // Resume lockout indicator if any
    updateLockoutDisplay();
  }, 1500);
}

// 3. OTP Verification
function verifyOTP() {
  // Block if locked out
  if (getLockoutRemaining() > 0) {
    updateLockoutDisplay();
    return;
  }

  const inputs = document.querySelectorAll('.otp-input');
  const code = Array.from(inputs).map(i => i.value).join('');

  if (code.length === 6) {
    if (code === currentOTP) {
      clearAttempts();
      setOtpError('');
      sessionStorage.setItem('admin_logged_in', 'true');
      const overlay = document.getElementById('login-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          const main = document.getElementById('admin-main');
          if (main) main.classList.add('authorized');
          if (typeof showSavedToast === 'function') showSavedToast('Securely Authenticated');
        }, 500);
      }
    } else {
      const attempts = getAttempts() + 1;
      setAttempts(attempts);
      const remainingTries = MAX_ATTEMPTS - attempts;
      inputs.forEach(i => { i.value = ''; });

      if (attempts >= MAX_ATTEMPTS) {
        startLockout();
        setOtpError('');
        updateLockoutDisplay();
      } else {
        setOtpError(`Invalid code. ${remainingTries} attempt${remainingTries === 1 ? '' : 's'} remaining.`);
        // Focus first input after error message renders
        setTimeout(() => { inputs[0] && inputs[0].focus(); }, 50);
      }
    }
  }
}

// 4. Input Helpers (Robust index-based focus)
function moveFocus(el) {
  if (el.value.length >= 1) {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const nextIndex = inputs.indexOf(el) + 1;
    if (nextIndex < inputs.length) {
      inputs[nextIndex].focus();
    }
  }
  
  // Auto-verify if all filled
  const code = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
  if (code.length === 6) {
    verifyOTP();
  }
}

function handleBackspace(el, e) {
  if (e.key === 'Backspace' && !el.value) {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const prevIndex = inputs.indexOf(el) - 1;
    if (prevIndex >= 0) {
      inputs[prevIndex].focus();
    }
  }
}
