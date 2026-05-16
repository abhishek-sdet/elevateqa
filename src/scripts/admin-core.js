/**
 * ELEVATE QA 2026 - ADMIN CORE ENGINE (SUPABASE MODULE)
 */
import { supabase } from './supabase-config.js';
import './admin-auth.js'; 
import { 
  loadAllData, saveBranding, saveSiteContent, saveManifesto, saveSpeaker, saveAgendaItem, 
  saveMaturityStage, savePillar, deleteItem, uploadImageToStorage, syncTableDeletes
} from './admin-supabase.js';

// 🛡️ SECURITY: Unified Admin Whitelist (Dynamic)
let ALLOWED_ADMINS = [
  'abhishek.johri@sdettech.com',
  'abhishekjohri150@gmail.com',
  'elevateqa@sdettech.com'
];

window.addAdminEmail = (email = '') => {
  const container = document.getElementById('admin-emails-list');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dynamic-row';
  div.style.marginBottom = '12px';
  div.innerHTML = `
    <div class="form-group" style="flex:1;">
      <input type="email" class="admin-email-entry" value="${email}" placeholder="admin@example.com">
    </div>
    <button class="btn-del" onclick="this.parentElement.remove()" title="Remove Admin">✕</button>
  `;
  container.appendChild(div);
};

window._visualData = {
  logo: '',
  heroBg: '',
  strip: ['', '', '']
};

window.showToast = (message, type = 'success', title = '') => {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'OK' : type === 'error' ? 'ERR' : 'INFO';
  const displayTitle = title || (type === 'success' ? 'Command Successful' : type === 'error' ? 'System Error' : 'Notification');

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${displayTitle}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 500);
  }, 4000);
};

window.showConfirm = (message, title = 'Are you sure?', btnText = 'PROCEED') => {
  return new Promise((resolve) => {
    let modal = document.getElementById('confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.className = 'premium-modal-overlay';
      modal.innerHTML = `
        <div class="premium-modal">
          <div class="modal-glow"></div>
          <div class="modal-content">
            <h3 id="confirm-title" class="modal-title"></h3>
            <p id="confirm-msg" class="modal-text"></p>
            <div class="modal-actions">
              <button id="confirm-cancel" class="btn-cancel">CANCEL</button>
              <button id="confirm-ok" class="btn-confirm"></button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('confirm-title').innerHTML = title;
    document.getElementById('confirm-msg').textContent = message;
    const okBtn = document.getElementById('confirm-ok');
    okBtn.textContent = btnText;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    
    const cleanup = (val) => {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
        resolve(val);
      }, 400);
    };

    okBtn.onclick = () => cleanup(true);
    document.getElementById('confirm-cancel').onclick = () => cleanup(false);
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[ElevateQA] Admin Core Initialized (Supabase Mode)');
  const data = await loadAllData();
  if (data) {
    window._lastLoadedData = data; // Cache globally for tab-click population
    populateUI(data);
  }
  window.checkSession();

  // Wire hamburger toggle (non-module safe fallback)
  const toggle = document.getElementById('admin-menu-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    document.body.classList.add('sidebar-active');
    if (backdrop) backdrop.classList.add('active');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    document.body.classList.remove('sidebar-active');
    if (backdrop) backdrop.classList.remove('active');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      document.body.classList.contains('sidebar-active') ? closeSidebar() : openSidebar();
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }
  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.addEventListener('click', function () {
      if (window.innerWidth <= 1024) closeSidebar();
    });
  });

  // Restore active section — priority: URL hash > sessionStorage > default
  const hashSection = location.hash.replace('#', '').trim();
  const savedTab = sessionStorage.getItem('admin_active_tab');
  const startTab = hashSection || savedTab || 'attendance';
  window.showSection(startTab);

  // --- REAL-TIME REGISTRATION SYNC ---
  console.log('[ElevateQA] Enabling Real-time Registration Sync...');
  supabase
    .channel('admin-registrations-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, async (payload) => {
      console.log('[ElevateQA] Registration Change Detected:', payload);
      const updatedData = await loadAllData();
      if (updatedData && updatedData.registrations) {
        window.renderAttendees(updatedData.registrations);
        if (payload.eventType === 'INSERT') {
          window.showToast(`New registration: ${payload.new.name}`, 'info', 'Real-time Update');
        }
      }
    })
    .subscribe((status) => {
      console.log('[ElevateQA] Registration Sync Status:', status);
    });

  // Dismiss preloader with a slight delay for smoothness
  setTimeout(() => {
    const preloader = document.getElementById('admin-preloader');
    if (preloader) {
      preloader.classList.add('dismissed');
      setTimeout(() => preloader.remove(), 600);
    }
  }, 400);
});

window.showPass = (id, name, email) => {
  const modal = document.getElementById('qr-modal');
  const target = document.getElementById('qr-target');
  const nameEl = document.getElementById('qr-attendee-name');
  const emailEl = document.getElementById('qr-attendee-email');

  if (!modal || !target) return;

  target.innerHTML = '';
  // Generate high-resolution QR
  const qr = qrcode(0, 'H');
  qr.addData(`ELEVATE-QA: ${id} | ${email}`);
  qr.make();
  
  // Use a size that fits comfortably in the 380px compact modal
  const imgHtml = qr.createImgTag(5); // Sized for compact view
  target.innerHTML = imgHtml;

  // Fix image styling inside modal to prevent truncation
  const img = target.querySelector('img');
  if (img) {
    img.style.display = 'block';
    img.style.width = '200px';
    img.style.height = '200px';
    img.style.maxWidth = '100%';
  }

  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;

  modal.style.display = 'flex';
};

window.generateAdminQR = (data) => {
  try {
    if (typeof qrcode === 'undefined') return '<span style="font-size:10px; color:var(--accent-red);">QR LIB MISSING</span>';
    const qr = qrcode(0, 'M');
    qr.addData(`ELEVATE-QA: ${data.id} | ${data.email}`);
    qr.make();
    return qr.createImgTag(2); // Small size for table
  } catch (e) {
    return '—';
  }
};

window.renderAttendees = (registrations) => {
  const tbody = document.getElementById('attendee-table');
  const countBadge = document.getElementById('attendee-count');
  if (!tbody) return;

  const atts = registrations || [];
  if (countBadge) countBadge.textContent = `${atts.length} registered`;

  if (atts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--ink-dim);">No registrations found</td></tr>';
    return;
  }

  tbody.innerHTML = atts.map((p) => {
    const qrHtml = window.generateAdminQR(p);
    const safeName = (p.name || '—').replace(/'/g, "\\'");
    const safeEmail = (p.email || '—').replace(/'/g, "\\'");
    
    return `
      <tr data-id="${p.id}">
        <td>${p.name || '—'}</td>
        <td>${p.company || '—'}</td>
        <td>${p.email || '—'}</td>
        <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
        <td>${(p.status && p.status.toUpperCase() === 'PRESENT') ? '<span class="badge" style="background:var(--accent); color:#000;">Present</span>' : '<span class="badge">Verified</span>'}</td>
        <td class="qr-col" onclick="showPass('${p.id}', '${safeName}', '${safeEmail}')" title="Click to View Pass">${qrHtml}</td>
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
    if (data) window.renderAttendees(data.registrations);
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

function populateUI(data) {
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) {
      if (val !== undefined && val !== null && val !== '') {
        el.value = val;
      } else {
        el.value = el.placeholder || '';
      }
    }
  }
  
  const sc = data.site_content || {};
  
  // MIGRATION: Auto-fix speakers section number if it's stuck on old value
  if (sc.speakersSectionNum === '04 / Speakers' || sc.speakersSectionNum === '04 / The Lineup') {
    sc.speakersSectionNum = '05 / The Lineup';
  }
  
  // MIGRATION: Auto-fix manifesto section number if it's stuck on old value
  if (sc.manifestoSectionNum === 'Manifesto' || !sc.manifestoSectionNum) {
    sc.manifestoSectionNum = '01 / MANIFESTO';
  }
  
  setVal('hero-headline', sc.heroHeadline);
  setVal('hero-tagline', sc.heroTagline);
  setVal('hero-eyebrow', sc.heroEyebrow);
  setVal('hero-edition', sc.heroEdition);
  setVal('event-date', sc.eventDate);
  setVal('event-venue', sc.eventVenue);
  setVal('hero-meta', sc.heroMeta);
  setVal('hero-format', sc.heroFormat);
  setVal('hero-audience', sc.heroAudience);
  setVal('hero-cta-text', sc.heroCtaText);

  setVal('stat1-num', sc.stat1Num); setVal('stat1-lbl', sc.stat1Lbl);
  setVal('stat2-num', sc.stat2Num); setVal('stat2-lbl', sc.stat2Lbl);
  setVal('stat3-num', sc.stat3Num); setVal('stat3-lbl', sc.stat3Lbl);
  setVal('stat4-num', sc.stat4Num); setVal('stat4-lbl', sc.stat4Lbl);

  for (let i = 1; i <= 9; i++) setVal(`ticker-${i}`, sc[`ticker${i}`]);

  setVal('prizes-title-input', sc.prizesHeadline);
  setVal('prizes-s1-num',  sc.prizesS1Num);  setVal('prizes-s1-text', sc.prizesS1Lbl);
  setVal('prizes-s2-num',  sc.prizesS2Num);  setVal('prizes-s2-text', sc.prizesS2Lbl);
  setVal('prizes-s3-num',  sc.prizesS3Num);  setVal('prizes-s3-text', sc.prizesS3Lbl);

  setVal('manifesto-section-num', sc.manifestoSectionNum);
  setVal('manifesto-pill', sc.manifestoPill);
  setVal('manifesto-aside', sc.manifestoAside);
  if (data.manifesto) setVal('manifesto-lines', data.manifesto.content);

  setVal('map-section-num', sc.mapSectionNum);
  setVal('experience-section-num', sc.experienceSectionNum);
  setVal('agenda-section-num', sc.agendaSectionNum);
  setVal('agenda-section-title', sc.agendaSectionTitle);

  setVal('speakers-section-num-input', sc.speakersSectionNum);
  setVal('speakers-section-title', sc.speakersSectionTitle);
  setVal('speakers-intro', sc.speakersIntro);

  setVal('involve-section-num', sc.involveSectionNum);
  setVal('involve-title', sc.involveTitle);
  setVal('involve-card1-title', sc.involveCard1Title);
  setVal('involve-card1-desc', sc.involveCard1Desc);
  setVal('involve-card1-link', sc.involveCard1Link);
  setVal('involve-card1-link-text', sc.involveCard1LinkText);
  setVal('involve-card2-title', sc.involveCard2Title);
  setVal('involve-card2-desc', sc.involveCard2Desc);
  setVal('involve-card2-link-text', sc.involveCard2LinkText);
  setVal('involve-card3-title', sc.involveCard3Title);
  setVal('involve-card3-desc', sc.involveCard3Desc);
  setVal('involve-card3-link-text', sc.involveCard3LinkText);

  setVal('coming-section-num', sc.comingSectionNum);
  setVal('coming-title', sc.comingTitle);
  setVal('coming-desc', sc.comingDesc);
  setVal('coming-visual-label', sc.comingVisualLabel);
  setVal('coming-visual-sub', sc.comingVisualSub);
  for (let i = 1; i <= 6; i++) {
    setVal(`coming-item${i}-label`, sc[`comingItem${i}Label`]);
    setVal(`coming-item${i}-status`, sc[`comingItem${i}Status`]);
  }

  setVal('footer-tagline', sc.footerTagline);
  setVal('footer-location', sc.footerLocation);
  setVal('footer-edition', sc.footerEdition);
  setVal('footer-copyright', sc.footerCopyright);
  setVal('footer-email', sc.footerEmail);

  setVal('nav-manifesto', sc.navManifesto);
  setVal('nav-maturity', sc.navMaturity);
  setVal('nav-experience', sc.navExperience);
  setVal('nav-agenda', sc.navAgenda);
  setVal('nav-speakers', sc.navSpeakers);
  setVal('nav-join', sc.navJoin);

  setVal('modal-price-scarcity', sc.modalPriceScarcity);
  setVal('modal-price-old', sc.modalPriceOld);
  setVal('modal-price-new', sc.modalPriceNew);
  setVal('modal-price-caption', sc.modalPriceCaption);
  setVal('modal-price-btn', sc.modalPriceBtn);
  setVal('modal-form-title', sc.modalFormTitle);
  setVal('modal-form-desc', sc.modalFormDesc);

  setVal('maturity-title-input', sc.maturityTitle);
  setVal('pillars-title-input', sc.pillarsTitle);

  // Populate Admin Whitelist
  const adminContainer = document.getElementById('admin-emails-list');
  if (adminContainer) {
    adminContainer.innerHTML = '';
    
    // Master fallback emails that cannot be locked out
    const MASTER_ADMINS = ['abhishekjohri150@gmail.com', 'elevateqa@sdettech.com', 'abhishek.johri@sdettech.com'];
    
    let whitelist = (sc.adminWhitelist && Array.isArray(sc.adminWhitelist) && sc.adminWhitelist.length > 0) 
      ? sc.adminWhitelist 
      : ALLOWED_ADMINS;
    
    // Always merge the master admins to prevent lockout
    whitelist = [...new Set([...whitelist, ...MASTER_ADMINS])];
    
    // Update the memory-resident whitelist for immediate session use
    ALLOWED_ADMINS = whitelist;
    whitelist.forEach(email => window.addAdminEmail(email));
  }

  // Branding Visuals & Colors
  const logoHeight = sc.logoHeight || (data.branding && data.branding.logo_height) || 48;
  setVal('visual-logo-height', logoHeight);
  const heightLabel = document.getElementById('logo-height-val');
  if (heightLabel) heightLabel.textContent = logoHeight;

  setVal('set-color-primary', sc.primaryColor || (data.branding && data.branding.primary_color));
  setVal('set-color-accent', sc.accentColor || (data.branding && data.branding.accent_color));

  const logoUrl = sc.logoUrl || (data.branding && data.branding.logo_url);
  if (logoUrl) {
    window._visualData.logo = logoUrl;
    renderImgPreview('logo', logoUrl);
    
    // Update all admin logo locations
    const pLogo = document.getElementById('admin-preloader-logo');
    const sLogo = document.getElementById('admin-sidebar-logo');
    const lLogo = document.getElementById('login-logo-img');
    if (pLogo) { pLogo.src = logoUrl; pLogo.style.display = 'block'; }
    if (sLogo) { sLogo.src = logoUrl; sLogo.style.display = 'block'; }
    if (lLogo) { lLogo.src = logoUrl; lLogo.style.display = 'block'; }
  }
  const heroBg = sc.heroBg || (data.branding && data.branding.hero_bg_url);
  if (heroBg) {
    window._visualData.heroBg = heroBg;
    renderImgPreview('hero-bg', heroBg);
  }
  for (let i = 1; i <= 3; i++) {
    const img = data[`stripImg${i}`];
    const cap = data[`stripCap${i}`];
    if (img) {
      window._visualData.strip[i-1] = img;
      renderImgPreview(`strip-0${i}`, img);
    }
    const capEl = document.getElementById(`strip-0${i}-caption`);
    if (capEl) capEl.value = cap || '';
  }

  function renderImgPreview(id, url) {
    const preview = document.getElementById(`preview-${id}`);
    const placeholder = document.getElementById(`placeholder-${id}`);
    if (preview) {
      preview.src = url;
      preview.style.display = 'block';
      preview.parentElement.classList.add('has-img');
      if (placeholder) placeholder.style.display = 'none';
    }
  }

  if (data.speakers) {
    const container = document.getElementById('speaker-list');
    if (container) {
      container.innerHTML = '';
      const speakers = data.speakers.length > 0 ? data.speakers : [
        { name: 'To be revealed', role: 'KEYNOTE', wave: 'WAVE 01', silhouette: '01' },
        { name: 'To be revealed', role: 'KEYNOTE', wave: 'WAVE 01', silhouette: '02' },
        { name: 'To be revealed', role: 'INDUSTRY', wave: 'WAVE 01', silhouette: '03' },
        { name: 'To be revealed', role: 'PRACTITIONER', wave: 'WAVE 02', silhouette: '04' },
        { name: 'To be revealed', role: 'PANEL', wave: 'WAVE 02', silhouette: '05' },
        { name: 'To be revealed', role: 'WORKSHOP', wave: 'WAVE 02', silhouette: '06' },
        { name: 'To be revealed', role: 'FIRESIDE', wave: 'WAVE 02', silhouette: '07' }
      ];
      speakers.forEach(s => {
        window.addSpeakerItem({
          id: s.id, name: s.name, role: s.role, title: s.title, status: s.status, img: s.image_url || s.img, display_order: s.display_order
        });
      });
    }
  }
  if (data.agenda) {
    const container = document.getElementById('agenda-list');
    if (container) {
      container.innerHTML = '';
      const agenda = data.agenda.length > 0 ? data.agenda : [
        { time: '09:00', tag: 'Opens', title: 'Registration & morning <em>coffee</em>', desc: 'Pick up your badge, meet the early arrivals, find your tribe before the day begins.' },
        { time: '10:00', tag: 'Opening Keynote', title: '<em>The proof of value:</em> what AI in QE has actually delivered', desc: 'A grounded look at where AI has paid off in quality engineering — and where the receipts are still missing.' },
        { time: '11:00', tag: 'Track Sessions', title: 'Parallel deep-dives <em>across two stages</em>', desc: 'Self-healing automation, AI-driven test generation, intelligent triage, risk-based prioritization. Engineers showing real implementations.' },
        { time: '13:00', tag: 'Break', title: 'Lunch & <em>networking</em>', desc: 'Curated tables by topic — sit with people working on the problems you\'re working on.' },
        { time: '14:30', tag: 'Keynote Panel', title: 'The candid panel: <em>hype vs. reality</em>', desc: 'Practitioners and leaders go on record about what\'s overhyped, what\'s underrated, and where the field goes next.' },
        { time: '15:30', tag: 'Workshops', title: 'Hands-on <em>working sessions</em>', desc: 'Bring a laptop. Leave with code, frameworks, and concrete starting points for your own AI-led QE program.' },
        { time: '17:30', tag: 'Awards', title: 'Speaker of the Event <em>& recognition</em>', desc: 'The day\'s best voice gets headline prizes. Audience awards, surprises, applause that means something.' },
        { time: '18:30', tag: 'Reception', title: 'Closing reception & <em>after hours</em>', desc: 'Drinks, conversations, and the connections that outlast the agenda.' }
      ];
      agenda.forEach(a => window.addAgendaItem({
        id: a.id,
        time: a.time_slot || a.time,
        tag: a.tag,
        title: a.title,
        desc: a.desc,
        display_order: a.display_order
      }));
    }
  }
  
  // Populate Maturity Stages (The Map)
  const maturityContainer = document.getElementById('maturity-stages-admin');
  if (maturityContainer) {
    maturityContainer.innerHTML = '';
    const stages = (Array.isArray(data.maturity_stages) && data.maturity_stages.length > 0) ? data.maturity_stages : [
      { label: 'STAGE 01', name: 'Manual-first', pct: '25%', desc: 'Test cases authored by hand. Automation islands. AI is "interesting," not yet operational.' },
      { label: 'STAGE 02', name: 'Assisted', pct: '50%', desc: 'AI helps generate test cases and data. Engineers stay in the loop. Early wins, mixed signals.' },
      { label: 'STAGE 03', name: 'Augmented', pct: '18%', desc: 'Self-healing automation, intelligent triage, AI-driven coverage gap analysis. Measurable lift.' },
      { label: 'STAGE 04', name: 'Autonomous', pct: '7%', desc: 'Quality agents reason about risk, prioritize, and adapt. Humans set strategy. The future, already here in pockets.' }
    ];
    stages.forEach(s => window.addMaturityStage(s));
  }

  // Populate Experience Pillars
  const pillarsContainer = document.getElementById('pillars-admin');
  if (pillarsContainer) {
    pillarsContainer.innerHTML = '';
    const pills = (Array.isArray(data.pillars) && data.pillars.length > 0) ? data.pillars : [
      { title: 'Keynotes from people doing the work', desc: 'Industry voices and engineering leaders sharing concrete case studies — what AI changed, what it cost, what it delivered. Real numbers, not roadmaps.' },
      { title: 'Practitioner deep-dives', desc: 'Hands-on breakouts from engineers who\'ve shipped AI-augmented test suites, self-healing automation, and intelligent quality pipelines at scale.' },
      { title: 'The community table', desc: 'Curated roundtables where 200–500 quality engineering leaders connect, debate, and forge the relationships that move careers and companies forward.' },
      { title: 'Live demos, not slideware', desc: 'See AI-led QE tooling in action on real codebases, real bugs, real flaky tests. Working software is the only honest demo.' },
      { title: 'The candid panels', desc: 'The unfiltered conversations: what AI in QE is overhyped, what\'s underrated, where the field goes from here. Speakers who\'ll say it plainly.' },
      { title: 'Recognition & prizes', desc: 'Speaker of the event, audience awards, and surprises throughout the day. We celebrate the people pushing the field — loudly.' }
    ];
    pills.forEach(p => window.addPillarItem(p));
  }

  if (data.registrations) {
    window.renderAttendees(data.registrations);
  }
}

window.handleSpeakerImg = async (input) => {
  const file = input.files[0];
  if (!file) return;

  const wrap = input.previousElementSibling;
  const img = wrap.querySelector('img');

  // ① Show instant local preview
  const localPreview = URL.createObjectURL(file);
  wrap.classList.add('has-img');
  img.src = localPreview;
  img.style.display = 'block';
  img.dataset.storageUrl = '';

  wrap.style.opacity = '0.6';
  wrap.title = 'Uploading…';

  // ② Upload to Supabase Storage
  const ext = file.name.split('.').pop().toLowerCase();
  const publicUrl = await uploadImageToStorage(file, `speakers/${Date.now()}.${ext}`);

  wrap.style.opacity = '1';
  wrap.title = '';

  if (publicUrl) {
    // ③ Swap to CDN URL — this is what gets saved to DB
    img.src = publicUrl;
    img.dataset.storageUrl = publicUrl;
    URL.revokeObjectURL(localPreview);
  } else {
    wrap.classList.remove('has-img');
    img.style.display = 'none';
    img.src = '';
    img.dataset.storageUrl = '';
    URL.revokeObjectURL(localPreview);
    window.showToast('Image upload failed. Check console.', 'error', 'Upload Failed');
  }
};

window.saveAll = async () => {
  const btn = document.getElementById('btn-publish');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Syncing Everything...';
  btn.disabled = true;

  try {
    const getVal = (id) => { const el = document.getElementById(id); return el ? (el.value.trim() || el.placeholder || '') : ''; };

    await saveSiteContent({
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

      stat1Num: getVal('stat1-num'), stat1Lbl: getVal('stat1-lbl'),
      stat2Num: getVal('stat2-num'), stat2Lbl: getVal('stat2-lbl'),
      stat3Num: getVal('stat3-num'), stat3Lbl: getVal('stat3-lbl'),
      stat4Num: getVal('stat4-num'), stat4Lbl: getVal('stat4-lbl'),

      ticker1: getVal('ticker-1'), ticker2: getVal('ticker-2'),
      ticker3: getVal('ticker-3'), ticker4: getVal('ticker-4'),
      ticker5: getVal('ticker-5'), ticker6: getVal('ticker-6'),
      ticker7: getVal('ticker-7'), ticker8: getVal('ticker-8'),
      ticker9: getVal('ticker-9'),

      prizesHeadline: getVal('prizes-title-input'),
      prizesS1Num: getVal('prizes-s1-num'), prizesS1Lbl: getVal('prizes-s1-text'),
      prizesS2Num: getVal('prizes-s2-num'), prizesS2Lbl: getVal('prizes-s2-text'),
      prizesS3Num: getVal('prizes-s3-num'), prizesS3Lbl: getVal('prizes-s3-text'),

      manifestoSectionNum: getVal('manifesto-section-num'),
      manifestoPill: getVal('manifesto-pill'),
      manifestoAside: getVal('manifesto-aside'),

      mapSectionNum: getVal('map-section-num'),
      experienceSectionNum: getVal('experience-section-num'),
      agendaSectionNum: getVal('agenda-section-num'),
      agendaSectionTitle: getVal('agenda-section-title'),

      speakersSectionNum: getVal('speakers-section-num-input'),
      speakersSectionTitle: getVal('speakers-section-title'),
      speakersIntro: getVal('speakers-intro'),

      involveSectionNum: getVal('involve-section-num'),
      involveTitle: getVal('involve-title'),
      involveCard1Title: getVal('involve-card1-title'), involveCard1Desc: getVal('involve-card1-desc'),
      involveCard1Link: getVal('involve-card1-link'), involveCard1LinkText: getVal('involve-card1-link-text'),
      involveCard2Title: getVal('involve-card2-title'), involveCard2Desc: getVal('involve-card2-desc'),
      involveCard2LinkText: getVal('involve-card2-link-text'),
      involveCard3Title: getVal('involve-card3-title'), involveCard3Desc: getVal('involve-card3-desc'),
      involveCard3LinkText: getVal('involve-card3-link-text'),

      comingSectionNum: getVal('coming-section-num'),
      comingTitle: getVal('coming-title'),
      comingDesc: getVal('coming-desc'),
      comingVisualLabel: getVal('coming-visual-label'),
      comingVisualSub: getVal('coming-visual-sub'),
      comingItem1Label: getVal('coming-item1-label'), comingItem1Status: getVal('coming-item1-status'),
      comingItem2Label: getVal('coming-item2-label'), comingItem2Status: getVal('coming-item2-status'),
      comingItem3Label: getVal('coming-item3-label'), comingItem3Status: getVal('coming-item3-status'),
      comingItem4Label: getVal('coming-item4-label'), comingItem4Status: getVal('coming-item4-status'),
      comingItem5Label: getVal('coming-item5-label'), comingItem5Status: getVal('coming-item5-status'),
      comingItem6Label: getVal('coming-item6-label'), comingItem6Status: getVal('coming-item6-status'),

      footerTagline: getVal('footer-tagline'),
      footerLocation: getVal('footer-location'),
      footerEdition: getVal('footer-edition'),
      footerCopyright: getVal('footer-copyright'),
      footerEmail: getVal('footer-email'),

      navManifesto: getVal('nav-manifesto'),
      navMaturity: getVal('nav-maturity'),
      navExperience: getVal('nav-experience'),
      navAgenda: getVal('nav-agenda'),
      navSpeakers: getVal('nav-speakers'),
      navJoin: getVal('nav-join'),

      modalPriceScarcity: getVal('modal-price-scarcity'),
      modalPriceOld: getVal('modal-price-old'),
      modalPriceNew: getVal('modal-price-new'),
      modalPriceCaption: getVal('modal-price-caption'),
      modalPriceBtn: getVal('modal-price-btn'),
      modalFormTitle: getVal('modal-form-title'),
      modalFormDesc: getVal('modal-form-desc'),

      maturityTitle: getVal('maturity-title-input'),
      pillarsTitle: getVal('pillars-title-input'),
      adminWhitelist: Array.from(document.querySelectorAll('.admin-email-entry')).map(i => i.value.trim().toLowerCase()).filter(e => e)
    });

    await saveBranding({
      logoUrl: window._visualData.logo,
      logoHeight: getVal('visual-logo-height'),
      heroBg: window._visualData.heroBg,
      stripImg1: window._visualData.strip[0], stripCap1: getVal('strip-01-caption'),
      stripImg2: window._visualData.strip[1], stripCap2: getVal('strip-02-caption'),
      stripImg3: window._visualData.strip[2], stripCap3: getVal('strip-03-caption'),
      primaryColor: getVal('set-color-primary') || '#d4ff3a'
    });

    await saveManifesto({ content: getVal('manifesto-lines') });

    const speakerPromises = Array.from(document.querySelectorAll('#speaker-list .dynamic-item')).map(async (el, i) => {
      let finalImg = el.querySelector('.img-upload-wrap img')?.dataset.storageUrl || '';
      let src = el.querySelector('.img-upload-wrap img')?.src || '';

      if (!finalImg && src.startsWith('data:image')) {
        try {
          const res = await fetch(src);
          const blob = await res.blob();
          const ext = blob.type.split('/')[1] || 'png';
          const file = new File([blob], `migrated_speaker_${Date.now()}_${i}.${ext}`, { type: blob.type });
          finalImg = await uploadImageToStorage(file, `speakers/${file.name}`) || '';
          if (finalImg) el.querySelector('.img-upload-wrap img').dataset.storageUrl = finalImg;
        } catch(e) { console.error('[ElevateAdmin] Base64 Migration Error:', e); }
      } else if (!finalImg) {
        finalImg = src;
      }

      if (finalImg.startsWith('data:image')) { finalImg = ''; }

      return {
        id: el.getAttribute('data-id') || undefined,
        name: el.querySelector('.s-name').value,
        role: el.querySelector('.s-role').value,
        title: el.querySelector('.s-title') ? el.querySelector('.s-title').value : '',
        status: el.querySelector('.s-status').value,
        img: finalImg,
        display_order: i
      };
    });
    
    const speakers = await Promise.all(speakerPromises);
    await syncTableDeletes('speakers', speakers.map(s => s.id));
    for (const s of speakers) await saveSpeaker(s);

    const agenda = Array.from(document.querySelectorAll('#agenda-list .dynamic-item')).map((el, i) => ({
      id: el.getAttribute('data-id') || undefined,
      time: el.querySelector('.a-time').value,
      tag: el.querySelector('.a-tag').value,
      title: el.querySelector('.a-title').value,
      speaker_name: el.querySelector('.a-speaker').value,
      desc: el.querySelector('.a-desc').value,
      display_order: i
    }));
    await syncTableDeletes('agenda', agenda.map(a => a.id));
    for (const a of agenda) await saveAgendaItem(a);

    const maturity = Array.from(document.querySelectorAll('#maturity-stages-admin .dynamic-item')).map((el, i) => ({
      id: el.getAttribute('data-id') || undefined,
      label: el.querySelector('.mat-label').value,
      name: el.querySelector('.mat-name').value,
      pct: el.querySelector('.mat-pct').value,
      desc: el.querySelector('.mat-desc').value,
      display_order: i
    }));
    await syncTableDeletes('maturity_stages', maturity.map(m => m.id));
    for (const m of maturity) await saveMaturityStage(m);

    const pillars = Array.from(document.querySelectorAll('#pillars-admin .dynamic-item')).map((el, i) => ({
      id: el.getAttribute('data-id') || undefined,
      title: el.querySelector('.pil-title').value,
      desc: el.querySelector('.pil-desc').value,
      display_order: i
    }));
    await syncTableDeletes('pillars', pillars.map(p => p.id));
    for (const p of pillars) await savePillar(p);

    btn.innerHTML = originalText;
    btn.disabled = false;
    window.showToast('All your changes have been successfully synced to the cloud and are now live on the site.', 'success', '100% Synced');
  } catch (err) {
    console.error('[ElevateAdmin] Save Error:', err);
    btn.innerHTML = 'Error! Try Again';
    btn.disabled = false;
  }
};

window.showIdentitySubSection = (subId) => {
  const container = document.querySelector('.internal-tabs');
  if (container) {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('onclick')?.includes(`'${subId}'`)) {
        btn.classList.add('active');
      }
    });
  }
  // Removed Fallback Injection - relying on admin-identity.html partial for high-fidelity content.


  document.querySelectorAll('.sub-identity-section').forEach(sec => {
    sec.style.display = 'none';
  });
  const target = document.getElementById(`sub-identity-${subId}`);
  if (target) target.style.display = 'block';
  
  // Re-populate dynamic sections on tab click if they're empty
  if (subId === 'map') {
    const matCont = document.getElementById('maturity-stages-admin');
    if (matCont && matCont.children.length === 0) {
      const cached = window._lastLoadedData;
      const stages = (cached && Array.isArray(cached.maturity_stages) && cached.maturity_stages.length > 0) 
        ? cached.maturity_stages
        : [
          { label: 'STAGE 01', name: 'Manual-first', pct: '25%', desc: 'Test cases authored by hand. Automation islands. AI is "interesting," not yet operational.' },
          { label: 'STAGE 02', name: 'Assisted', pct: '50%', desc: 'AI helps generate test cases and data. Engineers stay in the loop. Early wins, mixed signals.' },
          { label: 'STAGE 03', name: 'Augmented', pct: '18%', desc: 'Self-healing automation, intelligent triage, AI-driven coverage gap analysis. Measurable lift.' },
          { label: 'STAGE 04', name: 'Autonomous', pct: '7%', desc: 'Quality agents reason about risk, prioritize, and adapt. Humans set strategy. The future, already here in pockets.' }
        ];
      stages.forEach(s => window.addMaturityStage(s));
    }
    
    const sc = window._lastLoadedData && window._lastLoadedData.site_content ? window._lastLoadedData.site_content : {};
    const mapNumEl = document.getElementById('map-section-num');
    const mapTitleEl = document.getElementById('maturity-title-input');
    if (mapNumEl && !mapNumEl.value) mapNumEl.value = sc.mapSectionNum || '02 / THE MAP';
    if (mapTitleEl && !mapTitleEl.value) mapTitleEl.value = sc.maturityTitle || 'Where is your team on the AI-led QE curve?';
  }
  
  if (subId === 'experience') {
    const pilCont = document.getElementById('pillars-admin');
    if (pilCont && pilCont.children.length === 0) {
      const cached = window._lastLoadedData;
      const pills = (cached && Array.isArray(cached.pillars) && cached.pillars.length > 0) 
        ? cached.pillars
        : [
          { title: 'Keynotes from people doing the work', desc: 'Industry voices and engineering leaders sharing concrete case studies — what AI changed, what it cost, what it delivered. Real numbers, not roadmaps.' },
          { title: 'Practitioner deep-dives', desc: 'Hands-on breakouts from engineers who\'ve shipped AI-augmented test suites, self-healing automation, and intelligent quality pipelines at scale.' },
          { title: 'The community table', desc: 'Curated roundtables where 200–500 quality engineering leaders connect, debate, and forge the relationships that move careers and companies forward.' },
          { title: 'Live demos, not slideware', desc: 'See AI-led QE tooling in action on real codebases, real bugs, real flaky tests. Working software is the only honest demo.' },
          { title: 'The candid panels', desc: 'The unfiltered conversations: what AI in QE is overhyped, what\'s underrated, where the field goes from here. Speakers who\'ll say it plainly.' },
          { title: 'Recognition & prizes', desc: 'Speaker of the event, audience awards, and surprises throughout the day. We celebrate the people pushing the field — loudly.' }
        ];
      pills.forEach(p => window.addPillarItem(p));
    }
    
    const sc = window._lastLoadedData && window._lastLoadedData.site_content ? window._lastLoadedData.site_content : {};
    const expNumEl = document.getElementById('experience-section-num');
    const expTitleEl = document.getElementById('pillars-title-input');
    if (expNumEl && !expNumEl.value) expNumEl.value = sc.experienceSectionNum || '03 / THE EXPERIENCE';
    if (expTitleEl && !expTitleEl.value) expTitleEl.value = sc.pillarsTitle || 'A day built around signal, not noise.';
  }
  
  if (subId === 'extras') {
    const sc = window._lastLoadedData && window._lastLoadedData.site_content ? window._lastLoadedData.site_content : {};
    const spNum = document.getElementById('speakers-section-num-input');
    const spTitle = document.getElementById('speakers-section-title');
    const spIntro = document.getElementById('speakers-intro');
    const invNum = document.getElementById('involve-section-num');
    const invTitle = document.getElementById('involve-title');
    const fTag = document.getElementById('footer-tagline-input');
    const fEmail = document.getElementById('footer-email');

    if (spNum && !spNum.value) spNum.value = sc.speakersSectionNum || '05 / The Lineup';
    if (spTitle && !spTitle.value) spTitle.value = sc.speakersSectionTitle || 'A roster built for proof.';
    if (spIntro && !spIntro.value) spIntro.value = sc.speakersIntro || 'We\'re curating a lineup of keynote voices, practitioner breakouts, and community panels focused strictly on AI-led quality engineering. Real implementers, no vendor pitches.';
    if (invNum && !invNum.value) invNum.value = sc.involveSectionNum || '07 / Get Involved';
    if (invTitle && !invTitle.value) invTitle.value = sc.involveTitle || 'How to participate.';
    if (fTag && !fTag.value) fTag.value = sc.footerTagline || 'The proof of value, or it didn\'t happen.';
    if (fEmail && !fEmail.value) fEmail.value = sc.footerEmail || 'elevateqa@sdettech.com';
  }
};

window.showSection = (target) => {
  const validSections = ['attendance', 'identity', 'agenda', 'speakers', 'visuals', 'intelligence', 'settings'];
  const activeId = validSections.includes(target) ? target : 'attendance';

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${activeId}`);
  if (activeNav) activeNav.classList.add('active');

  document.querySelectorAll('main section').forEach(sec => sec.style.display = 'none');
  const targetSec = document.getElementById(`sec-${activeId}`);
  if (targetSec) targetSec.style.display = 'block';

  // Persist via both sessionStorage AND URL hash (survives page refresh)
  sessionStorage.setItem('admin_active_tab', activeId);
  history.replaceState(null, '', `#${activeId}`);

  // Update header title/desc if elements exist
  const titles = {
    attendance: ['Attendee Command', 'Real-time registration tracking and verification.'],
    identity: ['Site Identity', 'Manage taglines, hero content, and about sections.'],
    agenda: ['Event Agenda', 'Organize sessions, timestamps, and topics.'],
    speakers: ['Speaker Roster', 'Curate your featured voices and credentials.'],
    visuals: ['Visual Assets', 'Upload atmosphere graphics and background media.'],
    intelligence: ['AI Intelligence', "Configure your event's artificial intelligence brain."],
    settings: ['Platform Settings', 'Configure administrative security and data.']
  };
  const titleEl = document.getElementById('page-title');
  const descEl = document.getElementById('page-desc');
  if (titleEl && titles[activeId]) {
    const parts = titles[activeId][0].split(' ');
    titleEl.innerHTML = `${parts[0]} <em>${parts[1] || ''}</em>`;
    if (descEl) descEl.textContent = titles[activeId][1];
  }
};

window.triggerVisualUpload = (id) => {
  document.getElementById(`upload-${id}`).click();
};

window.handleVisualUpload = async (input, id) => {
  const file = input.files[0];
  if (!file) return;

  const preview = document.getElementById(`preview-${id}`);
  const placeholder = document.getElementById(`placeholder-${id}`);

  // ① Instant local preview
  const localPreview = URL.createObjectURL(file);
  if (preview) {
    preview.src = localPreview;
    preview.style.display = 'block';
    preview.parentElement.classList.add('has-img');
    preview.parentElement.style.opacity = '0.6';
    preview.parentElement.title = 'Uploading…';
    if (placeholder) placeholder.style.display = 'none';
  }

  // ② Upload to Supabase Storage
  const folder = id === 'logo' ? 'branding' : 'visuals';
  const ext = file.name.split('.').pop().toLowerCase();
  const publicUrl = await uploadImageToStorage(file, `${folder}/${id}_${Date.now()}.${ext}`);

  if (preview) {
    preview.parentElement.style.opacity = '1';
    preview.parentElement.title = '';
  }

  if (publicUrl) {
    // ③ Swap to CDN URL
    if (preview) preview.src = publicUrl;
    URL.revokeObjectURL(localPreview);
    
    if (id === 'logo') window._visualData.logo = publicUrl;
    else if (id === 'hero-bg') window._visualData.heroBg = publicUrl;
    else if (id.startsWith('strip-')) {
      const idx = parseInt(id.split('-')[1]) - 1;
      window._visualData.strip[idx] = publicUrl;
    }

    window.showToast('Image uploaded successfully!', 'success', 'Upload Done');
  } else {
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
      preview.parentElement.classList.remove('has-img');
    }
    URL.revokeObjectURL(localPreview);
    window.showToast('Image upload failed. Check console.', 'error', 'Upload Failed');
  }
};

window.toggleSidebar = () => {
  const isActive = document.body.classList.toggle('sidebar-active');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) backdrop.classList.toggle('active', isActive);
  const toggle = document.getElementById('admin-menu-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', String(isActive));
};

window.logout = async () => {
  const confirmed = await window.showConfirm('Are you sure you want to end your current session and logout?', 'Logout Confirmation', 'LOGOUT');
  if (confirmed) {
    await supabase.auth.signOut();
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('admin_active_tab');
    location.href = location.pathname; // clear hash on logout
  }
};

const ADMIN_MAX_ATTEMPTS = 5;
const ADMIN_LOCKOUT_SECONDS = 60;
const ADMIN_ATTEMPT_KEY = 'admin_otp_attempts';
const ADMIN_LOCKOUT_KEY = 'admin_otp_lockout_until';

const _getAttempts = () => parseInt(sessionStorage.getItem(ADMIN_ATTEMPT_KEY) || '0', 10);
const _setAttempts = (n) => sessionStorage.setItem(ADMIN_ATTEMPT_KEY, String(n));
const _clearAttempts = () => {
  sessionStorage.removeItem(ADMIN_ATTEMPT_KEY);
  sessionStorage.removeItem(ADMIN_LOCKOUT_KEY);
};
const _getLockoutRemaining = () => {
  const until = parseInt(sessionStorage.getItem(ADMIN_LOCKOUT_KEY) || '0', 10);
  if (!until) return 0;
  const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
  if (remaining === 0) sessionStorage.removeItem(ADMIN_LOCKOUT_KEY);
  return remaining;
};
const _startLockout = () => sessionStorage.setItem(ADMIN_LOCKOUT_KEY, String(Date.now() + ADMIN_LOCKOUT_SECONDS * 1000));

const _setOtpError = (message) => {
  const el = document.getElementById('otp-error-msg');
  if (el) {
    el.textContent = message || '';
    el.classList.toggle('error', !!message);
  }
  document.querySelectorAll('.otp-input').forEach(i => i.setAttribute('aria-invalid', message ? 'true' : 'false'));
};

const _updateLockoutDisplay = () => {
  const msg = document.getElementById('otp-lockout-msg');
  const btn = document.getElementById('btn-verify-otp');
  const inputs = document.querySelectorAll('.otp-input');
  const remaining = _getLockoutRemaining();

  if (remaining > 0) {
    if (msg) {
      msg.style.display = 'block';
      msg.textContent = `Too many invalid attempts. Try again in ${remaining}s.`;
      msg.classList.add('error');
    }
    inputs.forEach(i => { i.disabled = true; });
    if (btn) btn.disabled = true;
    setTimeout(_updateLockoutDisplay, 1000);
  } else {
    if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
    inputs.forEach(i => { i.disabled = false; });
    if (btn) btn.disabled = false;
  }
};

window.checkSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true' || !!session;

  if (isLoggedIn) {
    if (session) sessionStorage.setItem('admin_logged_in', 'true');
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'none';
    const main = document.getElementById('admin-main');
    if (main) main.classList.add('authorized');
  }
  if (_getLockoutRemaining() > 0) _updateLockoutDisplay();
};

window.sendOTP = async (e) => {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('login-number');
  if (!emailInput) return;

  const honeypot = document.getElementById('login-website');
  if (honeypot && honeypot.value) {
    console.warn('[ElevateQA] Bot detected via honeypot.');
    return;
  }

  const email = emailInput.value.trim().toLowerCase();
  const btn = document.getElementById('btn-send-otp');
  const msg = document.getElementById('login-email-msg');

  if (!email) {
    emailInput.setAttribute('aria-invalid', 'true');
    if (msg) { msg.textContent = 'Please enter your email.'; msg.classList.add('error'); }
    emailInput.focus();
    return;
  }

  // 🛡️ SECURITY: Whitelist Check
  if (!ALLOWED_ADMINS.includes(email)) {
    if (msg) { 
      msg.textContent = 'Access Denied: Email not authorized.'; 
      msg.classList.add('error'); 
    }
    window.showToast('This email is not authorized for administrative access.', 'error', 'Access Denied');
    return;
  }

  emailInput.setAttribute('aria-invalid', 'false');
  if (msg) { msg.textContent = ''; msg.classList.remove('error'); }

  btn.innerHTML = '<span class="spinner"></span> Sending Secure Code...';
  btn.disabled = true;

  try {
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: { shouldCreateUser: true } 
    });

    if (error) throw error;

    document.getElementById('auth-step-1').style.display = 'none';
    document.getElementById('auth-step-2').style.display = 'block';
    const target = document.getElementById('otp-target-email');
    if (target) target.textContent = email;

    const firstInput = document.querySelector('.otp-input');
    if (firstInput) firstInput.focus();
  } catch (err) {
    window.showToast(`System Auth Failure: ${err.message}`, 'error', 'Security Error');
    console.error('[ElevateQA] Auth Request Error:', err);
  } finally {
    btn.innerHTML = 'Send Access Code';
    btn.disabled = false;
  }
};

window.verifyOTP = async () => {
  if (_getLockoutRemaining() > 0) { _updateLockoutDisplay(); return; }

  const email = document.getElementById('login-number').value.trim().toLowerCase();
  const inputs = document.querySelectorAll('.otp-input');
  const code = Array.from(inputs).map(i => i.value).join('');

  if (code.length === 6) {
    const btn = document.getElementById('btn-verify-otp');
    if (btn) {
      btn.innerHTML = '<span class="spinner"></span> Verifying...';
      btn.disabled = true;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'magiclink'
      });

      if (error) throw error;

      if (data.session) {
        _clearAttempts();
        _setOtpError('');
        sessionStorage.setItem('admin_logged_in', 'true');
        
        // Clean reload to ensure all modules re-initialize with the fresh session
        location.reload();
      }
    } catch (err) {
      const attempts = _getAttempts() + 1;
      _setAttempts(attempts);
      const remainingTries = ADMIN_MAX_ATTEMPTS - attempts;
      inputs.forEach(i => { i.value = ''; });

      if (attempts >= ADMIN_MAX_ATTEMPTS) {
        _startLockout();
        _setOtpError('');
        _updateLockoutDisplay();
      } else {
        _setOtpError(`Invalid code. ${remainingTries} attempt${remainingTries === 1 ? '' : 's'} remaining.`);
        setTimeout(() => { inputs[0] && inputs[0].focus(); }, 50);
        window.showToast('The security code is incorrect. Please try again.', 'error', 'Invalid Code');
      }
    } finally {
      if (btn) {
        btn.innerHTML = 'Verify & Enter';
        btn.disabled = false;
      }
    }
  }
};

window.moveFocus = (el) => {
  if (el.value.length >= 1) {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const nextIndex = inputs.indexOf(el) + 1;
    if (nextIndex < inputs.length) inputs[nextIndex].focus();
  }
  const code = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
  if (code.length === 6) window.verifyOTP();
};

window.handleBackspace = (el, e) => {
  if (e.key === 'Backspace' && !el.value) {
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const prevIndex = inputs.indexOf(el) - 1;
    if (prevIndex >= 0) inputs[prevIndex].focus();
  }
};

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
        <div class="img-upload-wrap ${data.img ? 'has-img' : ''}" onclick="this.nextElementSibling.click()">
          <img
            src="${data.img || ''}"
            data-storage-url="${data.img || ''}"
            alt="Preview"
            style="display: ${data.img ? 'block' : 'none'}">
          <div class="placeholder">Click to replace</div>
        </div>
        <input type="file" class="s-img-input" accept="image/*" style="display:none;" onchange="window.handleSpeakerImg(this)">
      </div>
      <div class="speaker-info-column">
        <div class="form-group"><label>Full Name</label><input type="text" class="s-name" value="${data.name}" placeholder="Kapil Dev"></div>
        <div class="form-group"><label>Role / Title</label><input type="text" class="s-role" value="${data.role}" placeholder="e.g. KEYNOTE"></div>
        <div class="form-group"><label>Status Label</label><input type="text" class="s-status" value="${data.status || 'CONFIRMED'}" placeholder="e.g. KEYNOTE SPEAKER"></div>
      </div>
    </div>
  `;
  container.appendChild(div);
};

window.addAgendaItem = (data = { id: null, time: '', tag: '', title: '', desc: '', speaker_name: '' }) => {
  const container = document.getElementById('agenda-list');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.setAttribute('data-id', data.id || '');
  div.innerHTML = `
    <div class="form-grid-2">
      <div class="form-group"><label>Time</label><input type="text" class="a-time" value="${data.time || data.time_slot || ''}" placeholder="09:00"></div>
      <div class="form-group"><label>Tag</label><input type="text" class="a-tag" value="${data.tag || ''}" placeholder="Keynote"></div>
    </div>
    <div class="form-group"><label>Topic Title</label><input type="text" class="a-title" value="${data.title || ''}" placeholder="The Proof of Value"></div>
    <div class="form-group"><label>Speaker Name</label><input type="text" class="a-speaker" value="${data.speaker_name || ''}" placeholder="John Doe"></div>
    <div class="form-group"><label>Description</label><textarea class="a-desc" rows="2">${data.desc || ''}</textarea></div>
    <button class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(div);
};

window.addMaturityStage = (data = { id: null, label: '', name: '', pct: '', desc: '' }) => {
  const container = document.getElementById('maturity-stages-admin');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.setAttribute('data-id', data.id || '');
  div.innerHTML = `
    <div class="form-grid-2">
      <div class="form-group"><label>Label (e.g. STAGE 01)</label><input type="text" class="mat-label" value="${data.label || ''}" placeholder="STAGE 01"></div>
      <div class="form-group"><label>Stage Name</label><input type="text" class="mat-name" value="${data.name}" placeholder="Manual-first"></div>
    </div>
    <div class="form-group"><label>Percentage</label><input type="text" class="mat-pct" value="${data.pct}" placeholder="25%"></div>
    <div class="form-group"><label>Description</label><textarea class="mat-desc" rows="3">${data.desc}</textarea></div>
    <button class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(div);
};

window.addPillarItem = (data = { id: null, title: '', desc: '' }) => {
  const container = document.getElementById('pillars-admin');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.setAttribute('data-id', data.id || '');
  div.innerHTML = `
    <div class="form-group"><label>Pillar Title</label><input type="text" class="pil-title" value="${data.title}" placeholder="Continuous Testing"></div>
    <div class="form-group"><label>Pillar Description</label><textarea class="pil-desc" rows="3">${data.desc}</textarea></div>
    <button class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(div);
};
