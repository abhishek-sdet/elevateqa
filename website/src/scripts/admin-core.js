/**
 * ELEVATE QA 2026 - ADMIN CORE ENGINE (ENTRY POINT)
 * ===================================================
 * This file is now a lean orchestrator. Business logic has been extracted to:
 *   - admin-ui.js          → UI helpers, populateUI, dynamic list items
 *   - admin-registrations.js → Attendee table, QR pass, export
 *   - admin-supabase.js    → All Supabase CRUD operations
 *   - admin-auth.js        → Session & OTP authentication
 */
import { supabase } from './supabase-config.js';
import './admin-auth.js?v=6';
import './admin-ui.js?v=2';
import './admin-registrations.js?v=3';
import './admin-ai-engine.js?v=1';
import {
  loadAllData, saveBranding, saveSiteContent, saveManifesto,
  saveSpeaker, saveAgendaItem, saveMaturityStage, savePillar,
  deleteItem, uploadImageToStorage, syncTableDeletes, fetchAttendanceUpdates
} from './admin-supabase.js?v=2';
import { populateUI, ALLOWED_ADMINS, setAllowedAdmins } from './admin-ui.js?v=2';

// ── Multi-admin conflict detection ───────────────────────────────────────────
// saveAll() below reconciles speakers/agenda/maturity_stages/pillars against
// whatever is CURRENTLY in this browser's DOM (see syncTableDeletes calls) and
// blindly overwrites site_content/branding/manifesto with this session's
// current field values. If a second admin is logged in on another device and
// saves in between, this session's next Save silently deletes their new rows
// (anything not in this stale DOM) and reverts their edits (anything this
// session never touched still gets written back with its OLD value). This
// snapshot lets saveAll() detect "the server has moved since I loaded" and
// warn before doing any of that, instead of silently clobbering the other
// admin's work. registrations/speaker_applications are deliberately excluded —
// those change constantly from real attendee activity and aren't part of what
// saveAll() writes, so including them would just cause constant false alarms.
const snapshotOf = (data) => JSON.stringify({
  speakers: data.speakers, agenda: data.agenda,
  maturity_stages: data.maturity_stages, pillars: data.pillars,
  site_content: data.site_content, branding: data.branding, manifesto: data.manifesto,
});

// ── Role restriction (desk staff vs full access) ─────────────────────────────
// MASTER_ADMINS are hard-coded full access everywhere in this app (client and
// both OTP functions) regardless of anything saved in the editable whitelist,
// so a mis-set role here can never lock out the core admins.
const MASTER_ADMINS = ['abhishekjohri150@gmail.com', 'elevateqa@sdettech.com', 'abhishek.johri@sdettech.com', 'mugdha.shah@sdettech.com'];

function applyRoleForCurrentAdmin(data) {
  const myEmail = (sessionStorage.getItem('admin_email') || '').toLowerCase();
  let role = 'full';
  if (myEmail && !MASTER_ADMINS.includes(myEmail)) {
    const whitelist = (data.site_content && data.site_content.adminWhitelist) || [];
    const entry = whitelist.find(e => (typeof e === 'string' ? e : e.email)?.toLowerCase() === myEmail);
    if (entry && typeof entry !== 'string' && entry.role) role = entry.role;
  }
  sessionStorage.setItem('admin_role', role);
  if (window.applyRoleRestrictions) window.applyRoleRestrictions(role);
}

// ── Initialization ────────────────────────────────────────────────────────────
const initAdmin = async () => {
  console.log('[ElevateQA] Admin Core Initialized (Supabase Mode)');

  // Defined BEFORE the initial fetch (not after) so it's already callable the
  // instant the login overlay appears — the overlay is visible by default via
  // CSS, so a fast OTP login can otherwise complete before this line below it
  // ever ran, leaving window.forceDataSync undefined and its post-login call
  // in admin-auth.js a silent no-op (data only ever shows up after a manual
  // refresh, once a fresh page load starts the fetch again from the top).
  window.forceDataSync = async () => {
    console.log('[ElevateQA] Force syncing data after auth...');
    const freshData = await loadAllData();
    if (freshData) {
      window._lastLoadedData = freshData;
      window._lastLoadedSnapshot = snapshotOf(freshData);
      populateUI(freshData);
      applyRoleForCurrentAdmin(freshData);
    }
  };

  const data = await loadAllData();
  if (data) {
    window._lastLoadedData = data;
    window._lastLoadedSnapshot = snapshotOf(data);
    populateUI(data);
    applyRoleForCurrentAdmin(data);
  }

  window.checkSession();

  // Sidebar hamburger
  const toggle   = document.getElementById('admin-menu-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');
  function openSidebar()  { document.body.classList.add('sidebar-active'); if (backdrop) backdrop.classList.add('active'); if (toggle) toggle.setAttribute('aria-expanded', 'true'); }
  function closeSidebar() { document.body.classList.remove('sidebar-active'); if (backdrop) backdrop.classList.remove('active'); if (toggle) toggle.setAttribute('aria-expanded', 'false'); }
  if (toggle)   toggle.addEventListener('click', (e) => { e.stopPropagation(); document.body.classList.contains('sidebar-active') ? closeSidebar() : openSidebar(); });
  if (backdrop) backdrop.addEventListener('click', closeSidebar);
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => { if (window.innerWidth <= 1024) closeSidebar(); });
  });

  // Restore active tab
  const hashSection = location.hash.replace('#', '').trim();
  const savedTab    = sessionStorage.getItem('admin_active_tab');
  window.showSection(hashSection || savedTab || 'attendance');

  // Real-time registration & speaker app sync
  console.log('[ElevateQA] Enabling Real-time Registration & Speaker Sync...');
  supabase
    .channel('admin-realtime-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, async (payload) => {
      console.log('[ElevateQA] Registration Change Detected:', payload);
      const updatedData = await loadAllData();
      if (updatedData && updatedData.registrations) {
        window.renderAttendees(updatedData.registrations);
        if (payload.eventType === 'INSERT') {
          window.showToast(`New attendee registration: ${payload.new.name} (${payload.new.company || ''})`, 'info', 'New Attendee');
        }
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'speaker_applications' }, async (payload) => {
      console.log('[ElevateQA] Speaker Application Change Detected:', payload);
      const updatedData = await loadAllData();
      if (updatedData && updatedData.speaker_applications) {
        window.renderSpeakerApps(updatedData.speaker_applications);
        if (payload.eventType === 'INSERT') {
          window.showToast(`New speaker application: ${payload.new.name} (${payload.new.company || ''})`, 'info', 'New Speaker App');
        }
      }
    })
    .subscribe((status) => { console.log('[ElevateQA] Real-time Sync Status:', status); });

  // Failsafe polling — the realtime subscription above is the primary path,
  // but if it's ever misconfigured or drops (e.g. the table isn't actually
  // in Supabase's realtime publication, or a websocket hiccup), this is the
  // only thing that keeps scanner check-ins showing up at all. Runs every
  // 3s rather than a slower interval since gate check-ins need to appear
  // for every admin watching the Attendance tab without a noticeable delay.
  // Only re-fetches registrations/speaker_applications (not every table via
  // loadAllData) so a tight interval doesn't add unnecessary Supabase load.
  setInterval(async () => {
    const updated = await fetchAttendanceUpdates();
    if (updated.registrations) window.renderAttendees(updated.registrations);
    if (updated.speaker_applications) window.renderSpeakerApps(updated.speaker_applications);
  }, 3000);

  // Cross-tab communication for local scanner
  window.addEventListener('storage', async (e) => {
    if (e.key === 'elevate_last_scan') {
      console.log('[ElevateQA] Scanner update detected, refreshing data...');
      const updatedData = await loadAllData();
      if (updatedData && updatedData.registrations) {
        window.renderAttendees(updatedData.registrations);
      }
    }
  });

  // Dismiss preloader
  setTimeout(() => {
    const preloader = document.getElementById('admin-preloader');
    if (preloader) { preloader.classList.add('dismissed'); setTimeout(() => preloader.remove(), 600); }
  }, 400);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}

// ── Save All (Publish) ────────────────────────────────────────────────────────
window.saveAll = async () => {
  const btn = document.getElementById('btn-publish');
  // The conflict check below awaits a network round-trip before the button
  // used to get disabled, so a fast double-click could start a second
  // concurrent saveAll() run — disable immediately, before anything else, to
  // rule that out.
  if (btn.disabled) return;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Checking for conflicts...';

  // Conflict check — if another admin has changed speakers/agenda/site
  // content etc. since this session loaded, saving now would silently
  // delete their new rows (via syncTableDeletes reconciling against this
  // stale DOM) and/or revert their edits (this session re-writes every
  // field's last-loaded value, including ones it never touched). Give the
  // admin a chance to back out and refresh instead of finding out after
  // the fact.
  if (window._lastLoadedSnapshot) {
    const freshCheck = await loadAllData();
    if (freshCheck && snapshotOf(freshCheck) !== window._lastLoadedSnapshot) {
      const proceed = await window.showConfirm(
        'Site data has changed since you loaded this page — most likely another admin saved changes in the meantime. Publishing now could overwrite their edits or delete anything they added (speakers, agenda items, etc). Refresh this page first to load the latest data, then re-apply your changes.',
        'Data Changed Elsewhere',
        'PUBLISH ANYWAY (RISKY)'
      );
      if (!proceed) {
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
      }
    }
  }

  btn.innerHTML = '<span class="spinner"></span> Syncing Everything...';

  try {
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : undefined; };
    const failures = [];

    const siteContentOk = await saveSiteContent({
      heroHeadline: getVal('hero-headline'), heroTagline: getVal('hero-tagline'),
      heroEyebrow: getVal('hero-eyebrow'),   heroEdition: getVal('hero-edition'),
      eventDate: getVal('event-date'),       eventVenue: getVal('event-venue'),
      heroMeta: getVal('hero-meta'),         heroFormat: getVal('hero-format'),
      heroAudience: getVal('hero-audience'), heroCtaText: getVal('hero-cta-text'),

      stat1Num: getVal('stat1-num'), stat1Lbl: getVal('stat1-lbl'),
      stat2Num: getVal('stat2-num'), stat2Lbl: getVal('stat2-lbl'),
      stat3Num: getVal('stat3-num'), stat3Lbl: getVal('stat3-lbl'),
      stat4Num: getVal('stat4-num'), stat4Lbl: getVal('stat4-lbl'),

      ticker1: getVal('ticker-1'), ticker2: getVal('ticker-2'), ticker3: getVal('ticker-3'),
      ticker4: getVal('ticker-4'), ticker5: getVal('ticker-5'), ticker6: getVal('ticker-6'),
      ticker7: getVal('ticker-7'), ticker8: getVal('ticker-8'), ticker9: getVal('ticker-9'),

      prizesMessage: getVal('prizes-message-input'),

      manifestoSectionNum: getVal('manifesto-section-num'),
      manifestoPill: getVal('manifesto-pill'), manifestoAside: getVal('manifesto-aside'),
      founderImg: window._visualData.founderImg,
      mapSectionNum: getVal('map-section-num'),
      experienceSectionNum: getVal('experience-section-num'),
      agendaSectionNum: getVal('agenda-section-num'), agendaSectionTitle: getVal('agenda-section-title'),
      speakersSectionNum: getVal('speakers-section-num-input'),
      speakersSectionTitle: getVal('speakers-section-title'), speakersIntro: getVal('speakers-intro'),
      speakersPlaceholder: getVal('speakers-placeholder'),
      involveSectionNum: getVal('involve-section-num'), involveTitle: getVal('involve-title'),
      involveCard1Title: getVal('involve-card1-title'), involveCard1Desc: getVal('involve-card1-desc'),
      involveCard1Link: getVal('involve-card1-link'),   involveCard1LinkText: getVal('involve-card1-link-text'),
      involveCard2Title: getVal('involve-card2-title'), involveCard2Desc: getVal('involve-card2-desc'),
      involveCard2LinkText: getVal('involve-card2-link-text'),
      involveCard3Title: getVal('involve-card3-title'), involveCard3Desc: getVal('involve-card3-desc'),
      involveCard3LinkText: getVal('involve-card3-link-text'),
      comingSectionNum: getVal('coming-section-num'), comingTitle: getVal('coming-title'),
      comingDesc: getVal('coming-desc'),
      comingItem1Label: getVal('coming-item1-label'), comingItem1Status: getVal('coming-item1-status'),
      comingItem2Label: getVal('coming-item2-label'), comingItem2Status: getVal('coming-item2-status'),
      comingItem3Label: getVal('coming-item3-label'), comingItem3Status: getVal('coming-item3-status'),
      comingItem4Label: getVal('coming-item4-label'), comingItem4Status: getVal('coming-item4-status'),
      comingItem5Label: getVal('coming-item5-label'), comingItem5Status: getVal('coming-item5-status'),
      comingItem6Label: getVal('coming-item6-label'), comingItem6Status: getVal('coming-item6-status'),
      footerTagline: getVal('footer-tagline'),     footerLocation: getVal('footer-location'),
      footerEdition: getVal('footer-edition'),     footerCopyright: getVal('footer-copyright'),
      footerEmail: getVal('footer-email'),
      supportEmailAttendee: getVal('set-email-attendee'), supportEmailPresenter: getVal('set-email-presenter'),
      supportEmailGeneral: getVal('set-email-support'),
      navManifesto: getVal('nav-manifesto-input'), navMaturity: getVal('nav-maturity-input'),
      navExperience: getVal('nav-experience-input'), navAgenda: getVal('nav-agenda-input'),
      navSpeakers: getVal('nav-speakers-input'),   navJoin: getVal('nav-join-input'),
      modalPriceScarcity: getVal('modal-price-scarcity'), modalPriceOld: getVal('modal-price-old'),
      modalPriceNew: getVal('modal-price-new'),    modalPriceCaption: getVal('modal-price-caption'),
      modalPriceBtn: getVal('modal-price-btn'),    modalFormTitle: getVal('modal-form-title'),
      modalFormDesc: getVal('modal-form-desc'),
      maxAttendeeLimit: getVal('set-max-attendees'),
      attendeeRegClosed: document.getElementById('set-attendee-closed')?.checked || false,
      speakerRegClosed: document.getElementById('set-speaker-closed')?.checked || false,
      maturityTitle: getVal('maturity-title-input'), pillarsTitle: getVal('pillars-title-input'),
      adminWhitelist: Array.from(document.querySelectorAll('#admin-emails-list .dynamic-row'))
        .map(row => {
          const email = row.querySelector('.admin-email-entry')?.value.trim().toLowerCase();
          const role = row.querySelector('.admin-role-select')?.value || 'full';
          return email ? { email, role } : null;
        })
        .filter(Boolean),
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
    });
    if (!siteContentOk) failures.push('Site Content');

    const brandingOk = await saveBranding({
      logoUrl:  window._visualData.logo,
      logoHeight: getVal('visual-logo-height'),
      heroBg:   window._visualData.heroBg,
      stripImg1: window._visualData.strip[0], stripCap1: getVal('strip-01-caption'),
      stripImg2: window._visualData.strip[1], stripCap2: getVal('strip-02-caption'),
      stripImg3: window._visualData.strip[2], stripCap3: getVal('strip-03-caption'),
      primaryColor: getVal('set-color-primary') || '#d4ff3a',
      accentColor: getVal('set-color-accent') || '#d4ff3a'
    });
    if (!brandingOk) failures.push('Branding');

    const manifestoOk = await saveManifesto({ content: getVal('manifesto-lines') });
    if (!manifestoOk) failures.push('Manifesto');

    // Speakers
    const speakerPromises = Array.from(document.querySelectorAll('#speaker-list .dynamic-item')).map(async (el, i) => {
      let finalImg = el.querySelector('.img-upload-wrap img')?.dataset.storageUrl || '';
      let src = el.querySelector('.img-upload-wrap img')?.src || '';
      if (!finalImg && src.startsWith('data:image')) {
        try {
          const res = await fetch(src); const blob = await res.blob();
          const ext = blob.type.split('/')[1] || 'png';
          const file = new File([blob], `migrated_speaker_${Date.now()}_${i}.${ext}`, { type: blob.type });
          finalImg = await uploadImageToStorage(file, `speakers/${file.name}`) || '';
          if (finalImg) el.querySelector('.img-upload-wrap img').dataset.storageUrl = finalImg;
        } catch(e) { console.error('[ElevateAdmin] Base64 Migration Error:', e); }
      } else if (!finalImg) { finalImg = src; }
      if (finalImg.startsWith('data:image')) finalImg = '';
      return { el, data: { id: el.getAttribute('data-id') || undefined, name: el.querySelector('.s-name').value, role: el.querySelector('.s-role').value, title: el.querySelector('.s-title') ? el.querySelector('.s-title').value : '', status: el.querySelector('.s-status').value, bio: el.querySelector('.s-bio') ? el.querySelector('.s-bio').value : '', linkedin: el.querySelector('.s-linkedin') ? el.querySelector('.s-linkedin').value : '', img: finalImg, display_order: i } };
    });
    const speakersWithEl = await Promise.all(speakerPromises);
    await syncTableDeletes('speakers', speakersWithEl.map(s => s.data.id));
    for (const s of speakersWithEl) {
      const newId = await saveSpeaker(s.data);
      if (newId) s.el.setAttribute('data-id', newId);
      else failures.push(`Speaker "${s.data.name || '(unnamed)'}"`);
    }

    // Agenda
    const agendaElements = Array.from(document.querySelectorAll('#agenda-list .dynamic-item'));
    const agendaData = agendaElements.map((el, i) => {
      const selectVal = el.querySelector('.a-tag-select')?.value || 'Talk';
      const tag = selectVal === 'Custom' ? (el.querySelector('.a-tag-custom')?.value || '') : selectVal;
      return { el, data: { id: el.getAttribute('data-id') || undefined, time: el.querySelector('.a-time').value, tag, title: el.querySelector('.a-title').value, speaker_name: el.querySelector('.a-speaker').value, desc: el.querySelector('.a-desc').value, display_order: i } };
    });
    await syncTableDeletes('agenda', agendaData.map(a => a.data.id));
    for (const a of agendaData) {
      const newId = await saveAgendaItem(a.data);
      if (newId) a.el.setAttribute('data-id', newId);
      else failures.push(`Agenda item "${a.data.title || '(untitled)'}"`);
    }

    // Maturity stages
    const maturityData = Array.from(document.querySelectorAll('#maturity-stages-admin .dynamic-item')).map((el, i) => ({
      el, data: { id: el.getAttribute('data-id') || undefined, name: el.querySelector('.mat-name').value, pct: el.querySelector('.mat-pct').value, desc: el.querySelector('.mat-desc').value, display_order: i }
    }));
    await syncTableDeletes('maturity_stages', maturityData.map(m => m.data.id));
    for (const m of maturityData) {
      const newId = await saveMaturityStage(m.data);
      if (newId) m.el.setAttribute('data-id', newId);
      else failures.push(`Maturity stage "${m.data.name || '(unnamed)'}"`);
    }

    // Pillars
    const pillarsData = Array.from(document.querySelectorAll('#pillars-admin .dynamic-item')).map((el, i) => ({
      el, data: { id: el.getAttribute('data-id') || undefined, title: el.querySelector('.pil-title').value, desc: el.querySelector('.pil-desc').value, display_order: i }
    }));
    await syncTableDeletes('pillars', pillarsData.map(p => p.data.id));
    for (const p of pillarsData) {
      const newId = await savePillar(p.data);
      if (newId) p.el.setAttribute('data-id', newId);
      else failures.push(`Pillar "${p.data.title || '(untitled)'}"`);
    }

    btn.innerHTML = originalText;
    btn.disabled = false;
    if (failures.length > 0) {
      window.showToast(`${failures.length} item(s) failed to save and were skipped: ${failures.join(', ')}. Everything else synced — fix these and Publish again.`, 'error', 'Partial Sync');
    } else {
      window.showToast('All your changes have been successfully synced to the cloud and are now live on the site.', 'success', '100% Synced');
    }
    const postSaveData = await loadAllData();
    if (postSaveData) {
      window._lastLoadedData = postSaveData;
      window._lastLoadedSnapshot = snapshotOf(postSaveData);
    }
  } catch (err) {
    console.error('[ElevateAdmin] Save Error:', err);
    btn.innerHTML = 'Error! Try Again';
    btn.disabled = false;
  }
};
