/**
 * ELEVATE QA — ADMIN REGISTRATIONS MODULE
 * =========================================
 * Contains: renderAttendees, deleteAttendee, exportAttendees, showPass, generateAdminQR
 * Extracted from admin-core.js for maintainability.
 */
import { deleteItem, loadAllData, updateRegistrationStatus } from './admin-supabase.js';

window.showPass = (id, name, email) => {
  const modal   = document.getElementById('qr-modal');
  const target  = document.getElementById('qr-target');
  const nameEl  = document.getElementById('qr-attendee-name');
  const emailEl = document.getElementById('qr-attendee-email');
  if (!modal || !target) return;

  target.innerHTML = '';
  const qr = qrcode(0, 'H');
  qr.addData(`ELEVATE-QA:${id}|${name}|${email}`);
  qr.make();
  const imgHtml = qr.createImgTag(5);
  target.innerHTML = imgHtml;

  const img = target.querySelector('img');
  if (img) {
    img.style.display  = 'block';
    img.style.width    = '200px';
    img.style.height   = '200px';
    img.style.maxWidth = '100%';
  }

  if (nameEl)  nameEl.textContent  = name;
  if (emailEl) emailEl.textContent = email;
  modal.style.display = 'flex';
};

window.generateAdminQR = (data) => {
  try {
    if (typeof qrcode === 'undefined') return '<span style="font-size:10px; color:var(--accent-red);">QR LIB MISSING</span>';
    const qr = qrcode(0, 'M');
    qr.addData(`ELEVATE-QA:${data.id}|${data.name}|${data.email}`);
    qr.make();
    return qr.createImgTag(2);
  } catch (e) {
    return '—';
  }
};

window.renderAttendees = (registrations) => {
  const tbody      = document.getElementById('attendee-table');
  const countBadge = document.getElementById('attendee-count');
  if (!tbody) return;

  const atts = registrations || [];
  if (countBadge) countBadge.textContent = `${atts.length} registered`;

  if (atts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 40px; color: var(--ink-dim);">No registrations found</td></tr>';
    return;
  }

  tbody.innerHTML = atts.map((p) => {
    const qrHtml        = window.generateAdminQR(p);
    const safeName      = (p.name  || '—').replace(/'/g, "\\'");
    const safeEmail     = (p.email || '—').replace(/'/g, "\\'");
    const linkedinLink  = p.linkedin
      ? `<a href="${p.linkedin}" target="_blank" style="color:var(--accent); font-weight:600; text-decoration:none;">LinkedIn ↗</a>`
      : '—';

    const isPresent = (p.status && p.status.toUpperCase() === 'PRESENT');
    
    return `
      <tr data-id="${p.id}">
        <td>${p.name  || '—'}</td>
        <td>${p.company     || '—'}</td>
        <td>${p.designation || '—'}</td>
        <td>${p.email || '—'}</td>
        <td>${p.mobile || '—'}</td>
        <td>${linkedinLink}</td>
        <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
        <td>${isPresent ? '<span class="badge" style="background:var(--accent); color:#000;">Present</span>' : '<span class="badge">Verified</span>'}</td>
        <td class="qr-col" onclick="showPass('${p.id}', '${safeName}', '${safeEmail}')" title="Click to View Pass">${qrHtml}</td>
        <td style="text-align: right;">
          <button class="btn-mini" onclick="resetAttendeeStatus('${p.id}')" title="Reset Status to Verified" style="color:var(--ink-main); border-color:rgba(255,255,255,0.2); margin-right: 4px;">↻</button>
          <button class="btn-mini" onclick="deleteAttendee('${p.id}')" title="Delete Registration" style="color:var(--accent-red); border-color:rgba(255,90,54,0.2);">✕</button>
        </td>
      </tr>
    `;
  }).join('');
};

window.resetAttendeeStatus = async (id) => {
  const success = await updateRegistrationStatus(id, 'VERIFIED');
  if (success) {
    window.showToast('Status reset to Verified', 'success');
    const data = await loadAllData();
    if (data) window.renderAttendees(data.registrations);
  } else {
    window.showToast('Failed to reset status', 'error');
  }
};

window.deleteAttendee = async (id) => {
  const confirmed = await window.showConfirm(
    'Are you sure you want to delete this registration? This cannot be undone.',
    'Delete Registration',
    'DELETE'
  );
  if (!confirmed) return;

  const success = await deleteItem('registrations', id);
  if (success) {
    window.showToast('Registration deleted successfully', 'success');
    const data = await loadAllData();
    if (data) window.renderAttendees(data.registrations);
  } else {
    window.showToast('Failed to delete registration', 'error');
  }
};

window.exportAttendees = () => {
  const table = document.getElementById('attendee-table');
  if (!table) return;

  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0 || rows[0].innerText.includes('No registrations')) {
    window.showToast('No data to export', 'info');
    return;
  }

  const data = rows.map(row => {
    const cells = row.querySelectorAll('td');
    return {
      name:        cells[0]?.innerText,
      company:     cells[1]?.innerText,
      designation: cells[2]?.innerText,
      email:       cells[3]?.innerText,
      mobile:      cells[4]?.innerText,
      linkedin:    cells[5]?.querySelector('a')?.href || cells[5]?.innerText || '—',
      registered:  cells[6]?.innerText,
      status:      cells[7]?.innerText
    };
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `elevate_attendees_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  window.showToast('Exported registration database', 'success');
};
