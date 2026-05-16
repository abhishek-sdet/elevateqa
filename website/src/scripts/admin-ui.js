/**
 * ELEVATE QA 2026 - ADMIN UI MODULE
 * Handles dynamic rendering, list management, and UI state.
 */

// 1. Speakers
function addSpeakerItem(data = { name: '', role: '', img: '', status: '' }) {
  const container = document.getElementById('speaker-list');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <div class="dynamic-header">
       <div class="badge">Speaker Node</div>
       <button class="btn-del" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
    <div class="form-grid-2">
      <div class="speaker-img-column">
        <label>Speaker Photo</label>
        <div class="img-upload-wrap ${data.img ? 'has-img' : ''}" onclick="this.nextElementSibling.click()">
          <img src="${data.img || ''}" alt="Preview" style="display: ${data.img ? 'block' : 'none'}">
          <div class="placeholder">Click to replace</div>
        </div>
        <input type="file" class="s-img-input" style="display:none;" onchange="handleSpeakerImg(this)">
      </div>
      <div class="speaker-info-column">
        <div class="form-group"><label>Full Name</label><input type="text" class="s-name" value="${data.name}" placeholder="Kapil Dev"></div>
        <div class="form-group"><label>Role / Title</label><input type="text" class="s-role" value="${data.role}" placeholder="e.g. KEYNOTE"></div>
        <div class="form-group"><label>Status Label</label><input type="text" class="s-status" value="${data.status || 'CONFIRMED'}" placeholder="e.g. KEYNOTE SPEAKER"></div>
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
  div.innerHTML = `
    <div class="form-grid-2">
      <div class="form-group"><label>Time</label><input type="text" class="a-time" value="${data.time}" placeholder="09:00"></div>
      <div class="form-group"><label>Tag</label><input type="text" class="a-tag" value="${data.tag}" placeholder="Keynote"></div>
    </div>
    <div class="form-group"><label>Topic Title</label><input type="text" class="a-title" value="${data.title}" placeholder="The Proof of Value"></div>
    <div class="form-group"><label>Description</label><textarea class="a-desc" rows="2">${data.desc || ''}</textarea></div>
    <button class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(div);
}

// 3. Maturity Stages
function addMaturityStage(data = { label: '', name: '', pct: '', desc: '' }) {
  const container = document.getElementById('maturity-stages-admin');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <div class="form-grid-2">
      <div class="form-group">
        <label>Stage Name <span class="label-hint">(e.g. &lt;em&gt;Manual&lt;/em&gt;-first)</span></label>
        <input type="text" class="mat-name" value="${data.name}" placeholder="Enter stage name...">
      </div>
      <div class="form-group">
        <label>Percentage / Stat</label>
        <input type="text" class="mat-pct" value="${data.pct}" placeholder="e.g. 25% of orgs...">
      </div>
    </div>
    <div class="form-group">
      <label>Stage Description</label>
      <textarea class="mat-desc" rows="3" placeholder="Describe this maturity level...">${data.desc}</textarea>
    </div>
    <button class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(div);
}

// 4. Pillar Items
function addPillarItem(data = { title: '', desc: '' }) {
  const container = document.getElementById('pillars-admin');
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <div class="form-group">
      <label>Pillar Title</label>
      <input type="text" class="pil-title" value="${data.title}" placeholder="e.g. Continuous Testing">
    </div>
    <div class="form-group">
      <label>Pillar Description</label>
      <textarea class="pil-desc" rows="3" placeholder="Describe this pillar...">${data.desc}</textarea>
    </div>
    <button class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(div);
}
