import { supabase } from './supabase-config.js';
import './admin-auth.js'; // Initialize Official Security Guard

// ─── AUTH STATE OBSERVER ───────────────────────────────────────────────────
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[ElevateAuth] State Change: ${event}`);
  const overlay = document.getElementById('login-overlay');
  const main = document.getElementById('admin-main');

  if (session) {
    if (overlay) overlay.style.display = 'none';
    if (main) main.classList.add('authorized');
    // Save minimal info for persistence if needed
    sessionStorage.setItem('admin_logged_in', 'true');
  } else {
    if (overlay) overlay.style.display = 'flex';
    if (main) main.classList.remove('authorized');
    sessionStorage.removeItem('admin_logged_in');
  }
});

// 1. Send Official OTP / Magic Link
async function sendOTP(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('login-number');
  const btn = document.getElementById('btn-send-otp');
  const msg = document.getElementById('login-email-msg');
  
  const email = emailInput.value.trim();
  if (!email) return;

  btn.innerHTML = '<span class="spinner"></span> Sending Secure Link...';
  btn.disabled = true;

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: window.location.origin + '/admin.html',
    }
  });

  if (error) {
    console.error('[ElevateAuth] Error:', error.message);
    if (msg) { msg.textContent = error.message; msg.classList.add('error'); }
    btn.innerHTML = 'Try Again';
    btn.disabled = false;
  } else {
    btn.innerHTML = 'Link Sent! Check Email';
    if (msg) { 
      msg.textContent = 'A secure login link has been sent to your email.'; 
      msg.classList.remove('error');
      msg.style.color = '#d4ff3a';
    }
    // Step 2 is not needed for magic link, but we keep it for UX feedback
    setTimeout(() => {
      document.getElementById('auth-step-1').style.display = 'none';
      document.getElementById('auth-step-2').style.display = 'block';
      const target = document.getElementById('otp-target-email');
      if (target) target.textContent = email;
    }, 2000);
  }
}

// 2. OTP Verification (Official Supabase)
async function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-input');
  const code = Array.from(inputs).map(i => i.value).join('');
  const emailInput = document.getElementById('login-number');
  const email = emailInput ? emailInput.value.trim() : '';

  if (code.length === 6 && email) {
    const btn = document.getElementById('btn-verify-otp');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Verifying Identity...';
    btn.disabled = true;

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'magiclink' // Supabase uses 'magiclink' type for email OTP by default
    });

    if (error) {
      console.error('[ElevateAuth] Verify Error:', error.message);
      const errEl = document.getElementById('otp-error-msg');
      if (errEl) {
        errEl.textContent = 'Invalid code or expired. Please check your email and try again.';
        errEl.style.display = 'block';
      }
      btn.innerHTML = 'Try Again';
      btn.disabled = false;
      inputs.forEach(i => { i.value = ''; });
      inputs[0].focus();
    } else {
      console.log('[ElevateAuth] Successfully authenticated!');
      // State observer will handle the UI transition automatically
    }
  }
}

// 3. Logout Function
async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (!error) window.location.reload();
}

// Initial session check
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'none';
    const main = document.getElementById('admin-main');
    if (main) main.classList.add('authorized');
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
