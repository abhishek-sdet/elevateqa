/**
 * ELEVATE QA — ADMIN UI MODULE
 * ==============================
 * Contains: showToast, showConfirm, populateUI, handleSpeakerImg,
 *           handleVisualUpload, triggerVisualUpload, showSection,
 *           showIdentitySubSection, addSpeakerItem, addAgendaItem,
 *           addMaturityStage, addPillarItem, updateAgendaIndexes,
 *           handleAgendaTagChange, toggleSidebar, logout, addAdminEmail
 * Extracted from admin-core.js for maintainability.
 */
import { supabase } from './supabase-config.js';
import { uploadImageToStorage } from './admin-supabase.js';

// ── Admin Whitelist (shared mutable reference) ─────────────────────────────
export let ALLOWED_ADMINS = [
  'abhishek.johri@sdettech.com',
  'abhishekjohri150@gmail.com',
  'elevateqa@sdettech.com'
];
export const setAllowedAdmins = (list) => { ALLOWED_ADMINS.length = 0; ALLOWED_ADMINS.push(...list); };

// ── Visual data store ───────────────────────────────────────────────────────
window._visualData = { logo: '', heroBg: '', founderImg: '', strip: ['', '', ''] };

// ── Toast ───────────────────────────────────────────────────────────────────
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
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 500); }, 4000);
};

// ── Confirm modal ────────────────────────────────────────────────────────────
window.showConfirm = (message, title = 'Are you sure?', btnText = 'PROCEED') => {
  return new Promise((resolve) => {
    let modal = document.getElementById('confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.className = 'premium-modal-overlay';
      modal.innerHTML = `
        <div class="premium-modal"><div class="modal-glow"></div>
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
      setTimeout(() => { modal.style.display = 'none'; resolve(val); }, 400);
    };
    okBtn.onclick = () => cleanup(true);
    document.getElementById('confirm-cancel').onclick = () => cleanup(false);
  });
};

// ── Section navigation ───────────────────────────────────────────────────────
window.showSection = (target) => {
  const validSections = ['attendance','email','identity','agenda','speakers','speaker-apps','visuals','intelligence','settings'];
  const activeId = validSections.includes(target) ? target : 'attendance';
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${activeId}`);
  if (activeNav) activeNav.classList.add('active');
  document.querySelectorAll('main section').forEach(sec => sec.style.display = 'none');
  const targetSec = document.getElementById(`sec-${activeId}`);
  if (targetSec) targetSec.style.display = 'block';
  sessionStorage.setItem('admin_active_tab', activeId);
  history.replaceState(null, '', `#${activeId}`);
  const titles = {
    attendance:   ['Attendee Command',  'Real-time registration tracking and verification.'],
    email:        ['Email Center',      'Dispatch custom blasts to attendees or specific lists.'],
    identity:     ['Site Identity',     'Manage taglines, hero content, and about sections.'],
    agenda:       ['Event Agenda',      'Organize sessions, timestamps, and topics.'],
    speakers:     ['Speaker Roster',    'Curate your featured voices and credentials.'],
    'speaker-apps': ['Speaker Apps',    'Review incoming applications to speak at Elevate QA.'],
    visuals:      ['Visual Assets',     'Upload atmosphere graphics and background media.'],
    intelligence: ['AI Intelligence',   "Configure your event's artificial intelligence brain."],
    settings:     ['Platform Settings', 'Configure administrative security and data.']
  };
  const titleEl = document.getElementById('page-title');
  const descEl  = document.getElementById('page-desc');
  if (titleEl && titles[activeId]) {
    const parts = titles[activeId][0].split(' ');
    titleEl.innerHTML = `${parts[0]} <em>${parts[1] || ''}</em>`;
    if (descEl) descEl.textContent = titles[activeId][1];
  }

  if (activeId === 'speaker-apps' && window.renderSpeakerApps) {
    window.renderSpeakerApps(window.rawSpeakerApps || (window._lastLoadedData && window._lastLoadedData.speaker_applications));
  }
};

// ── Identity sub-section ─────────────────────────────────────────────────────
window.showIdentitySubSection = (subId) => {
  const container = document.querySelector('.internal-tabs');
  if (container) {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('onclick')?.includes(`'${subId}'`)) btn.classList.add('active');
    });
  }
  document.querySelectorAll('.sub-identity-section').forEach(sec => { sec.style.display = 'none'; });
  const target = document.getElementById(`sub-identity-${subId}`);
  if (target) target.style.display = 'block';

  if (subId === 'map') {
    const matCont = document.getElementById('maturity-stages-admin');
    if (matCont && matCont.children.length === 0) {
      const cached = window._lastLoadedData;
      const stages = (cached && Array.isArray(cached.maturity_stages) && cached.maturity_stages.length > 0) ? cached.maturity_stages : [
        { id: 1, label: 'STAGE 01', name: 'Manual-first', pct: '25%', desc: 'Test cases authored by hand. Automation islands. AI is "interesting," not yet operational.' },
        { id: 2, label: 'STAGE 02', name: 'Assisted',     pct: '50%', desc: 'AI helps generate test cases and data. Engineers stay in the loop. Early wins, mixed signals.' },
        { id: 3, label: 'STAGE 03', name: 'Augmented',    pct: '18%', desc: 'Self-healing automation, intelligent triage, AI-driven coverage gap analysis. Measurable lift.' },
        { id: 4, label: 'STAGE 04', name: 'Autonomous',   pct: '7%',  desc: 'Quality agents reason about risk, prioritize, and adapt. Humans set strategy. The future, already here in pockets.' }
      ];
      stages.forEach(s => window.addMaturityStage(s));
    }
    const sc = window._lastLoadedData?.site_content || {};
    const mapNumEl = document.getElementById('map-section-num');
    const mapTitleEl = document.getElementById('maturity-title-input');
    if (mapNumEl && !mapNumEl.value) mapNumEl.value = sc.mapSectionNum || '02 / THE MAP';
    if (mapTitleEl && !mapTitleEl.value) mapTitleEl.value = sc.maturityTitle || 'Where is your team on the AI-led QE curve?';
  }

  if (subId === 'experience') {
    const pilCont = document.getElementById('pillars-admin');
    if (pilCont && pilCont.children.length === 0) {
      const cached = window._lastLoadedData;
      const pills = (cached && Array.isArray(cached.pillars) && cached.pillars.length > 0) ? cached.pillars : [
        { id: 1, title: 'Keynotes from people doing the work', desc: 'Industry voices sharing concrete case studies — what AI changed, what it cost, what it delivered.' },
        { id: 2, title: 'Practitioner deep-dives',             desc: "Hands-on breakouts from engineers who've shipped AI-augmented test suites at scale." },
        { id: 3, title: 'The community table',                 desc: 'Curated roundtables where quality engineering leaders connect and forge career-moving relationships.' }
      ];
      pills.forEach(p => window.addPillarItem(p));
    }
    const sc = window._lastLoadedData?.site_content || {};
    const expNumEl = document.getElementById('experience-section-num');
    const expTitleEl = document.getElementById('pillars-title-input');
    if (expNumEl && !expNumEl.value) expNumEl.value = sc.experienceSectionNum || '03 / THE EXPERIENCE';
    if (expTitleEl && !expTitleEl.value) expTitleEl.value = sc.pillarsTitle || 'A day built around signal, not noise.';
  }

  if (subId === 'extras') {
    const sc = window._lastLoadedData?.site_content || {};
    const fields = {
      'speakers-section-num-input': sc.speakersSectionNum  || '05 / The Lineup',
      'speakers-section-title':     sc.speakersSectionTitle|| 'A roster built for proof.',
      'speakers-intro':             sc.speakersIntro       || "We're curating a lineup of keynote voices, practitioner breakouts, and community panels.",
      'speakers-placeholder':       sc.speakersPlaceholder || 'To be revealed',
      'involve-section-num':        sc.involveSectionNum   || '07 / Get Involved',
      'involve-title':              sc.involveTitle        || 'How to participate.',
      'footer-email':               sc.footerEmail         || 'elevateqa@sdettech.com'
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = val;
    });
  }
};

// ── Sidebar / logout ─────────────────────────────────────────────────────────
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
    location.href = location.pathname;
  }
};

// ── Admin email list ─────────────────────────────────────────────────────────
window.addAdminEmail = (email = '') => {
  const container = document.getElementById('admin-emails-list');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dynamic-row';
  div.style.marginBottom = '12px';
  div.innerHTML = `
    <div class="form-group" style="flex:1;"><input type="email" class="admin-email-entry" value="${email}" placeholder="admin@example.com"></div>
    <button class="btn-del" onclick="this.parentElement.remove()" title="Remove Admin">✕</button>
  `;
  container.appendChild(div);
};

// ── Speaker image upload ─────────────────────────────────────────────────────
window.handleSpeakerImg = async (input) => {
  const file = input.files[0];
  if (!file) return;
  const wrap = input.previousElementSibling;
  const img  = wrap.querySelector('img');
  const localPreview = URL.createObjectURL(file);
  wrap.classList.add('has-img');
  img.src = localPreview; img.style.display = 'block'; img.dataset.storageUrl = '';
  wrap.style.opacity = '0.6'; wrap.title = 'Uploading…';
  const ext = file.name.split('.').pop().toLowerCase();
  const publicUrl = await uploadImageToStorage(file, `speakers/${Date.now()}.${ext}`);
  wrap.style.opacity = '1'; wrap.title = '';
  if (publicUrl) {
    img.src = publicUrl; img.dataset.storageUrl = publicUrl; URL.revokeObjectURL(localPreview);
  } else {
    wrap.classList.remove('has-img'); img.style.display = 'none'; img.src = ''; img.dataset.storageUrl = '';
    URL.revokeObjectURL(localPreview);
    window.showToast('Image upload failed. Check console.', 'error', 'Upload Failed');
  }
};

// ── Visual asset upload ──────────────────────────────────────────────────────
window.triggerVisualUpload = (id) => { document.getElementById(`upload-${id}`).click(); };

window.handleVisualUpload = async (input, id) => {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById(`preview-${id}`);
  const placeholder = document.getElementById(`placeholder-${id}`);
  const localPreview = URL.createObjectURL(file);
  if (preview) {
    preview.src = localPreview; preview.style.display = 'block';
    preview.parentElement.classList.add('has-img');
    preview.parentElement.style.opacity = '0.6'; preview.parentElement.title = 'Uploading…';
    if (placeholder) placeholder.style.display = 'none';
  }
  const folder = id === 'logo' ? 'branding' : 'visuals';
  const ext = file.name.split('.').pop().toLowerCase();
  const publicUrl = await uploadImageToStorage(file, `${folder}/${id}_${Date.now()}.${ext}`);
  if (preview) { preview.parentElement.style.opacity = '1'; preview.parentElement.title = ''; }
  if (publicUrl) {
    if (preview) preview.src = publicUrl;
    URL.revokeObjectURL(localPreview);
    if (id === 'logo') window._visualData.logo = publicUrl;
    else if (id === 'hero-bg') window._visualData.heroBg = publicUrl;
    else if (id === 'founder') window._visualData.founderImg = publicUrl;
    else if (id.startsWith('strip-')) window._visualData.strip[parseInt(id.split('-')[1]) - 1] = publicUrl;
    const dlLink = document.getElementById(`download-${id}`);
    if (dlLink) { dlLink.href = publicUrl; dlLink.style.display = 'inline-block'; }
    window.showToast('Image uploaded successfully!', 'success', 'Upload Done');
  } else {
    if (preview) { preview.src = ''; preview.style.display = 'none'; preview.parentElement.classList.remove('has-img'); }
    const dlLink = document.getElementById(`download-${id}`);
    if (dlLink) { dlLink.href = ''; dlLink.style.display = 'none'; }
    URL.revokeObjectURL(localPreview);
    window.showToast('Image upload failed. Check console.', 'error', 'Upload Failed');
  }
};

// ── Dynamic list items ───────────────────────────────────────────────────────
window.addSpeakerItem = (data = { id: null, name: '', role: '', title: '', img: '', status: '', bio: '' }) => {
  const container = document.getElementById('speaker-list');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.setAttribute('data-id', data.id || '');
  div.innerHTML = `
    <div class="dynamic-header"><div class="badge">Speaker Node</div><button class="btn-del" onclick="this.parentElement.parentElement.remove()">&times;</button></div>
    <div class="form-grid-2">
      <div class="speaker-img-column">
        <label>Speaker Photo</label>
        <div class="img-upload-wrap ${data.img ? 'has-img' : ''}" onclick="this.nextElementSibling.click()">
          <img src="${data.img || ''}" data-storage-url="${data.img || ''}" alt="Preview" style="display: ${data.img ? 'block' : 'none'}">
          <div class="placeholder">Click to replace</div>
        </div>
        <input type="file" class="s-img-input" accept="image/*" style="display:none;" onchange="window.handleSpeakerImg(this)">
      </div>
      <div class="speaker-info-column">
        <div class="form-group"><label>Full Name</label><input type="text" class="s-name" value="${data.name}" placeholder="Kapil Dev"></div>
        <div class="form-group"><label>Role Tag (e.g. KEYNOTE)</label><input type="text" class="s-role" value="${data.role}" placeholder="e.g. KEYNOTE"></div>
        <div class="form-group"><label>Designation</label><input type="text" class="s-title" value="${data.title || ''}" placeholder="e.g. Director of QE"></div>
        <div class="form-group"><label>Status Label</label><input type="text" class="s-status" value="${data.status || 'CONFIRMED'}" placeholder="e.g. KEYNOTE SPEAKER"></div>
        <div class="form-group"><label>Bio</label><textarea class="s-bio" rows="3" placeholder="Speaker bio...">${data.bio || ''}</textarea></div>
      </div>
    </div>
  `;
  container.appendChild(div);
};

window.updateAgendaIndexes = () => {
  document.querySelectorAll('#agenda-list .dynamic-item').forEach((item, idx) => {
    const badge = item.querySelector('.index-badge');
    if (badge) badge.textContent = `${idx + 1}`;
  });
};

window.handleAgendaTagChange = (selectEl) => {
  const item = selectEl.closest('.dynamic-item');
  const customInput = item.querySelector('.a-tag-custom');
  const tagVal = selectEl.value;
  if (tagVal === 'Custom') { customInput.style.display = 'block'; customInput.focus(); }
  else { customInput.style.display = 'none'; }
  Array.from(item.classList).forEach(c => { if (c.startsWith('border-')) item.classList.remove(c); });
  const targetTag = tagVal === 'Custom' ? (customInput.value || 'Custom') : tagVal;
  item.classList.add(`border-${targetTag.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
};

window.addAgendaItem = (data = { id: null, time: '', tag: '', title: '', desc: '', speaker_name: '' }) => {
  const container = document.getElementById('agenda-list');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.setAttribute('data-id', data.id || '');
  const tagsList = ['Opens','Opening','Keynote','Talk','Panel','Break','Closing'];
  const tagVal = data.tag || 'Talk';
  const isCustom = !tagsList.includes(tagVal) && tagVal !== '';
  div.classList.add(`border-${(isCustom ? 'custom' : tagVal).toLowerCase().replace(/[^a-z0-9]/g, '')}`);
  const optionsHtml = tagsList.map(t => `<option value="${t}" ${tagVal === t ? 'selected' : ''}>${t}</option>`).join('') +
    `<option value="Custom" ${isCustom ? 'selected' : ''}>Custom...</option>`;
  div.innerHTML = `
    <div class="agenda-admin-header">
      <div class="agenda-item-index"><span class="index-num">SESSION</span><span class="index-badge">#</span></div>
      <button class="btn-del" onclick="this.closest('.dynamic-item').remove(); window.updateAgendaIndexes();" title="Delete Session">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </button>
    </div>
    <div class="agenda-card-grid">
      <div class="agenda-col-meta">
        <div class="form-group"><label>Time Slot</label><input type="text" class="a-time" value="${data.time || data.time_slot || ''}" placeholder="09:00 – 09:30"></div>
        <div class="form-group"><label>Category Tag</label>
          <select class="a-tag-select" onchange="window.handleAgendaTagChange(this)">${optionsHtml}</select>
          <input type="text" class="a-tag-custom" value="${isCustom ? tagVal : ''}" placeholder="Enter Custom Tag" style="margin-top:10px;display:${isCustom ? 'block' : 'none'};">
        </div>
        <div class="form-group"><label>Speaker Name</label><input type="text" class="a-speaker" value="${data.speaker_name || ''}" placeholder="John Doe (Optional)"></div>
      </div>
      <div class="agenda-col-main">
        <div class="form-group"><label>Topic Title</label><input type="text" class="a-title" value="${data.title || ''}" placeholder="The Proof of Value"></div>
        <div class="form-group"><label>Session Description</label><textarea class="a-desc" rows="5" placeholder="Session details...">${data.desc || ''}</textarea></div>
      </div>
    </div>
  `;
  container.appendChild(div);
  const customInput = div.querySelector('.a-tag-custom');
  customInput.addEventListener('input', () => {
    Array.from(div.classList).forEach(c => { if (c.startsWith('border-')) div.classList.remove(c); });
    div.classList.add(`border-${customInput.value.toLowerCase().replace(/[^a-z0-9]/g, '') || 'custom'}`);
  });
  window.updateAgendaIndexes();
};

window.addMaturityStage = (data = { id: null, name: '', pct: '', desc: '' }) => {
  const container = document.getElementById('maturity-stages-admin');
  if (!container) return;
  const stageNum = container.querySelectorAll('.dynamic-item').length + 1;
  const COLORS = ['#ffffff', 'var(--accent-3)', 'var(--accent-2)', 'var(--accent)'];
  const color = COLORS[stageNum - 1] || 'var(--accent)';
  const pctNum = String(data.pct || '').replace('%','').trim() || '0';
  const div = document.createElement('div');
  div.className = 'dynamic-item maturity-admin-card';
  div.setAttribute('data-id', data.id || '');
  div.innerHTML = `
    <div class="dynamic-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="mat-stage-badge" style="background:rgba(255,255,255,0.04);border:1px solid var(--line-strong);border-radius:8px;padding:4px 12px;font-family:var(--mono);font-size:10px;letter-spacing:0.12em;color:var(--ink-dim);">STAGE 0${stageNum}</span>
        <span class="mat-name-preview" style="font-family:var(--display);font-size:16px;font-weight:300;color:var(--ink);">${ data.name || 'Unnamed Stage' }</span>
      </div>
      <button class="btn-del" onclick="this.closest('.dynamic-item').remove()" title="Delete Stage">✕</button>
    </div>
    <div class="form-grid-2" style="margin-bottom:20px;">
      <div class="form-group">
        <label>Stage Name <span style="color:var(--accent);">*</span></label>
        <input type="text" class="mat-name" value="${data.name || ''}" placeholder="e.g. Manual-first"
          oninput="this.closest('.dynamic-item').querySelector('.mat-name-preview').textContent = this.value || 'Unnamed Stage'">
      </div>
      <div class="form-group">
        <label>Progress (% of orgs) <span style="color:var(--accent);">*</span></label>
        <input type="text" class="mat-pct" value="${data.pct || ''}" placeholder="e.g. 25%"
          oninput="const v=this.value.replace('%','').trim();const bar=this.closest('.dynamic-item').querySelector('.mat-meter-fill');if(bar){bar.style.width=(isNaN(v)?0:Math.min(v,100))+'%';}this.closest('.dynamic-item').querySelector('.mat-pct-preview').textContent=(v||'0')+'%';">
      </div>
    </div>
    <div class="form-group" style="margin-bottom:20px;">
      <label>Description <span style="color:var(--accent);">*</span></label>
      <textarea class="mat-desc" rows="3" placeholder="What does this stage look like in practice?">${data.desc || ''}</textarea>
    </div>
    <div style="background:var(--bg-2);border:1px solid var(--line);border-radius:12px;padding:16px 20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-family:var(--mono);font-size:9px;letter-spacing:0.12em;color:var(--ink-dim);text-transform:uppercase;">Live Preview — Progress Meter</span>
        <span class="mat-pct-preview" style="font-family:var(--mono);font-size:11px;color:${color};font-weight:700;">~ ${pctNum}% of orgs surveyed</span>
      </div>
      <div style="background:var(--bg-3);border-radius:100px;height:6px;overflow:hidden;">
        <div class="mat-meter-fill" style="height:100%;border-radius:100px;background:${color};width:${Math.min(parseFloat(pctNum)||0,100)}%;transition:width 0.4s ease;"></div>
      </div>
    </div>
  `;
  container.appendChild(div);
};

window.addPillarItem = (data = { id: null, title: '', desc: '' }) => {
  const container = document.getElementById('pillars-admin');
  if (!container) return;
  const pilNum = container.querySelectorAll('.dynamic-item').length + 1;
  const div = document.createElement('div');
  div.className = 'dynamic-item pillar-admin-card';
  div.setAttribute('data-id', data.id || '');
  div.innerHTML = `
    <div class="dynamic-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-family:var(--mono);font-size:10px;letter-spacing:0.12em;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent-dim);border-radius:8px;padding:4px 12px;">&gt; 0${pilNum}</span>
        <span class="pil-title-preview" style="font-family:var(--display);font-size:15px;font-weight:300;color:var(--ink);">${data.title || 'Untitled Pillar'}</span>
      </div>
      <button class="btn-del" onclick="this.closest('.dynamic-item').remove()" title="Delete Pillar">✕</button>
    </div>
    <div class="form-group" style="margin-bottom:16px;">
      <label>Pillar Title <span style="color:var(--accent);">*</span></label>
      <input type="text" class="pil-title" value="${data.title || ''}" placeholder="e.g. Continuous Testing"
        oninput="this.closest('.dynamic-item').querySelector('.pil-title-preview').textContent = this.value || 'Untitled Pillar'">
    </div>
    <div class="form-group">
      <label>Pillar Description <span style="color:var(--accent);">*</span></label>
      <textarea class="pil-desc" rows="3" placeholder="What happens in this pillar?">${data.desc || ''}</textarea>
    </div>
  `;
  container.appendChild(div);
};


// ── populateUI ───────────────────────────────────────────────────────────────
export function populateUI(data) {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = (val !== undefined && val !== null) ? val : (el.placeholder || '');
  };

  const sc = data.site_content || {};

  // Migrations
  if (!sc.manifestoSectionNum) sc.manifestoSectionNum = '01 / MANIFESTO';
  let heroEd = sc.heroEdition || '';
  if (!heroEd || heroEd.toUpperCase().includes('EDITION 01') || heroEd.toUpperCase().includes('EDITION 2') || heroEd.toUpperCase().includes('INAUGURAL')) sc.heroEdition = 'Edition 3';
  let footerEd = sc.footerEdition || '';
  if (!footerEd || footerEd.toUpperCase().includes('EDITION 01') || footerEd.toUpperCase().includes('EDITION 2') || footerEd.toUpperCase().includes('INAUGURAL')) sc.footerEdition = 'Edition 3';
  if (sc.involveCard2Title === 'Host' || !sc.involveCard2Title) { sc.involveCard2Title = 'Attend'; sc.involveCard2LinkText = 'SECURE YOUR ELITE PASS &rarr;'; }
  if (!sc.involveCard1LinkText) sc.involveCard1LinkText = 'SUBMIT YOUR TALK &rarr;';
  if (!sc.involveCard3LinkText) sc.involveCard3LinkText = 'COPY EVENT INVITE &rarr;';
  if (sc.involveTitle === 'How to participate.') sc.involveTitle = 'Three ways to [[shape]] Elevate QA.';

  // Populate all fields
  ['hero-headline','hero-tagline','hero-eyebrow','hero-edition','event-date','event-venue','hero-meta','hero-format','hero-audience','hero-cta-text'].forEach(f => setVal(f, sc[f.replace(/-([a-z])/g, (_, c) => c.toUpperCase())]));
  setVal('hero-headline', sc.heroHeadline); setVal('hero-tagline', sc.heroTagline);
  setVal('hero-eyebrow', sc.heroEyebrow);   setVal('hero-edition', sc.heroEdition);
  setVal('event-date', sc.eventDate);       setVal('event-venue', sc.eventVenue);
  setVal('hero-meta', sc.heroMeta);         setVal('hero-format', sc.heroFormat);
  setVal('hero-audience', sc.heroAudience); setVal('hero-cta-text', sc.heroCtaText);
  [1,2,3,4].forEach(i => { setVal(`stat${i}-num`, sc[`stat${i}Num`]); setVal(`stat${i}-lbl`, sc[`stat${i}Lbl`]); });
  for (let i = 1; i <= 9; i++) setVal(`ticker-${i}`, sc[`ticker${i}`]);
  setVal('prizes-title-input', sc.prizesHeadline);
  [1,2,3].forEach(i => { setVal(`prizes-s${i}-num`, sc[`prizesS${i}Num`]); setVal(`prizes-s${i}-text`, sc[`prizesS${i}Lbl`]); });
  setVal('manifesto-section-num', sc.manifestoSectionNum); setVal('manifesto-pill', sc.manifestoPill);
  setVal('manifesto-aside', sc.manifestoAside);
  if (data.manifesto) setVal('manifesto-lines', data.manifesto.content);
  setVal('map-section-num', sc.mapSectionNum); setVal('experience-section-num', sc.experienceSectionNum);
  setVal('agenda-section-num', sc.agendaSectionNum); setVal('agenda-section-title', sc.agendaSectionTitle);
  setVal('speakers-section-num-input', sc.speakersSectionNum); setVal('speakers-section-title', sc.speakersSectionTitle);
  setVal('speakers-intro', sc.speakersIntro);
  setVal('speakers-placeholder', sc.speakersPlaceholder || 'To be revealed');
  setVal('involve-section-num', sc.involveSectionNum); setVal('involve-title', sc.involveTitle);
  ['1','2','3'].forEach(n => {
    setVal(`involve-card${n}-title`, sc[`involveCard${n}Title`]); setVal(`involve-card${n}-desc`, sc[`involveCard${n}Desc`]);
    if (n !== '2') setVal(`involve-card${n}-link`, sc[`involveCard${n}Link`]);
    setVal(`involve-card${n}-link-text`, sc[`involveCard${n}LinkText`]);
  });
  setVal('coming-section-num', sc.comingSectionNum); setVal('coming-title', sc.comingTitle);
  setVal('coming-desc', sc.comingDesc); setVal('coming-visual-label', sc.comingVisualLabel); setVal('coming-visual-sub', sc.comingVisualSub);
  for (let i = 1; i <= 6; i++) { setVal(`coming-item${i}-label`, sc[`comingItem${i}Label`]); setVal(`coming-item${i}-status`, sc[`comingItem${i}Status`]); }
  setVal('footer-tagline', sc.footerTagline); setVal('footer-location', sc.footerLocation);
  setVal('footer-edition', sc.footerEdition); setVal('footer-copyright', sc.footerCopyright); setVal('footer-email', sc.footerEmail);
  setVal('nav-manifesto-input', sc.navManifesto); setVal('nav-maturity-input', sc.navMaturity);
  setVal('nav-experience-input', sc.navExperience); setVal('nav-agenda-input', sc.navAgenda);
  setVal('nav-speakers-input', sc.navSpeakers); setVal('nav-join-input', sc.navJoin);
  setVal('modal-price-scarcity', sc.modalPriceScarcity); setVal('modal-price-old', sc.modalPriceOld);
  setVal('modal-price-new', sc.modalPriceNew); setVal('modal-price-caption', sc.modalPriceCaption);
  setVal('modal-price-btn', sc.modalPriceBtn); setVal('modal-form-title', sc.modalFormTitle); setVal('modal-form-desc', sc.modalFormDesc);
  setVal('maturity-title-input', sc.maturityTitle); setVal('pillars-title-input', sc.pillarsTitle);
  setVal('set-max-attendees', sc.maxAttendeeLimit || '200');

  // Admin whitelist
  const adminContainer = document.getElementById('admin-emails-list');
  if (adminContainer) {
    adminContainer.innerHTML = '';
    const MASTER_ADMINS = ['abhishekjohri150@gmail.com', 'elevateqa@sdettech.com', 'abhishek.johri@sdettech.com'];
    let rawWhitelist = sc.admin_whitelist || sc.adminWhitelist;
    let whitelist = (rawWhitelist && Array.isArray(rawWhitelist) && rawWhitelist.length > 0) ? rawWhitelist : [...ALLOWED_ADMINS];
    whitelist = [...new Set([...whitelist, ...MASTER_ADMINS])];
    setAllowedAdmins(whitelist);
    whitelist.forEach(email => window.addAdminEmail(email));
  }

  // Branding
  const logoHeight = sc.logoHeight || (data.branding && data.branding.logo_height) || 48;
  setVal('visual-logo-height', logoHeight);
  const heightLabel = document.getElementById('logo-height-val');
  if (heightLabel) heightLabel.textContent = logoHeight;
  setVal('set-color-primary', sc.primaryColor || (data.branding && data.branding.primary_color));
  setVal('set-color-accent',  sc.accentColor  || (data.branding && data.branding.accent_color));

  const logoUrl = sc.logoUrl || (data.branding && data.branding.logo_url);
  if (logoUrl) {
    window._visualData.logo = logoUrl;
    _renderImgPreview('logo', logoUrl);
    ['admin-preloader-logo','admin-sidebar-logo','login-logo-img'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.src = logoUrl; el.style.display = 'block'; }
    });
  }
  const heroBg = sc.heroBg || (data.branding && data.branding.hero_bg_url);
  if (heroBg) { window._visualData.heroBg = heroBg; _renderImgPreview('hero-bg', heroBg); }
  
  const founderImg = sc.founderImg || (data.branding && data.branding.founder_img_url);
  if (founderImg) { window._visualData.founderImg = founderImg; _renderImgPreview('founder', founderImg); }

  const defaultStrips = [
    { img: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200&q=80', cap: 'The room. Curated, not crowded.' },
    { img: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=1000&q=80', cap: 'The stage. Built for proof.' },
    { img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80', cap: 'The conversation. Where careers compound.' }
  ];
  for (let i = 1; i <= 3; i++) {
    const img = (sc[`stripImg${i}`] != null) ? sc[`stripImg${i}`] : defaultStrips[i-1].img;
    const cap = (sc[`stripCap${i}`] != null) ? sc[`stripCap${i}`] : defaultStrips[i-1].cap;
    if (img) { window._visualData.strip[i-1] = img; _renderImgPreview(`strip-0${i}`, img); }
    const capEl = document.getElementById(`strip-0${i}-caption`);
    if (capEl) capEl.value = cap;
  }

  // Speaker list
  if (data.speakers) {
    const container = document.getElementById('speaker-list');
    if (container) {
      container.innerHTML = '';
      (data.speakers.length > 0 ? data.speakers : [
        { name: 'To be revealed', role: 'KEYNOTE', wave: 'WAVE 01' },
        { name: 'To be revealed', role: 'KEYNOTE', wave: 'WAVE 01' },
        { name: 'To be revealed', role: 'INDUSTRY', wave: 'WAVE 01' }
      ]).forEach(s => window.addSpeakerItem({ id: s.id, name: s.name, role: s.role, title: s.title, status: s.status, img: s.image_url || s.img, display_order: s.display_order, bio: s.bio }));
    }
  }

  // Agenda list
  if (data.agenda) {
    const container = document.getElementById('agenda-list');
    if (container) {
      container.innerHTML = '';
      data.agenda.forEach(a => window.addAgendaItem({ id: a.id, time: a.time_slot || a.time, tag: a.tag, title: a.title, desc: a.desc, display_order: a.display_order }));
    }
  }

  // Maturity stages
  const matContainer = document.getElementById('maturity-stages-admin');
  if (matContainer) {
    matContainer.innerHTML = '';
    const stages = (Array.isArray(data.maturity_stages) && data.maturity_stages.length > 0) ? data.maturity_stages : [
      { id: 1, label: 'STAGE 01', name: 'Manual-first', pct: '25%', desc: 'Test cases authored by hand.' },
      { id: 2, label: 'STAGE 02', name: 'Assisted',     pct: '50%', desc: 'AI helps generate test cases and data.' },
      { id: 3, label: 'STAGE 03', name: 'Augmented',    pct: '18%', desc: 'Self-healing automation, intelligent triage.' },
      { id: 4, label: 'STAGE 04', name: 'Autonomous',   pct: '7%',  desc: 'Quality agents reason about risk, prioritize, and adapt.' }
    ];
    stages.forEach(s => window.addMaturityStage(s));
  }

  // Pillars
  const pilContainer = document.getElementById('pillars-admin');
  if (pilContainer) {
    pilContainer.innerHTML = '';
    const pills = (Array.isArray(data.pillars) && data.pillars.length > 0) ? data.pillars : [
      { id: 1, title: 'Keynotes from people doing the work', desc: 'Industry voices sharing concrete case studies.' },
      { id: 2, title: 'Practitioner deep-dives',             desc: "Hands-on breakouts from engineers who've shipped AI-augmented test suites at scale." },
      { id: 3, title: 'The community table',                 desc: 'Curated roundtables for quality engineering leaders.' }
    ];
    pills.forEach(p => window.addPillarItem(p));
  }

  if (data.registrations) window.renderAttendees(data.registrations);
  if (data.speaker_applications) window.renderSpeakerApps(data.speaker_applications);

  // Email templates
  const et = sc.emailTemplates || {};
  const fillTpl = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  const reg = et.registration || {};
  fillTpl('et-registration-subject', reg.subject);
  fillTpl('et-registration-body1',   reg.body1);
  fillTpl('et-registration-body2',   reg.body2);
  fillTpl('et-registration-closing', reg.closing);
  fillTpl('et-registration-tagline', reg.tagline);
  const tkt = et.ticket || {};
  fillTpl('et-ticket-subject', tkt.subject);
  fillTpl('et-ticket-body1',   tkt.body1);
  fillTpl('et-ticket-closing', tkt.closing);
  fillTpl('et-ticket-tagline', tkt.tagline);
  const spk = et.speaker || {};
  fillTpl('et-speaker-subject', spk.subject);
  fillTpl('et-speaker-body1',   spk.body1);
  fillTpl('et-speaker-body2',   spk.body2);
  fillTpl('et-speaker-contact', spk.contact);
  const rej = et.rejection || {};
  fillTpl('et-rejection-subject', rej.subject);
  fillTpl('et-rejection-body1',   rej.body1);
  fillTpl('et-rejection-body2',   rej.body2);
  fillTpl('et-rejection-closing', rej.closing);
  fillTpl('et-rejection-tagline', rej.tagline);
}

function _renderImgPreview(id, url) {
  const preview     = document.getElementById(`preview-${id}`);
  const placeholder = document.getElementById(`placeholder-${id}`);
  if (preview) { preview.src = url; preview.style.display = 'block'; preview.parentElement.classList.add('has-img'); if (placeholder) placeholder.style.display = 'none'; }
  const dlLink = document.getElementById(`download-${id}`);
  if (dlLink && url) { dlLink.href = url; dlLink.style.display = 'inline-block'; }
}

// ── Email Center Logic ───────────────────────────────────────────────────────

// Switch template tabs
window.showEmailTemplateTab = (tabId) => {
  document.querySelectorAll('.email-template-panel').forEach(panel => panel.style.display = 'none');
  const target = document.getElementById(`etab-${tabId}`);
  if (target) target.style.display = 'block';
  document.querySelectorAll('[id^="etab-btn-"]').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`etab-btn-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');
};

// Save email templates to Supabase via saveSiteContent
window.saveEmailTemplates = async () => {
  const btn = document.getElementById('btn-save-email-templates');
  const statusEl = document.getElementById('email-template-status');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...'; }
  if (statusEl) { statusEl.textContent = ''; statusEl.style.color = 'var(--text-dim)'; }

  const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

  const templates = {
    emailTemplates: {
      registration: {
        subject: getVal('et-registration-subject'),
        body1:   getVal('et-registration-body1'),
        body2:   getVal('et-registration-body2'),
        closing: getVal('et-registration-closing'),
        tagline: getVal('et-registration-tagline'),
      },
      ticket: {
        subject: getVal('et-ticket-subject'),
        body1:   getVal('et-ticket-body1'),
        closing: getVal('et-ticket-closing'),
        tagline: getVal('et-ticket-tagline'),
      },
      speaker: {
        subject: getVal('et-speaker-subject'),
        body1:   getVal('et-speaker-body1'),
        body2:   getVal('et-speaker-body2'),
        contact: getVal('et-speaker-contact'),
      },
      rejection: {
        subject:  getVal('et-rejection-subject'),
        body1:    getVal('et-rejection-body1'),
        body2:    getVal('et-rejection-body2'),
        closing:  getVal('et-rejection-closing'),
        tagline:  getVal('et-rejection-tagline'),
      },
    }
  };

  try {
    const { saveSiteContent } = await import('./admin-supabase.js?v=2');
    // Merge with existing cached data so we don't overwrite other fields
    const existing = (window._lastLoadedData && window._lastLoadedData.site_content) || {};
    const merged = { ...existing, ...templates };
    const ok = await saveSiteContent(merged);
    if (ok) {
      // Update cache
      if (window._lastLoadedData) window._lastLoadedData.site_content = { ...existing, ...templates };
      if (statusEl) { statusEl.textContent = '✓ Templates saved!'; statusEl.style.color = 'var(--accent)'; }
      window.showToast('Email templates saved successfully!', 'success', 'Templates Saved');
    } else {
      throw new Error('Save returned false');
    }
  } catch (err) {
    console.error('[saveEmailTemplates]', err);
    if (statusEl) { statusEl.textContent = '✕ Save failed. Check console.'; statusEl.style.color = 'var(--accent-red)'; }
    window.showToast('Failed to save templates.', 'error', 'Save Error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'SAVE TEMPLATES <span aria-hidden="true" style="margin-left:8px;">💾</span>'; }
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 5000);
  }
};

window.toggleCustomEmailInput = () => {
  const target = document.querySelector('input[name="email-target"]:checked').value;
  const customContainer = document.getElementById('custom-emails-container');
  if (target === 'custom') {
    customContainer.style.display = 'block';
  } else {
    customContainer.style.display = 'none';
    const previewContainer = document.getElementById('custom-emails-preview-container');
    if (previewContainer) previewContainer.style.display = 'none';
    const btnSend = document.getElementById('btn-send-email');
    if (btnSend) btnSend.innerHTML = 'SEND EMAIL BLAST <span aria-hidden="true" style="margin-left: 8px;">🚀</span>';
  }
};

window.sendCustomEmail = async () => {
  const subject = document.getElementById('email-subject').value.trim();
  const message = document.getElementById('email-message').value.trim();
  const target = document.querySelector('input[name="email-target"]:checked').value;
  const statusMsg = document.getElementById('email-status-msg');
  
  if (!subject || !message) {
    statusMsg.style.color = 'var(--accent-red)';
    statusMsg.textContent = 'Please enter both a subject and a message.';
    return;
  }

  let targetEmails = [];

  const previewContainer = document.getElementById('custom-emails-preview-container');
  const previewTextarea = document.getElementById('custom-emails-preview-textarea');
  const btnSend = document.getElementById('btn-send-email');

  // First step: Generate and show preview
  if (previewContainer.style.display === 'none') {
    let parsed = [];
    
    if (target === 'custom') {
      const customInput = document.getElementById('custom-emails-input').value.trim();
      if (!customInput) {
        statusMsg.style.color = 'var(--accent-red)';
        statusMsg.textContent = 'Please enter at least one custom email address.';
        return;
      }
      
      parsed = customInput.split(',').map(e => {
        const raw = e.trim();
        if (!raw) return null;
        const match = raw.match(/^(.*?)\s*<(.+)>$/);
        if (match && match[1].trim()) {
          return { name: match[1].trim(), email: match[2].trim() };
        } else {
          const emailParts = raw.split('@')[0].split(/[._-]/);
          let extractedName = '';
          if (emailParts.length > 0) {
            extractedName = emailParts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
          }
          return { name: extractedName, email: raw };
        }
      }).filter(e => e);
    } else {
      statusMsg.style.color = 'var(--text-dim)';
      statusMsg.textContent = 'Fetching attendee list...';
      try {
        const { supabase } = await import('./supabase-config.js');
        const { data, error } = await supabase.from('registrations').select('email, name').neq('status', 'cancelled');
        if (error) throw error;
        if (!data || data.length === 0) {
          statusMsg.style.color = 'var(--accent-red)';
          statusMsg.textContent = 'No attendees found.';
          return;
        }
        parsed = data.filter(row => row.email).map(row => ({ email: row.email, name: row.name || 'there' }));
      } catch (err) {
        console.error('Error fetching attendees:', err);
        statusMsg.style.color = 'var(--accent-red)';
        statusMsg.textContent = 'Error fetching attendees from database.';
        return;
      }
    }
    
    previewTextarea.value = parsed.map(item => `${item.name} <${item.email}>`).join(',\n');
    
    previewContainer.style.display = 'block';
    btnSend.innerHTML = 'CONFIRM & SEND <span aria-hidden="true" style="margin-left: 8px;">🚀</span>';
    statusMsg.style.color = 'var(--accent)';
    statusMsg.textContent = 'Please review and edit the names before sending.';
    return; // Stop execution here, wait for second click
    
  } else {
    // Second step: Confirm and build targetEmails from the preview textarea
    const finalInput = previewTextarea.value.trim();
    let formatError = false;
    
    targetEmails = finalInput.split(',').map(e => {
      const raw = e.trim();
      if (!raw) return null;
      
      const match = raw.match(/^(.*?)\s*<(.+)>$/);
      if (match && match[1].trim()) {
        return { name: match[1].trim(), email: match[2].trim() };
      } else {
        formatError = true;
        return null;
      }
    }).filter(e => e);
    
    if (formatError || targetEmails.length === 0) {
      statusMsg.style.color = 'var(--accent-red)';
      statusMsg.textContent = 'Please ensure all emails follow the format: Name <email@example.com>';
      return;
    }
    
    // Hide preview and reset button for the next blast
    previewContainer.style.display = 'none';
    btnSend.innerHTML = 'SEND EMAIL BLAST <span aria-hidden="true" style="margin-left: 8px;">🚀</span>';
  }

  if (targetEmails.length === 0) {
    statusMsg.style.color = 'var(--accent-red)';
    statusMsg.textContent = 'No valid email addresses found.';
    return;
  }

  statusMsg.style.color = 'var(--text-dim)';
  statusMsg.textContent = `Sending to ${targetEmails.length} recipient(s)...`;
  document.getElementById('btn-send-email').disabled = true;

    try {
    const BACKEND_URL = '/.netlify/functions';
    
    const ccInput = document.getElementById('cc-emails-input') ? document.getElementById('cc-emails-input').value.trim() : '';
    const bccInput = document.getElementById('bcc-emails-input') ? document.getElementById('bcc-emails-input').value.trim() : '';
    const ccEmails = ccInput ? ccInput.split(',').map(e => e.trim()).filter(e => e) : [];
    const bccEmails = bccInput ? bccInput.split(',').map(e => e.trim()).filter(e => e) : [];

    const response = await fetch(`${BACKEND_URL}/send-custom-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        message,
        targetEmails,
        ccEmails,
        bccEmails
      })
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to send custom email');
    }

    statusMsg.style.color = 'var(--accent)';
    statusMsg.textContent = `Success! Email blast sent to ${targetEmails.length} recipient(s).`;
    
    // Clear the form after sending
    document.getElementById('email-subject').value = '';
    document.getElementById('email-message').value = '';
    if (target === 'custom') document.getElementById('custom-emails-input').value = '';
    if (document.getElementById('cc-emails-input')) document.getElementById('cc-emails-input').value = '';
    if (document.getElementById('bcc-emails-input')) document.getElementById('bcc-emails-input').value = '';

  } catch (err) {
    console.error('Error sending custom email:', err);
    statusMsg.style.color = 'var(--accent-red)';
    statusMsg.textContent = 'Error sending email: ' + err.message;
  } finally {
    document.getElementById('btn-send-email').disabled = false;
  }
};
