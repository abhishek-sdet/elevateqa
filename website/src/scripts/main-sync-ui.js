/**
 * ELEVATE QA — MAIN SYNC UI MODULE
 * ==================================
 * Contains the syncEverything() function that maps LocalStorage data to DOM.
 * Extracted from main.js for maintainability.
 */
import { DEFAULT_MATURITY, DEFAULT_PILLARS, DEFAULT_AGENDA, DEFAULT_SPEAKERS } from './main-ui.js';

const parseAccent = (str) => String(str || '')
  .replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>')
  .replace(/==(.*?)==/g, '<span class="highlight">$1</span>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>');

const parseEm = (str) => String(str || '').replace(/\[\[(.*?)\]\]/g, '<em>$1</em>').replace(/\|/g, '<br>');

const setHtml = (id, val) => {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) {
    const targetStr = parseAccent(String(val));
    if (el.innerHTML !== targetStr) el.innerHTML = targetStr;
  }
};

window.syncEverything = () => {
  console.log('[ElevateQA] 🔄 Running Global Sync...');

  const site     = JSON.parse(localStorage.getItem('elevate_site_content'));
  const visuals  = JSON.parse(localStorage.getItem('elevate_visuals'));
  const speakers = JSON.parse(localStorage.getItem('elevate_speakers')) || [];
  const agenda   = JSON.parse(localStorage.getItem('elevate_agenda')) || [];
  const manifesto= JSON.parse(localStorage.getItem('elevate_manifesto')) || [];
  const maturity = JSON.parse(localStorage.getItem('elevate_maturity_stages')) || [];
  const pillars  = JSON.parse(localStorage.getItem('elevate_pillars')) || [];

  // ── Visuals ────────────────────────────────────────────────────────────────
  if (visuals) {
    const logoUrl = visuals.logo || './logo.png';
    document.querySelectorAll('.logo img, #footer-logo-img, #site-logo-img').forEach(img => {
      if (img.src !== logoUrl) {
        img.src = logoUrl;
        img.onerror = function() { this.src = './logo.png'; };
      }
    });
    if (visuals.primaryColor) {
      document.documentElement.style.setProperty('--accent', visuals.primaryColor);
    }
    if (visuals.heroBg) {
      const heroBg = document.querySelector('.hero-ambient img');
      if (heroBg && heroBg.src !== visuals.heroBg) heroBg.src = visuals.heroBg;
    }

    // Experience image carousel
    if (Array.isArray(visuals.strip)) {
      visuals.strip.forEach((item, i) => {
        const n   = String(i + 1).padStart(2, '0');
        const img = document.getElementById(`strip-img-${n}`);
        const cap = document.getElementById(`strip-cap-${n}`);
        if (img && item.img) img.src = item.img;
        if (cap) {
          const wrapper = cap.closest('.carousel-caption') || cap.closest('.caption');
          if (!item.cap || item.cap.trim() === '') {
            cap.textContent = '';
            if (wrapper) wrapper.style.display = 'none';
          } else {
            cap.textContent = item.cap;
            if (wrapper) wrapper.style.display = '';
          }
        }
      });
    }
  } else {
    document.querySelectorAll('.logo img, #footer-logo-img, #site-logo-img').forEach(img => {
      if (!img.src.includes('logo.png')) img.src = './logo.png';
    });
  }

  // ── Site Content ───────────────────────────────────────────────────────────
  if (site) {
    // MIGRATION: auto-fix edition strings
    let heroEd = site.heroEdition || '';
    if (!heroEd || heroEd.toUpperCase().includes('EDITION 01') || heroEd.toUpperCase().includes('EDITION 2') || heroEd.toUpperCase().includes('INAUGURAL')) {
      site.heroEdition = 'Edition 3';
    }
    let footerEd = site.footerEdition || '';
    if (!footerEd || footerEd.toUpperCase().includes('EDITION 01') || footerEd.toUpperCase().includes('EDITION 2') || footerEd.toUpperCase().includes('INAUGURAL')) {
      site.footerEdition = 'Edition 3';
    }
    if (site.stat1Num === '2nd' || site.stat1Num === '2' || !site.stat1Num) {
      site.stat1Num = '3rd';
    }
    if (site.eventDate && !site.eventDate.includes('Saturday')) {
      site.eventDate = 'Saturday, ' + site.eventDate;
    }

    // Hero
    const headline = site.heroHeadline || 'Elevate Quality. | Prove value.';
    const titleEl = document.getElementById('hero-title');
    if (titleEl) {
      const targetHtml = headline.split(/[|\n]/).filter(l => l.trim()).map(line =>
        `<span class="title-line"><span>${parseAccent(line)}</span></span>`
      ).join('');
      if (titleEl.innerHTML !== targetHtml) titleEl.innerHTML = targetHtml;
    }
    setHtml('hero-tagline', parseAccent(site.heroTagline));
    setHtml('hero-eyebrow', parseAccent(site.heroEyebrow));
    setHtml('hero-edition', parseAccent(site.heroEdition));
    if (site.heroCtaText) {
      const ctaBtn = document.getElementById('hero-cta-btn');
      if (ctaBtn) ctaBtn.innerHTML = `${site.heroCtaText} <span class="arrow">→</span>`;
    }
    setHtml('hero-format', parseEm(site.heroFormat));
    setHtml('hero-audience', parseEm(site.heroAudience));
    setHtml('hero-venue-bottom', parseEm(site.eventVenue));
    setHtml('hero-date-bottom', parseEm(site.eventDate));

    // Ticker
    for (let i = 1; i <= 9; i++) setHtml(`ticker-${i}`, site[`ticker${i}`]);

    // Stats
    [1, 2, 3, 4].forEach(i => {
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

    // Manifesto metadata
    setHtml('manifesto-section-num', site.manifestoSectionNum || '01 / Manifesto');
    setHtml('manifesto-pill', site.manifestoPill || 'Why now');
    setHtml('manifesto-aside-text', site.manifestoAside || 'A note from the <br>founder.');
    
    if (site.founderImg) {
      const founderImg = document.getElementById('manifesto-founder-photo');
      if (founderImg && founderImg.src !== site.founderImg) founderImg.src = site.founderImg;
    }

    // Nav labels
    if (site.navManifesto) setHtml('nav-manifesto', site.navManifesto);
    if (site.navMaturity)  setHtml('nav-maturity', site.navMaturity);
    if (site.navExperience)setHtml('nav-experience', site.navExperience);
    if (site.navAgenda)    setHtml('nav-agenda', site.navAgenda);
    if (site.navSpeakers)  setHtml('nav-speakers', site.navSpeakers);
    if (site.navJoin)      setHtml('nav-join', site.navJoin);

    setHtml('prizes-title', parseEm(site.prizesHeadline));
    setHtml('prizes-s1-val', site.prizesS1Num); setHtml('prizes-s1-text', site.prizesS1Lbl);
    setHtml('prizes-s2-val', site.prizesS2Num); setHtml('prizes-s2-text', site.prizesS2Lbl);
    setHtml('prizes-s3-val', site.prizesS3Num); setHtml('prizes-s3-text', site.prizesS3Lbl);

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
    setHtml('coming-visual-label', site.comingVisualLabel || 'REVEALING');
    setHtml('coming-visual-sub',   site.comingVisualSub   || 'Soon');
    for (let i = 1; i <= 6; i++) {
      setHtml(`coming-item${i}-label`,  site[`comingItem${i}Label`]);
      setHtml(`coming-item${i}-status`, site[`comingItem${i}Status`]);
    }

    // Footer
    let footerTagStr = site.footerTagline || "The proof of value, or it didn't happen.";
    if (!footerTagStr.includes('<em>') && !footerTagStr.includes('*')) {
      footerTagStr = footerTagStr.replace(/(or it didn't happen\.?)/i, '<em>$1</em>');
    }
    setHtml('footer-tagline', parseAccent(footerTagStr));
    setHtml('footer-location', site.footerLocation || 'Delhi-NCR, India');
    setHtml('footer-edition', site.footerEdition || 'Edition 3');
    setHtml('footer-copyright', site.footerCopyright || '<a href="https://sdettech.com" rel="noopener noreferrer">SDET Tech</a>');
    const fEmail = document.getElementById('footer-email');
    if (fEmail && site.footerEmail) {
      const mailHtml = `<a href="mailto:${site.footerEmail}" style="color: var(--accent); font-weight: 600;">${site.footerEmail}</a>`;
      if (fEmail.innerHTML !== mailHtml) fEmail.innerHTML = mailHtml;
    }

    // Navigation (secondary pass)
    ['manifesto', 'maturity', 'experience', 'agenda', 'speakers', 'join'].forEach(n => {
      const key = 'nav' + n.charAt(0).toUpperCase() + n.slice(1);
      if (site[key] && site[key].trim() !== '') setHtml(`nav-${n}`, site[key]);
    });
  }

  // ── Manifesto Content ──────────────────────────────────────────────────────
  if (manifesto && manifesto[0]) {
    const wrap = document.getElementById('manifesto-text');
    if (wrap && manifesto[0].content) {
      const lines = manifesto[0].content.split(/[|\n]/).filter(l => l.trim());
      const targetHtml = lines.map(line => `<p class="reveal">${parseAccent(line)}</p>`).join('');
      if (wrap.innerHTML !== targetHtml) wrap.innerHTML = targetHtml;
    }
  }

  // ── Maturity Stages ────────────────────────────────────────────────────────
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
      if (grid.innerHTML !== targetHtml) grid.innerHTML = targetHtml;
    }
  }

  // ── Experience Pillars ─────────────────────────────────────────────────────
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
      if (grid.innerHTML !== targetHtml) grid.innerHTML = targetHtml;
    }
  }

  // ── Agenda ─────────────────────────────────────────────────────────────────
  const finalAgenda = (agenda && agenda.length > 0) ? agenda : DEFAULT_AGENDA;
  if (finalAgenda.length > 0) {
    const timeline = document.querySelector('.timeline');
    if (timeline) {
      const escapeHtml = (val) => String(val || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const targetHtml = finalAgenda.map(item => {
        const titleLower = item.title?.toLowerCase() || '';
        const tagLower   = item.tag?.toLowerCase() || '';
        const isFeatured = tagLower.includes('keynote') || tagLower.includes('closing') || titleLower.includes('keynote') || titleLower.includes('closing') || titleLower.includes('remarks');
        const isBreak    = tagLower.includes('break') || tagLower.includes('tea') || tagLower.includes('lunch') || tagLower.includes('coffee') || titleLower.includes('break') || titleLower.includes('tea') || titleLower.includes('lunch') || titleLower.includes('coffee');
        const rowClass   = `timeline-row reveal${isFeatured ? ' featured' : ''}${isBreak ? ' break' : ''}`;
        const cleanTag   = item.tag ? item.tag.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        const tagClass   = `tag${cleanTag ? ' tag-' + cleanTag : ''}`;
        return `
        <div class="${rowClass}">
          <div class="timeline-time">${item.time_slot || item.time}</div>
          <div class="timeline-content">
            <span class="${tagClass}" style="${item.tag ? '' : 'display:none;'}">${item.tag || ''}</span>
            <h4>${parseEm(item.title)}</h4>
            ${item.speaker_name ? `<div class="timeline-speaker">By <strong>${escapeHtml(item.speaker_name)}</strong></div>` : ''}
            <p class="desc">${item.desc || ''}</p>
          </div>
        </div>`;
      }).join('');
      if (timeline.innerHTML !== targetHtml) timeline.innerHTML = targetHtml;
    }
  }

  // ── Speakers ───────────────────────────────────────────────────────────────
  let finalSpeakers = speakers;
  if (finalSpeakers && Array.isArray(finalSpeakers) && finalSpeakers.length === 0) {
    const placeholderText = site?.speakersPlaceholder || 'To be revealed';
    finalSpeakers = [
      { name: placeholderText, role: 'KEYNOTE', wave: 'WAVE 01', silhouette: '01' },
      { name: placeholderText, role: 'KEYNOTE', wave: 'WAVE 01', silhouette: '02' },
      { name: placeholderText, role: 'KEYNOTE', wave: 'WAVE 01', silhouette: '03' }
    ];
  } else if (!finalSpeakers || !Array.isArray(finalSpeakers)) {
    finalSpeakers = DEFAULT_SPEAKERS;
  }
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
            <div class="pitch">Have a story <em>worth telling?</em><br><a href="javascript:void(0)" onclick="window.openSpeakFlow()">Apply to speak ></a></div>
          </div>`;
      if (grid.innerHTML !== targetHtml) grid.innerHTML = targetHtml;
    }
  }

  // Re-observe any newly injected .reveal elements
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
