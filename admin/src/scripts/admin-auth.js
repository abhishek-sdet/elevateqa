/**
 * ELEVATE QA 2026 - ENTERPRISE ADMIN AUTH
 * High-security OTP authentication with Supabase and Whitelisting.
 */

const ALLOWED_ADMINS = [
  'abhishek.johri@sdettech.com',
  'abhishekjohri150@gmail.com'
];

// 1. Session Security (Real Supabase Session)
async function checkSession() {
  const { data: { session } } = await window.supabase.auth.getSession();
  
  if (session && ALLOWED_ADMINS.includes(session.user.email)) {
    authorizeUI();
  } else if (session) {
    // Logged in but not whitelisted? Sign out.
    await window.supabase.auth.signOut();
  }
}

function authorizeUI() {
  if (typeof window.startSync === 'function') {
    window.startSync();
  } else {
    // Fallback if core hasn't loaded
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'none';
    const main = document.getElementById('admin-main');
    if (main) main.classList.add('authorized');
  }
}

// 2. OTP Delivery (Real Supabase Auth)
window.sendOTP = async function(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('login-number');
  if (!emailInput) return;
  
  const email = emailInput.value.trim().toLowerCase();
  const btn = document.getElementById('btn-send-otp');
  
  if (!email) return;

  // 🛡️ SECURITY: Whitelist Check
  if (!ALLOWED_ADMINS.includes(email)) {
    alert('Access Denied: This email is not authorized for administrative access.');
    return;
  }
  
  btn.innerHTML = '<span class="spinner"></span> Sending Secure Code...';
  btn.disabled = true;

  try {
    const { error } = await window.supabase.auth.signInWithOtp({ 
      email,
      options: {
        shouldCreateUser: false // Only allow existing whitelisted users
      }
    });

    if (error) throw error;

    document.getElementById('auth-step-1').style.display = 'none';
    document.getElementById('auth-step-2').style.display = 'block';
    const target = document.getElementById('otp-target-email');
    if (target) target.textContent = email;
    
    const firstInput = document.querySelector('.otp-input');
    if (firstInput) firstInput.focus();
  } catch (err) {
    alert(`Auth Error: ${err.message}`);
  } finally {
    btn.innerHTML = 'Send Access Code';
    btn.disabled = false;
  }
};

// 3. OTP Verification (Real Supabase Auth)
window.verifyOTP = async function() {
  const email = document.getElementById('login-number').value.trim().toLowerCase();
  const inputs = document.querySelectorAll('.otp-input');
  const code = Array.from(inputs).map(i => i.value).join('');
  
  if (code.length === 6) {
    try {
      const { data, error } = await window.supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'magiclink' // Supabase uses 'magiclink' for OTP verification
      });

      if (error) throw error;

      if (data.session) {
        // Set session state and reload for a clean data-sync lifecycle
        sessionStorage.setItem('admin_logged_in', 'true');
        location.reload();
      }
    } catch (err) {
      inputs.forEach(i => {
        i.style.borderColor = '#ff3a3a';
        i.value = '';
      });
      inputs[0].focus();
      alert(`Invalid Code: ${err.message}`);
    }
  }
}

// 4. Input Helpers
window.moveFocus = function(el) {
  if (el.value.length >= 1) {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const nextIndex = inputs.indexOf(el) + 1;
    if (nextIndex < inputs.length) {
      inputs[nextIndex].focus();
    }
  }
  
  const code = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
  if (code.length === 6) {
    window.verifyOTP();
  }
};

window.handleBackspace = function(el, e) {
  if (e.key === 'Backspace' && !el.value) {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const prevIndex = inputs.indexOf(el) - 1;
    if (prevIndex >= 0) {
      inputs[prevIndex].focus();
    }
  }
};

// Auto-check session on load
document.addEventListener('DOMContentLoaded', checkSession);
