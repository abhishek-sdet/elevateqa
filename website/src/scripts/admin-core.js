/**
 * ELEVATE QA 2026 - ADMIN CORE ENGINE
 * Orchestrates all modules and handles main app lifecycle.
 */

const DEFAULT_ADMIN_DATA = {
  site_content: {
    // Hero
    heroEyebrow:  "AI Led Quality Engineering Tech Summit · by SDET TECH",
    heroHeadline: "Elevate | [[Quality.]] | Prove value.",
    heroTagline:  "The first grand symposium for quality engineering in the age of AI — a one-day reckoning with what's real, what's hype, and what actually moves the needle.",
    heroCtaText:  "Get your ticket",
    heroEdition:  "EDITION 02 — AUGUST 2026",
    heroMeta:     "A SYMPOSIUM BY SDET TECHNOLOGIES / NOIDA, INDIA / 8TH AUG 2026",
    // Hero Footer Metadata
    eventDate:    "Revealing soon",
    eventVenue:   "Delhi NCR, India",
    heroFormat:   "One day, two stages",
    heroAudience: "200–500 QE leaders",
    // Stats Bar
    stat1Num: "2<em>nd</em>", stat1Lbl: "Edition / Aug 2026",
    stat2Num: "<em>500</em>", stat2Lbl: "QE Practitioners",
    stat3Num: "8<em>+</em>",  stat3Lbl: "Hours of Signal",
    stat4Num: "<em>1</em>",   stat4Lbl: "Theme. Proof of Value.",
    // Ticker
    ticker1: "Elevate QA 2026",
    ticker2: "AI-Led Quality Engineering",
    ticker3: "AI Led Quality Engineering Tech Summit",
    ticker4: "Hosted by SDET Technologies",
    ticker5: "8th August 2026 — Noida",
    ticker6: "Speaker Submissions Open",
    ticker7: "200–500 Attendees — Edition 02",
    ticker8: "CFP Now Open",
    // Manifesto
    manifestoPill:  "Why now",
    manifestoAside: "A note from the founder.",
    manifestoLines: [
      "Everyone is talking about AI in quality engineering. <em>Few are showing the proof.</em>",
      "We've watched the hype cycle. We've sat through the same demos. We know what actually shipped to production and held up.",
      "Elevate QA exists for the harder conversation. Where practitioners put real work on the table — what they tried, what broke, what changed the math.",
      "No vendor pitches. No abstract theory. <em>The proof of value, or it didn't happen.</em>"
    ],
    // Speakers Section
    speakersSectionTitle: "A roster built for <em>proof.</em>",
    speakersIntro: "We're curating a lineup of keynote voices and industry practitioners who have moved beyond the hype. Meet the first wave of confirmed speakers.",
    // Get Involved
    involveTitle:      "Three ways to <em>shape</em> Elevate QA.",
    involveCard1Title: "Speak",
    involveCard1Desc:  "If you've shipped real AI-led QE work and have a story that holds up to scrutiny, the stage is yours. We're curating speakers, not collecting them.",
    involveCard2Title: "Attend",
    involveCard2Desc:  "Join the 2nd Edition of Elevate QA. We've unlocked limited <strong>Free Entry</strong> for the first 300 practitioners to ensure the room is built on merit, not budgets.",
    involveCard3Title: "Spread the word",
    involveCard3Desc:  "Send this to a colleague who's living the AI-in-QE problem. The right peer recommendation builds a better room than any campaign ever could.",
    // Coming Soon
    comingTitle:       "Date. Venue. <em>Lineup.</em>",
    comingDesc:        "We're locking in the details that make a great event a memorable one. Watch this space — the full reveal is coming in waves over the next few weeks.",
    comingItem1Status: "✓ Live",
    comingItem2Status: "✓ Open",
    comingItem3Status: "✓ 8th Aug 2026",
    comingItem4Status: "✓ Noida, Delhi NCR",
    comingItem5Status: "✓ Wave 01 & 02 Live",
    comingItem6Status: "Wave 03",
    // Navigation
    navManifesto:  "Manifesto",
    navMaturity:   "Why Now",
    navExperience: "Experience",
    navAgenda:     "Agenda",
    navSpeakers:   "Speakers",
    navJoin:       "Get Involved",
    // Modal
    modalPriceScarcity: "Special 2nd Edition Access",
    modalPriceOld:      "₹499",
    modalPriceNew:      "₹0",
    modalPriceCaption:  "Unlocked for the first 300 registered practitioners.",
    modalPriceBtn:      "Claim my free spot →",
    modalFormTitle:     "Confirm your <em>Access</em>",
    modalFormDesc:      "Since this is a free pass, please provide your professional details to confirm your seat.",
    // Footer
    footerTagline:  "The proof of value, or it didn't happen.",
    footerLocation: "DELHI NCR, INDIA",
    footerEdition:  "EDITION 02",
    // Section Titles
    maturityTitle:   "Where is your team on the AI-led QE curve?",
    experienceTitle: "A day built around <em>signal,</em> not noise.",
    // Dynamic
    maturityStages: [
      { name: "Manual-first", pct: "25%", desc: "Test cases authored by hand. Automation islands. AI is \"interesting,\" not yet operational." },
      { name: "Assisted",     pct: "50%", desc: "AI helps generate test cases and data. Engineers stay in the loop. Early wins, mixed signals." },
      { name: "Augmented",    pct: "75%", desc: "Self-healing automation, intelligent triage, AI-driven coverage gap analysis. Measurable lift." },
      { name: "Autonomous",   pct: "100%",desc: "Quality agents reason about risk, prioritize, and adapt. Humans set strategy. The future, already here in pockets." }
    ],
    pillars: [
      { title: "Keynotes from people doing the work",   desc: "Industry voices and engineering leaders sharing concrete case studies — what AI changed, what it delivered." },
      { title: "Practitioner deep-dives",               desc: "Hands-on breakouts from engineers who've shipped AI-augmented test suites and intelligent pipelines." },
      { title: "The community table",                   desc: "Curated roundtables where 200–500 quality engineering leaders connect and debate." },
      { title: "Live demos, not slideware",             desc: "See AI-led QE tooling in action on real codebases, real bugs, real flaky tests." },
      { title: "The candid panels",                     desc: "The unfiltered conversations: what AI in QE is overhyped, what's underrated, where the field goes from here." },
      { title: "Recognition & prizes",                  desc: "Speaker of the event, audience awards, and surprises throughout the day." }
    ]
  },
  agenda: [
    { time: "09:00", tag: "Opens",          title: "Registration & morning coffee",           desc: "Pick up your badge, meet the early arrivals." },
    { time: "10:00", tag: "Opening Keynote",title: "The proof of value: what AI in QE has actually delivered", desc: "A grounded look at where AI has paid off in quality engineering." },
    { time: "11:00", tag: "Track Sessions", title: "Parallel deep-dives across two stages",   desc: "Engineers showing real AI implementations." },
    { time: "13:00", tag: "Break",          title: "Lunch & networking",                      desc: "Curated tables by topic — sit with people working on similar problems." },
    { time: "14:30", tag: "Keynote Panel",  title: "The candid panel: hype vs. reality",      desc: "Practitioners go on record about what's overhyped and what's underrated." },
    { time: "15:30", tag: "Workshops",      title: "Hands-on working sessions",               desc: "Bring a laptop. Leave with code and concrete starting points." },
    { time: "17:30", tag: "Awards",         title: "Speaker of the Event & recognition",      desc: "Audience awards, surprises, applause that means something." },
    { time: "18:30", tag: "Reception",      title: "Closing reception & after hours",         desc: "Drinks, conversations, and connections that outlast the agenda." }
  ],
  speakers: [
    { name: "Keynote Speaker 01", role: "Category Creator", status: "KEYNOTE SPEAKER", img: "" },
    { name: "Industry Leader 02", role: "Engineering VP",   status: "GUEST SPEAKER",   img: "" }
  ],
  visuals: {
    logo: "/logo-brand.png",
    logoHeight: 48,
    heroBg: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1600&q=80",
    strip: [
      { img: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200&q=80", cap: "The room. Curated, not crowded." },
      { img: "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=1000&q=80", cap: "The stage. Built for proof." },
      { img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",   cap: "The conversation. Where careers compound." }
    ]
  }
};


document.addEventListener('DOMContentLoaded', () => {
  console.log('[ElevateQA] Admin Core Initialized');
  checkSession();

  // 3. Initialize Firebase if available
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    window.db = firebase.database();
    loadAllData();
  }

  // 4. Initialize Visual Preview Store with safety
  try {
    const savedVisuals = localStorage.getItem('elevate_visuals');
    const parsedVisuals = savedVisuals ? JSON.parse(savedVisuals) : {};
    window._visualData = {
      logo: parsedVisuals.logo || '',
      heroBg: parsedVisuals.heroBg || '',
      strip: (parsedVisuals.strip || ['', '', '']).map(s => typeof s === 'string' ? s : (s.img || ''))
    };
  } catch (e) {
    console.warn('[ElevateQA] Visuals cache corrupted, resetting:', e);
    window._visualData = { logo: '', heroBg: '', strip: ['', '', ''] };
  }
});

// Navigation Function (Global)
function showSection(target) {
  console.log(`[ElevateQA] Navigating to ${target}`);
  
  // 1. Update Tabs
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNav = document.getElementById(`nav-${target}`);
  if (activeNav) activeNav.classList.add('active');

  // 2. Update Sections
  document.querySelectorAll('main section').forEach(sec => {
    sec.style.display = 'none';
  });
  
  const targetSec = document.getElementById(`sec-${target}`);
  if (targetSec) {
    targetSec.style.display = 'block';
  } else {
    console.warn(`[ElevateQA] Section #sec-${target} not found`);
  }
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('admin_logged_in');
    window.location.reload();
  }
}

/**
 * MAIN SAVE ACTION
 * Orchestrates the collection of all UI data and pushes to Cloud/Local.
 */
function saveAll() {
  try {
    const getVal = (id) => document.getElementById(id)?.value || '';
    
    console.log('[ElevateAdmin] Starting Save Orchestration...');
    
    // A. Site Content
    const site_content_data = {
      // ... same as before ...
    // Hero
    heroHeadline:   getVal('hero-headline'),
    heroTagline:    getVal('hero-tagline'),
    heroCtaText:    getVal('hero-cta-text'),
    heroEyebrow:    getVal('hero-eyebrow'),
    heroMeta:       getVal('hero-meta'),
    heroEdition:    getVal('hero-edition'),
    // Hero Footer Metadata
    eventDate:      getVal('event-date'),
    eventVenue:     getVal('event-venue'),
    heroFormat:     getVal('hero-format'),
    heroAudience:   getVal('hero-audience'),
    // Stats Bar
    stat1Num: getVal('stat1-num'), stat1Lbl: getVal('stat1-lbl'),
    stat2Num: getVal('stat2-num'), stat2Lbl: getVal('stat2-lbl'),
    stat3Num: getVal('stat3-num'), stat3Lbl: getVal('stat3-lbl'),
    stat4Num: getVal('stat4-num'), stat4Lbl: getVal('stat4-lbl'),
    // Ticker
    ticker1: getVal('ticker-1'), ticker2: getVal('ticker-2'),
    ticker3: getVal('ticker-3'), ticker4: getVal('ticker-4'),
    ticker5: getVal('ticker-5'), ticker6: getVal('ticker-6'),
    ticker7: getVal('ticker-7'), ticker8: getVal('ticker-8'),
    // Manifesto
    manifestoPill:  getVal('manifesto-pill'),
    manifestoAside: getVal('manifesto-aside'),
    manifestoLines: getVal('manifesto-lines').split('\n').filter(l => l.trim()),
    // Speakers Section
    speakersSectionTitle: getVal('speakers-section-title'),
    speakersIntro:        getVal('speakers-intro'),
    // Get Involved
    involveTitle:      getVal('involve-title'),
    involveCard1Title: getVal('involve-card1-title'),
    involveCard1Desc:  getVal('involve-card1-desc'),
    involveCard2Title: getVal('involve-card2-title'),
    involveCard2Desc:  getVal('involve-card2-desc'),
    involveCard3Title: getVal('involve-card3-title'),
    involveCard3Desc:  getVal('involve-card3-desc'),
    // Coming Soon
    comingTitle:        getVal('coming-title'),
    comingDesc:         getVal('coming-desc'),
    comingItem1Status:  getVal('coming-item1-status'),
    comingItem2Status:  getVal('coming-item2-status'),
    comingItem3Status:  getVal('coming-item3-status'),
    comingItem4Status:  getVal('coming-item4-status'),
    comingItem5Status:  getVal('coming-item5-status'),
    comingItem6Status:  getVal('coming-item6-status'),
    // Navigation
    navManifesto:  getVal('nav-manifesto'),
    navMaturity:   getVal('nav-maturity'),
    navExperience: getVal('nav-experience'),
    navAgenda:     getVal('nav-agenda'),
    navSpeakers:   getVal('nav-speakers'),
    navJoin:       getVal('nav-join'),
    // Modal
    modalPriceScarcity: getVal('modal-price-scarcity'),
    modalPriceOld:      getVal('modal-price-old'),
    modalPriceNew:      getVal('modal-price-new'),
    modalPriceCaption:  getVal('modal-price-caption'),
    modalPriceBtn:      getVal('modal-price-btn'),
    modalFormTitle:     getVal('modal-form-title'),
    modalFormDesc:      getVal('modal-form-desc'),
    // Footer
    footerTagline:  getVal('footer-tagline'),
    footerLocation: getVal('footer-location'),
    footerEdition:  getVal('footer-edition'),
    // Section Titles
    maturityTitle:    getVal('maturity-title'),
    experienceTitle:  getVal('pillars-title'),
    // Typography
    fontHeroTitle:    getVal('font-hero-title'),
    lhHeroTitle:      getVal('lh-hero-title'),
    fontHeroTagline:  getVal('font-hero-tagline'),
    fontBody:         getVal('font-body'),
    // Dynamic
    maturityStages: Array.from(document.querySelectorAll('#maturity-stages-admin .dynamic-item')).map((el, i) => ({
      label: `STAGE 0${i+1}`,
      name: el.querySelector('.mat-name').value,
      pct: el.querySelector('.mat-pct').value,
      desc: el.querySelector('.mat-desc').value
    })),
    pillars: Array.from(document.querySelectorAll('#pillars-admin .dynamic-item')).map(el => ({
      title: el.querySelector('.pil-title').value,
      desc: el.querySelector('.pil-desc').value
    }))
  };

  // B. Agenda
  const agenda = Array.from(document.querySelectorAll('#agenda-list .dynamic-item')).map(el => ({
    time:  el.querySelector('.a-time').value,
    tag:   el.querySelector('.a-tag').value,
    title: el.querySelector('.a-title').value,
    desc:  el.querySelector('.a-desc') ? el.querySelector('.a-desc').value : ''
  }));

  // C. Speakers
  const speakers = Array.from(document.querySelectorAll('#speaker-list .dynamic-item')).map(el => {
    const imgEl = el.querySelector('img');
    let imgSrc = '';
    if (imgEl && imgEl.src) {
      // If it's a data URL, use it directly. 
      // If it's a full URL that looks like the page itself (empty img src fallback), treat as empty.
      if (imgEl.src.startsWith('data:')) {
        imgSrc = imgEl.src;
      } else if (imgEl.src.length > 5 && !imgEl.src.endsWith('admin.html') && !imgEl.src.endsWith('/') && !imgEl.style.display === 'none') {
        imgSrc = imgEl.src;
      }
    }

    return {
      name: el.querySelector('.s-name')?.value || '',
      role: el.querySelector('.s-role')?.value || '',
      status: el.querySelector('.s-status')?.value || 'CONFIRMED',
      img: imgSrc
    };
  });

  // D. Visuals
  const visuals = {
    logo: window._visualData.logo || '',
    logoHeight: getVal('visual-logo-height') || 48,
    heroBg: window._visualData.heroBg || '',
    strip: [0,1,2].map(i => ({
      img: window._visualData.strip[i] || '',
      cap: document.getElementById(`strip-0${i+1}-caption`)?.value || ''
    }))
  };

  // E. Settings
  const settings_data = {
    domain: getVal('set-domain'),
    emails: {
      admins: Array.from(document.querySelectorAll('.admin-email-entry')).map(i => i.value.trim()).filter(i => i),
      attendee:  getVal('set-email-attendee'),
      support:   getVal('set-email-support')
    }
  };

  // F. EXECUTE SYNC
  const btn = document.getElementById('btn-publish');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Syncing...';
  btn.disabled = true;

  // Try local first
  try {
    console.log('[ElevateAdmin] Saving Visuals:', visuals);
    localStorage.setItem('elevate_site_content', JSON.stringify(site_content_data));
    localStorage.setItem('elevate_agenda', JSON.stringify(agenda));
    localStorage.setItem('elevate_speakers', JSON.stringify(speakers));
    localStorage.setItem('elevate_settings', JSON.stringify(settings_data));
    localStorage.setItem('elevate_visuals', JSON.stringify(visuals));
  } catch(e) { 
    console.warn('[ElevateQA] Local Storage Error:', e); 
  }

  // Cloud Push (Parallel)
  const syncPromises = [
    syncToCloud('site_content', site_content_data),
    syncToCloud('agenda', agenda),
    syncToCloud('speakers', speakers),
    syncToCloud('visuals', visuals),
    syncToCloud('settings', settings_data)
  ];

    Promise.all(syncPromises).then(results => {
      const success = results.every(r => r === true);
      btn.innerHTML = originalText;
      btn.disabled = false;
      
      if (success) {
        showSavedToast('🚀 100% Synced to Live Site');
      } else {
        showSavedToast('⚠ Sync Partial or Failed (Check Console)');
      }
    });

  } catch (err) {
    console.error('[ElevateAdmin] CRITICAL SAVE ERROR:', err);
    alert('A critical error occurred during saving. Check console for details.');
    const btn = document.getElementById('btn-publish');
    if (btn) {
      btn.innerHTML = 'SYNC & PUBLISH';
      btn.disabled = false;
    }
  }
}

/**
 * DATA LOADERS (Invoked by Sync Module)
 */
function loadSiteContent(data) {
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  // Hero
  setVal('hero-headline',  data.heroHeadline);
  setVal('hero-tagline',   data.heroTagline);
  setVal('hero-cta-text',  data.heroCtaText);
  setVal('hero-eyebrow',   data.heroEyebrow);
  setVal('hero-meta',      data.heroMeta);
  setVal('hero-edition',   data.heroEdition);
  // Hero Footer Metadata
  setVal('event-date',     data.eventDate);
  setVal('event-venue',    data.eventVenue);
  setVal('hero-format',    data.heroFormat);
  setVal('hero-audience',  data.heroAudience);
  // Stats Bar
  setVal('stat1-num', data.stat1Num); setVal('stat1-lbl', data.stat1Lbl);
  setVal('stat2-num', data.stat2Num); setVal('stat2-lbl', data.stat2Lbl);
  setVal('stat3-num', data.stat3Num); setVal('stat3-lbl', data.stat3Lbl);
  setVal('stat4-num', data.stat4Num); setVal('stat4-lbl', data.stat4Lbl);
  // Ticker
  for (let i = 1; i <= 8; i++) setVal(`ticker-${i}`, data[`ticker${i}`]);
  // Manifesto
  setVal('manifesto-pill',  data.manifestoPill);
  setVal('manifesto-aside', data.manifestoAside);
  setVal('manifesto-lines', (data.manifestoLines || []).join('\n'));
  // Speakers Section
  setVal('speakers-section-title', data.speakersSectionTitle);
  setVal('speakers-intro',         data.speakersIntro);
  // Get Involved
  setVal('involve-title',       data.involveTitle);
  setVal('involve-card1-title', data.involveCard1Title);
  setVal('involve-card1-desc',  data.involveCard1Desc);
  setVal('involve-card2-title', data.involveCard2Title);
  setVal('involve-card2-desc',  data.involveCard2Desc);
  setVal('involve-card3-title', data.involveCard3Title);
  setVal('involve-card3-desc',  data.involveCard3Desc);
  // Coming Soon
  setVal('coming-title', data.comingTitle);
  setVal('coming-desc',  data.comingDesc);
  for (let i = 1; i <= 6; i++) setVal(`coming-item${i}-status`, data[`comingItem${i}Status`]);
  // Navigation
  setVal('nav-manifesto',  data.navManifesto);
  setVal('nav-maturity',   data.navMaturity);
  setVal('nav-experience', data.navExperience);
  setVal('nav-agenda',     data.navAgenda);
  setVal('nav-speakers',   data.navSpeakers);
  setVal('nav-join',       data.navJoin);
  // Modal
  setVal('modal-price-scarcity', data.modalPriceScarcity);
  setVal('modal-price-old',      data.modalPriceOld);
  setVal('modal-price-new',      data.modalPriceNew);
  setVal('modal-price-caption',  data.modalPriceCaption);
  setVal('modal-price-btn',      data.modalPriceBtn);
  setVal('modal-form-title',     data.modalFormTitle);
  setVal('modal-form-desc',      data.modalFormDesc);
  // Footer
  setVal('footer-tagline',  data.footerTagline);
  setVal('footer-location', data.footerLocation);
  setVal('footer-edition',  data.footerEdition);
  // Section Titles
  setVal('maturity-title', data.maturityTitle);
  setVal('pillars-title',  data.experienceTitle);
  // Dynamic
  const matContainer = document.getElementById('maturity-stages-admin');
  if (matContainer) { matContainer.innerHTML = ''; (data.maturityStages || []).forEach(s => addMaturityStage(s)); }
  const pilContainer = document.getElementById('pillars-admin');
  if (pilContainer) { pilContainer.innerHTML = ''; (data.pillars || []).forEach(p => addPillarItem(p)); }
}

function loadAgenda(data) {
  const container = document.getElementById('agenda-list');
  if (container && Array.isArray(data)) {
    container.innerHTML = '';
    data.forEach(item => addAgendaItem(item));
  }
}

function loadSpeakers(data) {
  const container = document.getElementById('speaker-list');
  if (container && Array.isArray(data)) {
    container.innerHTML = '';
    data.forEach(s => addSpeakerItem(s));
  }
}

function loadSettings(data) {
  const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val || ''; };
  setVal('set-domain', data.domain);
  if (data.emails) {
    setVal('set-email-attendee', data.emails.attendee);
    setVal('set-email-support', data.emails.support);
  }
}

function loadVisuals(data) {
  if (!data) return;
  
  // 0. Logo
  if (data.logo) {
    const preview = document.getElementById('preview-logo');
    if (preview) {
      preview.src = data.logo;
      preview.style.display = 'block';
      const wrap = preview.parentElement;
      if (wrap) wrap.classList.add('has-img');
    }
    const sidebarLogo = document.getElementById('admin-sidebar-logo');
    if (sidebarLogo) sidebarLogo.src = data.logo;
    const loginLogo = document.getElementById('login-logo-img');
    if (loginLogo) loginLogo.src = data.logo;
    window._visualData.logo = data.logo;
  }
  if (data.logoHeight) {
    const input = document.getElementById('visual-logo-height');
    const display = document.getElementById('logo-height-val');
    if (input) input.value = data.logoHeight;
    if (display) display.textContent = data.logoHeight;
  }

  // 1. Hero BG
  if (data.heroBg) {
    const preview = document.getElementById('preview-hero-bg');
    if (preview) {
      preview.src = data.heroBg;
      preview.style.display = 'block';
      const wrap = preview.parentElement;
      if (wrap) wrap.classList.add('has-img');
      window._visualData.heroBg = data.heroBg;
    }
  }

  // 2. Image Strip
  if (Array.isArray(data.strip)) {
    data.strip.forEach((item, i) => {
      const idx = i + 1;
      const preview = document.getElementById(`preview-strip-0${idx}`);
      const caption = document.getElementById(`strip-0${idx}-caption`);
      const placeholder = document.getElementById(`placeholder-strip-0${idx}`);
      
      if (preview && item.img) {
        preview.src = item.img;
        preview.style.display = 'block';
        const wrap = preview.parentElement;
        if (wrap) wrap.classList.add('has-img');
        window._visualData.strip[i] = item.img;
      }
      if (caption) {
        caption.value = item.cap || '';
      }
    });
  }
}

function loadAttendees(data) {
  const container = document.getElementById('attendee-list');
  if (container && Array.isArray(data)) {
    container.innerHTML = data.map(a => `
      <div class="attendee-row">
        <div class="a-info">
          <strong>${a.name}</strong>
          <span>${a.org} &bull; ${a.email}</span>
        </div>
        <div class="a-status ${a.checkedIn ? 'checked' : ''}">${a.checkedIn ? 'Checked In' : 'Registered'}</div>
      </div>
    `).join('');
    document.getElementById('attendee-count').textContent = data.length;
  }
}

// Visual Upload Handlers
function triggerVisualUpload(id) {
  document.getElementById(`upload-${id}`).click();
}

function handleVisualUpload(input, id) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById(`preview-${id}`);
    if (preview) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      preview.parentElement.classList.add('has-img');
      
      // Update store
      if (id === 'logo') {
        console.log('[ElevateAdmin] Logo updated in store (Base64 length):', e.target.result.length);
        window._visualData.logo = e.target.result;
        const sidebarLogo = document.getElementById('admin-sidebar-logo');
        if (sidebarLogo) sidebarLogo.src = e.target.result;
        const loginLogo = document.getElementById('login-logo-img');
        if (loginLogo) loginLogo.src = e.target.result;
      } else if (id === 'hero-bg') {
        window._visualData.heroBg = e.target.result;
      } else {
        const idx = parseInt(id.split('-')[1]) - 1;
        window._visualData.strip[idx] = e.target.result;
      }
    }
  };
  reader.readAsDataURL(file);
}
