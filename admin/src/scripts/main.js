/**
 * ELEVATE QA 2026 - MAIN ENGINE
 * Consolidated logic for Animations, Sync, and Interactions.
 */

// 1. ANIMATION ENGINE
function startCountUp(el) {
  const target = parseInt(el.getAttribute('data-target'));
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
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  };

  // Dynamic meter animation logic - no longer hardcoded

  window.io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('count-up')) {
          startCountUp(entry.target);
        }
        // Animate meter bar when maturity stage becomes visible
        if (entry.target.classList.contains('maturity-stage')) {
          const fill = entry.target.querySelector('.meter-fill');
          const pctText = entry.target.querySelector('.pct')?.textContent || '';
          const match = pctText.match(/(\d+)/);
          const width = match ? match[1] + '%' : '25%';
          if (fill) {
            setTimeout(() => { fill.style.width = width; }, 200);
          }
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .reveal-child > *').forEach(el => {
    window.io.observe(el);
  });
  // Observe maturity stages for meter animation
  document.querySelectorAll('.maturity-stage').forEach(el => window.io.observe(el));
}

// 2. CORE INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  initAnimations();

  // Navigation Effects + Scroll Progress + Parallax
  const nav = document.querySelector('nav');
  const progressBar = document.getElementById('scroll-progress');
  const heroAmbientImg = document.querySelector('.hero-ambient img');

  window.addEventListener('scroll', () => {
    // Nav scroll style
    if (nav) {
      if (window.scrollY > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    // Scroll progress bar
    if (progressBar) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (window.scrollY / total * 100) + '%';
    }
    // Hero parallax
    if (heroAmbientImg && window.scrollY < window.innerHeight) {
      heroAmbientImg.style.transform = `translateY(${window.scrollY * 0.18}px)`;
    }
  });

  // Mobile Hamburger Menu
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Custom Cursor Glow
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow) {
    document.addEventListener('mousemove', (e) => {
      // Use requestAnimationFrame for smooth performance
      requestAnimationFrame(() => {
        cursorGlow.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
      });
    });
  }

  // Registration Modal
  window.openModal = (e) => {
    if (e) e.preventDefault();
    const modal = document.getElementById('regModal');
    if (modal) {
      modal.classList.add('active');
      document.getElementById('form-view').style.display = 'block';
      document.getElementById('ticket-view').style.display = 'none';
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

  // Ticket Generation
  window.generateTicket = (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const org = document.getElementById('reg-org').value.trim();
    const ticketId = Math.random().toString(36).substr(2, 9).toUpperCase();

    // Save to local storage for the scanner
    const attendees = JSON.parse(localStorage.getItem('elevate_attendees') || '[]');
    attendees.push({
      ticketId, name, email, org,
      registeredAt: new Date().toISOString(),
      checkedIn: false
    });
    localStorage.setItem('elevate_attendees', JSON.stringify(attendees));

    document.getElementById('ticket-name').textContent = name;
    document.getElementById('ticket-org').textContent = org;
    if (document.getElementById('ticket-id-display')) {
      document.getElementById('ticket-id-display').textContent = `ID: ${ticketId}`;
    }

    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: `ELEVATEQA26|${ticketId}|${name}|${email}|${org}`,
        width: 160, height: 160, colorDark: "#0b0b10", colorLight: "#ffffff"
      });
    }

    document.getElementById('form-view').style.display = 'none';
    document.getElementById('ticket-view').style.display = 'block';
    
    const statusWrap = document.getElementById('email-status-wrap');
    if (statusWrap) {
      statusWrap.innerHTML = '<div class="email-status success">✓ Ticket generated successfully!</div>';
    }
  };

  // 3. SYNCHRONIZATION ENGINE
  // Initialize Firebase for Live Sync if available
  if (typeof firebase !== 'undefined') {
    try {
      // Ensure we use the global firebaseConfig
      const config = window.firebaseConfig || firebaseConfig; 
      if (!firebase.apps.length) firebase.initializeApp(config);
      window.db = firebase.database();
      console.log('[ElevateQA] Cloud Sync Initialized');

      // Live Listeners for each section
      const sections = ['site_content', 'agenda', 'speakers', 'visuals', 'settings'];
      sections.forEach(node => {
        window.db.ref(node).on('value', (snap) => {
          const data = snap.val();
          if (data) {
            console.log(`[ElevateQA] Received ${node} from Cloud`);
            localStorage.setItem(`elevate_${node}`, JSON.stringify(data));
            syncEverything(); // Refresh UI
          }
        });
      });
    } catch(e) { console.error('[ElevateQA] Firebase Init Error:', e); }
  } else {
    console.warn('[ElevateQA] Firebase SDK not found. Falling back to local storage.');
  }

  function syncEverything() {
    const site = JSON.parse(localStorage.getItem('elevate_site_content'));
    const agenda = JSON.parse(localStorage.getItem('elevate_agenda'));
    const speakers = JSON.parse(localStorage.getItem('elevate_speakers'));
    const visualsRaw = localStorage.getItem('elevate_visuals');

    if (site) {
      // Hero Text Fields
      const titleEl = document.getElementById('hero-title');
      if (titleEl && site.heroHeadline) {
        const lines = site.heroHeadline.split(/[|\n]/).filter(l => l.trim());
        titleEl.innerHTML = lines.map(line => {
          const processed = line.replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
          return `<span class="title-line" style="display:block;"><span style="display:inline-block;">${processed}</span></span>`;
        }).join('');
      }
      
      const tagEl = document.getElementById('hero-tagline');
      if (tagEl && site.heroTagline) tagEl.innerHTML = site.heroTagline;
      
      const eyebrowEl = document.getElementById('hero-eyebrow');
      if (eyebrowEl && site.heroEyebrow) eyebrowEl.innerHTML = site.heroEyebrow;

      const metaEl = document.getElementById('hero-line-signature');
      if (metaEl) {
        metaEl.innerHTML = site.heroMeta ? `<span class="line"></span> ${site.heroMeta}` : '';
      }

      const venueEl = document.getElementById('hero-venue-bottom');
      if (venueEl && site.eventVenue) venueEl.innerHTML = site.eventVenue;

      const dateEl = document.getElementById('hero-date-bottom');
      if (dateEl && site.eventDate) dateEl.innerHTML = site.eventDate;

      // New Sync Fields
      const editionEl = document.getElementById('hero-edition-val');
      if (editionEl && site.heroEdition) editionEl.innerHTML = site.heroEdition;

      const formatEl = document.getElementById('hero-format-val');
      if (formatEl && site.heroFormat) formatEl.innerHTML = site.heroFormat;

      const audienceEl = document.getElementById('hero-audience-val');
      if (audienceEl && site.heroAudience) audienceEl.innerHTML = site.heroAudience;

      // Manifesto
      if (site.manifestoLines && site.manifestoLines.length > 0) {
        const manifestoWrap = document.querySelector('.manifesto-text');
        if (manifestoWrap) {
          manifestoWrap.innerHTML = site.manifestoLines.map(line => {
            const processed = line.replace(/\[\[(.*?)\]\]/g, '<span class="highlight">$1</span>');
            return `<p class="reveal">${processed}</p>`;
          }).join('');
        }
      }

      // Maturity Map
      if (site.maturityStages && site.maturityStages.length > 0) {
        const matWrap = document.querySelector('.maturity');
        if (matWrap) {
          matWrap.innerHTML = site.maturityStages.map((s, idx) => {
            const colors = ['#333333', '#4a90e2', '#ff5a36', '#d4ff3a'];
            const color = colors[idx] || colors[0];
            const pctMatch = (s.pct || '').match(/(\d+)/);
            const width = pctMatch ? pctMatch[1] : '25';
            return `
              <div class="maturity-stage reveal">
                <div class="level"><span>${s.label || `STAGE 0${idx+1}`}</span><span>${s.sub || ''}</span></div>
                <div class="stage-name">${s.name}</div>
                <p class="stage-desc">${s.desc}</p>
                <div class="meter"><div class="meter-fill" data-width="${width}%" style="background: ${color};"></div></div>
                <div class="pct">${s.pct}</div>
              </div>`;
          }).join('');
        }
      }

      // Pillars
      if (site.pillars && site.pillars.length > 0) {
        const pillarsWrap = document.querySelector('.pillars');
        if (pillarsWrap) {
          const icons = [
            '<svg viewBox="0 0 48 48"><path d="M8 38 L24 8 L40 38 Z"/><path d="M18 30 L30 30"/></svg>',
            '<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="2"/><path d="M14 18 L34 18 M14 24 L28 24 M14 30 L34 30"/></svg>',
            '<svg viewBox="0 0 48 48"><circle cx="14" cy="24" r="6"/><circle cx="34" cy="14" r="6"/><circle cx="34" cy="34" r="6"/><path d="M19 22 L29 16 M19 26 L29 32"/></svg>',
            '<svg viewBox="0 0 48 48"><polygon points="24,6 28,18 40,18 30,26 34,38 24,30 14,38 18,26 8,18 20,18"/></svg>',
            '<svg viewBox="0 0 48 48"><path d="M12 36 L12 12 L36 12 L36 28 L24 28 L12 36 Z"/></svg>',
            '<svg viewBox="0 0 48 48"><path d="M24 6 L24 42 M6 24 L42 24"/><circle cx="24" cy="24" r="8"/></svg>'
          ];
          pillarsWrap.innerHTML = site.pillars.map((p, i) => `
            <div class="pillar reveal">
              <div class="pillar-num">→ 0${i+1}</div>
              <div class="pillar-icon">${icons[i] || icons[0]}</div>
              <h3>${p.title}</h3>
              <p>${p.desc}</p>
            </div>`).join('');
        }
      }
    }

    // VISUALS SYNC (Images) - Runs always, independent of site content
    if (visualsRaw) {
      try {
        const visuals = JSON.parse(visualsRaw);
        console.log('[ElevateQA] Visuals loaded from storage:', visuals ? 'heroBg length=' + (visuals.heroBg || '').length : 'null');
        // Hero BG
        const heroImg = document.querySelector('.hero-ambient img');
        if (heroImg) {
          if (visuals && visuals.heroBg && visuals.heroBg.length > 5) {
            heroImg.src = visuals.heroBg;
            console.log('[ElevateQA] Hero BG applied from storage');
          } else {
            // Fallback to default if no image is stored
            heroImg.src = 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1600&q=80';
            console.log('[ElevateQA] Hero BG using default fallback');
          }
        }
        // Image Strip
        if (visuals && visuals.strip && visuals.strip.some(s => s.img)) {
          const stripWrap = document.querySelector('.image-strip');
          if (stripWrap) {
            stripWrap.innerHTML = visuals.strip.map((s, i) => `
              <div class="img-cell reveal">
                <img src="${s.img || ''}" alt="Gallery ${i+1}" />
                <div class="caption"><span class="num">0${i+1}</span>${s.cap || ''}</div>
              </div>`).join('');
          }
        }
      } catch(e) { console.error('[ElevateQA] Visuals sync error:', e); }
    }

    // Agenda
    if (agenda && agenda.length > 0) {
      const timeline = document.querySelector('.timeline');
      if (timeline) {
        timeline.innerHTML = agenda.map(item => {
          const isKeynote = (item.tag || '').toLowerCase().includes('keynote');
          const isBreak = (item.tag || '').toLowerCase().includes('break') || (item.title || '').toLowerCase().includes('lunch');
          return `
            <div class="timeline-row reveal ${isKeynote ? 'featured' : ''} ${isBreak ? 'break' : ''}">
              <div class="timeline-time">${item.time}</div>
              <div class="timeline-content"><span class="tag">${item.tag}</span><h4>${item.title}</h4><p>${item.desc || ''}</p></div>
            </div>`;
        }).join('');
      }
    }

    // Speakers
    if (speakers && speakers.length > 0) {
      const grid = document.querySelector('.speakers-grid');
      if (grid) {
        grid.innerHTML = speakers.map((s, idx) => {
          const isPhoto = s.img && s.img.length > 5;
          const photoHtml = isPhoto
            ? `<div class="speaker-photo-wrap"><img class="speaker-photo" src="${s.img}" alt="${s.name}"></div>`
            : `<div class="silhouette">${(idx + 1).toString().padStart(2, '0')}</div>`;
          const nameParts = (s.name || '').split(' ');
          return `
            <div class="speaker-card reveal ${isPhoto ? 'speaker-has-photo' : ''}">
              ${photoHtml}
              <div class="top"><span>${(s.role || 'Keynote').toUpperCase()}</span><span>CONFIRMED</span></div>
              <div class="name">${nameParts[0]} ${nameParts.slice(1).join(' ') ? `<em>${nameParts.slice(1).join(' ')}</em>` : ''}</div>
            </div>`;
        }).join('') + `
          <div class="speaker-card speaker-cta-card reveal">
            <div class="silhouette">+</div>
            <div class="top"><span>SUBMISSIONS</span><span>OPEN</span></div>
            <div class="pitch">Have a story <em>worth telling?</em><br><a href="#join">Apply to speak →</a></div>
          </div>`;
      }
    }

    // Re-observe for animations (including newly injected maturity stages)
    if (window.io) {
      document.querySelectorAll('.reveal').forEach(el => window.io.observe(el));
      document.querySelectorAll('.maturity-stage').forEach(el => window.io.observe(el));
    }
  }

  // Real-time Storage Sync
  window.addEventListener('storage', (e) => {
    if (e.key.startsWith('elevate_')) syncEverything();
  });

  // Initial Sync
  syncEverything();
});

function copyLink(e) {
  e.preventDefault();
  const link = document.getElementById('copyLink');
  const original = link.textContent;
  navigator.clipboard?.writeText(window.location.href).then(() => {
    link.textContent = 'Copied ✓';
    setTimeout(() => link.textContent = original, 2200);
  });
}
