import { initCloudSync } from './main-sync.js';
import { supabase } from './supabase-config.js';

// ─── UTIL: HTML ESCAPE (XSS guard for untrusted Supabase strings) ────────────
window.escapeHtml = window.escapeHtml || function(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// MagneticElement disabled for .btn — buttons stay fixed in position
// Keep class available for other uses (e.g. floating-stamp)
const lerp = (a, b, n) => (1 - n) * a + n * b;

class MagneticElement {
  constructor(el, strength = 0.25) {
    this.el = el;
    this.strength = strength;
    this.x = 0; this.y = 0;
    this.targetX = 0; this.targetY = 0;
    this.init();
  }
  init() {
    window.addEventListener('mousemove', (e) => {
      const rect = this.el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      
      if (dist < 150) {
        this.targetX = (e.clientX - centerX) * this.strength;
        this.targetY = (e.clientY - centerY) * this.strength;
      } else {
        this.targetX = 0; this.targetY = 0;
      }
    });
    this.animate();
  }
  animate() {
    this.x = lerp(this.x, this.targetX, 0.1);
    this.y = lerp(this.y, this.targetY, 0.1);
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
    requestAnimationFrame(() => this.animate());
  }
}

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

  window.io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible', 'revealed');
        if (entry.target.classList.contains('count-up')) {
          startCountUp(entry.target);
        }
        if (entry.target.classList.contains('maturity-stage')) {
          const fill = entry.target.querySelector('.meter-fill');
          if (fill) {
            let width = fill.getAttribute('data-width');
            if (!width) {
              const pctText = entry.target.querySelector('.pct')?.textContent || '';
              const match = pctText.match(/(\d+)/);
              width = match ? match[1] + '%' : '25%';
            }
            setTimeout(() => { 
              fill.style.width = width; 
              fill.style.setProperty('--meter-width', width);
            }, 200);
          }
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .reveal-child > *').forEach(el => {
    window.io.observe(el);
  });
  document.querySelectorAll('.maturity-stage').forEach(el => window.io.observe(el));
}

// --- GLOBALLY EXPOSED MODAL FUNCTIONS ---
window.openModal = (e) => {
  if (e) e.preventDefault();
  const modal = document.getElementById('regModal');
  if (modal) {
    // Proactive Reset every time we open
    const form = document.getElementById('registration-form');
    if (form) form.reset();
    
    const submitBtn = document.getElementById('generate-btn') || document.querySelector('#registration-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'CONFIRM & GENERATE TICKET';
    }

    modal.classList.add('active');
    document.getElementById('price-view').style.display = 'block';
    document.getElementById('form-view').style.display = 'none';
    document.getElementById('ticket-view').style.display = 'none';
    document.body.style.overflow = 'hidden';
    
    // Clear status messages
    const status = document.getElementById('email-status');
    if (status) {
      status.innerHTML = '';
      status.className = 'email-status';
    }
    
    console.log('[ElevateQA] Modal Opened & State Reset');
  }
};

window.proceedToForm = () => {
  const priceView = document.getElementById('price-view');
  const formView = document.getElementById('form-view');
  if (priceView && formView) {
    priceView.style.display = 'none';
    formView.style.display = 'block';
    console.log('[ElevateQA] Proceeding to Form');
  }
};

window.closeModal = () => {
  const modal = document.getElementById('regModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // RESET FORM FOR NEXT USER
    setTimeout(() => {
      // 1. Clear text inputs
      const form = document.getElementById('registration-form');
      if (form) form.reset();
      
      // 2. Reset Button State
      const submitBtn = document.getElementById('generate-btn') || document.querySelector('#registration-form button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'CONFIRM & GENERATE TICKET';
      }
      
      // 3. Reset View Hierarchy
      const priceView = document.getElementById('price-view');
      const formView = document.getElementById('form-view');
      const ticketView = document.getElementById('ticket-view');
      
      if (priceView) priceView.style.display = 'block';
      if (formView) formView.style.display = 'none';
      if (ticketView) ticketView.style.display = 'none';
      
      // 4. Clear status messages
      const status = document.getElementById('email-status');
      if (status) {
        status.innerHTML = '';
        status.className = 'email-status';
      }
    }, 400); // Wait for modal fade-out
  }
};

window.generateTicket = async (e) => {
  e.preventDefault();
  console.log('[ElevateQA] Registration Started...');
  const btn = e.target.querySelector('button');
  const originalText = btn.textContent;
  btn.textContent = 'Processing...';
  btn.disabled = true;

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const org = document.getElementById('reg-org').value.trim();
  const ticketId = Math.random().toString(36).substr(2, 9).toUpperCase();

  try {
    console.log('[ElevateQA] Persisting to Supabase:', { name, email, org });
    // PERSIST TO SUPABASE
    const { error } = await supabase
      .from('registrations')
      .insert([{ name, email, company: org }]);

    if (error) {
      console.error('[ElevateQA] Supabase Insert Error Details:', error);
      throw error;
    }

    console.log('[ElevateQA] Registration Success, Generating QR');
    document.getElementById('ticket-name').textContent = name;
    document.getElementById('ticket-org').textContent = org;
    
    // QR Generation (Must match scanner format: ELEVATE-QA: uuid | email)
    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      if (typeof QRCode !== 'undefined') {
        const qrText = `ELEVATE-QA: ${ticketId} | ${email}`;
        new QRCode(qrContainer, {
          text: qrText,
          width: 160, height: 160, colorDark: "#0b0b10", colorLight: "#ffffff"
        });
        
        // Add LinkedIn Share Link
        const shareMsg = encodeURIComponent(`Excited to attend Elevate QA 2026! 🚀 \n\nLooking forward to deep-diving into the proof of value and shipping quality at scale. Catch me there! \n\n#ElevateQA #QualityEngineering #Testing #SDET`);
        const shareUrl = encodeURIComponent('https://elevateqa.netlify.app');
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&summary=${shareMsg}`;
        
        const shareBtn = document.getElementById('linkedin-share-btn');
        if (shareBtn) shareBtn.setAttribute('href', linkedinUrl);
      } else {
        console.warn('[ElevateQA] QRCode library not loaded yet!');
        qrContainer.innerHTML = '<p style="font-size:10px; color:red;">QR Error - Please refresh</p>';
      }
    }

    document.getElementById('form-view').style.display = 'none';
    document.getElementById('ticket-view').style.display = 'block';
    
    // EMAILJS INTEGRATION (Setup ready)
    if (window.emailjs) {
      // Initialize with Public Key
      emailjs.init('ZzPD0nx75Ms7J2ntS');

      const templateParams = {
        to_name: name,
        to_email: email,
        ticket_id: ticketId,
        qr_data: `ELEVATE-QA: ${ticketId} | ${email}`,
        company: org
      };

      // Sending using the service ID from your screenshot and the template I created
      emailjs.send('service_5za1p9c', 'template_0wi7mv9', templateParams)
        .then(() => {
          console.log('[ElevateQA] Ticket Email Sent Successfully to:', email);
          const status = document.getElementById('email-status');
          if (status) {
            status.className = 'email-status success';
            status.innerHTML = '✓ Ticket sent to your email';
          }
        })
        .catch((err) => {
          console.error('[ElevateQA] Email Failed:', err);
          const status = document.getElementById('email-status');
          if (status) {
            status.className = 'email-status error';
            status.innerHTML = '✕ Email failed, please download QR below';
          }
        });
    }

    console.log('[ElevateQA] Preparing to send confirmation email to:', email);
  } catch (err) {
    console.error('[ElevateQA] Full Registration Failure:', err);
    alert('Registration failed. ' + (err.message || 'Please try again.'));
    btn.textContent = originalText;
    btn.disabled = false;
  }
};

window.downloadTicketQR = () => {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `ElevateQA26-Ticket.png`;
  link.href = canvas.toDataURL();
  link.click();
};

// 2. CORE INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  initAnimations();

  const nav = document.querySelector('nav');
  const progressBar = document.getElementById('scroll-progress');
  const stamp = document.querySelector('.floating-stamp');
  const heroImg = document.querySelector('.hero-ambient img');

  const backToTop = document.getElementById('backToTop');

  // WORLD CLASS PASSIVE SCROLL ENGINE
  let ticking = false;
  let lastScrollY = window.scrollY;

  const updateScrollTransitions = () => {
    if (nav) {
      if (lastScrollY > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }

    if (backToTop) {
      if (lastScrollY > 600) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    }

    if (progressBar) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (lastScrollY / total * 100) + '%';
    }

    if (stamp) {
      stamp.style.transform = `rotate(${lastScrollY * 0.15}deg)`;
    }

    if (heroImg && lastScrollY < window.innerHeight) {
      heroImg.style.transform = `scale(${1 + lastScrollY * 0.0005}) translateY(${lastScrollY * 0.18}px)`;
    }

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(updateScrollTransitions);
      ticking = true;
    }
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ELITE SMOOTH SCROLL CONTROLLER
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  const handleSmoothScroll = (targetId, e) => {
    const target = document.querySelector(targetId);
    if (!target) return;
    
    if (e) e.preventDefault();
    
    // Mobile menu cleanup
    if (menuToggle && navLinks && navLinks.classList.contains('active')) {
      menuToggle.classList.remove('open');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
      menuToggle.setAttribute('aria-expanded', 'false');
    }

    const headerHeight = nav ? nav.offsetHeight : 80;
    const elementPosition = target.getBoundingClientRect().top;
    // Increase offset to 40px for better visibility of section titles
    const offsetPosition = elementPosition + window.scrollY - headerHeight - 40;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    // Force reveal elements in the target section to become visible immediately
    target.classList.add('visible', 'revealed');
    target.querySelectorAll('.reveal, .reveal-child > *').forEach(el => {
      el.classList.add('visible', 'revealed');
    });
  };

  // Intercept all internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      handleSmoothScroll(targetId, e);
    });
  });


  // MOBILE NAVIGATION CONTROLLER - Elite Full-Screen Overlay
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      
      const isOpen = navLinks.classList.contains('active');
      document.body.style.overflow = isOpen ? 'hidden' : '';
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // WORLD CLASS ELITE BRANDED CURSOR
  const brandedCursor = document.querySelector('.cursor-branded');
  
  if (brandedCursor) {
    document.addEventListener('mousemove', (e) => {
      // 1:1 tracking for professional feel (no lag)
      brandedCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }, { passive: true });

    const interactive = 'a, button, .btn, .speaker-card, .involve-card, .clickable';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactive)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactive)) document.body.classList.remove('cursor-hover');
    });
  }

  // Magnetic effect disabled for buttons — only apply to floating decorative stamp
  document.querySelectorAll('.floating-stamp').forEach(el => new MagneticElement(el));

  // Spotlight Effect for Bento Cards
  document.querySelectorAll('.pillar, .maturity-stage').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 3. SYNCHRONIZATION ENGINE
  window.syncEverything = function() {
    const site = JSON.parse(localStorage.getItem('elevate_site_content'));
    const agenda = JSON.parse(localStorage.getItem('elevate_agenda'));
    const speakers = JSON.parse(localStorage.getItem('elevate_speakers'));
    const manifesto = JSON.parse(localStorage.getItem('elevate_manifesto'));
    const maturity = JSON.parse(localStorage.getItem('elevate_maturity_stages'));
    const pillars = JSON.parse(localStorage.getItem('elevate_pillars'));
    const visuals = JSON.parse(localStorage.getItem('elevate_visuals'));

    if (site) {
      const setImg = (id, src) => { const el = document.getElementById(id); if (el && src) el.src = src; };

      const heroAmbImg = document.querySelector('.hero-ambient img');
      if (heroAmbImg) {
        const bgUrl = (visuals && visuals.heroBg) || (site && site.heroBg);
        if (bgUrl && bgUrl.length > 5) {
          heroAmbImg.src = bgUrl;
          heroAmbImg.style.filter = 'none'; 
          heroAmbImg.style.opacity = '0.7'; 
        } else {
          // Fallback to default unsplash if DB is empty
          heroAmbImg.src = 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1600&q=80';
          heroAmbImg.style.filter = 'grayscale(100%) contrast(1.2)';
          heroAmbImg.style.opacity = '0.35';
        }
      }

      setImg('strip-img-01', site.strip01Img);
      setImg('strip-img-02', site.strip02Img);
      setImg('strip-img-03', site.strip03Img);
      const setTxt = (id, val) => { const el = document.getElementById(id); if (el && val) el.innerHTML = val; };
      setTxt('strip-cap-01', site.strip01Cap);
      setTxt('strip-cap-02', site.strip02Cap);
      setTxt('strip-cap-03', site.strip03Cap);

      const b = visuals || {};
      const logoUrl = b.logo || (site && site.logoUrl) || '/logo-elevate-clean.svg';
      const logoHeight = b.logoHeight || (site && site.logoHeight) || 48;
      
      const logos = document.querySelectorAll('.logo img, .preloader-logo, #footer-logo-img, #site-logo-img');
      logos.forEach(img => {
        img.src = logoUrl;
        img.style.display = 'block';
        img.style.height = logoHeight + 'px';
        img.style.width = 'auto';
        if (!img.alt) img.alt = 'Elevate QA Logo';
      });

      const titleEl = document.getElementById('hero-title');
      if (titleEl && site.heroHeadline) {
        const lines = site.heroHeadline.split(/[|\n]/).filter(l => l.trim());
        titleEl.innerHTML = lines.map(line => {
          const processed = line.replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
          return `<span class="title-line" style="display:block;"><span style="display:inline-block;">${processed}</span></span>`;
        }).join('');
      }

      const tagEl = document.getElementById('hero-tagline');
      if (tagEl && site.heroTagline) {
        tagEl.innerHTML = site.heroTagline.replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
      }

      const eyebrowEl = document.getElementById('hero-eyebrow');
      if (eyebrowEl && site.heroEyebrow) {
        eyebrowEl.innerHTML = site.heroEyebrow.replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
      }

      const introEl = document.getElementById('speakers-intro');
      if (introEl) {
        introEl.innerHTML = (site.speakersIntro || '').replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
      }

      const metaEl = document.getElementById('hero-line-signature');
      if (metaEl) {
        const text = site.heroMeta || '';
        const processed = text.replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
        metaEl.innerHTML = text ? `<span class="line"></span> ${processed}` : '';
      }

      const venueEl = document.getElementById('hero-venue-bottom');
      if (venueEl && site.eventVenue) venueEl.innerHTML = site.eventVenue;

      const dateEl = document.getElementById('hero-date-bottom');
      if (dateEl && site.eventDate) dateEl.innerHTML = site.eventDate;

      // Stats Bar / Proof Bar
      const setStat = (id, val) => { 
        const el = document.getElementById(id); 
        if (el && val) el.innerHTML = val.replace(/\[\[(.*?)\]\]/g, '<em>$1</em>'); 
      };
      setStat('stat1-num', site.stat1Num); setStat('stat1-lbl', site.stat1Lbl);
      setStat('stat2-num', site.stat2Num); setStat('stat2-lbl', site.stat2Lbl);
      setStat('stat3-num', site.stat3Num); setStat('stat3-lbl', site.stat3Lbl);
      setStat('stat4-num', site.stat4Num); setStat('stat4-lbl', site.stat4Lbl);

      const pTitle = document.getElementById('prizes-title');
      if (pTitle && site.prizesHeadline) {
        let html = site.prizesHeadline.replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
        html = html.replace(/\|/g, '<br>');
        pTitle.innerHTML = html;
      }

      const setPrize = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val || ''; };
      setPrize('prizes-s1-val', site.prizesS1Num);
      setPrize('prizes-s1-text', site.prizesS1Lbl);
      setPrize('prizes-s2-val', site.prizesS2Num);
      setPrize('prizes-s2-text', site.prizesS2Lbl);
      setPrize('prizes-s3-val', site.prizesS3Num);
      setPrize('prizes-s3-text', site.prizesS3Lbl);

      for (let i = 1; i <= 9; i++) {
        const tEl = document.getElementById(`ticker-${i}`);
        if (tEl && site[`ticker${i}`]) {
          tEl.innerHTML = site[`ticker${i}`].replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
        }
      }

      const setFooter = (id, val) => { const el = document.getElementById(id); if (el && val) el.innerHTML = val; };
      setFooter('footer-tagline', site.footerTagline);
      setFooter('footer-location', site.footerLocation);
      setFooter('footer-edition', site.footerEdition);
      setFooter('footer-copyright', site.footerCopyright);
      if (site.footerEmail) {
        const fe = document.getElementById('footer-email');
        if (fe) fe.innerHTML = `<a href="mailto:${site.footerEmail}" style="color: var(--accent); font-weight: 600;">${site.footerEmail}</a>`;
      }

      setFooter('involve-title', site.involveTitle);
      setFooter('involve-section-num', site.involveSectionNum);
      for (let i = 1; i <= 3; i++) {
        setFooter(`involve-card${i}-title`, site[`involveCard${i}Title`]);
        const desc = (site[`involveCard${i}Desc`] || '').replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
        const dEl = document.getElementById(`involve-card${i}-desc`);
        if (dEl) dEl.innerHTML = desc;
      }
      const c1Link = document.getElementById('involve-card1-link');
      if (c1Link) {
        // Hardcoded to ensure the correct form is always attached as requested
        c1Link.setAttribute('href', 'https://forms.office.com/r/eNjZMN831G');
      }
      
      const c3Link = document.getElementById('copyLink');
      if (c3Link && site.involveCard3LinkText) {
        c3Link.innerHTML = site.involveCard3LinkText;
      }

      setFooter('coming-title', site.comingTitle);
      setFooter('coming-desc', site.comingDesc);
      setFooter('coming-section-num', site.comingSectionNum);
      setFooter('coming-visual-label', site.comingVisualLabel);
      setFooter('coming-visual-sub', site.comingVisualSub);
      const comingList = document.getElementById('coming-checklist');
      if (comingList) {
        const lis = comingList.querySelectorAll('li');
        for (let i = 1; i <= 6; i++) {
          const li = lis[i - 1];
          if (!li) continue;
          const labelEl = li.querySelector('span:not(.status)');
          if (labelEl && site[`comingItem${i}Label`]) labelEl.innerHTML = site[`comingItem${i}Label`];
        }
      }
      for (let i = 1; i <= 6; i++) {
        const sEl = document.getElementById(`coming-item${i}-status`);
        if (sEl && site[`comingItem${i}Status`]) {
          const val = site[`comingItem${i}Status`];
          sEl.innerHTML = val;
          if (val.toLowerCase().includes('live') || val.toLowerCase().includes('open') || val.includes('✓')) {
            sEl.classList.remove('pending');
          } else {
            sEl.classList.add('pending');
          }
        }
      }

      setFooter('agenda-section-num', site.agendaSectionNum);
      if (site.agendaSectionTitle) {
        const aTitleEl = document.getElementById('agenda-section-title');
        if (aTitleEl) {
          aTitleEl.innerHTML = site.agendaSectionTitle.replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
        }
      }
      setFooter('speakers-section-num', site.speakersSectionNum);

      const navItemsList = ['manifesto', 'maturity', 'experience', 'agenda', 'speakers', 'join'];
      navItemsList.forEach(item => {
        const key = 'nav' + item.charAt(0).toUpperCase() + item.slice(1);
        const el = document.getElementById('nav-' + item);
        if (el && site[key]) el.innerHTML = site[key];
      });

      const b2 = visuals || {};
      let pColor = b2.primaryColor || site.primaryColor || '#d4ff3a';
      if (pColor === '#000000' || pColor === '') pColor = '#d4ff3a';
      document.documentElement.style.setProperty('--accent', pColor);
    }

    const setFooter2 = (id, val) => { const el = document.getElementById(id); if (el && val) el.innerHTML = val; };

    // MANIFESTO
    if (site) {
      setFooter2('manifesto-section-num', site.manifestoSectionNum);
      setFooter2('manifesto-pill', site.manifestoPill);
      setFooter2('manifesto-aside-text', site.manifestoAside);
    }
    if (manifesto && manifesto[0]) {
      const manifestEl = document.getElementById('manifesto-text') || document.getElementById('manifesto-text-content');
      if (manifestEl && manifesto[0].content) {
        const lines = String(manifesto[0].content).split(/[|\n]/).filter(l => l.trim());
        if (lines.length) {
          manifestEl.innerHTML = lines.map(line => {
            let clean = line;
            // Auto-format signature phrases if markers are missing from the DB
            if (!clean.includes('[[') && !clean.includes('<')) {
              clean = clean.replace(/Few are showing the proof\./g, '[[Few are showing the proof.]]');
              clean = clean.replace(/The proof of value, or it didn't happen\./g, '[[The proof of value, or it didn\'t happen.]]');
            }
            if (!clean.includes('==') && !clean.includes('<')) {
              clean = clean.replace(/what actually shipped to production/g, '==what actually shipped to production==');
            }
            
            clean = clean.replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
            clean = clean.replace(/==(.*?)==/g, '<span class="highlight">$1</span>');
            return `<p class="reveal">${clean}</p>`;
          }).join('');
        }
      }
    }

    // MATURITY
    if (site) setFooter2('map-section-num', site.mapSectionNum);
    const mTitle = document.getElementById('maturity-title');
    if (mTitle && site && site.maturityTitle) {
      mTitle.innerHTML = site.maturityTitle.replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
    }

    if (maturity && maturity.length > 0) {
      const stagesContainer = document.getElementById('maturity-stages-grid');
      if (stagesContainer) {
        const seen = new Set();
        const uniqueMaturity = maturity.filter(m => {
          if (seen.has(m.name)) return false;
          seen.add(m.name);
          return true;
        });
        const STAGE_COLORS = ['#ffffff', 'var(--accent-3, #3a8dff)', 'var(--accent-2, #ff3a3a)', 'var(--accent, #d4ff3a)'];

        stagesContainer.innerHTML = uniqueMaturity.map((m, i) => {
          const cleanPct = String(m.pct || '0').replace(/%/g, '').trim();
          const barColor = m.color || STAGE_COLORS[i] || 'var(--accent)';
          const procName = (m.name || '').replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
          const procDesc = (m.desc || '').replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
          return `
            <div class="maturity-stage reveal" style="--meter-width: ${cleanPct}%">
              <div class="level"><span>STAGE 0${i+1}</span></div>
              <div class="stage-name">${procName}</div>
              <p class="stage-desc">${procDesc}</p>
              <div class="meter"><div class="meter-fill" style="width: 0%; background: ${barColor} !important;" data-width="${cleanPct}%"></div></div>
              <div class="pct">~ ${cleanPct}% of orgs surveyed</div>
            </div>`;
        }).join('');
      }
    }

    // PILLARS
    if (site) setFooter2('experience-section-num', site.experienceSectionNum);
    if (pillars && pillars.length > 0) {
      const pillarsGrid = document.getElementById('pillars-grid');
      if (pillarsGrid) {
        const seen = new Set();
        const uniquePillars = pillars.filter(p => {
          if (seen.has(p.title)) return false;
          seen.add(p.title);
          return true;
        });
        const PILLAR_ICONS = [
          '<circle cx="24" cy="24" r="20"/><path d="M14 24 L22 32 L34 18"/>',
          '<rect x="6" y="6" width="36" height="36" rx="2"/><path d="M14 18 L34 18 M14 24 L28 24 M14 30 L34 30"/>',
          '<circle cx="14" cy="24" r="6"/><circle cx="34" cy="14" r="6"/><circle cx="34" cy="34" r="6"/><path d="M19 22 L29 16 M19 26 L29 32"/>',
          '<path d="M24 6 L24 42 M6 24 L42 24"/><circle cx="24" cy="24" r="8"/>',
          '<path d="M12 36 L12 12 L36 12 L36 28 L24 28 L12 36 Z"/>',
          '<polygon points="24,6 28,18 40,18 30,26 34,38 24,30 14,38 18,26 8,18 20,18"/>'
        ];
        pillarsGrid.innerHTML = uniquePillars.map((p, i) => {
          const icon = PILLAR_ICONS[i] || PILLAR_ICONS[0];
          const procTitle = (p.title || '').replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
          const procDesc = (p.desc || '').replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
          return `
            <div class="pillar reveal">
              <div class="pillar-num">> 0${i+1}</div>
              <div class="pillar-icon"><svg viewBox="0 0 48 48">${icon}</svg></div>
              <h3>${procTitle}</h3>
              <p>${procDesc}</p>
            </div>`;
        }).join('');
      }
    }

    // AGENDA
    if (agenda && agenda.length > 0) {
      const timeline = document.querySelector('.timeline');
      if (timeline) {
        const esc = window.escapeHtml;
        timeline.innerHTML = agenda.map(item => {
          const isKeynote = (item.tag || '').toLowerCase().includes('keynote');
          const isBreak = (item.tag || '').toLowerCase().includes('break') || (item.title || '').toLowerCase().includes('lunch');
          return `
            <div class="timeline-row reveal ${isKeynote ? 'featured' : ''} ${isBreak ? 'break' : ''}">
              <div class="timeline-time">${esc(item.time_slot || item.time)}</div>
              <div class="timeline-content">
                <span class="tag">${esc(item.tag || 'SESSION')}</span>
                <h4>${(item.title || '').replace(/\[\[(.*?)\]\]/g, '<em>$1</em>')}</h4>
                <p>${esc(item.desc || '')}</p>
              </div>
            </div>`;
        }).join('');
      }
    }

    // SPEAKERS
    if (speakers && speakers.length > 0) {
      const grid = document.querySelector('.speakers-grid');
      if (grid) {
        const esc = window.escapeHtml;
        grid.innerHTML = speakers.map((s, idx) => {
          const spkImg = s.image_url || s.img || '';
          const isPhoto = spkImg && spkImg.length > 5;
          const safeName = esc(s.name || '');
          const photoHtml = isPhoto
            ? `<div class="speaker-photo-wrap"><img class="speaker-photo" src="${esc(spkImg)}" alt="${safeName}" loading="lazy"></div>`
            : `<div class="silhouette" aria-hidden="true">${(idx + 1).toString().padStart(2, '0')}</div>`;
          const nameParts = (s.name || '').split(' ');
          const firstSafe = esc(nameParts[0] || '');
          const restSafe = esc(nameParts.slice(1).join(' '));
          return `
            <div class="speaker-card reveal ${isPhoto ? 'speaker-has-photo' : ''}">
              ${photoHtml}
              <div class="top"><span>${esc((s.role || 'Keynote').toUpperCase())}</span><span>${esc((s.status || 'CONFIRMED').toUpperCase())}</span></div>
              <div class="speaker-content">
                <div class="name">${firstSafe} ${restSafe ? `<em>${restSafe}</em>` : ''}</div>
                ${s.title ? `<div class="designation">${esc(s.title)}</div>` : ''}
              </div>
            </div>`;
        }).join('') + `
          <div class="speaker-card speaker-cta-card reveal">
            <div class="silhouette" aria-hidden="true">+</div>
            <div class="top"><span>SUBMISSIONS</span><span>OPEN</span></div>
            <div class="pitch">Have a story <em>worth telling?</em><br><a href="#join">Apply to speak ></a></div>
          </div>`;
      }
    }

    if (window.io) {
      document.querySelectorAll('.reveal').forEach(el => window.io.observe(el));
      document.querySelectorAll('.maturity-stage').forEach(el => window.io.observe(el));
    }
  };

  window.addEventListener('storage', (e) => {
    if (e && e.key && e.key.startsWith('elevate_')) {
      try { window.syncEverything(); } catch(err) { console.error('[ElevateQA] Sync Error:', err); }
    }
  });

  try {
    initCloudSync();
    window.syncEverything();
  } catch(err) {
    console.error('[ElevateQA] Initial Sync Failed:', err);
  } finally {
    const dismissPreloader = () => {
      const preloader = document.getElementById('page-preloader');
      if (preloader) {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        setTimeout(() => preloader.remove(), 1000);
      }
    };
    if (document.readyState === 'complete') dismissPreloader();
    else window.addEventListener('load', dismissPreloader);
    setTimeout(dismissPreloader, 3000);
  }
});

window.copyLink = (e) => {
  e.preventDefault();
  const link = document.getElementById('copyLink');
  const original = link.textContent;
  navigator.clipboard?.writeText(window.location.href).then(() => {
    link.textContent = 'Copied';
    setTimeout(() => link.textContent = original, 2200);
  });
};
