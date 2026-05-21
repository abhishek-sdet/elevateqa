/**
 * ELEVATE QA 2026 - MAIN CORE MODULE
 * Handles reveal animations, cursor glow, and app lifecycle orchestration.
 * Scroll/Nav/Menu logic lives in main-ui.js to avoid duplication.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[ElevateQA] Core Active — Starting Initialization...');

  // 1. Reveal Observer (scroll-triggered animations)
  const revealOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Trigger progress bar fill animations
        const bars = entry.target.querySelectorAll('.progress-fill, .meter-fill');
        bars.forEach(bar => {
          const targetWidth = bar.getAttribute('data-width') || bar.style.width;
          if (targetWidth) {
            bar.style.width = '0';
            setTimeout(() => { bar.style.width = targetWidth; }, 100);
          }
        });
      }
    });
  }, revealOptions);

  // Observe all existing reveal elements
  document.querySelectorAll('.reveal, .hero, .maturity-card, .pillar-card, .speaker-card, .involve-card').forEach(el => {
    io.observe(el);
  });

  // Re-observe after dynamic content is injected
  window._observeNewReveal = () => {
    document.querySelectorAll('.reveal:not(.observed)').forEach(el => {
      el.classList.add('observed');
      io.observe(el);
    });
  };

  // 2. Cursor Glow Tracking
  const cursor = document.querySelector('.cursor-glow');
  document.addEventListener('mousemove', (e) => {
    if (cursor) {
      cursor.style.transform = `translate3d(${e.clientX - 300}px, ${e.clientY - 300}px, 0)`;
    }
    // Subtle parallax on hero grid
    const grid = document.querySelector('.hero-grid');
    if (grid) {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      grid.style.transform = `translate(${x}px, ${y}px)`;
    }
  });

  // 3. Scroll Progress Bar & Sticky Header
  const header = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    const progress = document.getElementById('scroll-progress');
    const winScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (progress) {
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      progress.style.width = ((winScroll / height) * 100) + '%';
    }
    if (header) {
      if (winScroll > 80) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
  });

  // 4. Start Cloud Sync (single entry point — fires after all scripts are loaded)
  if (typeof initCloudSync === 'function') {
    initCloudSync();
  } else {
    console.warn('[ElevateQA] initCloudSync not found — sync module may not have loaded.');
  }
});

// ─── COPY LINK ───────────────────────────────────────────────────────────────
// Global function called via onclick="copyLink(event)" in involve.html
window.copyLink = function(e) {
  if (e) e.preventDefault();
  const btn = document.getElementById('copyLink');
  const url = window.location.href;

  navigator.clipboard.writeText(url).then(() => {
    if (btn) {
      const original = btn.textContent;
      btn.textContent = 'Copied! ✓';
      btn.style.color = '#b8ff57';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.color = '';
      }, 2500);
    }
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (btn) {
      const original = btn.textContent;
      btn.textContent = 'Copied! ✓';
      btn.style.color = '#b8ff57';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.color = '';
      }, 2500);
    }
  });
};

