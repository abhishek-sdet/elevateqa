/**
 * ELEVATE QA 2026 - MAIN ENGINE
 * Consolidated logic for Animations, Sync, and Interactions.
 */
import { initCloudSync } from './main-sync.js';
import { supabase } from './supabase-config.js';
import { sendAttendeeEmail } from './email-service.js';

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

  window.io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('count-up')) {
          startCountUp(entry.target);
        }
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
  document.querySelectorAll('.maturity-stage').forEach(el => window.io.observe(el));
}

// 2. CORE INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  initAnimations();

  // Navigation Effects
  const nav = document.querySelector('nav');
  const progressBar = document.getElementById('scroll-progress');
  const heroAmbientImg = document.querySelector('.hero-ambient img');

  window.addEventListener('scroll', () => {
    if (nav) {
      if (window.scrollY > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    if (progressBar) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (window.scrollY / total * 100) + '%';
    }
    if (heroAmbientImg && window.scrollY < window.innerHeight) {
      heroAmbientImg.style.transform = `translateY(${window.scrollY * 0.18}px)`;
    }
  });

  // ELITE SMOOTH SCROLL CONTROLLER
  const handleSmoothScroll = (targetId, e) => {
    const target = document.querySelector(targetId);
    if (!target) return;
    
    if (e) e.preventDefault();
    
    const headerOffset = nav ? nav.offsetHeight : 80;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

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


  // Mobile Menu
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

  // Custom Cursor
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow) {
    document.addEventListener('mousemove', (e) => {
      requestAnimationFrame(() => {
        cursorGlow.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
      });
    });
  }

  // Modal Functions
  window.openModal = (e) => {
    if (e) e.preventDefault();
    const modal = document.getElementById('regModal');
    if (modal) {
      modal.classList.add('active');
      document.getElementById('price-view').style.display = 'block';
      document.getElementById('form-view').style.display = 'none';
      document.getElementById('ticket-view').style.display = 'none';
      document.body.style.overflow = 'hidden';
    }
  };
  
  window.proceedToForm = () => {
    const priceView = document.getElementById('price-view');
    const formView = document.getElementById('form-view');
    if (priceView && formView) {
      priceView.style.display = 'none';
      formView.style.display = 'block';
    }
  };

  window.closeModal = () => {
    const modal = document.getElementById('regModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // 3. SYNCHRONIZATION ENGINE
  window.syncEverything = () => {
    const brandingData = JSON.parse(localStorage.getItem('elevate_branding')) || [];
    const manifestoData = JSON.parse(localStorage.getItem('elevate_manifesto')) || [];
    const speakersData = JSON.parse(localStorage.getItem('elevate_speakers')) || [];
    const agendaData = JSON.parse(localStorage.getItem('elevate_agenda')) || [];

    const branding = brandingData[0];
    const manifesto = manifestoData[0];

    if (branding) {
      if (branding.logo_url) {
        document.querySelectorAll('.logo img').forEach(img => img.src = branding.logo_url);
      }
      if (branding.primary_color) {
        document.documentElement.style.setProperty('--accent', branding.primary_color);
      }

      // Headline Parsing
      const titleEl = document.getElementById('hero-title');
      if (titleEl && branding.heroHeadline) {
        const lines = branding.heroHeadline.split(/[|\n]/).filter(l => l.trim());
        titleEl.innerHTML = lines.map(line => {
          const processed = line.replace(/\[\[(.*?)\]\]/g, '<span class="accent">$1</span>');
          return `<span class="title-line" style="display:block;"><span style="display:inline-block;">${processed}</span></span>`;
        }).join('');
      }

      // Other Metadata
      const tagEl = document.getElementById('hero-tagline');
      if (tagEl && branding.heroTagline) tagEl.innerHTML = branding.heroTagline;
      
      const eyebrowEl = document.getElementById('hero-eyebrow');
      if (eyebrowEl && branding.heroEyebrow) eyebrowEl.innerHTML = branding.heroEyebrow;
      
      const editionEl = document.getElementById('hero-edition-val');
      if (editionEl && branding.heroEdition) editionEl.innerHTML = branding.heroEdition;

      const venueEl = document.getElementById('hero-venue-bottom');
      if (venueEl && branding.eventVenue) venueEl.innerHTML = branding.eventVenue;

      const dateEl = document.getElementById('hero-date-bottom');
      if (dateEl && branding.eventDate) dateEl.innerHTML = branding.eventDate;
    }

    if (manifesto) {
      const manifestoWrap = document.querySelector('.manifesto-text');
      if (manifestoWrap && manifesto.content) {
        const lines = manifesto.content.split('\n');
        manifestoWrap.innerHTML = lines.map(line => {
          const processed = line.replace(/\[\[(.*?)\]\]/g, '<span class="highlight">$1</span>');
          return `<p class="reveal">${processed}</p>`;
        }).join('');
      }
    }

    if (agendaData.length > 0) {
      const timeline = document.querySelector('.timeline');
      if (timeline) {
        timeline.innerHTML = agendaData.map(item => `
          <div class="timeline-row reveal">
            <div class="timeline-time">${item.time_slot}</div>
            <div class="timeline-content"><h4>${item.title}</h4><p>${item.speaker_name || ''}</p></div>
          </div>`).join('');
      }
    }

    if (speakersData.length > 0) {
      const grid = document.querySelector('.speakers-grid');
      if (grid) {
        grid.innerHTML = speakersData.map((s, idx) => `
          <div class="speaker-card reveal">
            ${s.image_url ? `<div class="speaker-photo-wrap"><img class="speaker-photo" src="${s.image_url}" alt="${s.name}"></div>` : `<div class="silhouette">${(idx + 1).toString().padStart(2, '0')}</div>`}
            <div class="top"><span>${(s.role || 'Speaker').toUpperCase()}</span><span>CONFIRMED</span></div>
            <div class="name">${s.name}</div>
          </div>`).join('');
      }
    }

    if (window.io) {
      document.querySelectorAll('.reveal').forEach(el => window.io.observe(el));
    }
  };

  // Ticket Generation - Persist to Supabase
  window.generateTicket = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Processing...';
    btn.disabled = true;

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const org = document.getElementById('reg-org').value.trim();
    const ticketId = Math.random().toString(36).substr(2, 9).toUpperCase();

    try {
      const { error } = await supabase
        .from('registrations')
        .insert([{ name, email, company: org }]);

      if (error) throw error;

      document.getElementById('ticket-name').textContent = name;
      document.getElementById('ticket-org').textContent = org;
      
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
      
      // Send professional "Thank You" email
      try {
        await sendAttendeeEmail({ name, email, company: org, ticketId });
        console.log(`[ElevateQA] Professional confirmation sent to ${email}`);
      } catch (e) {
        console.warn('[ElevateQA] Email delivery engine returned an error, but registration is saved in database.', e);
      }

      const statusWrap = document.getElementById('email-status-wrap');
      if (statusWrap) {
        statusWrap.innerHTML = `<div class="email-status success">✓ Professional entry pass sent to ${email}</div>`;
      }
    } catch (error) {
      console.error('[ElevateQA] Error:', error);
      alert('Registration failed. Please try again.');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  };

  initCloudSync();

  // 4. PRELOADER REMOVAL LOGIC
  const removePreloader = () => {
    const preloader = document.getElementById('page-preloader');
    if (preloader) {
      preloader.classList.add('fade-out');
      setTimeout(() => preloader.remove(), 1000);
    }
  };

  // Wait for first sync to remove preloader
  const originalSync = window.syncEverything;
  let firstSyncDone = false;
  window.syncEverything = () => {
    originalSync();
    if (!firstSyncDone) {
      firstSyncDone = true;
      setTimeout(removePreloader, 800); // Small delay for smooth transition
    }
  };

  // Failsafe: Remove preloader anyway after 5 seconds
  setTimeout(removePreloader, 5000);
});

window.copyLink = (e) => {
  e.preventDefault();
  const link = document.getElementById('copyLink');
  const original = link.textContent;
  navigator.clipboard?.writeText(window.location.href).then(() => {
    link.textContent = 'Copied ✓';
    setTimeout(() => link.textContent = original, 2200);
  });
};
