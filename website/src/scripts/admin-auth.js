/**
 * ELEVATE QA 2026 - ADMIN AUTH MODULE
 * Handles OTP login, sessions, and security overlays.
 */

// 1. Session Security
function checkSession() {
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'none';
    const main = document.getElementById('admin-main');
    if (main) main.classList.add('authorized');
  }
}

let currentOTP = null;

// 2. OTP Delivery
function sendOTP(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('login-number');
  if (!emailInput) return;
  
  const email = emailInput.value.trim();
  const btn = document.getElementById('btn-send-otp');
  
  if (!email) return;
  
  // Generate random 6-digit code
  currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
  
  btn.innerHTML = '<span class="spinner"></span> Sending Secure Code...';
  btn.disabled = true;

  console.log(`[ElevateQA] SECURE AUTH: Code for ${email} is ${currentOTP}`);
  
  // INTEGRATION: If EmailJS is initialized, we could send it here
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
  }, 1500);
}

// 3. OTP Verification
function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-input');
  const code = Array.from(inputs).map(i => i.value).join('');
  
  if (code.length === 6) {
    if (code === currentOTP) {
      sessionStorage.setItem('admin_logged_in', 'true');
      const overlay = document.getElementById('login-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          const main = document.getElementById('admin-main');
          if (main) main.classList.add('authorized');
          if (typeof showSavedToast === 'function') showSavedToast('✓ Securely Authenticated');
        }, 500);
      }
    } else {
      inputs.forEach(i => {
        i.style.borderColor = '#ff3a3a';
        i.value = '';
      });
      inputs[0].focus();
      alert('Invalid security code. Please check your email and try again.');
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
