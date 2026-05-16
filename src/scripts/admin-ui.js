/**
 * ELEVATE QA 2026 - ADMIN UI MODULE
 * Handles dynamic rendering, list management, and UI state.
 */

// ─── UTILITY: HTML ESCAPE (to neutralize untrusted strings before innerHTML) ──
window.escapeHtml = function(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// ─── MOBILE: SIDEBAR HAMBURGER TOGGLE ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!toggle || !sidebar) return;

  const setOpen = (isOpen) => {
    toggle.classList.toggle('open', isOpen);
    sidebar.classList.toggle('open', isOpen);
    if (backdrop) backdrop.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
  backdrop?.addEventListener('click', () => setOpen(false));
  // Close after navigation on mobile
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 900px)').matches) setOpen(false);
    });
  });
});

// ─── PATCH showSection TO SET aria-current ────────────────────────────────────
(function wrapShowSection() {
  const tryWrap = () => {
    if (typeof window.showSection === 'function' && !window.showSection.__ariaWrapped) {
      const original = window.showSection;
      window.showSection = function(target) {
        original(target);
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
          item.removeAttribute('aria-current');
        });
        const active = document.getElementById(`nav-${target}`);
        if (active) active.setAttribute('aria-current', 'page');
      };
      window.showSection.__ariaWrapped = true;
    } else {
      setTimeout(tryWrap, 100);
    }
  };
  tryWrap();
})();

// 1. Speakers
function addSpeakerItem(data = { name: '', role: '', img: '', status: '' }) {
  const container = document.getElementById('speaker-list');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  const esc = window.escapeHtml;
  const safeImg = esc(data.img || '');
  div.innerHTML = `
    <div class="dynamic-header">
       <div class="badge">Speaker Node</div>
       <button class="btn-del" onclick="this.parentElement.parentElement.remove()" aria-label="Remove speaker">&times;</button>
    </div>
    <div class="form-grid-2">
      <div class="speaker-img-column">
        <label>Speaker Photo</label>
        <div class="img-upload-wrap ${data.img ? 'has-img' : ''}" onclick="this.nextElementSibling.click()">
          <img src="${safeImg}" alt="Speaker photo preview" style="display: ${data.img ? 'block' : 'none'}">
          <div class="placeholder">Click to replace</div>
        </div>
        <input type="file" class="s-img-input" style="display:none;" onchange="handleSpeakerImg(this)" aria-label="Upload speaker photo">
      </div>
      <div class="speaker-info-column">
        <div class="form-group"><label>Full Name</label><input type="text" class="s-name" value="${esc(data.name)}" placeholder="Kapil Dev"></div>
        <div class="form-group"><label>Role / Badge</label><input type="text" class="s-role" value="${esc(data.role)}" placeholder="e.g. KEYNOTE"></div>
        <div class="form-group"><label>Professional Designation</label><input type="text" class="s-title" value="${esc(data.title || '')}" placeholder="e.g. CEO at SDET TECH"></div>
        <div class="form-group"><label>Status Label</label><input type="text" class="s-status" value="${esc(data.status || 'CONFIRMED')}" placeholder="e.g. CONFIRMED"></div>
      </div>
    </div>
  `;
  container.appendChild(div);
}

function handleSpeakerImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const wrap = input.previousElementSibling;
    const img = wrap.querySelector('img');
    img.src = e.target.result;
    img.style.display = 'block';
    wrap.classList.add('has-img');
  };
  reader.readAsDataURL(file);
}

// 2. Agenda
function addAgendaItem(data = { time: '', tag: '', title: '', desc: '' }) {
  const container = document.getElementById('agenda-list');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  const esc = window.escapeHtml;
  div.innerHTML = `
    <div class="form-grid-2">
      <div class="form-group"><label>Time</label><input type="text" class="a-time" value="${esc(data.time)}" placeholder="09:00"></div>
      <div class="form-group"><label>Tag</label><input type="text" class="a-tag" value="${esc(data.tag)}" placeholder="Keynote"></div>
    </div>
    <div class="form-group"><label>Topic Title</label><input type="text" class="a-title" value="${esc(data.title)}" placeholder="The Proof of Value"></div>
    <div class="form-group"><label>Description</label><textarea class="a-desc" rows="2">${esc(data.desc || '')}</textarea></div>
    <button class="btn-remove" onclick="this.parentElement.remove()" aria-label="Remove agenda item">&times;</button>
  `;
  container.appendChild(div);
}

// 3. Maturity Stages
function addMaturityStage(data = { label: '', name: '', pct: '', desc: '' }) {
  const container = document.getElementById('maturity-stages-admin');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  const esc = window.escapeHtml;
  div.innerHTML = `
    <div class="form-grid-2">
      <div class="form-group">
        <label>Stage Name <span class="label-hint">(e.g. &lt;em&gt;Manual&lt;/em&gt;-first)</span></label>
        <input type="text" class="mat-name" value="${esc(data.name)}" placeholder="Enter stage name...">
      </div>
      <div class="form-group">
        <label>Percentage / Stat</label>
        <input type="text" class="mat-pct" value="${esc(data.pct)}" placeholder="e.g. 25% of orgs...">
      </div>
    </div>
    <div class="form-group">
      <label>Stage Description</label>
      <textarea class="mat-desc" rows="3" placeholder="Describe this maturity level...">${esc(data.desc)}</textarea>
    </div>
    <button class="btn-remove" onclick="this.parentElement.remove()" aria-label="Remove maturity stage">&times;</button>
  `;
  container.appendChild(div);
}

// 4. Pillar Items
function addPillarItem(data = { title: '', desc: '' }) {
  const container = document.getElementById('pillars-admin');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  const esc = window.escapeHtml;
  div.innerHTML = `
    <div class="form-group">
      <label>Pillar Title</label>
      <input type="text" class="pil-title" value="${esc(data.title)}" placeholder="e.g. Continuous Testing">
    </div>
    <div class="form-group">
      <label>Pillar Description</label>
      <textarea class="pil-desc" rows="3" placeholder="Describe this pillar...">${esc(data.desc)}</textarea>
    </div>
    <button class="btn-remove" onclick="this.parentElement.remove()" aria-label="Remove pillar">&times;</button>
  `;
  container.appendChild(div);
}
