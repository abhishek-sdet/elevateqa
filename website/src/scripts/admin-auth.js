// ─── LOCAL STATE FOR BACKEND OTP ───
let currentAuthEmail = '';

// 1. Send OTP via Node Backend
async function sendAdminOTP(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('login-number');
  const btn = document.getElementById('btn-send-otp');
  const msg = document.getElementById('login-email-msg');

  const email = emailInput.value.trim().toLowerCase();
  if (!email) return;

  btn.innerHTML = '<span class="spinner"></span> Verifying Access & Sending Code...';
  btn.disabled = true;

  try {
    const response = await fetch('/api/send-admin-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to send OTP');

    currentAuthEmail = email;
    btn.innerHTML = 'Code Sent! Check Email';
    if (msg) {
      msg.textContent = 'A secure login code has been sent to your email.';
      msg.classList.remove('error');
      msg.style.color = '#d4ff3a';
    }

    setTimeout(() => {
      document.getElementById('auth-step-1').style.display = 'none';
      document.getElementById('auth-step-2').style.display = 'block';
      const target = document.getElementById('otp-target-email');
      if (target) target.textContent = email;
    }, 1500);

  } catch (error) {
    console.error('[ElevateAuth] Error:', error.message);
    if (msg) {
      msg.textContent = error.message;
      msg.classList.add('error');
      msg.style.color = '#ff5a36';
    }
    btn.innerHTML = 'Try Again';
    btn.disabled = false;
  }
}

// 2. OTP Verification via Backend
async function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-input');
  const code = Array.from(inputs).map((i) => i.value).join('');

  if (code.length === 6 && currentAuthEmail) {
    const btn = document.getElementById('btn-verify-otp');
    btn.innerHTML = '<span class="spinner"></span> Verifying Identity...';
    btn.disabled = true;

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentAuthEmail, otp: code })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Invalid Code');

      console.log('[ElevateAuth] Successfully authenticated!');
      sessionStorage.setItem('admin_logged_in', 'true');
      sessionStorage.setItem('admin_email', currentAuthEmail);
      if (result.token) sessionStorage.setItem('admin_token', result.token);

      document.documentElement.classList.add('is-logged-in');
      document.documentElement.classList.remove('not-logged-in');

      const overlay = document.getElementById('login-overlay');
      if (overlay) overlay.style.display = 'none';

      if (window.forceDataSync) window.forceDataSync();

    } catch (error) {
      console.error('[ElevateAuth] Verify Error:', error.message);
      const errEl = document.getElementById('otp-error-msg');
      if (errEl) {
        errEl.textContent = error.message;
        errEl.style.display = 'block';
      }
      btn.innerHTML = 'Try Again';
      btn.disabled = false;
      inputs.forEach((i) => { i.value = ''; });
      inputs[0].focus();
    }
  }
}

// 3. Logout Function
async function handleLogout() {
  sessionStorage.removeItem('admin_logged_in');
  sessionStorage.removeItem('admin_email');
  sessionStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_role');
  window.location.reload();
}

// Initial session check
async function checkSession() {
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
  const overlay = document.getElementById('login-overlay');

  if (isLoggedIn) {
    document.documentElement.classList.add('is-logged-in');
    document.documentElement.classList.remove('not-logged-in');
    if (overlay) overlay.style.display = 'none';
  } else {
    document.documentElement.classList.add('not-logged-in');
    document.documentElement.classList.remove('is-logged-in');
    if (overlay) overlay.style.display = 'flex';
  }
}

// Export for global access
window.sendAdminOTP = sendAdminOTP;
window.verifyOTP = verifyOTP;
window.handleLogout = handleLogout;
window.checkSession = checkSession;

// 4. Input Helpers
window.moveFocus = (el) => {
  if (el.value.length >= 1) {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const nextIndex = inputs.indexOf(el) + 1;
    if (nextIndex < inputs.length) {
      inputs[nextIndex].focus();
    }
  }

  const code = Array.from(document.querySelectorAll('.otp-input')).map((i) => i.value).join('');
  if (code.length === 6) {
    verifyOTP();
  }
};

window.handleBackspace = (el, e) => {
  if (e.key === 'Backspace' && !el.value) {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const prevIndex = inputs.indexOf(el) - 1;
    if (prevIndex >= 0) {
      inputs[prevIndex].focus();
    }
  }
};

function moveFocus(el) { window.moveFocus(el); }
function handleBackspace(el, e) { window.handleBackspace(el, e); }
