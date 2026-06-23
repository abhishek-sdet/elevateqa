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
  if (registrations) {
    window.rawAttendees = registrations;
  }
  const raw = window.rawAttendees || [];
  
  // Get filter inputs
  const globalSearch = (document.getElementById('attendee-search')?.value || '').toLowerCase().trim();
  const nameFilter = (document.getElementById('col-filter-name')?.value || '').toLowerCase().trim();
  const orgFilter = (document.getElementById('col-filter-org')?.value || '').toLowerCase().trim();
  const desigFilter = (document.getElementById('col-filter-desig')?.value || '').toLowerCase().trim();
  const emailFilter = (document.getElementById('col-filter-email')?.value || '').toLowerCase().trim();
  const mobileFilter = (document.getElementById('col-filter-mobile')?.value || '').toLowerCase().trim();
  const statusFilter = (document.getElementById('col-filter-status')?.value || '').toLowerCase().trim();

  let filtered = raw.filter(p => {
    if (globalSearch) {
      const matchText = `${p.name || ''} ${p.company || ''} ${p.designation || ''} ${p.email || ''} ${p.phone || ''}`.toLowerCase();
      if (!matchText.includes(globalSearch)) return false;
    }
    if (nameFilter && !(p.name || '').toLowerCase().includes(nameFilter)) return false;
    if (orgFilter && !(p.company || '').toLowerCase().includes(orgFilter)) return false;
    if (desigFilter && !(p.designation || '').toLowerCase().includes(desigFilter)) return false;
    if (emailFilter && !(p.email || '').toLowerCase().includes(emailFilter)) return false;
    if (mobileFilter && !(p.phone || '').toLowerCase().includes(mobileFilter)) return false;
    if (statusFilter) {
      const status = (p.status || 'verified').toLowerCase();
      if (statusFilter === 'ticket_sent') {
        if (status !== 'ticket_sent' && status !== 'pass sent') return false;
      } else {
        if (status !== statusFilter) return false;
      }
    }
    return true;
  });

  // Sort by created_at descending (recently added at top)
  filtered.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const tbody      = document.getElementById('attendee-table');
  const countBadge = document.getElementById('attendee-count');
  if (!tbody) return;

  if (countBadge) {
    if (raw.length === filtered.length) {
      countBadge.textContent = `${raw.length} registered`;
    } else {
      countBadge.textContent = `${filtered.length} found (${raw.length} total)`;
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 40px; color: var(--ink-dim);">No registrations found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((p) => {
    const qrHtml        = window.generateAdminQR(p);
    const safeName      = (p.name  || '—').replace(/'/g, "\\'");
    const safeEmail     = (p.email || '—').replace(/'/g, "\\'");
    const linkedinLink  = p.linkedin
      ? `<a href="${p.linkedin}" target="_blank" style="color:var(--accent); font-weight:600; text-decoration:none;">LinkedIn ↗</a>`
      : '—';

    const isPresent = (p.status && p.status.toUpperCase() === 'PRESENT');
    const isSent = (p.status && p.status.toUpperCase() === 'TICKET_SENT');
    const isRejected = (p.status && p.status.toUpperCase() === 'REJECTED');
    let badgeHtml = '<span class="badge">Verified</span>';
    if (isPresent) badgeHtml = '<span class="badge" style="background:var(--accent); color:#000;">Present</span>';
    else if (isSent) badgeHtml = '<span class="badge" style="background:#4CAF50; color:#fff; border-color:#4CAF50;">Pass Sent</span>';
    else if (isRejected) badgeHtml = '<span class="badge" style="background:var(--accent-red); color:#fff; border-color:var(--accent-red);">Rejected</span>';
    
    return `
      <tr data-id="${p.id}">
        <td style="text-align: center;"><input type="checkbox" class="attendee-cb" value='${JSON.stringify({id: p.id, name: p.name, email: p.email, company: p.company, designation: p.designation, phone: p.phone, linkedin: p.linkedin}).replace(/'/g, "&#39;")}'></td>
        <td>${p.name  || '—'}</td>
        <td>${p.company     || '—'}</td>
        <td>${p.designation || '—'}</td>
        <td>${p.email || '—'}</td>
        <td>${p.phone || '—'}</td>
        <td>${linkedinLink}</td>
        <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
        <td>${badgeHtml}</td>
        <td class="qr-col" onclick="showPass('${p.id}', '${safeName}', '${safeEmail}')" title="Click to View Pass">${qrHtml}</td>
        <td>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn-mini" onclick="resetAttendeeStatus('${p.id}')" title="Reset Status to Verified" style="color:var(--ink-main); border-color:rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 6px;">↻</button>
            <button class="btn-mini" onclick="deleteAttendee('${p.id}')" title="Delete Registration" style="color:var(--accent-red); border-color:rgba(255,90,54,0.2); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 6px;">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.filterAttendees = () => {
  window.renderAttendees();
};

window.resetAllFilters = () => {
  const ids = ['attendee-search', 'col-filter-name', 'col-filter-org', 'col-filter-desig', 'col-filter-email', 'col-filter-mobile', 'col-filter-status'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  window.renderAttendees();
};

window.toggleAllAttendees = (source) => {
  const checkboxes = document.querySelectorAll('.attendee-cb');
  checkboxes.forEach(cb => cb.checked = source.checked);
};

window.getSelectedAttendees = () => {
  const checkboxes = document.querySelectorAll('.attendee-cb:checked');
  return Array.from(checkboxes).map(cb => JSON.parse(cb.value.replace(/&#39;/g, "'")));
};

window.sendBulkTickets = async () => {
  const selected = window.getSelectedAttendees();
  if (selected.length === 0) return window.showToast('Select at least one attendee.', 'error');
  
  const confirmed = await window.showConfirm(`Are you sure you want to send final passes to ${selected.length} attendees?`, 'Send Final Passes', 'PROCEED');
  if (!confirmed) return;

  const btn = document.getElementById('btn-send-bulk-tickets');
  const prog = document.getElementById('bulk-progress');
  btn.disabled = true;
  prog.style.display = 'block';

  let sent = 0;
  for (const attendee of selected) {
    prog.textContent = `Processing ${sent + 1} / ${selected.length}...`;
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocalhost ? '/.netlify/functions' : 'https://elevateqa.netlify.app/.netlify/functions';
      
      const payload = {
        name: attendee.name,
        email: attendee.email,
        company: attendee.company,
        designation: attendee.designation || '',
        ticketId: 'EQ26-' + String(attendee.id).split('-')[0].toUpperCase(),
        qrData: `ELEVATE-QA:${attendee.id}|${attendee.name}|${attendee.company}`
      };

      const response = await fetch(`${baseUrl}/send-final-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed');
      await updateRegistrationStatus(attendee.id, 'TICKET_SENT');
      sent++;
    } catch(e) {
      console.error('Failed to send to', attendee.email, e);
    }
  }

  prog.textContent = `Done. Sent ${sent} of ${selected.length}`;
  window.showToast(`Sent ${sent} passes.`, 'success');
  btn.disabled = false;
  setTimeout(() => { prog.style.display = 'none'; }, 3000);
  
  // Refresh UI to show updated badges
  const data = await loadAllData();
  if (data && data.registrations) window.renderAttendees(data.registrations);
  setTimeout(() => { prog.style.display = 'none'; }, 3000);
};

window.sendBulkRejections = async () => {
  const selected = window.getSelectedAttendees();
  if (selected.length === 0) return window.showToast('Select at least one attendee.', 'error');
  
  const confirmed = await window.showConfirm(`Are you sure you want to send house full emails to ${selected.length} attendees?`, 'Send Rejections', 'PROCEED');
  if (!confirmed) return;

  const btn = document.getElementById('btn-send-bulk-rejections');
  const prog = document.getElementById('bulk-progress');
  btn.disabled = true;
  prog.style.display = 'block';

  let sent = 0;
  for (const attendee of selected) {
    prog.textContent = `Processing ${sent + 1} / ${selected.length}...`;
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocalhost ? '/.netlify/functions' : 'https://elevateqa.netlify.app/.netlify/functions';
      
      const payload = {
        name: attendee.name,
        email: attendee.email
      };

      const response = await fetch(`${baseUrl}/send-rejection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed');
      await updateRegistrationStatus(attendee.id, 'REJECTED');
      sent++;
    } catch(e) {
      console.error('Failed to send rejection to', attendee.email, e);
    }
  }

  prog.textContent = `Done. Sent ${sent} rejections.`;
  window.showToast(`Sent ${sent} rejection emails.`, 'success');
  btn.disabled = false;
  
  // Refresh UI to show updated badges
  const data = await loadAllData();
  if (data && data.registrations) window.renderAttendees(data.registrations);
  setTimeout(() => { prog.style.display = 'none'; }, 3000);
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

  // Create data array for SheetJS
  const excelData = [];
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 8) return;
    
    excelData.push({
      "Name": cells[1]?.innerText.trim() || '',
      "Company": cells[2]?.innerText.trim() || '',
      "Designation": cells[3]?.innerText.trim() || '',
      "Email": cells[4]?.innerText.trim() || '',
      "Mobile": cells[5]?.innerText.trim() || '',
      "LinkedIn": cells[6]?.querySelector('a')?.href || cells[6]?.innerText.trim() || '',
      "Registered Date": cells[7]?.innerText.trim() || '',
      "Status": cells[8]?.innerText.trim() || ''
    });
  });

  if (typeof XLSX === 'undefined') {
    window.showToast('Excel library is loading, please try again in a few seconds.', 'error');
    return;
  }

  // Generate Excel workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
  
  // Style the header row slightly
  const headerKeys = Object.keys(excelData[0] || {});
  for (let i = 0; i < headerKeys.length; i++) {
    const cellRef = XLSX.utils.encode_cell({r: 0, c: i});
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = { font: { bold: true } };
    }
  }

  // Export and download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `elevate_attendees_${dateStr}.xlsx`);
  
  window.showToast('Exported registration database as Excel format', 'success');
};

window.renderSpeakerApps = (appsList) => {
  if (appsList) {
    window.rawSpeakerApps = appsList;
  }
  const tbody = document.getElementById('speaker-apps-list');
  const countBadge = document.getElementById('speaker-apps-count');
  const emptyState = document.getElementById('speaker-apps-empty');
  const tableContainer = document.querySelector('#sec-speaker-apps .table-container');
  if (!tbody) return;

  const dbApps = window.rawSpeakerApps || [];
  const localApps = JSON.parse(localStorage.getItem('elevate_speaker_apps') || '[]');
  
  // Merge or prefer dbApps, but if empty use localApps as fallback
  const apps = dbApps.length > 0 ? dbApps : localApps;
  
  if (countBadge) countBadge.textContent = `${apps.length} applied`;

  if (apps.length === 0) {
    if (tableContainer) tableContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (tableContainer) tableContainer.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = apps.map((app) => {
    const appKey = app.id || app.email;
    const dateStr = app.created_at ? new Date(app.created_at).toLocaleDateString() : (app.date || new Date().toLocaleDateString());
    return `
      <tr data-id="${app.id || ''}">
        <td>${dateStr}</td>
        <td><strong>${app.name}</strong><br><span style="font-size:11px;color:var(--ink-dim);">${app.email}</span></td>
        <td>${app.company || app.organization || '—'}<br><span style="font-size:11px;color:var(--ink-dim);">${app.designation || '—'}</span></td>
        <td><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${app.topic || 'N/A'}">${app.topic || 'N/A'}</div></td>
        <td>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn-mini" onclick="viewSpeakerApp('${appKey}')" title="View Details" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 6px;">👁</button>
            <button class="btn-mini" onclick="deleteSpeakerApp('${appKey}')" title="Delete Application" style="color:var(--accent-red); border-color:rgba(255,90,54,0.2); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 6px;">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.viewSpeakerApp = (key) => {
  const dbApps = window.rawSpeakerApps || [];
  const localApps = JSON.parse(localStorage.getItem('elevate_speaker_apps') || '[]');
  const apps = dbApps.length > 0 ? dbApps : localApps;
  const app = apps.find(a => a.id === key || a.email === key);
  if (!app) return;

  document.getElementById('sa-name').textContent = app.name || '—';
  document.getElementById('sa-email').textContent = app.email || '—';
  document.getElementById('sa-phone').textContent = app.phone || '—';
  document.getElementById('sa-org').textContent = app.company || app.organization || '—';
  document.getElementById('sa-designation').textContent = app.designation || '—';
  
  const ln = document.getElementById('sa-linkedin');
  if (app.linkedin) {
    ln.href = app.linkedin;
    ln.style.display = 'inline';
    ln.textContent = app.linkedin;
  } else {
    ln.style.display = 'none';
  }

  document.getElementById('sa-topic').textContent = app.topic || '—';
  document.getElementById('sa-bio').textContent = app.bio || '—';
  document.getElementById('sa-date').textContent = app.created_at ? new Date(app.created_at).toLocaleDateString() : (app.date || '—');

  // New fields
  document.getElementById('sa-applicant-info').textContent = app.applicantInfo || 'Individual';
  
  const drive = document.getElementById('sa-drive');
  if (app.driveLink) {
    let dLink = app.driveLink;
    if (!/^https?:\/\//i.test(dLink)) dLink = 'https://' + dLink;
    drive.href = dLink;
    drive.style.display = 'inline';
  } else {
    drive.style.display = 'none';
  }

  const teamContainer = document.getElementById('sa-team-container');
  if (app.applicantInfo === 'Team' && app.teamDetails) {
    teamContainer.style.display = 'block';
    document.getElementById('sa-team').textContent = app.teamDetails;
  } else {
    teamContainer.style.display = 'none';
  }

  document.getElementById('sa-special').textContent = app.specialReq || 'None';

  document.getElementById('speaker-app-modal').style.display = 'flex';
};

window.deleteSpeakerApp = async (key) => {
  const confirmed = await window.showConfirm(
    'Are you sure you want to delete this speaker application? This cannot be undone.',
    'Delete Application',
    'DELETE'
  );
  if (!confirmed) return;

  // If uuid key, delete from Supabase
  if (key && key.includes('-')) {
    const success = await deleteItem('speaker_applications', key);
    if (success) {
      window.showToast('Speaker application deleted successfully', 'success');
      const data = await loadAllData();
      if (data) window.renderSpeakerApps(data.speaker_applications);
    } else {
      window.showToast('Failed to delete speaker application', 'error');
    }
  } else {
    // Fallback to local storage for legacy/local items
    const apps = JSON.parse(localStorage.getItem('elevate_speaker_apps') || '[]');
    const idx = apps.findIndex(a => a.email === key);
    if (idx !== -1) {
      apps.splice(idx, 1);
      localStorage.setItem('elevate_speaker_apps', JSON.stringify(apps));
    }
    window.showToast('Speaker application deleted', 'success');
    window.renderSpeakerApps();
  }
};

window.downloadSpeakerAppsCSV = () => {
  const dbApps = window.rawSpeakerApps || [];
  const localApps = JSON.parse(localStorage.getItem('elevate_speaker_apps') || '[]');
  const apps = dbApps.length > 0 ? dbApps : localApps;

  if (apps.length === 0) {
    window.showToast('No speaker applications to export', 'info');
    return;
  }

  // Create data array for SheetJS
  const excelData = apps.map(app => {
    return {
      "Date": app.created_at ? new Date(app.created_at).toLocaleDateString() : (app.date || new Date().toLocaleDateString()),
      "Name": app.name || '',
      "Email": app.email || '',
      "Phone": app.phone || '',
      "Organization": app.company || app.organization || '',
      "Designation": app.designation || '',
      "Topic": app.topic || '',
      "LinkedIn": app.linkedin || '',
      "Applicant Type": app.applicantInfo || 'Individual',
      "Team Details": app.teamDetails || '',
      "Drive Link": app.driveLink || '',
      "Special Requests": app.specialReq || '',
      "Bio": app.bio || ''
    };
  });

  if (typeof XLSX === 'undefined') {
    window.showToast('Excel library is loading, please try again in a few seconds.', 'error');
    return;
  }

  // Generate Excel workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Speaker_Apps");
  
  // Style the header row slightly
  const headerKeys = Object.keys(excelData[0] || {});
  for (let i = 0; i < headerKeys.length; i++) {
    const cellRef = XLSX.utils.encode_cell({r: 0, c: i});
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = { font: { bold: true } };
    }
  }

  // Export and download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `speaker_applications_${dateStr}.xlsx`);
  
  window.showToast('Exported speaker applications database as Excel format', 'success');
};
