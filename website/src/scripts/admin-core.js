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
import {
  loadAllData, saveBranding, saveSiteContent, saveManifesto,
  saveSpeaker, saveAgendaItem, saveMaturityStage, savePillar,
  deleteItem, uploadImageToStorage, syncTableDeletes
} from './admin-supabase.js?v=2';
import { populateUI, ALLOWED_ADMINS, setAllowedAdmins } from './admin-ui.js?v=2';

// ── Initialization ────────────────────────────────────────────────────────────
const initAdmin = async () => {
  console.log('[ElevateQA] Admin Core Initialized (Supabase Mode)');
  const data = await loadAllData();
  if (data) {
    window._lastLoadedData = data;
    populateUI(data);
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

  // Failsafe polling (every 30 seconds) to ensure updates are fetched
  setInterval(async () => {
    const updatedData = await loadAllData();
    if (updatedData) {
      if (updatedData.registrations) window.renderAttendees(updatedData.registrations);
      if (updatedData.speaker_applications) window.renderSpeakerApps(updatedData.speaker_applications);
    }
  }, 30000);

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
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Syncing Everything...';
  btn.disabled = true;

  try {
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : undefined; };

    await saveSiteContent({
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

      prizesHeadline: getVal('prizes-title-input'),
      prizesS1Num: getVal('prizes-s1-num'), prizesS1Lbl: getVal('prizes-s1-text'),
      prizesS2Num: getVal('prizes-s2-num'), prizesS2Lbl: getVal('prizes-s2-text'),
      prizesS3Num: getVal('prizes-s3-num'), prizesS3Lbl: getVal('prizes-s3-text'),

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
      comingDesc: getVal('coming-desc'), comingVisualLabel: getVal('coming-visual-label'),
      comingVisualSub: getVal('coming-visual-sub'),
      comingItem1Label: getVal('coming-item1-label'), comingItem1Status: getVal('coming-item1-status'),
      comingItem2Label: getVal('coming-item2-label'), comingItem2Status: getVal('coming-item2-status'),
      comingItem3Label: getVal('coming-item3-label'), comingItem3Status: getVal('coming-item3-status'),
      comingItem4Label: getVal('coming-item4-label'), comingItem4Status: getVal('coming-item4-status'),
      comingItem5Label: getVal('coming-item5-label'), comingItem5Status: getVal('coming-item5-status'),
      comingItem6Label: getVal('coming-item6-label'), comingItem6Status: getVal('coming-item6-status'),
      footerTagline: getVal('footer-tagline'),     footerLocation: getVal('footer-location'),
      footerEdition: getVal('footer-edition'),     footerCopyright: getVal('footer-copyright'),
      footerEmail: getVal('footer-email'),
      navManifesto: getVal('nav-manifesto-input'), navMaturity: getVal('nav-maturity-input'),
      navExperience: getVal('nav-experience-input'), navAgenda: getVal('nav-agenda-input'),
      navSpeakers: getVal('nav-speakers-input'),   navJoin: getVal('nav-join-input'),
      modalPriceScarcity: getVal('modal-price-scarcity'), modalPriceOld: getVal('modal-price-old'),
      modalPriceNew: getVal('modal-price-new'),    modalPriceCaption: getVal('modal-price-caption'),
      modalPriceBtn: getVal('modal-price-btn'),    modalFormTitle: getVal('modal-form-title'),
      modalFormDesc: getVal('modal-form-desc'),
      maxAttendeeLimit: getVal('set-max-attendees'),
      maturityTitle: getVal('maturity-title-input'), pillarsTitle: getVal('pillars-title-input'),
      adminWhitelist: Array.from(document.querySelectorAll('.admin-email-entry'))
        .map(i => i.value.trim().toLowerCase()).filter(e => e),
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

    await saveBranding({
      logoUrl:  window._visualData.logo,
      logoHeight: getVal('visual-logo-height'),
      heroBg:   window._visualData.heroBg,
      founderImg: window._visualData.founderImg,
      stripImg1: window._visualData.strip[0], stripCap1: getVal('strip-01-caption'),
      stripImg2: window._visualData.strip[1], stripCap2: getVal('strip-02-caption'),
      stripImg3: window._visualData.strip[2], stripCap3: getVal('strip-03-caption'),
      primaryColor: getVal('set-color-primary') || '#d4ff3a'
    });

    await saveManifesto({ content: getVal('manifesto-lines') });

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
      return { el, data: { id: el.getAttribute('data-id') || undefined, name: el.querySelector('.s-name').value, role: el.querySelector('.s-role').value, title: el.querySelector('.s-title') ? el.querySelector('.s-title').value : '', status: el.querySelector('.s-status').value, bio: el.querySelector('.s-bio') ? el.querySelector('.s-bio').value : '', img: finalImg, display_order: i } };
    });
    const speakersWithEl = await Promise.all(speakerPromises);
    await syncTableDeletes('speakers', speakersWithEl.map(s => s.data.id));
    for (const s of speakersWithEl) { const newId = await saveSpeaker(s.data); if (newId) s.el.setAttribute('data-id', newId); }

    // Agenda
    const agendaElements = Array.from(document.querySelectorAll('#agenda-list .dynamic-item'));
    const agendaData = agendaElements.map((el, i) => {
      const selectVal = el.querySelector('.a-tag-select')?.value || 'Talk';
      const tag = selectVal === 'Custom' ? (el.querySelector('.a-tag-custom')?.value || '') : selectVal;
      return { el, data: { id: el.getAttribute('data-id') || undefined, time: el.querySelector('.a-time').value, tag, title: el.querySelector('.a-title').value, speaker_name: el.querySelector('.a-speaker').value, desc: el.querySelector('.a-desc').value, display_order: i } };
    });
    await syncTableDeletes('agenda', agendaData.map(a => a.data.id));
    for (const a of agendaData) { const newId = await saveAgendaItem(a.data); if (newId) a.el.setAttribute('data-id', newId); }

    // Maturity stages
    const maturityData = Array.from(document.querySelectorAll('#maturity-stages-admin .dynamic-item')).map((el, i) => ({
      el, data: { id: el.getAttribute('data-id') || undefined, name: el.querySelector('.mat-name').value, pct: el.querySelector('.mat-pct').value, desc: el.querySelector('.mat-desc').value, display_order: i }
    }));
    await syncTableDeletes('maturity_stages', maturityData.map(m => m.data.id));
    for (const m of maturityData) { const newId = await saveMaturityStage(m.data); if (newId) m.el.setAttribute('data-id', newId); }

    // Pillars
    const pillarsData = Array.from(document.querySelectorAll('#pillars-admin .dynamic-item')).map((el, i) => ({
      el, data: { id: el.getAttribute('data-id') || undefined, title: el.querySelector('.pil-title').value, desc: el.querySelector('.pil-desc').value, display_order: i }
    }));
    await syncTableDeletes('pillars', pillarsData.map(p => p.data.id));
    for (const p of pillarsData) { const newId = await savePillar(p.data); if (newId) p.el.setAttribute('data-id', newId); }

    btn.innerHTML = originalText;
    btn.disabled = false;
    window.showToast('All your changes have been successfully synced to the cloud and are now live on the site.', 'success', '100% Synced');
    await loadAllData();
  } catch (err) {
    console.error('[ElevateAdmin] Save Error:', err);
    btn.innerHTML = 'Error! Try Again';
    btn.disabled = false;
  }
};
