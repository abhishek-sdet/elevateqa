/**
 * ELEVATE QA — MAIN ANIMATIONS MODULE
 * =====================================
 * Contains: MagneticElement, startCountUp, initAnimations, initCursor
 * Extracted from main.js for maintainability.
 */

const lerp = (a, b, n) => (1 - n) * a + n * b;

export class MagneticElement {
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

export function startCountUp(el) {
  const target = parseInt(el.getAttribute('data-target'));
  if (isNaN(target)) return;
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

export function initAnimations() {
  const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };

  window.io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible', 'revealed');
        if (entry.target.classList.contains('count-up')) startCountUp(entry.target);
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

  document.querySelectorAll('.reveal').forEach(el => window.io.observe(el));
}

export function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  
  let dotX = mouseX;
  let dotY = mouseY;
  
  let ringX = mouseX;
  let ringY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function render() {
    // Dot trails with tight, precise lag (highly responsive)
    dotX += (mouseX - dotX) * 0.85;
    dotY += (mouseY - dotY) * 0.85;
    
    // Ring follows with a gorgeous, fluid, buttery-smooth delay
    ringX += (mouseX - ringX) * 0.28;
    ringY += (mouseY - ringY) * 0.28;
    
    dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  document.addEventListener('mousedown', () => {
    dot.classList.add('clicking');
    ring.classList.add('clicking');
  });
  
  document.addEventListener('mouseup', () => {
    dot.classList.remove('clicking');
    ring.classList.remove('clicking');
  });
}
