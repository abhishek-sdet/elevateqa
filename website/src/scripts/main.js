import { initCloudSync } from './main-sync.js';
import { supabase } from './supabase-config.js';
import { sendAttendeeEmail } from './email-service.js';
import { DEFAULT_MATURITY, DEFAULT_PILLARS, DEFAULT_AGENDA, DEFAULT_SPEAKERS } from './main-ui.js';


// ─── UTIL: HTML ESCAPE ──────────────────────────────────────────────────────
window.escapeHtml = window.escapeHtml || function(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const lerp = (a, b, n) => (1 - n) * a + n * b;

class MagneticElement {
  constructor(el, strength = 0.25) {
    this.el = el;
    this.strength = strength;
    this.x = 0; this.y = 0;
    this.targetX = 0; this.targetY = 0;
    this.init();
  }
  init() {
    window.addEventListener('mousemove', (e) => {
      const rect = this.el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      
      if (dist < 150) {
        this.targetX = (e.clientX - centerX) * this.strength;
        this.targetY = (e.clientY - centerY) * this.strength;
      } else {
        this.targetX = 0; this.targetY = 0;
      }
    });
    this.animate();
  }
  animate() {
    this.x = lerp(this.x, this.targetX, 0.1);
    this.y = lerp(this.y, this.targetY, 0.1);
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
    requestAnimationFrame(() => this.animate());
  }
}

function startCountUp(el) {
  const target = parseInt(el.getAttribute('data-target'));
  if (isNaN(target)) return;
  const duration = 2000;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(easeProgress * (target - start) + start);

    el.textContent = current + (el.getAttribute('data-suffix') || '');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initAnimations() {
  const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };

  window.io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible', 'revealed');
        if (entry.target.classList.contains('count-up')) startCountUp(entry.target);
        if (entry.target.classList.contains('maturity-stage')) {
          const fill = entry.target.querySelector('.meter-fill');
          if (fill) {
            let width = fill.getAttribute('data-width');
            if (!width) {
              const pctText = entry.target.querySelector('.pct')?.textContent || '';
              const match = pctText.match(/(\d+)/);
              width = match ? match[1] + '%' : '25%';
            }
            setTimeout(() => { 
              fill.style.width = width; 
              fill.style.setProperty('--meter-width', width);
            }, 200);
          }
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => window.io.observe(el));
}

function initCursor() {
  const cursor = document.querySelector('.cursor-branded');
  if (!cursor) return;
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    const dx = e.movementX || 0;
    const rotation = Math.min(Math.max(dx * 0.5, -15), 15);
    cursor.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
  });
  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup', () => cursor.classList.remove('clicking'));
}

// ─── SYNCHRONIZATION ENGINE ─────────────────────────────────────────────────
window.syncEverything = () => {
  console.log('[ElevateQA] 🔄 Running Global Sync...');
  
  const site = JSON.parse(localStorage.getItem('elevate_site_content'));
  const visuals = JSON.parse(localStorage.getItem('elevate_visuals'));
  const speakers = JSON.parse(localStorage.getItem('elevate_speakers')) || [];
  const agenda = JSON.parse(localStorage.getItem('elevate_agenda')) || [];
  const manifesto = JSON.parse(localStorage.getItem('elevate_manifesto')) || [];
  const maturity = JSON.parse(localStorage.getItem('elevate_maturity_stages')) || [];
  const pillars = JSON.parse(localStorage.getItem('elevate_pillars')) || [];

  const setHtml = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) {
      const targetStr = String(val);
      if (el.innerHTML !== targetStr) {
        el.innerHTML = targetStr;
      }
    }
  };
  const parseAccent = (str) => String(str || '')
    .replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>')
    .replace(/==(.*?)==/g, '<span class="highlight">$1</span>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  const parseEm = (str) => String(str || '').replace(/\[\[(.*?)\]\]/g, '<em>$1</em>').replace(/\|/g, '<br>');

  if (visuals) {
    const logoUrl = visuals.logo || './logo.png';
    document.querySelectorAll('.logo img, #footer-logo-img, #site-logo-img').forEach(img => {
      if (img.src !== logoUrl) {
        img.src = logoUrl;
        img.onerror = function() {
          this.src = './logo.png';
        };
      }
    });
    if (visuals.primaryColor) {
      document.documentElement.style.setProperty('--accent', visuals.primaryColor);
    }
    if (visuals.heroBg) {
      const heroBg = document.querySelector('.hero-ambient img');
      if (heroBg && heroBg.src !== visuals.heroBg) heroBg.src = visuals.heroBg;
    }
  } else {
    document.querySelectorAll('.logo img, #footer-logo-img, #site-logo-img').forEach(img => {
      if (!img.src.includes('logo.png')) {
        img.src = './logo.png';
      }
    });
  }

  if (site) {
    // MIGRATION: Auto-fix heroEdition if it's EDITION 01 or INAUGURAL or empty
    let heroEd = site.heroEdition || '';
    if (!heroEd || heroEd.toUpperCase().includes('EDITION 01') || heroEd.toUpperCase().includes('INAUGURAL')) {
      site.heroEdition = 'Edition 2';
    }

    // MIGRATION: Auto-fix footerEdition if it's EDITION 01 or INAUGURAL or empty
    let footerEd = site.footerEdition || '';
    if (!footerEd || footerEd.toUpperCase().includes('EDITION 01') || footerEd.toUpperCase().includes('INAUGURAL')) {
      site.footerEdition = 'Edition 2';
    }

    // Hero
    const headline = site.heroHeadline || 'Elevate Quality. | Prove value.';
    const titleEl = document.getElementById('hero-title');
    if (titleEl) {
      const targetHtml = headline.split(/[|\n]/).filter(l => l.trim()).map(line => {
        return `<span class="title-line"><span>${parseAccent(line)}</span></span>`;
      }).join('');
      if (titleEl.innerHTML !== targetHtml) {
        titleEl.innerHTML = targetHtml;
      }
    }
    setHtml('hero-tagline', parseAccent(site.heroTagline));
    setHtml('hero-eyebrow', parseAccent(site.heroEyebrow));
    setHtml('hero-edition', parseAccent(site.heroEdition));
    setHtml('hero-format', parseEm(site.heroFormat));
    setHtml('hero-audience', parseEm(site.heroAudience));
    setHtml('hero-venue-bottom', parseEm(site.eventVenue));
    setHtml('hero-date-bottom', parseEm(site.eventDate));

    // Stats
    const stats = [1, 2, 3, 4];
    stats.forEach(i => {
      const numEl = document.getElementById(`stat${i}-num`);
      const lblEl = document.getElementById(`stat${i}-lbl`);
      if (numEl) {
        const val = (site[`stat${i}Num`] || '0').replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
        if (numEl.innerHTML !== val) numEl.innerHTML = val;
      }
      if (lblEl) {
        const val = (site[`stat${i}Lbl`] || '').replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
        if (lblEl.innerHTML !== val) lblEl.innerHTML = val;
      }
    });

    // Manifesto Metadata
    setHtml('manifesto-section-num', site.manifestoSectionNum || '01 / Manifesto');
    setHtml('manifesto-pill', site.manifestoPill || 'Why now');
    setHtml('manifesto-aside-text', site.manifestoAside || 'A note from the <br>founder.');

    setHtml('prizes-title', parseEm(site.prizesHeadline));
    setHtml('prizes-s1-val', site.prizesS1Num); setHtml('prizes-s1-text', site.prizesS1Lbl);
    setHtml('prizes-s2-val', site.prizesS2Num); setHtml('prizes-s2-text', site.prizesS2Lbl);
    setHtml('prizes-s3-val', site.prizesS3Num); setHtml('prizes-s3-text', site.prizesS3Lbl);

    let footerTagStr = site.footerTagline || "The proof of value, or it didn't happen.";
    if (!footerTagStr.includes('<em>') && !footerTagStr.includes('*')) {
      footerTagStr = footerTagStr.replace(/(or it didn't happen\.?)/i, '<em>$1</em>');
    }
    setHtml('footer-tagline', parseAccent(footerTagStr));
    setHtml('footer-location', site.footerLocation);
    setHtml('footer-edition', site.footerEdition);
    setHtml('footer-copyright', site.footerCopyright);
    const fEmail = document.getElementById('footer-email');
    if (fEmail && site.footerEmail) {
      const mailHtml = `<a href="mailto:${site.footerEmail}" style="color: var(--accent); font-weight: 600;">${site.footerEmail}</a>`;
      if (fEmail.innerHTML !== mailHtml) fEmail.innerHTML = mailHtml;
    }

    // Navigation
    const navs = ['manifesto', 'maturity', 'experience', 'agenda', 'speakers', 'join'];
    navs.forEach(n => {
      const key = 'nav' + n.charAt(0).toUpperCase() + n.slice(1);
      setHtml(`nav-${n}`, site[key]);
    });
  }

  if (manifesto && manifesto[0]) {
    const wrap = document.getElementById('manifesto-text');
    if (wrap && manifesto[0].content) {
      const lines = manifesto[0].content.split(/[|\n]/).filter(l => l.trim());
      const targetHtml = lines.map(line => `<p class="reveal">${parseAccent(line)}</p>`).join('');
      if (wrap.innerHTML !== targetHtml) {
        wrap.innerHTML = targetHtml;
      }
    }
  }

  const finalMaturity = (maturity && maturity.length > 0) ? maturity : DEFAULT_MATURITY;
  if (finalMaturity.length > 0) {
    const grid = document.getElementById('maturity-stages-grid');
    if (grid) {
      const COLORS = ['#ffffff', 'var(--accent-3)', 'var(--accent-2)', 'var(--accent)'];
      const targetHtml = finalMaturity.map((m, i) => {
        const pct = String(m.pct || '0').replace('%', '').trim();
        const color = m.color || COLORS[i] || 'var(--accent)';
        return `
          <div class="maturity-stage reveal">
            <div class="level"><span>STAGE 0${i+1}</span></div>
            <div class="stage-name">${parseEm(m.name)}</div>
            <p class="stage-desc">${m.desc}</p>
            <div class="meter"><div class="meter-fill" style="width: 0%; background: ${color} !important;" data-width="${pct}%"></div></div>
            <div class="pct">~ ${pct}% of orgs surveyed</div>
          </div>`;
      }).join('');
      if (grid.innerHTML !== targetHtml) {
        grid.innerHTML = targetHtml;
      }
    }
  }

  const finalPillars = (pillars && pillars.length > 0) ? pillars : DEFAULT_PILLARS;
  if (finalPillars.length > 0) {
    const grid = document.getElementById('pillars-grid');
    if (grid) {
      const ICONS = [
        '<circle cx="24" cy="24" r="20"/><path d="M14 24 L22 32 L34 18"/>',
        '<rect x="6" y="6" width="36" height="36" rx="2"/><path d="M14 18 L34 18 M14 24 L28 24 M14 30 L34 30"/>',
        '<circle cx="14" cy="24" r="6"/><circle cx="34" cy="14" r="6"/><circle cx="34" cy="34" r="6"/><path d="M19 22 L29 16 M19 26 L29 32"/>',
        '<path d="M24 6 L24 42 M6 24 L42 24"/><circle cx="24" cy="24" r="8"/>',
        '<path d="M12 36 L12 12 L36 12 L36 28 L24 28 L12 36 Z"/>',
        '<polygon points="24,6 28,18 40,18 30,26 34,38 24,30 14,38 18,26 8,18 20,18"/>'
      ];
      const targetHtml = finalPillars.map((p, i) => `
        <div class="pillar reveal">
          <div class="pillar-num">> 0${i+1}</div>
          <div class="pillar-icon"><svg viewBox="0 0 48 48">${p.icon || ICONS[i] || ICONS[0]}</svg></div>
          <h3>${parseEm(p.title)}</h3>
          <p>${p.desc}</p>
        </div>`).join('');
      if (grid.innerHTML !== targetHtml) {
        grid.innerHTML = targetHtml;
      }
    }
  }

  const finalAgenda = (agenda && agenda.length > 0) ? agenda : DEFAULT_AGENDA;
  if (finalAgenda.length > 0) {
    const timeline = document.querySelector('.timeline');
    if (timeline) {
      const targetHtml = finalAgenda.map(item => {
        const isFeatured = item.tag?.toLowerCase().includes('keynote');
        const isBreak = item.tag?.toLowerCase().includes('break') || item.tag?.toLowerCase().includes('tea') || item.tag?.toLowerCase().includes('lunch');
        const rowClass = `timeline-row reveal${isFeatured ? ' featured' : ''}${isBreak ? ' break' : ''}`;
        return `
        <div class="${rowClass}">
          <div class="timeline-time">${item.time_slot || item.time}</div>
          <div class="timeline-content">
            <span class="tag">${item.tag || 'SESSION'}</span>
            <h4>${parseEm(item.title)}</h4>
            <p class="desc">${item.desc || ''}</p>
          </div>
        </div>`;
      }).join('');
      if (timeline.innerHTML !== targetHtml) {
        timeline.innerHTML = targetHtml;
      }
    }
  }

  const finalSpeakers = (speakers && speakers.length > 0) ? speakers : DEFAULT_SPEAKERS;
  if (finalSpeakers.length > 0) {
    const grid = document.querySelector('.speakers-grid');
    if (grid) {
      const targetHtml = finalSpeakers.map((s, idx) => {
        const photo = s.image_url || s.img;
        return `
        <div class="speaker-card reveal">
          ${photo ? `<div class="speaker-photo-wrap"><img class="speaker-photo" src="${photo}" alt="${s.name}"></div>` : `<div class="silhouette">${(idx + 1).toString().padStart(2, '0')}</div>`}
          <div class="top"><span>${(s.role || 'Speaker').toUpperCase()}</span><span>${s.status || s.wave || 'CONFIRMED'}</span></div>
          <div class="speaker-content">
            <div class="name">${s.name}</div>
            <div class="designation">${s.title || s.role || ''}</div>
          </div>
        </div>`;
      }).join('') + `
          <div class="speaker-card speaker-cta-card reveal">
            <div class="silhouette" aria-hidden="true">+</div>
            <div class="top"><span>SUBMISSIONS</span><span>OPEN</span></div>
            <div class="pitch">Have a story <em>worth telling?</em><br><a href="#join">Apply to speak ></a></div>
          </div>`;
      if (grid.innerHTML !== targetHtml) {
        grid.innerHTML = targetHtml;
      }
    }
  }

  // RE-OBSERVE NEW ELEMENTS
  if (window.io) {
    document.querySelectorAll('.reveal, .maturity-stage, .pillar').forEach(el => {
      window.io.observe(el);
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('visible', 'revealed');
      }
    });
  }
};

window.openModal = (e) => {
  if (e) e.preventDefault();
  const modal = document.getElementById('regModal');
  const priceView = document.getElementById('price-view');
  const formView = document.getElementById('form-view');
  const ticketView = document.getElementById('ticket-view');

  if (modal) {
    if (priceView) priceView.style.display = 'block';
    if (formView) formView.style.display = 'none';
    if (ticketView) ticketView.style.display = 'none';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = () => {
  const modal = document.getElementById('regModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.proceedToForm = function() {
  const priceView = document.getElementById('price-view');
  const formView = document.getElementById('form-view');
  if (priceView) priceView.style.display = 'none';
  if (formView) formView.style.display = 'block';
};

window.generateTicket = async function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const org = document.getElementById('reg-org').value;
  const designation = document.getElementById('reg-designation').value;
  const linkedin = document.getElementById('reg-linkedin').value;

  // Show loading state
  const btn = document.querySelector('#form-view button[type="submit"]');
  const originalBtnText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Generating...';
  }

  let dbId = null;
  let shortId = null;

  // Save to Supabase FIRST to get the UUID
  try {
    const { data, error } = await supabase.from('registrations').insert([
      { name, email, company: org, status: 'confirmed', designation, linkedin }
    ]).select();

    if (error) {
      console.error('[ElevateQA] Error saving registration:', error);
      alert('Failed to register. Please try again.');
      if (btn) { btn.disabled = false; btn.innerHTML = originalBtnText; }
      return;
    }
    
    if (data && data.length > 0) {
      dbId = data[0].id;
      // Make a nice short ID for display (first 8 chars of UUID)
      shortId = 'EQ26-' + dbId.split('-')[0].toUpperCase();
    }
  } catch(e) {
    console.error('[ElevateQA] Registration exception:', e);
    alert('An unexpected error occurred. Please try again.');
    if (btn) { btn.disabled = false; btn.innerHTML = originalBtnText; }
    return;
  }

  // Restore button just in case
  if (btn) { btn.disabled = false; btn.innerHTML = originalBtnText; }

  // Update UI with the confirmed ID
  document.getElementById('ticket-name').textContent = name;
  document.getElementById('ticket-org').textContent = org;
  
  const idDisplay = document.getElementById('ticket-id-val') || document.getElementById('ticket-id-display');
  if (idDisplay) idDisplay.textContent = `PASS ID: ${shortId}`;

  const qrEl = document.getElementById('qrcode');
  if (qrEl) {
    qrEl.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrEl, {
        text: `ELEVATE-QA:${dbId}|${name}|${org}`,
        width: 160,
        height: 160,
        colorDark: "#0b0b10",
        colorLight: "#ffffff"
      });
    }
  }

  document.getElementById('form-view').style.display = 'none';
  document.getElementById('ticket-view').style.display = 'block';

  // SEND ACTUAL EMAIL VIA EMAILJS
  try {
    await sendAttendeeEmail({ name, email, company: org, ticketId: shortId, dbId, designation, linkedin });
    const statusWrap = document.getElementById('email-status-wrap');
    if (statusWrap) {
      statusWrap.innerHTML = '<div class="email-status success">✓ Ticket sent to ' + escapeHtml(email) + '</div>';
    }
  } catch(e) {
    console.error('Failed to send email:', e);
    const statusWrap = document.getElementById('email-status-wrap');
    if (statusWrap) {
      statusWrap.innerHTML = '<div class="email-status error" style="color:var(--accent-red)">⚠ Error sending email</div>';
    }
  }
};

window.downloadPremiumTicket = function() {
  const qrImg = document.querySelector('#qrcode img');
  if (qrImg) {
    const link = document.createElement('a');
    link.href = qrImg.src;
    link.download = 'ElevateQA26-Pass.png';
    link.click();
  } else {
    // Fallback for canvas-based QRCode
    const qrCanvas = document.querySelector('#qrcode canvas');
    if (qrCanvas) {
      const link = document.createElement('a');
      link.href = qrCanvas.toDataURL();
      link.download = 'ElevateQA26-Pass.png';
      link.click();
    }
  }
};

window.shareOnLinkedIn = function() {
  const url = encodeURIComponent('https://elevateqa.sdettech.com/');
  const title = encodeURIComponent('I just claimed my free pass for Elevate QA 2026!');
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=600');
};

document.addEventListener('DOMContentLoaded', () => {
  initAnimations();
  initCursor();
  
  // Helper to safely dismiss the preloader
  const dismissPreloader = () => {
    const preloader = document.getElementById('page-preloader');
    if (preloader && !preloader.classList.contains('fade-out')) {
      preloader.classList.add('fade-out');
      setTimeout(() => preloader.remove(), 800);
    }
  };

  // 1. Immediately sync UI with cached data for instantaneous LCP (0ms perceived load)
  if (typeof window.syncEverything === 'function') {
    window.syncEverything();
  }

  // 2. If cached data already exists, dismiss the preloader instantly so the user sees the page immediately
  if (localStorage.getItem('elevate_site_content')) {
    dismissPreloader();
  }

  // 3. Revalidate in the background from Supabase
  initCloudSync().then(() => {
    // If the user didn't have cached data previously, dismiss the preloader now
    dismissPreloader();
  }).catch(() => {
    dismissPreloader();
  });
  
  let syncTimeout;
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('elevate_')) {
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        window.syncEverything();
      }, 100);
    }
  });

  // Failsafe preloader removal (reduced to 5 seconds to prevent frozen screen if offline)
  setTimeout(dismissPreloader, 5000);
});
