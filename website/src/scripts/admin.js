let CURRENT_OTP = "";

// ============================================================
// SINGLE SOURCE OF TRUTH — all site content lives here.
// These are the DEFAULTS. Once saved via the admin portal,
// localStorage takes over as the live data source.
// ============================================================
const DEFAULT_SITE_CONTENT = {
  // HERO
  heroHeadline: "AI-Led|Quality Engineering|[[Proof of Value]]",
  heroTagline: "The first grand symposium for quality engineering in the age of AI — a one-day reckoning with what's <em>real</em>, what's <em>hype</em>, and what actually moves the needle.",
  heroCtaText: "Be part of it",
  heroEyebrow: "QE × AI — The Proof of Value",
  heroMeta: "A SYMPOSIUM BY SDET TECHNOLOGIES / INDIA / 2026",
  heroEdition: "EDITION 01 — INAUGURAL",
  eventDate: "8th August 2026",
  eventVenue: "Noida, Delhi NCR",
  heroFormat: "One day, <em>two stages</em>",
  heroAudience: "200–300 <em>QE leaders</em>",

  // MANIFESTO
  manifestoPill: "Why now",
  manifestoAside: "A note from the <br>founder.",
  manifestoLines: [
    "Everyone is talking about AI in quality engineering. <em>Few are showing the proof.</em>",
    "We've watched the hype cycle. We've sat through the same demos. We know what an AI-generated test looks like — and we know <span class=\"highlight\">what actually shipped to production</span> and held up.",
    "Elevate QA exists for the second conversation. The harder one. The one where engineers, leaders, and practitioners put real work on the table — what they tried, what broke, what changed the math.",
    "No vendor pitches. No abstract theory. <em>The proof of value, or it didn't happen.</em>"
  ],

  // WHY NOW / MATURITY
  maturityTitle: "Where is your team on the <em>AI-led QE</em> curve?",
  maturityStages: [
    { label: "STAGE 01", sub: "FOUNDATION", name: "<em>Manual</em>-first", desc: "Test cases authored by hand. Automation islands. AI is \"interesting,\" not yet operational.", pct: "~ 25% of orgs surveyed" },
    { label: "STAGE 02", sub: "EXPLORATORY", name: "<em>Assisted</em>", desc: "AI helps generate test cases and data. Engineers stay in the loop. Early wins, mixed signals.", pct: "~ 50% of orgs surveyed" },
    { label: "STAGE 03", sub: "OPERATIONAL", name: "<em>Augmented</em>", desc: "Self-healing automation, intelligent triage, AI-driven coverage gap analysis. Measurable lift.", pct: "~ 18% of orgs surveyed" },
    { label: "STAGE 04", sub: "FRONTIER", name: "<em>Autonomous</em>", desc: "Quality agents reason about risk, prioritize, and adapt. Humans set strategy. The future, already here in pockets.", pct: "~ 7% of orgs surveyed" }
  ],

  // PILLARS
  pillarsTitle: "Four pillars. One theme. <em>Proof of value.</em>",
  pillars: [
    { title: "The <em>Strategic</em> Case", desc: "Why AI in QE now? ROI frameworks, executive buy-in, and maturity models from leaders who have made the business case — and proved it." },
    { title: "The <em>Technical</em> Foundation", desc: "AI-assisted test generation, self-healing locators, visual testing, LLM-powered test design. Hands-on proof — not slides." },
    { title: "The <em>Human</em> Element", desc: "Reskilling QA teams, changing team structures, the evolving role of the tester, career paths in an AI-first world." },
    { title: "The <em>Proof</em> of Value", desc: "Case studies with real metrics. Before/after numbers. Failures and what they taught. The receipts — or it didn't happen." },
    { title: "<em>Candid</em> Panels", desc: "CTO + QA Head on the uncomfortable truth about AI ROI in testing. Practitioners who will say it plainly, on record, on stage." },
    { title: "Live <em>Workshops</em>", desc: "Bring a laptop. Leave with code, frameworks, and starting points for your AI-led QE programme." }
  ],

  // OTHERS
  speakersIntro: "We're curating a lineup of keynote voices and industry practitioners who have moved beyond the hype. Meet the first wave of confirmed speakers.",
  prizesTitle: "Speak well. Win <em>big.</em><br>Speaker of the Event takes home <em>headline prizes.</em>",
  comingTitle: "Date. Venue. <em>Lineup.</em>",
  comingDesc: "We're locking in the details that make a great event a memorable one. Watch this space — the full reveal is coming in waves over the next few weeks."
};


const DEFAULT_AGENDA = [
  { time: "09:00", tag: "Opens",    title: "Registration & Morning Coffee",        desc: "Pick up your badge, collect your welcome kit. Find your tribe before the day begins." },
  { time: "09:35", tag: "Opening",  title: "Welcome & Opening Remarks",             desc: "MC sets the stage. What today is about and what to expect from the next 8 hours." },
  { time: "10:00", tag: "Keynote 1",title: "Keynote Speaker 1",                     desc: "The proof of value: what AI in QE has actually delivered. Real metrics, no hype." },
  { time: "10:25", tag: "Talk",     title: "Presenter 1",                           desc: "Practitioner deep-dive into AI-augmented test engineering." },
  { time: "10:50", tag: "Talk",     title: "Presenter 2",                           desc: "Hands-on session on self-healing automation and intelligent quality pipelines." },
  { time: "11:15", tag: "Break",    title: "Tea Break",                             desc: "Quick reset and networking in the lounge." },
  { time: "11:30", tag: "Panel",    title: "Panel Discussion",                      desc: "Four practitioners go on record about the uncomfortable truth of AI ROI." },
  { time: "12:00", tag: "Talk",     title: "Presenter 3",                           desc: "Case study: Scaling AI-led QE in a legacy environment." },
  { time: "12:25", tag: "Talk",     title: "Presenter 4",                           desc: "Beyond the hype: Technical architecture of AI testing agents." },
  { time: "12:50", tag: "Break",    title: "Lunch & Networking",                    desc: "Curated tables by topic. Connect with your peers." },
  { time: "14:00", tag: "Keynote 2",title: "Keynote Speaker 2",                     desc: "Beyond Test Automation — AI as Your Quality Intelligence Layer." },
  { time: "14:25", tag: "Talk",     title: "Presenter 5",                           desc: "Practitioner session on intelligent triage and risk-based testing." },
  { time: "14:50", tag: "Talk",     title: "Presenter 6",                           desc: "LLM-powered test design: From requirements to execution." },
  { time: "15:15", tag: "Talk",     title: "Presenter 7",                           desc: "The role of the tester in an AI-first world: A career roadmap." },
  { time: "15:40", tag: "Break",    title: "Tea Break",                             desc: "Afternoon recharge before the closing sessions." },
  { time: "16:00", tag: "Keynote 3",title: "Presenter 8 / Sachin Sir",              desc: "Strategic Address on AI-Led Quality Engineering Leadership." },
  { time: "16:25", tag: "Talk",     title: "Presenter 9",                           desc: "Final practitioner track: AI in mobile and cross-platform testing." },
  { time: "16:50", tag: "Talk",     title: "Presenter 10",                          desc: "The roadmap to 2028: What's actually next for QE." },
  { time: "17:15", tag: "Closing",  title: "Awards & Closing Remarks",              desc: "Speaker of the Event, lucky draw, and final wrap-up." },
  { time: "17:45", tag: "Social",   title: "Closing reception & after hours",       desc: "Drinks, conversations, and the connections that outlast the agenda." }
];

const DEFAULT_SPEAKERS = [
  { name: "Sachin Srivastava", role: "Strategic Speaker (Wave 01)", img: "" },
  { name: "Kapil Dev", role: "Keynote Speaker (Wave 01)", img: "" }
];

const DEFAULT_SETTINGS = {
  domain: "elevate-qa.com",
  emails: {
    admin: "abhishekjohri150@gmail.com",
    attendee: "tickets@elevate-qa.com",
    presenter: "speakers@elevate-qa.com",
    support: "help@sdet.tech"
  },
  theme: {
    primary: "#d4ff3a",
    background: "#0b0b10",
    accent: "#ff5a36"
  }
};
const DEFAULT_VISUALS = {
  heroBg: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1600&q=80',
  strip: [
    { img: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200&q=80', cap: 'The room. Curated, not crowded.' },
    { img: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=1000&q=80', cap: 'The stage. Built for proof.' },
    { img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80', cap: 'The conversation. Where careers compound.' }
  ]
};

// ============================================================
// FIREBASE INITIALIZATION
// ============================================================
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.database();
  console.log("[ElevateAdmin] Firebase Initialized.");
}

// Helper to push to Cloud
function syncToCloud(path, data) {
  if (window.db) {
    console.log(`[ElevateQA] Attempting sync to ${path}...`);
    window.db.ref(path).set(data)
      .then(() => console.log(`[ElevateQA] ✓ ${path} synced successfully`))
      .catch(err => {
        console.error(`[ElevateQA] ✗ ${path} sync failed:`, err);
        if (err.message.includes('permission_denied')) {
          alert('Database Error: Permission Denied. Please check your Firebase rules.');
        }
      });
  } else {
    console.warn(`[ElevateQA] ⚠ Cannot sync ${path}: Database not initialized`);
  }
}

// Helper to pull from Cloud
function syncFromFirebase() {
  if (!window.db) return;
  
  // 1. Initial full pull
  window.db.ref('/').once('value').then(snapshot => {
    const data = snapshot.val();
    if (!data) return;
    updateLocalAndUI(data);
    console.log("[ElevateAdmin] Initial Sync from Cloud.");
  });

  // 2. Real-time listener for attendees (updates table instantly on scan)
  window.db.ref('attendees').on('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      localStorage.setItem('elevate_attendees', JSON.stringify(data));
      loadAllData(); // Refresh the table UI
      console.log("[ElevateAdmin] Live Update: Attendee checked in.");
    }
  });
}

function updateLocalAndUI(data) {
  if (data.site_content) localStorage.setItem('elevate_site_content', JSON.stringify(data.site_content));
  if (data.agenda) localStorage.setItem('elevate_agenda', JSON.stringify(data.agenda));
  if (data.speakers) localStorage.setItem('elevate_speakers', JSON.stringify(data.speakers));
  if (data.visuals) localStorage.setItem('elevate_visuals', JSON.stringify(data.visuals));
  if (data.attendees) localStorage.setItem('elevate_attendees', JSON.stringify(data.attendees));
  if (data.settings) localStorage.setItem('elevate_settings', JSON.stringify(data.settings));
}

// ============================================================
// IN-MEMORY VISUAL DATA STORE
// Stores actual uploaded data URLs, independent of DOM img.src.
// DOM img.src is unreliable: when src="", the browser resolves it
// to the full page URL, breaking save conditions.
// ============================================================
window._visualData = {
  heroBg: '',
  strip: ['', '', '']
};

// ============================================================
// AUTH
// ============================================================
function checkAuth() {
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('protected-content').style.display = 'flex';
    document.body.style.overflow = 'auto';
    syncFromFirebase(); // Pull latest from Cloud on login
    loadAllData();
    
    // RESTORE ACTIVE TAB
    const savedTab = sessionStorage.getItem('admin_active_tab') || 'attendance';
    showSection(savedTab);
  }
}

function addAdminEmail(email = '') {
  const container = document.getElementById('admin-emails-list');
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
}

function sendOTP(e) {
  if (e) e.preventDefault();
  const loginInput = document.getElementById('login-number');
  const inputEmail = loginInput.value.trim().toLowerCase();
  
  const settings = JSON.parse(localStorage.getItem('elevate_settings')) || {};
  const authorizedEmails = settings.emails && Array.isArray(settings.emails.admins) 
    ? settings.emails.admins.map(e => e.trim().toLowerCase()) 
    : ["abhishekjohri150@gmail.com"];

  if (settings.emails && Array.isArray(settings.emails.admins)) {
    document.getElementById('admin-emails-list').innerHTML = '';
    settings.emails.admins.forEach(email => addAdminEmail(email));
  } else {
    addAdminEmail("abhishekjohri150@gmail.com");
  }
  
  if (settings.theme) {
    const p = settings.theme.primary || "#d4ff3a";
    const b = settings.theme.background || "#0b0b10";
    const a = settings.theme.accent || "#ff5a36";
    
    document.getElementById('set-color-primary').value = p;
    document.getElementById('set-color-primary-hex').value = p;
    document.getElementById('set-color-bg').value = b;
    document.getElementById('set-color-bg-hex').value = b;
    document.getElementById('set-color-accent').value = a;
    document.getElementById('set-color-accent-hex').value = a;
    
    // Add real-time sync between picker, text, and visual preview
    ['primary', 'bg', 'accent'].forEach(id => {
      const pkr = document.getElementById(`set-color-${id}`);
      const txt = document.getElementById(`set-color-${id}-hex`);
      const prv = document.getElementById(`preview-${id}`);
      
      const update = (val) => {
        prv.style.background = val;
        pkr.value = val;
        txt.value = val;
      };

      pkr.oninput = () => update(pkr.value);
      txt.oninput = () => update(txt.value);
      
      // Set initial
      update(pkr.value);
    });
  }
  
  if (settings.emails) {
    document.getElementById('set-email-attendee').value = settings.emails.attendee || "";
    document.getElementById('set-email-presenter').value = settings.emails.presenter || "";
    document.getElementById('set-email-support').value = settings.emails.support || "";
  }
  
  document.getElementById('set-domain').value = settings.domain || "";
  
  console.log("Login Attempt:", { inputEmail, authorizedEmails });

  // Check if email is in the authorized list OR is the master key
  if (authorizedEmails.includes(inputEmail) || inputEmail === "abhishekjohri150@gmail.com") {
    console.log("Auth Successful");
    document.getElementById('auth-step-1').style.display = 'none';
    document.getElementById('auth-step-2').style.display = 'block';
    
    CURRENT_OTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send to the email that is trying to log in
    fetch(`https://formsubmit.co/ajax/${inputEmail}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: "Elevate QA Admin — Login Code",
        "Your Login OTP": CURRENT_OTP,
        _replyto: inputEmail
      })
    }).then(res => res.json()).then(data => {
      if (data.success === 'true' || data.success === true) {
        showAuthToast("OTP sent to your Email!");
      } else {
        CURRENT_OTP = "123456";
        showAuthToast("Email API Error. Fallback code: 123456", true);
      }
    }).catch(err => {
      CURRENT_OTP = "123456";
      showAuthToast("Network error. Fallback code: 123456", true);
    });
  } else {
    showConfirm(`The email "${inputEmail}" is not authorized to access this panel.`, "Unauthorized Access", "CLOSE");
  }
}

function showAuthToast(msg, isWarning = false) {
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;top:40px;left:50%;transform:translateX(-50%);background:${isWarning?'#ff5a36':'#d4ff3a'};color:#0b0b10;padding:12px 24px;border-radius:8px;font-family:Manrope,sans-serif;font-weight:600;z-index:10001;box-shadow:0 10px 30px rgba(0,0,0,0.5);`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function moveFocus(el, i) { 
  if (el.value.length === 1 && i < 6) {
    const next = document.querySelectorAll('.otp-input')[i];
    if (next) next.focus();
  } 
}

function handleBackspace(el, e) {
  if (e.key === "Backspace" && el.value === "") {
    const inputs = document.querySelectorAll('.otp-input');
    const idx = Array.from(inputs).indexOf(el);
    if (idx > 0) inputs[idx - 1].focus();
  }
}

function verifyOTP() {
  const enteredCode = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
  console.log("Verification Attempt:", { enteredCode, CURRENT_OTP });

  if (enteredCode === CURRENT_OTP) {
    console.log("Verify Successful");
    sessionStorage.setItem('admin_logged_in', 'true');
    location.reload();
  } else {
    showAuthToast("Incorrect Code", true);
  }
}

function logout() { sessionStorage.removeItem('admin_logged_in'); location.reload(); }

// ============================================================
// NAVIGATION
// ============================================================
function showSection(id) {
  const sections = ['attendance', 'identity', 'agenda', 'speakers', 'visuals', 'settings'];
  sections.forEach(s => {
    const el = document.getElementById(`sec-${s}`);
    const nav = document.getElementById(`nav-${s}`);
    if (el) el.style.display = (s === id) ? 'block' : 'none';
    if (nav) nav.classList.toggle('active', s === id);
  });

  sessionStorage.setItem('admin_active_tab', id);

  const titles = {
    attendance: ['Attendee Command', 'Real-time registration tracking and verification.'],
    identity: ['Site Identity', 'Manage taglines, hero content, and about sections.'],
    agenda: ['Event Agenda', 'Organize sessions, timestamps, and topics.'],
    speakers: ['Speaker Roster', 'Curate your featured voices and credentials.'],
    visuals: ['Visual Assets', 'Upload atmosphere graphics and background media.'],
    settings: ['Platform Settings', 'Configure administrative security and data.']
  };

  const titleEl = document.getElementById('page-title');
  const descEl = document.getElementById('page-desc');
  if (titleEl && titles[id]) {
    const parts = titles[id][0].split(' ');
    titleEl.innerHTML = `${parts[0]} <em>${parts[1] || ''}</em>`;
    descEl.textContent = titles[id][1];
  }
}

async function purgeAttendees() {
  const confirmed = await showConfirm("This will delete ALL registered attendees permanently. This action cannot be undone.", "Clear Attendee List", "PURGE");
  if (confirmed) {
    localStorage.removeItem('elevate_attendees');
    syncToCloud('attendees', []); // Clear cloud too
    loadAllData();
    showSavedToast("Attendee List Purged");
  }
}

// ============================================================
// LOAD ALL DATA — initialise localStorage with defaults if empty
// ============================================================
function loadAllData() {
  // Seed defaults if localStorage is empty or stale
  let currentContent = localStorage.getItem('elevate_site_content');
  if (!currentContent) {
    localStorage.setItem('elevate_site_content', JSON.stringify(DEFAULT_SITE_CONTENT));
  } else {
    // Migration/Fix: FORCE UPDATE to the new requested 3-line layout and manifesto lines
    const parsed = JSON.parse(currentContent);
    parsed.heroHeadline = "AI-Led|Quality Engineering|[[Proof of Value]]";
    
    // Also force-fix manifesto if it's empty or incomplete
    if (!parsed.manifestoLines || parsed.manifestoLines.length < 2) {
      parsed.manifestoLines = DEFAULT_SITE_CONTENT.manifestoLines;
    }
    
    // FORCE CLEAR OLD GREY META
    if (parsed.heroMeta && parsed.heroMeta.includes("A SYMPOSIUM BY")) {
      parsed.heroMeta = "";
    }
    
    localStorage.setItem('elevate_site_content', JSON.stringify(parsed));
  }
  if (!localStorage.getItem('elevate_agenda') || JSON.parse(localStorage.getItem('elevate_agenda')).length === 0) {
    localStorage.setItem('elevate_agenda', JSON.stringify(DEFAULT_AGENDA));
  }
  if (!localStorage.getItem('elevate_speakers') || JSON.parse(localStorage.getItem('elevate_speakers')).length === 0) {
    localStorage.setItem('elevate_speakers', JSON.stringify(DEFAULT_SPEAKERS));
  }
  if (!localStorage.getItem('elevate_visuals')) {
    localStorage.setItem('elevate_visuals', JSON.stringify(DEFAULT_VISUALS));
  }

  // Site Identity
  const site = JSON.parse(localStorage.getItem('elevate_site_content'));
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  
  setVal('hero-headline', site.heroHeadline);
  setVal('hero-tagline',  site.heroTagline);
  setVal('hero-cta-text', site.heroCtaText);
  setVal('hero-eyebrow',  site.heroEyebrow);
  setVal('hero-meta',     site.heroMeta);
  setVal('hero-edition',  site.heroEdition);
  setVal('event-date',    site.eventDate);
  setVal('event-venue',   site.eventVenue);
  setVal('hero-format',   site.heroFormat);
  setVal('hero-audience', site.heroAudience);

  // 3. Manifesto Force-Load
  const manifestoPill = site.manifestoPill || DEFAULT_SITE_CONTENT.manifestoPill;
  const manifestoAside = site.manifestoAside || DEFAULT_SITE_CONTENT.manifestoAside;
  const manifestoLines = (site.manifestoLines && site.manifestoLines.length > 0) ? site.manifestoLines : DEFAULT_SITE_CONTENT.manifestoLines;

  setVal('manifesto-pill', manifestoPill);
  setVal('manifesto-aside', manifestoAside);
  setVal('manifesto-lines', manifestoLines.join('\n'));

  // 4. Maturity Map Force-Load
  const maturityStages = (site.maturityStages && site.maturityStages.length > 0) ? site.maturityStages : DEFAULT_SITE_CONTENT.maturityStages;
  setVal('maturity-title', site.maturityTitle || DEFAULT_SITE_CONTENT.maturityTitle);
  const matGrid = document.getElementById('maturity-stages-admin');
  if (matGrid) {
    matGrid.innerHTML = '';
    maturityStages.forEach(s => addMaturityStage(s));
  }

  // 5. Pillars Force-Load
  const pillars = (site.pillars && site.pillars.length > 0) ? site.pillars : DEFAULT_SITE_CONTENT.pillars;
  setVal('pillars-title', site.pillarsTitle || DEFAULT_SITE_CONTENT.pillarsTitle);
  const pilGrid = document.getElementById('pillars-admin');
  if (pilGrid) {
    pilGrid.innerHTML = '';
    pillars.forEach(p => addPillarItem(p));
  }

  setVal('speakers-intro', site.speakersIntro);
  setVal('prizes-title',   site.prizesTitle);
  setVal('coming-title',   site.comingTitle);
  setVal('coming-desc',    site.comingDesc);

  // Platform Settings
  let settings = JSON.parse(localStorage.getItem('elevate_settings'));
  if (!settings) {
    settings = DEFAULT_SETTINGS;
    localStorage.setItem('elevate_settings', JSON.stringify(settings));
  }
  setVal('set-domain',         settings.domain);
  setVal('set-email-admin',     settings.emails.admin || "abhishekjohri150@gmail.com");
  setVal('set-email-attendee',  settings.emails.attendee);
  setVal('set-email-presenter', settings.emails.presenter);
  setVal('set-email-support',   settings.emails.support);
  
  setVal('set-color-primary',     settings.theme.primary);
  setVal('set-color-primary-hex', settings.theme.primary);
  setVal('set-color-bg',          settings.theme.background);
  setVal('set-color-bg-hex',      settings.theme.background);
  setVal('set-color-accent',      settings.theme.accent);
  setVal('set-color-accent-hex',  settings.theme.accent);

  // Sync color inputs
  ['primary', 'bg', 'accent'].forEach(key => {
    const picker = document.getElementById(`set-color-${key}`);
    const hex = document.getElementById(`set-color-${key}-hex`);
    if (picker && hex) {
      picker.oninput = () => hex.value = picker.value;
      hex.oninput = () => { if (hex.value.match(/^#[0-9a-fA-F]{6}$/)) picker.value = hex.value; };
    }
  });

  // Agenda
  const agenda = JSON.parse(localStorage.getItem('elevate_agenda') || '[]');
  document.getElementById('agenda-list').innerHTML = '';
  agenda.forEach(item => addAgendaItem(item));

  // Speakers
  const speakers = JSON.parse(localStorage.getItem('elevate_speakers') || '[]');
  document.getElementById('speaker-list').innerHTML = '';
  speakers.forEach(item => addSpeakerItem(item));

  // Visuals
  const visuals = JSON.parse(localStorage.getItem('elevate_visuals')) || DEFAULT_VISUALS;
  if (visuals && visuals.heroBg) {
    const preview = document.getElementById('preview-hero-bg');
    if (preview) {
      preview.src = visuals.heroBg;
      preview.style.display = 'block';
      const ph = document.getElementById('placeholder-hero-bg');
      if (ph) ph.style.display = 'none';
    }
    window._visualData.heroBg = visuals.heroBg;
  }
  if (visuals && visuals.strip) {
    visuals.strip.forEach((s, i) => {
      const img = document.getElementById(`preview-strip-0${i+1}`);
      const cap = document.getElementById(`strip-0${i+1}-caption`);
      const ph = document.getElementById(`placeholder-strip-0${i+1}`);
      if (img && s.img) { 
        img.src = s.img; 
        img.style.display = 'block'; 
        if (ph) ph.style.display = 'none';
      }
      if (cap && s.cap) cap.value = s.cap;
      if (s.img) window._visualData.strip[i] = s.img;
    });
  }

  // Attendees
  const atts = JSON.parse(localStorage.getItem('elevate_attendees') || '[]');
  const badge = document.getElementById('attendee-count');
  const checkedInCount = atts.filter(a => a.checkedIn).length;
  if (badge) badge.textContent = `${atts.length} registered · ${checkedInCount} checked in`;
  
  const tbody = document.getElementById('attendee-table');
  if (tbody) {
    if (atts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--ink-dim);">No registrations yet</td></tr>';
    } else {
      tbody.innerHTML = atts.map((p, idx) => {
        const statusBadge = p.checkedIn
          ? `<span class="badge badge-accent">✓ Checked In</span>`
          : `<span class="badge">○ Not Yet</span>`;
        return `<tr>
          <td>${p.name || '—'}</td>
          <td>${p.org || '—'}</td>
          <td>${p.email || '—'}</td>
          <td>${p.date ? new Date(p.date).toLocaleDateString() : '—'}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <button class="btn-mini" onclick="viewQrModal(${idx})" title="View QR Code" style="margin-right: 8px;">▤</button>
            <button class="btn-mini" onclick="deleteAttendee(${idx})" title="Delete Entry" style="color:var(--accent-red); border-color:rgba(255,90,54,0.2);">✕</button>
          </td>
        </tr>`;
      }).join('');
    }
  }
}

function exportAttendees() {
  const atts = JSON.parse(localStorage.getItem('elevate_attendees') || '[]');
  if (atts.length === 0) {
    showSavedToast("No attendees to export!");
    return;
  }

  const dataStr = JSON.stringify(atts, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', `elevate_attendees_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showSavedToast("Database Exported!");
}

// ============================================================
// PREMIUM POPUPS
// ============================================================
function showConfirm(msg, title = "Are you sure?", btnText = "PROCEED") {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').innerHTML = title;
    document.getElementById('confirm-msg').textContent = msg;
    const okBtn = document.getElementById('confirm-ok');
    okBtn.textContent = btnText;
    
    modal.style.display = 'flex';
    
    const cleanup = (val) => {
      modal.style.display = 'none';
      okBtn.onclick = null;
      document.getElementById('confirm-cancel').onclick = null;
      resolve(val);
    };

    okBtn.onclick = () => cleanup(true);
    document.getElementById('confirm-cancel').onclick = () => cleanup(false);
  });
}

async function deleteAttendee(idx) {
  const atts = JSON.parse(localStorage.getItem('elevate_attendees') || '[]');
  const name = atts[idx]?.name || 'this entry';
  
  const confirmed = await showConfirm(`You are about to delete ${name}. This action cannot be undone.`, "Delete Entry", "DELETE");
  if (!confirmed) return;
  
  atts.splice(idx, 1);
  localStorage.setItem('elevate_attendees', JSON.stringify(atts));
  loadAllData();
  syncToCloud('attendees', atts); // Also sync the deletion
}

function viewQrModal(idx) {
  const atts = JSON.parse(localStorage.getItem('elevate_attendees') || '[]');
  const p = atts[idx];
  if (!p) return;

  document.getElementById('qr-attendee-name').textContent = p.name || 'Unknown';
  document.getElementById('qr-attendee-email').textContent = p.email || 'Unknown';

  const qrContainer = document.getElementById('qr-target');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    // Format must match scanner expectation: ELEVATEQA26|{ticketId}|{name}|{email}|{org}
    const qrText = `ELEVATEQA26|${p.ticketId || ''}|${p.name || ''}|${p.email || ''}|${p.org || ''}`;
    
    // We use the 'qrcode-generator' library included in admin.html
    const typeNumber = 0;
    const errorCorrectionLevel = 'H';
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(qrText);
    qr.make();
    // Cell size 8 makes it much larger and sharper on screen for easier scanning
    qrContainer.innerHTML = qr.createImgTag(8, 20); 
  }
  document.getElementById('qr-modal').style.display = 'flex';
}

function closeQrModal() {
  document.getElementById('qr-modal-overlay').style.display = 'none';
}

// ============================================================
// ASSET HELPERS
// ============================================================
function triggerVisualUpload(id) {
  document.getElementById(`upload-${id}`).click();
}

function handleVisualUpload(input, type) {
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    const img = document.getElementById(`preview-${type}`);
    const ph = document.getElementById(`placeholder-${type}`);
    
    if (img) {
      img.src = dataUrl;
      img.style.display = 'block';
    }
    if (ph) ph.style.display = 'none';

    // Store in memory for saveAll()
    if (type === 'hero-bg') {
      window._visualData.heroBg = dataUrl;
    } else if (type.startsWith('strip-0')) {
      const idx = parseInt(type.split('-0')[1]) - 1;
      window._visualData.strip[idx] = dataUrl;
    }
  };
  if (input.files[0]) reader.readAsDataURL(input.files[0]);
}

function downloadImg(id) {
  const img = document.getElementById(id);
  if (!img || !img.src) return alert("No image to download");
  const link = document.createElement('a');
  link.href = img.src;
  link.download = `elevate_asset_${id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// DYNAMIC ROW BUILDERS
// ============================================================
function addAgendaItem(data = { time: '', tag: '', title: '', desc: '' }) {
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <div class="dynamic-row">
      <div class="form-group"><label>Time</label><input type="text" class="a-time" value="${data.time}" placeholder="09:00"></div>
      <div class="form-group"><label>Tag</label><input type="text" class="a-tag" value="${data.tag}" placeholder="Keynote"></div>
      <div class="form-group" style="flex: 2;"><label>Title</label><input type="text" class="a-title" value="${data.title}" placeholder="Session Title"></div>
      <div class="form-group" style="flex: 3;"><label>Description</label><input type="text" class="a-desc" value="${data.desc}" placeholder="Short description..."></div>
      <button class="btn-del" onclick="this.parentElement.parentElement.remove()" title="Remove">✕</button>
    </div>`;
  document.getElementById('agenda-list').appendChild(div);
  
  // UX: Scroll to new item and focus first field
  setTimeout(() => {
    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
    div.querySelector('input').focus();
  }, 50);
}

function addSpeakerItem(data = { name: '', role: '', img: '' }) {
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <div class="dynamic-row speaker-row">
      <div class="form-group photo-group">
        <label>Photo</label>
        <div class="img-upload-wrap" onclick="this.querySelector('input').click()">
          <img src="${data.img || ''}" style="${data.img ? '' : 'display:none'}">
          <input type="file" onchange="previewImg(this)">
          <div class="placeholder" style="${data.img ? 'display:none' : ''}">+</div>
        </div>
      </div>
      <div class="speaker-inputs">
        <div class="form-group"><label>Full Name</label><input type="text" class="s-name" value="${data.name}" placeholder="Kapil Dev"></div>
        <div class="form-group"><label>Role / Title</label><input type="text" class="s-role" value="${data.role}" placeholder="Keynote Speaker"></div>
      </div>
      <button class="btn-del" onclick="this.parentElement.parentElement.remove()" title="Remove">✕</button>
    </div>`;
  document.getElementById('speaker-list').appendChild(div);

  // UX: Scroll to new item and focus name field
  setTimeout(() => {
    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
    div.querySelector('.s-name').focus();
  }, 50);
}

function previewImg(input) {
  const reader = new FileReader();
  reader.onload = e => {
    const wrap = input.parentElement;
    const img = wrap.querySelector('img');
    const placeholder = wrap.querySelector('.placeholder');
    img.src = e.target.result;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}

function addMaturityStage(data = { name: '', pct: '', desc: '' }) {
  const container = document.getElementById('maturity-stages-admin');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  const i = container.querySelectorAll('.dynamic-item').length + 1;
  div.innerHTML = `
    <div class="dynamic-header">
      <div class="step-num">STAGE 0${i}</div>
      <button class="btn-del" onclick="this.parentElement.parentElement.remove()" title="Delete Stage">✕</button>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Stage Name <span class="label-hint">(e.g. Manual, Assisted)</span></label>
        <input type="text" class="mat-name" value="${data.name}" placeholder="Enter stage name...">
      </div>
      <div class="form-group">
        <label>Percentage / Statistic</label>
        <input type="text" class="mat-pct" value="${data.pct}" placeholder="e.g. 25% of orgs...">
      </div>
    </div>
    <div class="form-group" style="margin-top:20px;">
      <label>Description</label>
      <textarea class="mat-desc" rows="3" placeholder="Describe this maturity level...">${data.desc}</textarea>
    </div>
  `;
  container.appendChild(div);
}

function addPillarItem(data = { title: '', desc: '' }) {
  const container = document.getElementById('pillars-admin');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <div class="dynamic-header">
      <div class="step-num">CORE PILLAR</div>
      <button class="btn-del" onclick="this.parentElement.parentElement.remove()" title="Delete Pillar">✕</button>
    </div>
    <div class="form-group">
      <label>Pillar Title</label>
      <input type="text" class="pil-title" value="${data.title}" placeholder="e.g. Continuous Testing">
    </div>
    <div class="form-group" style="margin-top:20px;">
      <label>Description</label>
      <textarea class="pil-desc" rows="3" placeholder="Describe this pillar...">${data.desc}</textarea>
    </div>
  `;
  container.appendChild(div);
}

// ============================================================
// SAVE ALL — write everything back to localStorage
// ============================================================
function saveAll() {
  const getVal = (id) => document.getElementById(id)?.value || '';
  
  // 1. Collect Site Identity
  const site_content_data = {
    heroHeadline:   getVal('hero-headline'),
    heroTagline:    getVal('hero-tagline'),
    heroCtaText:    getVal('hero-cta-text'),
    heroEyebrow:    getVal('hero-eyebrow'),
    heroMeta:       getVal('hero-meta'),
    heroEdition:    getVal('hero-edition'),
    eventDate:      getVal('event-date'),
    eventVenue:     getVal('event-venue'),
    heroFormat:     getVal('hero-format'),
    heroAudience:   getVal('hero-audience'),
    
    manifestoPill:  getVal('manifesto-pill'),
    manifestoAside: getVal('manifesto-aside'),
    manifestoLines: getVal('manifesto-lines').split('\n').filter(l => l.trim()),

    maturityTitle:  getVal('maturity-title'),
    maturityStages: Array.from(document.querySelectorAll('#maturity-stages-admin .dynamic-item')).map((el, i) => ({
      label: `STAGE 0${i+1}`,
      sub: i===0?"FOUNDATION":i===1?"EXPLORATORY":i===2?"OPERATIONAL":"FRONTIER",
      name: el.querySelector('.mat-name').value,
      pct: el.querySelector('.mat-pct').value,
      desc: el.querySelector('.mat-desc').value
    })),

    pillarsTitle: getVal('pillars-title'),
    pillars: Array.from(document.querySelectorAll('#pillars-admin .dynamic-item')).map(el => ({
      title: el.querySelector('.pil-title').value,
      desc: el.querySelector('.pil-desc').value
    })),

    speakersIntro: getVal('speakers-intro'),
    prizesTitle:   getVal('prizes-title'),
    comingTitle:   getVal('coming-title'),
    comingDesc:    getVal('coming-desc')
  };

  // 2. Collect Platform Settings
  const adminEmails = Array.from(document.querySelectorAll('.admin-email-entry')).map(i => i.value.trim()).filter(i => i);
  const settings_data = {
    domain: document.getElementById('set-domain').value,
    emails: {
      admins: adminEmails.length > 0 ? adminEmails : ["abhishekjohri150@gmail.com"],
      attendee:  document.getElementById('set-email-attendee').value,
      presenter: document.getElementById('set-email-presenter').value,
      support:   document.getElementById('set-email-support').value
    },
    theme: {
      primary:    document.getElementById('set-color-primary').value,
      background: document.getElementById('set-color-bg').value,
      accent:     document.getElementById('set-color-accent').value
    }
  };

  // 3. Collect Agenda
  const agenda = Array.from(document.querySelectorAll('#agenda-list .dynamic-item')).map(el => ({
    time:  el.querySelector('.a-time').value,
    tag:   el.querySelector('.a-tag').value,
    title: el.querySelector('.a-title').value,
    desc:  el.querySelector('.a-desc') ? el.querySelector('.a-desc').value : ''
  }));

  // 4. Collect Speakers
  const speakers = Array.from(document.querySelectorAll('#speaker-list .dynamic-item')).map(el => ({
    name: el.querySelector('.s-name').value,
    role: el.querySelector('.s-role').value,
    img:  el.querySelector('img').src && !el.querySelector('img').src.endsWith(location.href) ? el.querySelector('img').src : ''
  }));

  // 5. Collect Visuals
  const visuals = {
    heroBg: window._visualData.heroBg || '',
    strip: [0,1,2].map(i => ({
      img: window._visualData.strip[i] || '',
      cap: document.getElementById(`strip-0${i+1}-caption`)?.value || ''
    }))
  };

  // 6. SAVE TO LOCAL STORAGE (with protection)
  try { localStorage.setItem('elevate_site_content', JSON.stringify(site_content_data)); } catch(e) {}
  try { localStorage.setItem('elevate_settings', JSON.stringify(settings_data)); } catch(e) {}
  try { localStorage.setItem('elevate_agenda', JSON.stringify(agenda)); } catch(e) {}
  
  try { 
    localStorage.setItem('elevate_speakers', JSON.stringify(speakers)); 
  } catch(e) { 
    console.warn("Speakers too large for local storage"); 
  }

  try { 
    localStorage.setItem('elevate_visuals', JSON.stringify(visuals)); 
  } catch(e) { 
    console.warn("Visuals too large for local storage, trying fallback...");
    try { localStorage.setItem('elevate_visuals', JSON.stringify({ heroBg: visuals.heroBg, strip: [] })); } catch(e2) {}
  }

  // 7. SYNC TO CLOUD (Prioritize Speakers & Agenda)
  syncToCloud('speakers', speakers);
  syncToCloud('agenda', agenda);
  syncToCloud('site_content', site_content_data);
  syncToCloud('visuals', visuals);
  syncToCloud('settings', settings_data);
  syncToCloud('attendees', JSON.parse(localStorage.getItem('elevate_attendees') || '[]'));

  showSavedToast();
}

function showSavedToast(msg = '✓ Synced to live site') {
  let toast = document.getElementById('save-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'save-toast';
    toast.style.cssText = 'position:fixed;bottom:120px;right:40px;background:#0b0b10;color:#d4ff3a;border:1px solid #d4ff3a;padding:16px 28px;border-radius:12px;font-family:JetBrains Mono,monospace;font-size:13px;z-index:9999;opacity:0;transition:opacity 0.4s;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ============================================================
// RESET TO DEFAULTS (dev helper)
// ============================================================
async function resetToDefaults() {
  const confirmed = await showConfirm('Are you absolutely sure? This will reset all site content, taglines, and visuals to their original defaults.', 'Purge Site Content', 'RESET');
  if (!confirmed) return;
  
  localStorage.removeItem('elevate_site_content');
  localStorage.removeItem('elevate_agenda');
  localStorage.removeItem('elevate_speakers');
  localStorage.removeItem('elevate_visuals');
  location.reload();
}

checkAuth();
