export function initAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  window.io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('count-up')) {
          startCountUp(entry.target);
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .reveal-child > *').forEach(el => {
    window.io.observe(el);
  });
}

function startCountUp(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const duration = 2000;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 4); // Quart easing
    const current = Math.floor(easeProgress * (target - start) + start);
    
    el.textContent = current + (el.getAttribute('data-suffix') || '');
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
