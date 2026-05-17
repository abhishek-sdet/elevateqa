/**
 * ELEVATE QA 2026 - ADMIN CORE ENGINE
 * Main orchestrator for UI management and data flow.
 */
import { 
  loadAllData, 
  saveSiteContent, 
  saveBranding, 
  saveManifesto,
  saveSpeaker,
  saveAgendaItem,
  saveMaturityStage,
  savePillar,
  deleteItem,
  uploadImageToStorage
} from './admin-supabase.js';

// GLOBAL STATE FOR PENDING VISUALS
window._visualData = {
  heroBg: null,
  logo: null,
  strip01Img: null,
  strip02Img: null,
  strip03Img: null
};

const MAX_IMAGE_SIZE_MB = 1.5;
const MAX_FILE_SIZE_MB = 2.0;

// ─── GLOBAL FUNCTIONS (EXPOSED TO HTML) ─────────────────────────────────────
// We define these at the top to avoid hoisting issues in modules.

window.logout = () => {
  sessionStorage.removeItem('admin_logged_in');
  location.href = location.pathname; // clear hash on logout
};

window.toggleSidebar = () => {
  const isActive = document.body.classList.toggle('sidebar-active');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) backdrop.classList.toggle('active', isActive);
  const toggle = document.getElementById('admin-menu-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', String(isActive));
};

window.triggerVisualUpload = (id) => {
  document.getElementById(`upload-${id}`)?.click();
};

window.showSection = (id) => {
  const sections = ['attendance', 'identity', 'agenda', 'speakers', 'visuals', 'intelligence', 'settings'];
  // Fallback to 'attendance' if id is not a valid section
  const activeId = sections.includes(id) ? id : 'attendance';

  sections.forEach(s => {
    const el = document.getElementById(`sec-${s}`);
    const nav = document.getElementById(`nav-${s}`);
    if (el) el.style.display = (s === activeId) ? 'block' : 'none';
    if (nav) nav.classList.toggle('active', s === activeId);
  });

  // Persist in BOTH sessionStorage AND URL hash for refresh resilience
  sessionStorage.setItem('admin_active_tab', activeId);
  // Update hash without triggering a scroll/reload
  history.replaceState(null, '', `#${activeId}`);

  const titles = {
    attendance: ['Attendee Command', 'Real-time registration tracking and verification.'],
    identity: ['Site Identity', 'Manage taglines, hero content, and about sections.'],
    agenda: ['Event Agenda', 'Organize sessions, timestamps, and topics.'],
    speakers: ['Speaker Roster', 'Curate your featured voices and credentials.'],
    visuals: ['Visual Assets', 'Upload atmosphere graphics and background media.'],
    intelligence: ['AI Intelligence', 'Configure your event\'s artificial intelligence brain.'],
    settings: ['Platform Settings', 'Configure administrative security and data.']
  };

  const titleEl = document.getElementById('page-title');
  const descEl = document.getElementById('page-desc');
  if (titleEl && titles[activeId]) {
    const parts = titles[activeId][0].split(' ');
    titleEl.innerHTML = `${parts[0]} <em>${parts[1] || ''}</em>`;
    if (descEl) descEl.textContent = titles[activeId][1];
  }
  // Sidebar close on mobile is handled by the inline bootstrap script in index.html
};

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('admin-preloader');
  if (preloader) {
    preloader.style.display = 'flex';
    preloader.classList.remove('dismissed');
  }

  // Use Event-Based Auth for 100% Reliability
  window.supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`[ElevateAuth] State Change: ${event}`);
    
    const loginState = sessionStorage.getItem('admin_logged_in');
    
    if (session || loginState === 'true') {
      // 🛡️ SECURITY: Verify whitelist one last time
      const userEmail = session?.user?.email || '';
      const isAllowed = ['abhishek.johri@sdettech.com'].includes(userEmail) || loginState === 'true';

      if (isAllowed) {
        window.startSync();
      } else {
        window.logout();
      }
    } else {
      // Not logged in — show overlay
      if (preloader) preloader.classList.add('dismissed');
      const loginOverlay = document.getElementById('login-overlay') || document.getElementById('admin-login-overlay');
      if (loginOverlay) {
        loginOverlay.style.display = 'flex';
        loginOverlay.style.opacity = '1';
      }
    }
  });
  
  console.log('[ElevateQA] Admin Core Initialized (Event-Driven)');
});

window.startSync = async () => {
  // 1. Show Protected UI
  showProtectedContent();
  
  // 2. Restore active section
  const hashSection = location.hash.replace('#', '').trim();
  const savedTab = sessionStorage.getItem('admin_active_tab');
  const startTab = hashSection || savedTab || 'attendance';
  window.showSection(startTab);

  // 3. Show Preloader explicitly for sync
  const preloader = document.getElementById('admin-preloader');
  if (preloader) {
    preloader.classList.remove('dismissed');
    preloader.style.display = 'flex';
  }

  // 4. Fetch Data
  await initData();

  // 5. Dismiss preloader with smoothness
  setTimeout(() => {
    if (preloader) {
      preloader.classList.add('dismissed');
      setTimeout(() => preloader.style.display = 'none', 600);
    }
  }, 500);
};

window.renderAttendees = (registrations) => {
  const tbody = document.getElementById('attendee-table');
  const countBadge = document.getElementById('attendee-count');
  if (!tbody) return;

  const atts = registrations || [];
  if (countBadge) countBadge.textContent = `${atts.length} registered`;

  if (atts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--ink-dim);">No registrations found</td></tr>';
    return;
  }

  tbody.innerHTML = atts.map((p) => {
    return `
      <tr data-id="${p.id}">
        <td>${p.name || '—'}</td>
        <td>${p.company || '—'}</td>
        <td>${p.email || '—'}</td>
        <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
        <td>${p.status === 'PRESENT' ? '<span class="badge" style="background:var(--accent); color:#000;">Present</span>' : '<span class="badge">Verified</span>'}</td>
        <td style="text-align: right;">
          <button class="btn-mini" onclick="deleteAttendee('${p.id}')" title="Delete Registration" style="color:var(--accent-red); border-color:rgba(255,90,54,0.2);">✕</button>
        </td>
      </tr>
    `;
  }).join('');
};

window.deleteAttendee = async (id) => {
  const confirmed = await window.showConfirm("Are you sure you want to delete this registration? This cannot be undone.", "Delete Registration", "DELETE");
  if (!confirmed) return;

  const success = await deleteItem('registrations', id);
  if (success) {
    window.showToast("Registration deleted successfully", "success");
    // Refresh the list
    const data = await loadAllData();
    if (data && data.registrations) window.renderAttendees(data.registrations);
  } else {
    window.showToast("Failed to delete registration", "error");
  }
};

window.exportAttendees = () => {
  const table = document.getElementById('attendee-table');
  if (!table) return;
  
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0 || rows[0].innerText.includes("No registrations")) {
    window.showToast("No data to export", "info");
    return;
  }

  const data = rows.map(row => {
    const cells = row.querySelectorAll('td');
    return {
      name: cells[0]?.innerText,
      company: cells[1]?.innerText,
      email: cells[2]?.innerText,
      registered: cells[3]?.innerText
    };
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `elevate_attendees_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  window.showToast("Exported registration database", "success");
};

async function initData() {
  // Show loading overlay while fetching from Supabase
  const overlay = _showLoadingOverlay();
  try {
    const data = await loadAllData();
    populateUI(data);
  } catch(e) {
    console.error('[ElevateAdmin] initData error:', e);
  } finally {
    _hideLoadingOverlay(overlay);
  }
}

function _showLoadingOverlay() {
  let overlay = document.getElementById('admin-data-loader');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'admin-data-loader';
    overlay.innerHTML = `
      <div class="loader-visual">
        <div class="loader-orbit"></div>
        <div class="loader-orbit-outer"></div>
      </div>
      <p class="loader-text">Syncing System Data...</p>
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.opacity = '1';
  overlay.style.display = 'flex';
  return overlay;
}

function _hideLoadingOverlay(overlay) {
  if (!overlay) return;
  overlay.style.opacity = '0';
  setTimeout(() => { 
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay); 
  }, 500);
}

function populateUI(data) {
  const { siteContent, speakers, agenda, maturity, pillars, manifesto } = data;
  
  // Set global visuals
  window._visualData = {
    heroBg: siteContent.heroBg || null,
    logo: siteContent.logoUrl || null,
    strip01Img: siteContent.strip01Img || null,
    strip02Img: siteContent.strip02Img || null,
    strip03Img: siteContent.strip03Img || null
  };

  // Populate form fields
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      if (val !== undefined && val !== null && val !== '') {
        el.value = val;
      } else {
        el.value = el.placeholder || '';
      }
    }
  };

  setVal('hero-headline', siteContent.hero_headline);
  setVal('hero-tagline', siteContent.hero_tagline);
  setVal('hero-eyebrow', siteContent.hero_eyebrow);
  setVal('hero-edition', siteContent.hero_edition);
  setVal('event-date', siteContent.event_date);
  setVal('event-venue', siteContent.event_venue);
  setVal('hero-meta', siteContent.heroMetaText || siteContent.hero_meta);
  setVal('hero-format', siteContent.heroFormat);
  setVal('hero-audience', siteContent.heroAudience);
  setVal('hero-cta-text', siteContent.heroCtaText);
  
  // Stats
  setVal('stat1-num', siteContent.stat1Num); setVal('stat1-lbl', siteContent.stat1Lbl);
  setVal('stat2-num', siteContent.stat2Num); setVal('stat2-lbl', siteContent.stat2Lbl);
  setVal('stat3-num', siteContent.stat3Num); setVal('stat3-lbl', siteContent.stat3Lbl);
  setVal('stat4-num', siteContent.stat4Num); setVal('stat4-lbl', siteContent.stat4Lbl);

  // Tickers
  for (let i = 1; i <= 8; i++) setVal(`ticker-${i}`, siteContent[`ticker${i}`]);

  // Manifesto & Sections
  setVal('manifesto-pill', siteContent.manifestoPill);
  setVal('manifesto-aside', siteContent.manifestoAside);
  setVal('speakers-section-title', siteContent.speakersSectionTitle);
  setVal('speakers-intro', siteContent.speakersIntro);

  // Involve
  setVal('involve-title', siteContent.involveTitle);
  for (let i = 1; i <= 3; i++) {
    setVal(`involve-card${i}-title`, siteContent[`involveCard${i}Title`]);
    setVal(`involve-card${i}-desc`, siteContent[`involveCard${i}Desc`]);
  }

  // Prizes
  setVal('prizes-headline', siteContent.prizesHeadline);
  setVal('prizes-s1-num', siteContent.prizesS1Num); setVal('prizes-s1-lbl', siteContent.prizesS1Lbl);
  setVal('prizes-s2-num', siteContent.prizesS2Num); setVal('prizes-s2-lbl', siteContent.prizesS2Lbl);
  setVal('prizes-s3-num', siteContent.prizesS3Num); setVal('prizes-s3-lbl', siteContent.prizesS3Lbl);

  // Coming Soon
  setVal('coming-title', siteContent.comingTitle);
  setVal('coming-desc', siteContent.comingDesc);
  for (let i = 1; i <= 6; i++) setVal(`coming-item${i}-status`, siteContent[`comingItem${i}Status`]);

  // Footer & Nav
  setVal('footer-tagline', siteContent.footerTagline);
  setVal('footer-location', siteContent.footerLocation);
  setVal('footer-edition', siteContent.footerEdition);
  setVal('nav-manifesto', siteContent.navManifesto);
  setVal('nav-maturity', siteContent.navMaturity);
  setVal('nav-experience', siteContent.navExperience);
  setVal('nav-agenda', siteContent.navAgenda);
  setVal('nav-speakers', siteContent.navSpeakers);
  setVal('nav-join', siteContent.navJoin);

  // Modal
  setVal('modal-price-scarcity', siteContent.modalPriceScarcity);
  setVal('modal-price-old', siteContent.modalPriceOld);
  setVal('modal-price-new', siteContent.modalPriceNew);
  setVal('modal-price-caption', siteContent.modalPriceCaption);
  setVal('modal-price-btn', siteContent.modalPriceBtn);
  setVal('modal-form-title', siteContent.modalFormTitle);
  setVal('modal-form-desc', siteContent.modalFormDesc);

  // Titles
  setVal('maturity-title', siteContent.maturityTitle);
  setVal('pillars-title', siteContent.pillarsTitle);

  setVal('visual-logo-height', siteContent.logo_height);
  setVal('set-color-primary', siteContent.primary_color);
  setVal('set-color-accent', siteContent.accent_color);

  // Set Sidebar & Preloader Logos
  const logoUrl = siteContent.logo_url;
  if (logoUrl) {
    const sLogo = document.getElementById('admin-sidebar-logo');
    if (sLogo) sLogo.src = logoUrl;
    const pLogo = document.getElementById('admin-preloader-logo');
    if (pLogo) pLogo.src = logoUrl;
  }

  setVal('manifesto-lines', manifesto.content);

  // Dynamic Lists
  if (data.maturity) {
    const mCont = document.getElementById('maturity-stages-admin');
    if (mCont) { mCont.innerHTML = ''; data.maturity.forEach(m => window.addMaturityItem(m)); }
  }
  if (data.pillars) {
    const pCont = document.getElementById('pillars-admin');
    if (pCont) { pCont.innerHTML = ''; data.pillars.forEach(p => window.addPillarItem(p)); }
  }

  // Lists
  if (data.speakers) {
    const container = document.getElementById('speaker-list');
    if (container) {
      container.innerHTML = '';
      data.speakers.forEach(s => window.addSpeakerItem(s));
    }
  }
  if (data.agenda) {
    const container = document.getElementById('agenda-list');
    if (container) {
      container.innerHTML = '';
      data.agenda.forEach(a => window.addAgendaItem(a));
    }
  }

  // Update Visual Previews
  updateVisualPreviews();

  if (data.registrations) {
    window.renderAttendees(data.registrations);
  }
}

function updateVisualPreviews() {
  const updateImg = (id, src) => {
    const wrap = document.getElementById(`upload-${id}`)?.previousElementSibling;
    if (wrap && src) {
      wrap.classList.add('has-img');
      const img = wrap.querySelector('img');
      if (img) {
        img.src = src;
        img.style.display = 'block';
      }
    }
  };
  updateImg('hero-bg', window._visualData.heroBg);
  updateImg('logo', window._visualData.logo);
}

// SAVE ALL
window.saveAll = async () => {
  console.log('[ElevateAdmin] Starting Global Sync...');
  const btn = document.getElementById('btn-publish');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Syncing Everything...';
  btn.disabled = true;

  try {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const results = [];

    // 1. Site Content
    const siteData = {
      heroHeadline: getVal('hero-headline'),
      heroTagline: getVal('hero-tagline'),
      heroEyebrow: getVal('hero-eyebrow'),
      heroEdition: getVal('hero-edition'),
      eventDate: getVal('event-date'),
      eventVenue: getVal('event-venue'),
      heroMeta: getVal('hero-meta'),
      heroFormat: getVal('hero-format'),
      heroAudience: getVal('hero-audience'),
      heroCtaText: getVal('hero-cta-text'),
      heroBg: window._visualData.heroBg,
      strip01Img: window._visualData.strip01Img, strip01Cap: getVal('strip-01-caption'),
      strip02Img: window._visualData.strip02Img, strip02Cap: getVal('strip-02-caption'),
      strip03Img: window._visualData.strip03Img, strip03Cap: getVal('strip-03-caption'),
      // Stats Bar
      stat1Num: getVal('stat1-num'), stat1Lbl: getVal('stat1-lbl'),
      stat2Num: getVal('stat2-num'), stat2Lbl: getVal('stat2-lbl'),
      stat3Num: getVal('stat3-num'), stat3Lbl: getVal('stat3-lbl'),
      stat4Num: getVal('stat4-num'), stat4Lbl: getVal('stat4-lbl'),
      // Tickers
      ticker1: getVal('ticker-1'), ticker2: getVal('ticker-2'),
      ticker3: getVal('ticker-3'), ticker4: getVal('ticker-4'),
      ticker5: getVal('ticker-5'), ticker6: getVal('ticker-6'),
      ticker7: getVal('ticker-7'), ticker8: getVal('ticker-8'),
      // Sections
      manifestoPill: getVal('manifesto-pill'),
      manifestoAside: getVal('manifesto-aside'),
      speakersSectionTitle: getVal('speakers-section-title'),
      speakersIntro: getVal('speakers-intro'),
      involveTitle: getVal('involve-title'),
      involveCard1Title: getVal('involve-card1-title'), involveCard1Desc: getVal('involve-card1-desc'),
      involveCard2Title: getVal('involve-card2-title'), involveCard2Desc: getVal('involve-card2-desc'),
      involveCard3Title: getVal('involve-card3-title'), involveCard3Desc: getVal('involve-card3-desc'),
      prizesHeadline: getVal('prizes-headline'),
      prizesS1Num: getVal('prizes-s1-num'), prizesS1Lbl: getVal('prizes-s1-lbl'),
      prizesS2Num: getVal('prizes-s2-num'), prizesS2Lbl: getVal('prizes-s2-lbl'),
      prizesS3Num: getVal('prizes-s3-num'), prizesS3Lbl: getVal('prizes-s3-lbl'),
      comingTitle: getVal('coming-title'),
      comingDesc: getVal('coming-desc'),
      comingItem1Status: getVal('coming-item1-status'),
      comingItem2Status: getVal('coming-item2-status'),
      comingItem3Status: getVal('coming-item3-status'),
      comingItem4Status: getVal('coming-item4-status'),
      comingItem5Status: getVal('coming-item5-status'),
      comingItem6Status: getVal('coming-item6-status'),
      // Footer & Nav
      footerTagline: getVal('footer-tagline'),
      footerLocation: getVal('footer-location'),
      footerEdition: getVal('footer-edition'),
      navManifesto: getVal('nav-manifesto'),
      navMaturity: getVal('nav-maturity'),
      navExperience: getVal('nav-experience'),
      navAgenda: getVal('nav-agenda'),
      navSpeakers: getVal('nav-speakers'),
      navJoin: getVal('nav-join'),
      // Modal
      modalPriceScarcity: getVal('modal-price-scarcity'),
      modalPriceOld: getVal('modal-price-old'),
      modalPriceNew: getVal('modal-price-new'),
      modalPriceCaption: getVal('modal-price-caption'),
      modalPriceBtn: getVal('modal-price-btn'),
      modalFormTitle: getVal('modal-form-title'),
      modalFormDesc: getVal('modal-form-desc'),
      // Maturity & Pillars Titles
      maturityTitle: getVal('maturity-title'),
      pillarsTitle: getVal('pillars-title')
    };
    results.push(await saveSiteContent(siteData));

    // 2. Branding
    results.push(await saveBranding({
      logoUrl: window._visualData.logo,
      logoHeight: getVal('visual-logo-height'),
      primaryColor: getVal('set-color-primary'),
      accentColor: getVal('set-color-accent')
    }));

    // 3. Manifesto
    results.push(await saveManifesto({ content: getVal('manifesto-lines') }));

    // 4. Speakers
    const speakerEls = Array.from(document.querySelectorAll('#speaker-list .dynamic-item'));
    console.log(`[ElevateAdmin] Syncing ${speakerEls.length} speakers...`);
    for (const [i, el] of speakerEls.entries()) {
      const sData = {
        id: el.getAttribute('data-id'),
        name: el.querySelector('.s-name').value,
        role: el.querySelector('.s-role').value,
        status: el.querySelector('.s-status').value,
        title: el.querySelector('.s-title') ? el.querySelector('.s-title').value : '',
        // Prefer the permanent storage URL; fall back to src (for already-saved images)
        img: el.querySelector('.img-upload-wrap img')?.dataset.storageUrl
          || el.querySelector('.img-upload-wrap img')?.src
          || '',
        display_order: i
      };
      results.push(await saveSpeaker(sData));
    }

    // 5. Agenda
    const agendaEls = Array.from(document.querySelectorAll('#agenda-list .dynamic-item'));
    for (const [i, el] of agendaEls.entries()) {
      results.push(await saveAgendaItem({
        id: el.getAttribute('data-id'),
        time: el.querySelector('.a-time').value,
        tag: el.querySelector('.a-tag').value,
        title: el.querySelector('.a-title').value,
        desc: el.querySelector('.a-desc').value,
        display_order: i
      }));
    }

    // 6. Maturity Stages
    const maturityEls = Array.from(document.querySelectorAll('#maturity-stages-admin .dynamic-item'));
    for (const [i, el] of maturityEls.entries()) {
      results.push(await saveMaturityStage({
        id: el.getAttribute('data-id'),
        label: el.querySelector('.m-label').value,
        name: el.querySelector('.m-name').value,
        pct: el.querySelector('.m-pct').value,
        desc: el.querySelector('.m-desc').value,
        color: el.querySelector('.m-color').value,
        display_order: i
      }));
    }

    // 7. Experience Pillars
    const pillarEls = Array.from(document.querySelectorAll('#pillars-admin .dynamic-item'));
    for (const [i, el] of pillarEls.entries()) {
      results.push(await savePillar({
        id: el.getAttribute('data-id'),
        title: el.querySelector('.p-title').value,
        desc: el.querySelector('.p-desc').value,
        icon: el.querySelector('.p-icon').value,
        display_order: i
      }));
    }

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (results.every(r => r === true)) {
      window.showToast('Your changes have been successfully synced to the cloud.', 'success', '100% Synced');
      // Force local cache refresh so other tabs (and the current UI) stay in sync
      loadAllData();
    } else {
      window.showToast('Some items failed to sync. Check console for details.', 'error', 'Partial Sync');
    }

  } catch (err) {
    console.error('[ElevateAdmin] Save Error:', err);
    btn.innerHTML = 'Error! Try Again';
    btn.disabled = false;
    window.showToast('Critical error during sync.', 'error', 'Sync Failed');
  }
};

// UI HELPERS
window.addSpeakerItem = (data = { id: null, name: '', role: '', img: '', status: '' }) => {
  const container = document.getElementById('speaker-list');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.setAttribute('data-id', data.id || '');
  div.innerHTML = `
    <div class="dynamic-header">
       <div class="badge">Speaker Node</div>
       <button class="btn-del" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
    <div class="form-grid-2">
      <div class="speaker-img-column">
        <label>Speaker Photo</label>
        <div class="img-upload-wrap ${data.img || data.image_url ? 'has-img' : ''}" onclick="this.nextElementSibling.click()">
          <img
            src="${data.img || data.image_url || ''}"
            data-storage-url="${data.img || data.image_url || ''}"
            alt="Preview"
            style="display: ${data.img || data.image_url ? 'block' : 'none'}">
          <div class="placeholder">Click to replace</div>
        </div>
        <input type="file" class="s-img-input" accept="image/*" style="display:none;" onchange="window.handleSpeakerImg(this)">
      </div>
      <div class="speaker-info-column">
        <div class="form-group"><label>Full Name</label><input type="text" class="s-name" value="${data.name}" placeholder="Kapil Dev"></div>
        <div class="form-group"><label>Role / Badge</label><input type="text" class="s-role" value="${data.role}" placeholder="e.g. KEYNOTE"></div>
        <div class="form-group"><label>Professional Designation</label><input type="text" class="s-title" value="${data.title || ''}" placeholder="e.g. CEO at SDET TECH"></div>
        <div class="form-group"><label>Status Label</label><input type="text" class="s-status" value="${data.status || 'CONFIRMED'}" placeholder="e.g. CONFIRMED"></div>
      </div>
    </div>
  `;
  container.appendChild(div);
};

window.addAgendaItem = (data = { id: null, time_slot: '', tag: '', title: '', desc: '' }) => {
  const container = document.getElementById('agenda-list');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.setAttribute('data-id', data.id || '');
  div.innerHTML = `
    <div class="form-grid-2">
      <div class="form-group"><label>Time</label><input type="text" class="a-time" value="${data.time_slot || ''}" placeholder="09:00"></div>
      <div class="form-group"><label>Tag</label><input type="text" class="a-tag" value="${data.tag || ''}" placeholder="Keynote"></div>
    </div>
    <div class="form-group"><label>Topic Title</label><input type="text" class="a-title" value="${data.title || ''}" placeholder="The Proof of Value"></div>
    <div class="form-group"><label>Description</label><textarea class="a-desc" rows="2">${data.desc || ''}</textarea></div>
    <button class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(div);
};

// ─── IMAGE HANDLING — uses Supabase Storage, NOT base64 ─────────────────────
// Shows an instant local preview, then uploads to storage in the background.
// Only the permanent CDN URL is stored in the DB / _visualData.

window.handleSpeakerImg = async (input) => {
  const file = input.files[0];
  if (!file) return;

  if (file.size / (1024 * 1024) > MAX_IMAGE_SIZE_MB) {
    alert(`Image is too large. Max ${MAX_IMAGE_SIZE_MB} MB.`);
    input.value = '';
    return;
  }

  const wrap = input.previousElementSibling;
  const img = wrap.querySelector('img');

  // ① Instant local preview (blob URL, never stored in DB)
  const localPreview = URL.createObjectURL(file);
  wrap.classList.add('has-img');
  img.src = localPreview;
  img.style.display = 'block';
  img.dataset.storageUrl = ''; // clear until upload completes

  // Show uploading state
  wrap.style.opacity = '0.6';
  wrap.title = 'Uploading…';

  // ② Upload to Supabase Storage
  const ext = file.name.split('.').pop().toLowerCase();
  const safeName = `speakers/${Date.now()}.${ext}`;
  const publicUrl = await uploadImageToStorage(file, safeName);

  wrap.style.opacity = '1';
  wrap.title = '';

  if (publicUrl) {
    // ③ Swap preview to the real CDN URL
    img.src = publicUrl;
    img.dataset.storageUrl = publicUrl;
    URL.revokeObjectURL(localPreview);
    console.log('[Admin] Speaker image uploaded:', publicUrl);
  } else {
    // Upload failed — revert preview
    wrap.classList.remove('has-img');
    img.style.display = 'none';
    img.src = '';
    img.dataset.storageUrl = '';
    URL.revokeObjectURL(localPreview);
    window.showToast('Image upload failed. Check console and try again.', 'error', 'Upload Failed');
  }
};

window.handleVisualUpload = async (input, id) => {
  const file = input.files[0];
  if (!file) return;

  if (file.size / (1024 * 1024) > MAX_IMAGE_SIZE_MB) {
    alert(`Image is too large. Max ${MAX_IMAGE_SIZE_MB} MB.`);
    input.value = '';
    return;
  }

  const wrap = input.previousElementSibling;
  const img = wrap.querySelector('img');

  // ① Instant local preview
  const localPreview = URL.createObjectURL(file);
  wrap.classList.add('has-img');
  img.src = localPreview;
  img.style.display = 'block';

  // Show uploading state
  wrap.style.opacity = '0.6';
  wrap.title = 'Uploading…';

  // ② Upload to Supabase Storage
  const folder = id === 'logo' ? 'branding' : 'visuals';
  const ext = file.name.split('.').pop().toLowerCase();
  const safeName = `${folder}/${id}_${Date.now()}.${ext}`;
  const publicUrl = await uploadImageToStorage(file, safeName);

  wrap.style.opacity = '1';
  wrap.title = '';

  if (publicUrl) {
    // ③ Swap to real CDN URL and persist in global state
    img.src = publicUrl;
    URL.revokeObjectURL(localPreview);

    if (id === 'hero-bg')  window._visualData.heroBg     = publicUrl;
    if (id === 'logo')     window._visualData.logo        = publicUrl;
    if (id === 'strip-01') window._visualData.strip01Img  = publicUrl;
    if (id === 'strip-02') window._visualData.strip02Img  = publicUrl;
    if (id === 'strip-03') window._visualData.strip03Img  = publicUrl;

    console.log(`[Admin] Visual '${id}' uploaded:`, publicUrl);
    window.showToast('Image uploaded successfully!', 'success', 'Upload Done');
  } else {
    // Upload failed — revert preview
    wrap.classList.remove('has-img');
    img.style.display = 'none';
    img.src = '';
    URL.revokeObjectURL(localPreview);
    window.showToast('Image upload failed. Check console and try again.', 'error', 'Upload Failed');
  }
};

// TOAST SYSTEM
window.showToast = (msg, type = 'success', title = 'Notice') => {
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-msg">${msg}</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 4000);
};

function showProtectedContent() {
  document.getElementById('admin-login-overlay').style.display = 'none';
  document.getElementById('protected-content').style.display = 'block';
}

window.logout = () => {
  window.supabase.auth.signOut();
  sessionStorage.removeItem('admin_logged_in');
  location.href = location.pathname;
};
