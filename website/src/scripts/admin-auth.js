import { supabase } from './supabase-config.js';

// ─── LOCAL STATE FOR BACKEND OTP ───
let currentAuthEmail = '';

// 1. Send OTP via Node Backend after Whitelist Check
async function sendOTP(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('login-number');
  const btn = document.getElementById('btn-send-otp');
  const msg = document.getElementById('login-email-msg');
  
  const email = emailInput.value.trim().toLowerCase();
  if (!email) return;

  btn.innerHTML = '<span class="spinner"></span> Verifying Access...';
  btn.disabled = true;

  try {
    // 1a. CHECK WHITELIST FROM SUPABASE PUBLIC TABLE
    const { data, error: dbError } = await supabase.from('site_content').select('admin_whitelist').single();
    
    // Master admins fallback just in case
    const MASTER_ADMINS = ['abhishekjohri150@gmail.com', 'elevateqa@sdettech.com', 'abhishek.johri@sdettech.com', 'mugdha.shah@sdettech.com'];
    let whitelist = [];
    if (data && data.admin_whitelist && Array.isArray(data.admin_whitelist)) {
      whitelist = data.admin_whitelist;
    }
    whitelist = [...new Set([...whitelist, ...MASTER_ADMINS])].map(e => e.toLowerCase());

    if (!whitelist.includes(email)) {
      if (msg) { msg.textContent = 'Unauthorized. Your email is not in the Admin list.'; msg.classList.add('error'); msg.style.color = '#ff5a36'; }
      btn.innerHTML = 'Try Again';
      btn.disabled = false;
      return;
    }

    btn.innerHTML = '<span class="spinner"></span> Sending Secure Code...';
    
    // 1b. SEND OTP VIA BACKEND
    const isLocalHostOrNetwork = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
    const baseUrl = isLocalHostOrNetwork ? 'http://localhost:3000/api' : 'https://elevateqa.netlify.app/.netlify/functions';
    
    // Note: Use the admin-specific OTP function for admin portal
    const response = await fetch(`${baseUrl}/send-admin-otp`, {
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
    if (msg) { msg.textContent = error.message; msg.classList.add('error'); msg.style.color = '#ff5a36'; }
    btn.innerHTML = 'Try Again';
    btn.disabled = false;
  }
}

// 2. OTP Verification via Backend
async function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-input');
  const code = Array.from(inputs).map(i => i.value).join('');

  if (code.length === 6 && currentAuthEmail) {
    const btn = document.getElementById('btn-verify-otp');
    btn.innerHTML = '<span class="spinner"></span> Verifying Identity...';
    btn.disabled = true;

    try {
      const isLocalHostOrNetwork = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
      const baseUrl = isLocalHostOrNetwork ? 'http://localhost:3000/api' : 'https://elevateqa.netlify.app/.netlify/functions';
      
      const response = await fetch(`${baseUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentAuthEmail, otp: code })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Invalid Code');

      console.log('[ElevateAuth] Successfully authenticated!');
      sessionStorage.setItem('admin_logged_in', 'true');
      
      const overlay = document.getElementById('login-overlay');
      const main = document.getElementById('admin-main');
      if (overlay) overlay.style.display = 'none';
      if (main) main.classList.add('authorized');

    } catch (error) {
      console.error('[ElevateAuth] Verify Error:', error.message);
      const errEl = document.getElementById('otp-error-msg');
      if (errEl) {
        errEl.textContent = error.message;
        errEl.style.display = 'block';
      }
      btn.innerHTML = 'Try Again';
      btn.disabled = false;
      inputs.forEach(i => { i.value = ''; });
      inputs[0].focus();
    }
  }
}

// 3. Logout Function
async function handleLogout() {
  // If they somehow had a supabase session, sign out of it too
  await supabase.auth.signOut();
  sessionStorage.removeItem('admin_logged_in');
  window.location.reload();
}

// Initial session check
async function checkSession() {
  // We now rely solely on sessionStorage since anon has access to what we need
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
  const overlay = document.getElementById('login-overlay');
  const main = document.getElementById('admin-main');
  
  if (isLoggedIn) {
    if (overlay) overlay.style.display = 'none';
    if (main) main.classList.add('authorized');
  } else {
    if (overlay) overlay.style.display = 'flex';
    if (main) main.classList.remove('authorized');
  }
}

// Export for global access
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.handleLogout = handleLogout;
window.checkSession = checkSession;

// 4. Input Helpers (Robust index-based focus)
window.moveFocus = (el) => {
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

// Double-register just to be safe if HTML expects different scope
function moveFocus(el) { window.moveFocus(el); }
function handleBackspace(el, e) { window.handleBackspace(el, e); }

