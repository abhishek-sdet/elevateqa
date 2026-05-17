/**
 * ELEVATE QA 2026 - MAIN UI RENDERING MODULE
 * Renders dynamic content from Cloud/LocalStorage with original fallback defaults.
 */

// ─── ORIGINAL CONTENT DEFAULTS ─────────────────────────────────────────────
const DEFAULT_MATURITY = [
  { label: 'FOUNDATION', name: '<em>Manual</em>-first', pct: '25%', color: '#ffffff', desc: 'Test cases authored by hand. Automation islands. AI is "interesting," not yet operational.' },
  { label: 'EXPLORATORY', name: '<em>Assisted</em>', pct: '50%', color: 'var(--accent-3)', desc: 'AI helps generate test cases and data. Engineers stay in the loop. Early wins, mixed signals.' },
  { label: 'OPERATIONAL', name: '<em>Augmented</em>', pct: '75%', color: 'var(--accent-2)', desc: 'Self-healing automation, intelligent triage, AI-driven coverage gap analysis. Measurable lift.' },
  { label: 'FRONTIER', name: '<em>Autonomous</em>', pct: '100%', color: 'var(--accent)', desc: 'Quality agents reason about risk, prioritize, and adapt. Humans set strategy. The future, already here in pockets.' }
];

const DEFAULT_PILLARS = [
  { title: '<em>Keynotes</em> from people doing the work', desc: 'Industry voices and engineering leaders sharing concrete case studies — what AI changed, what it cost, what it delivered. Real numbers, not roadmaps.', icon: '<circle cx="24" cy="24" r="20"/><path d="M14 24 L22 32 L34 18"/>' },
  { title: 'Practitioner <em>deep-dives</em>', desc: 'Hands-on breakouts from engineers who\'ve shipped AI-augmented test suites, self-healing automation, and intelligent quality pipelines at scale.', icon: '<rect x="6" y="6" width="36" height="36" rx="2"/><path d="M14 18 L34 18 M14 24 L28 24 M14 30 L34 30"/>' },
  { title: 'The <em>community</em> table', desc: 'Curated roundtables where 200–500 quality engineering leaders connect, debate, and forge the relationships that move careers and companies forward.', icon: '<circle cx="14" cy="24" r="6"/><circle cx="34" cy="14" r="6"/><circle cx="34" cy="34" r="6"/><path d="M19 22 L29 16 M19 26 L29 32"/>' },
  { title: 'Live <em>demos</em>, not slideware', desc: 'See AI-led QE tooling in action on real codebases, real bugs, real flaky tests. Working software is the only honest demo.', icon: '<path d="M24 6 L24 42 M6 24 L42 24"/><circle cx="24" cy="24" r="8"/>' },
  { title: 'The <em>candid</em> panels', desc: 'The unfiltered conversations: what AI in QE is overhyped, what\'s underrated, where the field goes from here. Speakers who\'ll say it plainly.', icon: '<path d="M12 36 L12 12 L36 12 L36 28 L24 28 L12 36 Z"/>' },
  { title: 'Recognition <em>& prizes</em>', desc: 'Speaker of the event, audience awards, and surprises throughout the day. We celebrate the people pushing the field — loudly.', icon: '<polygon points="24,6 28,18 40,18 30,26 34,38 24,30 14,38 18,26 8,18 20,18"/>' }
];

const DEFAULT_AGENDA = [
  { time: '09:00', tag: 'Opens',          title: 'Registration & morning <em>coffee</em>',        desc: 'Pick up your badge, meet the early arrivals, find your tribe before the day begins.' },
  { time: '10:00', tag: 'Opening Keynote',title: '<em>The proof of value:</em> what AI in QE has actually delivered', desc: 'A grounded look at where AI has paid off in quality engineering — and where the receipts are still missing.' },
  { time: '11:00', tag: 'Track Sessions', title: 'Parallel deep-dives <em>across two stages</em>', desc: 'Self-healing automation, AI-driven test generation, intelligent triage, risk-based prioritization. Engineers showing real implementations.' },
  { time: '13:00', tag: 'Break',          title: 'Lunch & <em>networking</em>',                   desc: 'Curated tables by topic — sit with people working on the problems you\'re working on.' },
  { time: '14:30', tag: 'Keynote Panel',  title: 'The candid panel: <em>hype vs. reality</em>',   desc: 'Practitioners and leaders go on record about what\'s overhyped, what\'s underrated, and where the field goes next.' },
  { time: '15:30', tag: 'Workshops',      title: 'Hands-on <em>working sessions</em>',             desc: 'Bring a laptop. Leave with code, frameworks, and concrete starting points for your own AI-led QE program.' },
  { time: '17:30', tag: 'Awards',         title: 'Speaker of the Event <em>& recognition</em>',   desc: 'The day\'s best voice gets headline prizes. Audience awards, surprises, applause that means something.' },
  { time: '18:30', tag: 'Reception',      title: 'Closing reception & <em>after hours</em>',      desc: 'Drinks, conversations, and the connections that outlast the agenda.' }
];

const DEFAULT_SPEAKERS = [
  { name: 'To be revealed', role: 'KEYNOTE',     wave: 'WAVE 01', silhouette: '01' },
  { name: 'To be revealed', role: 'KEYNOTE',     wave: 'WAVE 01', silhouette: '02' },
  { name: 'To be revealed', role: 'INDUSTRY',    wave: 'WAVE 01', silhouette: '03' },
  { name: 'To be revealed', role: 'PRACTITIONER',wave: 'WAVE 02', silhouette: '04' },
  { name: 'To be revealed', role: 'PANEL',       wave: 'WAVE 02', silhouette: '05' },
  { name: 'To be revealed', role: 'WORKSHOP',    wave: 'WAVE 02', silhouette: '06' },
  { name: 'To be revealed', role: 'FIRESIDE',    wave: 'WAVE 02', silhouette: '07' }
];

// ─── UTILITIES ─────────────────────────────────────────────────────────────
function tryParse(key) {
  const node = key.replace('elevate_', '');
  if (window._cloudCache && window._cloudCache[node]) return window._cloudCache[node];
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch(e) { return null; }
}

// Escape HTML special chars for safe interpolation into innerHTML
const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
window.escapeHtml = window.escapeHtml || escapeHtml;

// parseAccent: ONLY wraps [[...]] tokens with span.accent — input is escaped first.
// IMPORTANT: This function is used on admin-authored content where intentional HTML em tags
// are part of the design. We escape input then re-introduce ONLY our marker pattern.
const parseAccent = (str) => {
  if (!str) return '';
  // Preserve <em>…</em> as design intent, but escape anything else
  return String(str).replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
};

// ─── MODAL INTERACTIONS ──────────────────────────────────────────────────────
window.openModal = function(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('regModal');
  const priceView = document.getElementById('price-view');
  const formView = document.getElementById('form-view');
  const ticketView = document.getElementById('ticket-view');

  if (modal) {
    // Reset views to initial state
    if (priceView) priceView.style.display = 'block';
    if (formView) formView.style.display = 'none';
    if (ticketView) ticketView.style.display = 'none';
    
    // Triggering 'active' now starts all CSS animations automatically
    modal.classList.add('active');
  }
  document.body.style.overflow = 'hidden';
};

window.closeModal = function() {
  const modal = document.getElementById('regModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
};

window.proceedToForm = function() {
  const priceView = document.getElementById('price-view');
  const formView = document.getElementById('form-view');
  if (priceView) priceView.style.display = 'none';
  if (formView) formView.style.display = 'block';
};

window.generateTicket = function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const org = document.getElementById('reg-org').value;
  const ticketId = 'EQ26-' + Math.random().toString(36).substr(2, 6).toUpperCase();

  document.getElementById('ticket-name').textContent = name;
  document.getElementById('ticket-org').textContent = org;
  document.getElementById('ticket-id-display').textContent = `PASS ID: ${ticketId}`;

  const qrEl = document.getElementById('qrcode');
  if (qrEl) {
    qrEl.innerHTML = '';
    new QRCode(qrEl, {
      text: `ELEVATEQA-2026|${ticketId}|${name}|${org}`,
      width: 160,
      height: 160,
      colorDark: "#0b0b10",
      colorLight: "#ffffff"
    });
  }

  document.getElementById('form-view').style.display = 'none';
  document.getElementById('ticket-view').style.display = 'block';

  // Simulate email sending success
  const statusWrap = document.getElementById('email-status-wrap');
  if (statusWrap) {
    setTimeout(() => {
      statusWrap.innerHTML = '<div class="email-status success">✓ Ticket sent to ' + email + '</div>';
    }, 2000);
  }
};

window.downloadTicketQR = function() {
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

// ─── GLOBAL SCROLL LOGIC (handled in main-core.js to avoid duplicates) ──────

// ─── RENDER FUNCTIONS ───────────────────────────────────────────────────────
function syncEverything() {
  const site     = tryParse('elevate_site_content');
  const agenda   = tryParse('elevate_agenda');
  const speakers = tryParse('elevate_speakers');
  const visuals  = tryParse('elevate_visuals');

  const setHtml = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.innerHTML = parseAccent(val);
  };

  if (site) {
    setHtml('hero-eyebrow', site.heroEyebrow);
    setHtml('hero-tagline', site.heroTagline);
    setHtml('hero-edition', site.heroEdition);
    
    // UNBUNDLE JSON from heroMeta if present
    let metaText = site.heroMeta || '';
    let ctaText  = '';
    if (metaText.startsWith('{')) {
      try {
        const extra = JSON.parse(metaText);
        Object.assign(site, extra);
        metaText = extra.heroMetaText || '';
        ctaText  = extra.heroCtaText || '';
      } catch(e) {}
    }
    
    setHtml('hero-meta', metaText);
    if (ctaText) {
      const ctaBtn = document.getElementById('hero-cta-btn');
      if (ctaBtn) ctaBtn.innerHTML = `${ctaText} <span class="arrow">→</span>`;
    }
    
    if (site.heroHeadline) {
      const titleEl = document.getElementById('hero-title');
      if (titleEl) {
        titleEl.innerHTML = site.heroHeadline.split(/[|\n]/).filter(l => l.trim()).map(line => {
          return `<span class="title-line"><span>${parseAccent(line.trim())}</span></span>`;
        }).join('');
      }
    }

    const setSplitHtml = (id, val) => {
      const el = document.getElementById(id);
      if (!el || !val) return;
      if (val.includes(',')) {
        const parts = val.split(',');
        el.innerHTML = `${parts[0]}, <em>${parts.slice(1).join(',').trim()}</em>`;
      } else {
        const parts = val.trim().split(' ');
        if (parts.length > 1) { const last = parts.pop(); el.innerHTML = `${parts.join(' ')} <em>${last}</em>`; }
        else el.innerHTML = `<em>${val}</em>`;
      }
    };
    setSplitHtml('hero-format',   site.heroFormat);
    setSplitHtml('hero-audience', site.heroAudience);
    setSplitHtml('hero-venue',    site.eventVenue);
    setSplitHtml('hero-date',     site.eventDate);

    setHtml('manifesto-pill',       site.manifestoPill);
    setHtml('manifesto-aside-text', site.manifestoAside);
    if (site.manifestoLines) {
      const mEl = document.getElementById('manifesto-text');
      if (mEl) {
        let lines = Array.isArray(site.manifestoLines) ? site.manifestoLines : 
                   (typeof site.manifestoLines === 'string' ? site.manifestoLines.split('\n').filter(l => l.trim()) : []);
        if (lines.length) {
          mEl.innerHTML = lines.map(l => `<p class="reveal">${parseAccent(l)}</p>`).join('');
        }
      }
    }

    // Navigation
    const navItems = ['manifesto', 'maturity', 'experience', 'agenda', 'speakers', 'join'];
    navItems.forEach(item => {
      const key = 'nav' + item.charAt(0).toUpperCase() + item.slice(1);
      setHtml('nav-' + item, site[key]);
    });

    // Stats Bar
    setHtml('stat1-num', site.stat1Num); setHtml('stat1-lbl', site.stat1Lbl);
    setHtml('stat2-num', site.stat2Num); setHtml('stat2-lbl', site.stat2Lbl);
    setHtml('stat3-num', site.stat3Num); setHtml('stat3-lbl', site.stat3Lbl);
    setHtml('stat4-num', site.stat4Num); setHtml('stat4-lbl', site.stat4Lbl);

    setHtml('experience-section-num',   site.experienceSectionNum   || '03 / The Experience');
    setHtml('experience-section-title', site.experienceSectionTitle || 'A day built around <em>signal,</em> not noise.');
    
    // Get Involved
    setHtml('involve-title',       site.involveTitle);
    setHtml('involve-card1-title', site.involveCard1Title);
    setHtml('involve-card1-desc',  site.involveCard1Desc);
    setHtml('involve-card2-title', site.involveCard2Title);
    setHtml('involve-card2-desc',  site.involveCard2Desc);
    setHtml('involve-card3-title', site.involveCard3Title);
    setHtml('involve-card3-desc',  site.involveCard3Desc);

    // Coming Soon
    setHtml('coming-title', site.comingTitle);
    setHtml('coming-desc',  site.comingDesc);
    for (let i = 1; i <= 6; i++) {
      setHtml(`coming-item${i}-status`, site[`comingItem${i}Status`]);
    }

    // Footer
    setHtml('footer-tagline',  site.footerTagline);
    setHtml('footer-location', site.footerLocation);
    setHtml('footer-edition',  site.footerEdition);

    // Ticker
    for (let i = 1; i <= 8; i++) {
      setHtml(`ticker-${i}`, site[`ticker${i}`]);
    }

    // Maturity Map
    renderMaturity(site.maturityStages);

    // Experience Pillars
    renderPillars(site.pillars);
  } else {
    renderMaturity(null);
    renderPillars(null);
  }

  if (visuals) {
    if (visuals.logo) {
      const logoImg = document.getElementById('site-logo-img');
      const footerLogo = document.getElementById('footer-logo-img');
      if (logoImg)    {
        logoImg.src = visuals.logo;
        logoImg.style.display = 'block';
        if (visuals.logoHeight) logoImg.style.height = visuals.logoHeight + 'px';
      }
      if (footerLogo) {
        footerLogo.src = visuals.logo;
        footerLogo.style.display = 'block';
      }
    }
    // Hero background image
    const heroImg = document.querySelector('.hero-ambient img');
    if (heroImg && visuals.heroBg) heroImg.src = visuals.heroBg;

    // Experience image strip (strip-img-01/02/03 + captions)
    if (Array.isArray(visuals.strip)) {
      visuals.strip.forEach((item, i) => {
        const n   = String(i + 1).padStart(2, '0');
        const img = document.getElementById(`strip-img-${n}`);
        const cap = document.getElementById(`strip-cap-${n}`);
        if (img && item.img) img.src = item.img;
        if (cap && item.cap) cap.textContent = item.cap;
      });
    }
  }

  renderAgenda(agenda);
  renderSpeakers(speakers);
}

function initNav() {
  const menuBtn = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    const isOpen = menuBtn.classList.toggle('open');   // CSS uses .open
    navLinks.classList.toggle('active', isOpen);       // CSS uses .active
    document.body.style.overflow = isOpen ? 'hidden' : ''; // lock scroll
    menuBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when any nav link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('open');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  // Perform initial render from localStorage cache immediately
  syncEverything();
  // Listen for cross-tab LocalStorage updates
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('elevate_')) syncEverything();
  });
  // NOTE: initCloudSync() is called by main-core.js after all scripts load
});

// ─── AGENDA ─────────────────────────────────────────────────────────────────
function renderAgenda(agenda) {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const data = (agenda && Array.isArray(agenda)) ? agenda : DEFAULT_AGENDA;
  timeline.innerHTML = data.map(item => {
    const isFeatured = item.tag?.toLowerCase().includes('keynote');
    const isBreak    = item.tag?.toLowerCase().includes('break') || item.tag?.toLowerCase().includes('tea') || item.tag?.toLowerCase().includes('lunch');
    const rowClass   = `timeline-row reveal${isFeatured ? ' featured' : ''}${isBreak ? ' break' : ''}`;

    return `
    <div class="${rowClass}">
      <div class="timeline-time">${escapeHtml(item.time)}</div>
      <div class="timeline-content">
        <span class="tag">${escapeHtml(item.tag)}</span>
        <h4>${parseAccent(item.title)}</h4>
        <p>${escapeHtml(item.desc || '')}</p>
      </div>
    </div>`;
  }).join('');
}

// ─── SPEAKERS ───────────────────────────────────────────────────────────────
function renderSpeakers(speakers) {
  // NOTE: Only inject dynamic speakers BEFORE the static CTA card in speakers.html.
  // The .speaker-cta-card is static HTML; we prepend dynamic cards only.
  const grid = document.querySelector('.speakers-grid');
  if (!grid) return;
  const data = (speakers && Array.isArray(speakers)) ? speakers : DEFAULT_SPEAKERS;

  // Remove any previously injected dynamic cards (not the static CTA card)
  grid.querySelectorAll('.speaker-card:not(.speaker-cta-card)').forEach(el => el.remove());

  const fragment = document.createDocumentFragment();
  data.forEach((s, idx) => {
    const hasPhoto = s.img && s.img.length > 10;
    const card = document.createElement('div');
    card.className = 'speaker-card reveal' + (hasPhoto ? ' speaker-has-photo' : '');
    const safeImg = escapeHtml(s.img);
    const safeName = escapeHtml(s.name || 'To be revealed');
    const safeRole = escapeHtml((s.role || 'KEYNOTE')).toUpperCase();
    const safeWave = escapeHtml(s.wave || 'WAVE 01');
    const safeSilhouette = escapeHtml(s.silhouette || '0' + (idx + 1));
    card.innerHTML = `
      ${hasPhoto
        ? `<div class="speaker-photo-wrap"><img src="${safeImg}" class="speaker-photo" alt="${safeName}" loading="lazy" decoding="async" /></div>`
        : `<div class="silhouette" aria-hidden="true">${safeSilhouette}</div>`
      }
      <div class="top"><span>${safeRole}</span><span>${safeWave}</span></div>
      <div class="name">${parseAccent(s.name || 'To be revealed')}</div>`;
    fragment.appendChild(card);
  });

  // Insert before the CTA card
  const ctaCard = grid.querySelector('.speaker-cta-card');
  if (ctaCard) {
    grid.insertBefore(fragment, ctaCard);
  } else {
    grid.appendChild(fragment);
  }
}


// ─── MATURITY MAP ───────────────────────────────────────────────────────────
function renderMaturity(stages) {
  // Matches <div class="maturity"> in map.html
  // CSS classes: .maturity-stage > .level, .stage-name, .stage-desc, .meter/.meter-fill, .pct
  const container = document.querySelector('.maturity');
  if (!container) return;
  const data = (stages && Array.isArray(stages)) ? stages : DEFAULT_MATURITY;

  const STAGE_LABELS = ['FOUNDATION', 'EXPLORATORY', 'OPERATIONAL', 'FRONTIER'];
  
  container.innerHTML = data.map((s, i) => {
    const stageNum = `STAGE 0${i + 1}`;
    const label    = s.label || STAGE_LABELS[i] || '';
    const pct      = s.pct   || '0%';
    const name     = s.name  || '';
    const desc     = s.desc  || '';

    // Clean the percentage string (remove any redundant characters from old data)
    const cleanPct = pct.replace(/~|of orgs surveyed|complete/g, '').trim();
    const finalPct = cleanPct.includes('%') ? cleanPct : `${cleanPct}%`;
    const barColor = s.color || (i === 0 ? '#ffffff' : (i === 1 ? 'var(--accent-3)' : (i === 2 ? 'var(--accent-2)' : 'var(--accent)')));

    return `
    <div class="maturity-stage reveal">
      <div class="level">
        <span style="opacity: 0.7;">${stageNum}</span>
        <span style="letter-spacing: 0.15em;">${label}</span>
      </div>
      <div class="stage-name">${name}</div>
      <div class="stage-desc">${desc}</div>
      <div class="meter">
        <div class="meter-fill" style="width: 0%; background: ${barColor};" data-width="${finalPct}"></div>
      </div>
      <div class="pct">~ ${finalPct} of orgs surveyed</div>
    </div>`;
  }).join('');
}

// ─── EXPERIENCE PILLARS ──────────────────────────────────────────────────────
function renderPillars(pillars) {
  // Matches <div class="pillars"> in experience.html
  // CSS classes: .pillar > .pillar-num, .pillar-icon svg, h3, p
  const container = document.querySelector('.pillars');
  if (!container) return;
  const data = (pillars && Array.isArray(pillars)) ? pillars : DEFAULT_PILLARS;

  const DEFAULT_ICONS = [
    'M14 24 L22 32 L34 18',
    'M14 18 L34 18 M14 24 L28 24 M14 30 L34 30',
    'M19 22 L29 16 M19 26 L29 32',
    'M24 6 L24 42 M6 24 L42 24',
    'M12 24 L24 12 L36 24 L24 36 Z',
    'M24 14 L24 34 M14 24 L34 24'
  ];

  container.innerHTML = data.map((p, i) => {
    const num    = String(i + 1).padStart(2, '0');
    
    // Use icon from database, or fallback to the high-fidelity default icon for this index
    let icon = p.icon || (DEFAULT_PILLARS[i] ? DEFAULT_PILLARS[i].icon : '');
    
    if (!icon || !icon.includes('<')) {
      // If still a legacy path or empty, use a sensible default path
      icon = `<path d="${icon || 'M14 24 L34 24'}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    }

    const title  = parseAccent(p.title || '');
    const desc   = parseAccent(p.desc  || '');
    return `
    <div class="pillar reveal">
      <div class="pillar-num">→ ${num}</div>
      <div class="pillar-icon">
        <svg viewBox="0 0 48 48">${icon}</svg>
      </div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>`;
  }).join('');
}
