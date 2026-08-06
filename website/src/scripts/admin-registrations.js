/**
 * ELEVATE QA — ADMIN REGISTRATIONS MODULE
 * =========================================
 * Contains: renderAttendees, deleteAttendee, exportAttendees, showPass, generateAdminQR,
 *           resetAttendeeStatus, revokeAttendeePresent
 * Extracted from admin-core.js for maintainability.
 */
import { deleteItem, loadAllData, updateRegistrationStatus, restoreData, addAttendee, purgeAllRegistrations } from './admin-supabase.js';
import { escapeHtml, jsAttrSafe, safeHttpUrl } from './admin-utils.js';

// ── ADD ATTENDEE MANUALLY ────────────────────────────────────────────────────
window.openAddAttendeeModal = () => {
  ['aa-name', 'aa-email', 'aa-company', 'aa-designation', 'aa-phone', 'aa-linkedin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const errEl = document.getElementById('add-attendee-error');
  if (errEl) errEl.style.display = 'none';
  const modal = document.getElementById('add-attendee-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.scrollTop = 0;
    const card = modal.querySelector('.manager-card');
    if (card) card.scrollTop = 0;
  }
};

window.closeAddAttendeeModal = () => {
  const modal = document.getElementById('add-attendee-modal');
  if (modal) modal.style.display = 'none';
};

window.submitAddAttendee = async () => {
  const name = document.getElementById('aa-name').value.trim();
  const email = document.getElementById('aa-email').value.trim();
  const company = document.getElementById('aa-company').value.trim();
  const designation = document.getElementById('aa-designation').value.trim();
  const phone = document.getElementById('aa-phone').value.trim();
  const linkedin = document.getElementById('aa-linkedin').value.trim();
  const errEl = document.getElementById('add-attendee-error');
  const btn = document.getElementById('btn-submit-add-attendee');

  if (!name || !email) {
    if (errEl) { errEl.textContent = 'Name and Email are required.'; errEl.style.display = 'block'; }
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (errEl) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = 'block'; }
    return;
  }

  const alreadyExists = (window.rawAttendees || []).some(p => (p.email || '').toLowerCase() === email.toLowerCase());
  if (alreadyExists) {
    if (errEl) { errEl.textContent = 'An attendee with this email is already registered.'; errEl.style.display = 'block'; }
    return;
  }

  if (errEl) errEl.style.display = 'none';
  const defaultLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Adding...';

  const result = await addAttendee({ name, email, company, designation, phone, linkedin });

  btn.disabled = false;
  btn.innerHTML = defaultLabel;

  if (!result) {
    if (errEl) { errEl.textContent = 'Failed to add attendee. Please try again.'; errEl.style.display = 'block'; }
    return;
  }

  window.closeAddAttendeeModal();
  window.showToast(`${name} added to the attendee list.`, 'success', 'Attendee Added');

  const data = await loadAllData();
  if (data && data.registrations) window.renderAttendees(data.registrations);
};

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
  
  // Get all column filters
  const fName = document.getElementById('col-filter-name') ? document.getElementById('col-filter-name').value.toLowerCase().trim() : '';
  const fOrg = document.getElementById('col-filter-org') ? document.getElementById('col-filter-org').value.toLowerCase().trim() : '';
  const fDesig = document.getElementById('col-filter-desig') ? document.getElementById('col-filter-desig').value.toLowerCase().trim() : '';
  const fEmail = document.getElementById('col-filter-email') ? document.getElementById('col-filter-email').value.toLowerCase().trim() : '';
  const fMobile = document.getElementById('col-filter-mobile') ? document.getElementById('col-filter-mobile').value.toLowerCase().trim() : '';
  const fStatus = document.getElementById('col-filter-status') ? document.getElementById('col-filter-status').value : '';
  const fRole = document.getElementById('col-filter-role') ? document.getElementById('col-filter-role').value : '';
  const globalSearch = (document.getElementById('attendee-search')?.value || '').toLowerCase().trim();

  // Tab filter is based on window.currentAttendeeTab
  const currentTab = window.currentAttendeeTab || 'all';

  // Sync tab styles with currentTab
  const tabAll = document.getElementById('tab-all');
  const tabPass = document.getElementById('tab-pass');
  const tabSpeaker = document.getElementById('tab-speaker');
  const tabReject = document.getElementById('tab-reject');
  
  if (tabAll && tabPass && tabSpeaker && tabReject) {
    [tabAll, tabPass, tabSpeaker, tabReject].forEach(t => {
      t.style.background = 'var(--bg-3)';
      t.style.color = 'var(--ink)';
    });
    if (currentTab === 'ticket_sent') {
      tabPass.style.background = 'var(--accent)';
      tabPass.style.color = '#000';
    } else if (currentTab === 'speaker') {
      tabSpeaker.style.background = 'var(--accent)';
      tabSpeaker.style.color = '#000';
    } else if (currentTab === 'rejected') {
      tabReject.style.background = 'var(--accent)';
      tabReject.style.color = '#000';
    } else if (currentTab === 'all') {
      tabAll.style.background = 'var(--accent)';
      tabAll.style.color = '#000';
    }
  }

  let filtered = raw.filter(p => {
    if (globalSearch) {
      const matchText = `${p.name || ''} ${p.company || ''} ${p.designation || ''} ${p.email || ''} ${p.phone || ''}`.toLowerCase();
      if (!matchText.includes(globalSearch)) return false;
    }
    if (fName && !(p.name || '').toLowerCase().includes(fName)) return false;
    if (fOrg && !(p.company || '').toLowerCase().includes(fOrg)) return false;
    if (fDesig && !(p.designation || '').toLowerCase().includes(fDesig)) return false;
    if (fEmail && !(p.email || '').toLowerCase().includes(fEmail)) return false;
    if (fMobile && !(p.phone || '').toLowerCase().includes(fMobile)) return false;
    
    const status = (p.status || 'verified').toLowerCase();
    const role = p.role || 'Attendee';
    const isSpecialRole = ['Keynote', 'Speaker', 'Panelist', 'Organiser', 'Chief Guest'].includes(role);

    // 1. Tab Level Filtering
    if (currentTab === 'speaker') {
      // Must have special role OR legacy speaker status
      if (!isSpecialRole && status !== 'speaker') return false;
    } else if (currentTab === 'ticket_sent') {
      if (isSpecialRole) return false;
      if (status !== 'ticket_sent' && status !== 'pass sent') return false;
    } else if (currentTab === 'rejected') {
      if (status !== 'rejected') return false;
    } else {
      // 'all' tab: exclude those in special tabs
      if (isSpecialRole || status === 'ticket_sent' || status === 'pass sent' || status === 'speaker' || status === 'rejected') {
        return false;
      }
    }

    // 3. Status Column filter
    if (fStatus) {
      if (fStatus === 'ticket_sent' && (status !== 'ticket_sent' && status !== 'pass sent')) return false;
      if (fStatus !== 'ticket_sent' && status !== fStatus) return false;
    }

    // 4. Role Column filter
    if (fRole) {
      if (role.toLowerCase() !== fRole.toLowerCase()) return false;
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
  const presentBadgeAttendee = document.getElementById('present-count-attendee');
  const presentBadgeSpeaker = document.getElementById('present-count-speaker');
  if (!tbody) return;

  if (countBadge) {
    const totalPassSent = raw.filter(p => p.status && (p.status.toLowerCase() === 'ticket_sent' || p.status.toLowerCase() === 'pass sent')).length;
    const totalRejected = raw.filter(p => p.status && p.status.toLowerCase() === 'rejected').length;
    const extras = ` • ${totalPassSent} Pass Sent • ${totalRejected} Rejected`;

    if (raw.length === filtered.length) {
      countBadge.textContent = `${raw.length} total${extras}`;
    } else {
      countBadge.textContent = `${filtered.length} found (${raw.length} total)${extras}`;
    }
  }
  
  // Update Tab Counts
  const isSpecialRoleGlobal = role => ['Keynote', 'Speaker', 'Panelist', 'Organiser', 'Chief Guest'].includes(role || 'Attendee');
  
  const countAll = raw.length;
  const countSpeaker = raw.filter(p => isSpecialRoleGlobal(p.role)).length;
  const countPass = raw.filter(p => {
    if (isSpecialRoleGlobal(p.role)) return false;
    const status = (p.status || '').toLowerCase();
    return status === 'ticket_sent' || status === 'pass sent';
  }).length;
  const countReject = raw.filter(p => (p.status || '').toLowerCase() === 'rejected').length;

  const tabAllBtn = document.getElementById('tab-all');
  const tabPassBtn = document.getElementById('tab-pass');
  const tabSpeakerBtn = document.getElementById('tab-speaker');
  const tabRejectBtn = document.getElementById('tab-reject');
  
  if (tabAllBtn) tabAllBtn.textContent = `All List (${countAll})`;
  if (tabPassBtn) tabPassBtn.textContent = `Final Pass Sent (${countPass})`;
  if (tabSpeakerBtn) tabSpeakerBtn.textContent = `Speakers / Keynotes (${countSpeaker})`;
  if (tabRejectBtn) tabRejectBtn.textContent = `House Full Sent (${countReject})`;

  const scannedBadgeTotal = document.getElementById('scanned-count-total');
  const badgeCountAttendee = document.getElementById('badge-count-attendee');
  const badgeCountSpeaker = document.getElementById('badge-count-speaker');

  if (scannedBadgeTotal && badgeCountAttendee && badgeCountSpeaker) {
    const isSpecialRole = role => ['Keynote', 'Speaker', 'Panelist', 'Organiser', 'Chief Guest'].includes(role || 'Attendee');
    
    // Scanned includes both 'PRESENT' and 'BADGE_GIVEN'
    const totalScanned = raw.filter(p => p.status && (p.status.toUpperCase() === 'PRESENT' || p.status.toUpperCase() === 'BADGE_GIVEN')).length;
    
    // Badge Given counts only 'BADGE_GIVEN'
    const badgeAttendees = raw.filter(p => p.status && p.status.toUpperCase() === 'BADGE_GIVEN' && !isSpecialRole(p.role)).length;
    const badgeSpeakers = raw.filter(p => p.status && p.status.toUpperCase() === 'BADGE_GIVEN' && isSpecialRole(p.role)).length;
    
    scannedBadgeTotal.textContent = `${totalScanned} Scanned`;
    badgeCountAttendee.textContent = `${badgeAttendees} Attendee Badge`;
    badgeCountSpeaker.textContent = `${badgeSpeakers} Speaker Badge`;
    
    if (badgeAttendees >= 200) {
      badgeCountAttendee.style.background = 'var(--accent-red)';
      badgeCountAttendee.style.color = '#fff';
      badgeCountAttendee.style.borderColor = 'var(--accent-red)';
    } else {
      badgeCountAttendee.style.background = 'var(--accent)';
      badgeCountAttendee.style.color = '#000';
      badgeCountAttendee.style.borderColor = 'var(--accent)';
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding: 40px; color: var(--ink-dim);">No registrations found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((p) => {
    const qrHtml        = window.generateAdminQR(p);
    const safeName      = jsAttrSafe(p.name  || '—');
    const safeEmail     = jsAttrSafe(p.email || '—');
    const safeLinkedinUrl = safeHttpUrl(p.linkedin);
    const linkedinLink  = safeLinkedinUrl
      ? `<a href="${escapeHtml(safeLinkedinUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-weight:600; text-decoration:none;">LinkedIn ↗</a>`
      : '—';

    const isBadgeGiven = (p.status && p.status.toUpperCase() === 'BADGE_GIVEN');
    const isPresent = (p.status && p.status.toUpperCase() === 'PRESENT') || isBadgeGiven;
    const isSent = (p.status && p.status.toUpperCase() === 'TICKET_SENT');
    const isSpeaker = (p.status && p.status.toUpperCase() === 'SPEAKER');
    const isRejected = (p.status && p.status.toUpperCase() === 'REJECTED');
    let badgeHtml = '<span class="badge">Verified</span>';
    if (isBadgeGiven) badgeHtml = '<span class="badge" style="background:#2196F3; color:#fff; border-color:#2196F3;">Badge Given</span>';
    else if (isPresent) badgeHtml = `
      <div style="display: flex; gap: 6px; align-items: center;">
        <span class="badge" style="background:var(--accent); color:#000;">Present</span>
        <button class="btn-mini" onclick="window.markBadgeGiven('${p.id}')" title="Mark Badge Given" style="background:#2196F3; color:#fff; border-color:#2196F3; font-size: 10px; padding: 4px 8px; border-radius: 4px; font-weight: bold; line-height: 1; min-width: max-content;">GIVE BADGE</button>
      </div>
    `;
    else if (isSent) badgeHtml = '<span class="badge" style="background:#4CAF50; color:#fff; border-color:#4CAF50;">Pass Sent</span>';
    else if (isSpeaker) badgeHtml = '<span class="badge" style="background:#9C27B0; color:#fff; border-color:#9C27B0;">Speaker</span>';
    else if (isRejected) badgeHtml = '<span class="badge" style="background:var(--accent-red); color:#fff; border-color:var(--accent-red);">Rejected</span>';
    
    const roleOptions = ['Attendee', 'Keynote', 'Speaker', 'Panelist', 'Organiser', 'Chief Guest'];
    const currentRole = p.role || 'Attendee';
    const roleBadgeHtml = `
      <select onchange="window.updateAttendeeRoleInline('${p.id}', this.value)" style="background: var(--bg-3); border: 1px solid var(--line-strong); border-radius: 4px; color: var(--ink); font-size: 11px; padding: 4px; width: 100%; min-width: 90px;">
        ${roleOptions.map(r => `<option value="${r}" ${r === currentRole ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
    `;

    return `
      <tr data-id="${p.id}">
        <td style="text-align: center;"><input type="checkbox" class="attendee-cb" value='${JSON.stringify({id: p.id, name: p.name, email: p.email, company: p.company, designation: p.designation, phone: p.phone, linkedin: p.linkedin}).replace(/&/g, "&amp;").replace(/'/g, "&#39;")}'></td>
        <td>${escapeHtml(p.name  || '—')}</td>
        <td>${badgeHtml}</td>
        <td>${roleBadgeHtml}</td>
        <td>${escapeHtml(p.company     || '—')}</td>
        <td>${escapeHtml(p.designation || '—')}</td>
        <td>${escapeHtml(p.email || '—')}</td>
        <td>${escapeHtml(p.phone || '—')}</td>
        <td>${linkedinLink}</td>
        <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
        <td class="qr-col" onclick="showPass('${p.id}', '${safeName}', '${safeEmail}')" title="Click to View Pass">${qrHtml}</td>
        <td>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            ${(isPresent && !isBadgeGiven) ? `<button class="btn-mini" onclick="window.markBadgeGiven('${p.id}')" title="Mark Badge Given" style="background:#2196F3; color:#fff; border-color:#2196F3; display: flex; align-items: center; justify-content: center; height: 28px; padding: 0 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">GIVE BADGE</button>` : ''}
            ${(!isPresent && !isBadgeGiven) ? `<button class="btn-mini" onclick="markAttendeePresent('${p.id}')" title="Mark as Present" style="color:var(--accent); border-color:rgba(212,255,58,0.3); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 6px; font-weight: bold;">✓</button>` : ''}
            ${isPresent ? `<button class="btn-mini" onclick="revokeAttendeePresent('${p.id}')" title="Revoke Check-in (back to Pass Sent)" style="color:var(--accent); border-color:rgba(212,255,58,0.3); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 6px;">↩</button>` : ''}
            <button class="btn-mini" onclick="resetAttendeeStatus('${p.id}')" title="Reset Status to Verified" style="color:var(--ink-main); border-color:rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 6px;">↻</button>
            <button class="btn-mini" onclick="deleteAttendee('${p.id}')" title="Delete Registration" style="color:var(--accent-red); border-color:rgba(255,90,54,0.2); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border-radius: 6px;">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.setTabFilter = (tabName) => {
  window.currentAttendeeTab = tabName || 'all';
  const statusSelect = document.getElementById('col-filter-status');
  if (statusSelect) statusSelect.value = '';
  const roleSelect = document.getElementById('col-filter-role');
  if (roleSelect) roleSelect.value = '';
  
  // Immediately update tab styles so the user sees they clicked it
  const tabAll = document.getElementById('tab-all');
  const tabPass = document.getElementById('tab-pass');
  const tabSpeaker = document.getElementById('tab-speaker');
  const tabReject = document.getElementById('tab-reject');
  
  if (tabAll && tabPass && tabSpeaker && tabReject) {
    [tabAll, tabPass, tabSpeaker, tabReject].forEach(t => {
      t.style.background = 'var(--bg-3)';
      t.style.color = 'var(--ink)';
    });
    if (tabName === 'ticket_sent') {
      tabPass.style.background = 'var(--accent)';
      tabPass.style.color = '#000';
    } else if (tabName === 'speaker') {
      tabSpeaker.style.background = 'var(--accent)';
      tabSpeaker.style.color = '#000';
    } else if (tabName === 'rejected') {
      tabReject.style.background = 'var(--accent)';
      tabReject.style.color = '#000';
    } else if (tabName === 'all' || !tabName) {
      tabAll.style.background = 'var(--accent)';
      tabAll.style.color = '#000';
    }
  }

  // Show a loading indicator in the table body
  const tbody = document.getElementById('attendee-table');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding: 40px; color: var(--ink-dim);">Loading...</td></tr>';
  }

  // Yield to the browser for repainting the tab styles
  setTimeout(() => {
    window.filterAttendees();
  }, 10);
};

let filterTimeout;
window.debouncedFilterAttendees = () => {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(() => {
    window.renderAttendees();
  }, 300);
};

window.filterAttendees = () => {
  window.renderAttendees();
};

window.resetAllFilters = () => {
  const ids = ['attendee-search', 'col-filter-name', 'col-filter-org', 'col-filter-desig', 'col-filter-email', 'col-filter-mobile', 'col-filter-status', 'col-filter-role'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  window.currentAttendeeTab = 'all';
  window.filterAttendees();
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
  const defaultLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';
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
        qrData: `ELEVATE-QA:${attendee.id}|${attendee.name}|${attendee.email}`
      };

      const response = await fetch(`${baseUrl}/send-final-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": sessionStorage.getItem('admin_token') || '' },
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
  btn.innerHTML = '✓ Sent!';
  window.showToast(`Sent ${sent} passes.`, 'success');
  btn.disabled = false;
  setTimeout(() => { prog.style.display = 'none'; btn.innerHTML = defaultLabel; }, 3000);

  // Refresh UI to show updated badges
  const data = await loadAllData();
  if (data && data.registrations) window.renderAttendees(data.registrations);
};

window.sendBulkRejections = async () => {
  const selected = window.getSelectedAttendees();
  if (selected.length === 0) return window.showToast('Select at least one attendee.', 'error');
  
  const confirmed = await window.showConfirm(`Are you sure you want to send house full emails to ${selected.length} attendees?`, 'Send Rejections', 'PROCEED');
  if (!confirmed) return;

  const btn = document.getElementById('btn-send-bulk-rejections');
  const prog = document.getElementById('bulk-progress');
  const defaultLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';
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
  btn.innerHTML = '✓ Sent!';
  window.showToast(`Sent ${sent} rejection emails.`, 'success');
  btn.disabled = false;
  setTimeout(() => { prog.style.display = 'none'; btn.innerHTML = defaultLabel; }, 3000);

  // Refresh UI to show updated badges
  const data = await loadAllData();
  if (data && data.registrations) window.renderAttendees(data.registrations);
};

// "Send Entry Reminder" (Bulk Actions bar). Deliberately does NOT attach a
// QR code — each attendee's QR is unique to their registration, so a single
// attached file would hand everyone the SAME (wrong) code. This just points
// people back to the QR already in their earlier "Final Passes" email, using
// whatever copy is saved in the Entry/QR email template.
window.sendBulkEntryReminder = async () => {
  const selected = window.getSelectedAttendees();
  if (selected.length === 0) return window.showToast('Select at least one attendee.', 'error');

  const confirmed = await window.showConfirm(`Send the entry/QR reminder email to ${selected.length} attendees?`, 'Send Entry Reminder', 'PROCEED');
  if (!confirmed) return;

  const tpl = (window._lastLoadedData && window._lastLoadedData.site_content && window._lastLoadedData.site_content.emailTemplates && window._lastLoadedData.site_content.emailTemplates.entry) || {};
  const subject = tpl.subject || 'ElevateQA 2026: Keep Your Entry QR Code Handy';
  const body1 = tpl.body1 || "Hi {{Name}},\n\nWe're just days away from ElevateQA 2026, and we can't wait to welcome you on August 8 at Crowne Plaza, New Delhi!\n\nA quick but important reminder about entry on the day: the QR code from your registration confirmation email is your official pass into the venue.";
  const body2 = tpl.body2 || "To help us keep the check-in line moving quickly, please:\n- Keep your registration email (with your QR code) easily accessible on your phone before you arrive.\n- We'd also recommend taking a screenshot as a backup, just in case of any network hiccups at the venue.\n- Turn your screen brightness up when you reach the desk — this helps our scanners read the code instantly.\n- Please avoid forwarding or re-screenshotting a compressed image, as this can sometimes affect scan quality.\n\nIf you're unable to locate your QR code before the event, reach out to us at elevateqa@sdettech.com and we'll get it to you.";
  const closing = tpl.closing || 'See you there — safe travels, and get ready for a great day ahead!';
  const message = [body1, body2, closing].filter(Boolean).join('\n\n');

  const btn = document.getElementById('btn-send-bulk-entry-reminder');
  const prog = document.getElementById('bulk-progress');
  const defaultLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';
  prog.style.display = 'block';

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = isLocalhost ? '/.netlify/functions' : 'https://elevateqa.netlify.app/.netlify/functions';
  const CHUNK_SIZE = 5;
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  let sent = 0;

  for (let i = 0; i < selected.length; i += CHUNK_SIZE) {
    if (i > 0) await sleep(1200);
    const chunk = selected.slice(i, i + CHUNK_SIZE);
    prog.textContent = `Processing ${Math.min(i + CHUNK_SIZE, selected.length)} / ${selected.length}...`;
    try {
      const response = await fetch(`${baseUrl}/send-custom-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': sessionStorage.getItem('admin_token') || '' },
        body: JSON.stringify({
          subject,
          message,
          targetEmails: chunk.map(a => ({ email: a.email, name: a.name })),
          ccEmails: [],
          bccEmails: [],
          attachments: []
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed');
      sent += result.successCount ?? chunk.length;
    } catch (e) {
      console.error('[sendBulkEntryReminder] batch failed:', e);
    }
  }

  prog.textContent = `Done. Sent ${sent} of ${selected.length}`;
  btn.innerHTML = '✓ Sent!';
  window.showToast(`Sent ${sent} entry reminder email(s).`, 'success');
  btn.disabled = false;
  setTimeout(() => { prog.style.display = 'none'; btn.innerHTML = defaultLabel; }, 3000);
};

window.openAssignRoleModal = () => {
  const selected = window.getSelectedAttendees();
  if (selected.length === 0) return window.showToast('Select at least one attendee.', 'error');
  document.getElementById('assign-role-select').value = 'Attendee';
  document.getElementById('assign-role-modal').style.display = 'flex';
};

window.sendBulkAssignRole = async () => {
  const selected = window.getSelectedAttendees();
  if (selected.length === 0) return;
  
  const role = document.getElementById('assign-role-select').value;
  
  const btn = document.getElementById('btn-submit-assign-role');
  const prog = document.getElementById('bulk-progress');
  const defaultLabel = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  prog.style.display = 'block';

  let updated = 0;
  // Use updateRegistrationRole from admin-supabase.js
  const { updateRegistrationRole } = await import('./admin-supabase.js');

  for (const attendee of selected) {
    prog.textContent = `Processing ${updated + 1} / ${selected.length}...`;
    try {
      await updateRegistrationRole(attendee.id, role);
      updated++;
    } catch(e) {
      console.error('Failed to update role for', attendee.email, e);
    }
  }

  prog.textContent = `Done. Updated ${updated} roles.`;
  btn.innerHTML = '✓ Saved!';
  window.showToast(`Updated roles for ${updated} attendees.`, 'success');
  btn.disabled = false;
  setTimeout(() => { 
    prog.style.display = 'none'; 
    btn.innerHTML = defaultLabel; 
    document.getElementById('assign-role-modal').style.display = 'none';
  }, 1500);

  // Refresh UI
  const { loadAllData } = await import('./admin-supabase.js');
  const data = await loadAllData();
  if (data && data.registrations) window.renderAttendees(data.registrations);
};

window.updateAttendeeRoleInline = async (id, role) => {
  const { updateRegistrationRole, loadAllData } = await import('./admin-supabase.js');
  try {
    const success = await updateRegistrationRole(id, role);
    if (!success) throw new Error("Database update failed (Check if 'role' column exists in Supabase)");
    
    window.showToast(`Role updated to ${role}`, 'success');
    
    const data = await loadAllData();
    if (data && data.registrations) window.renderAttendees(data.registrations);
  } catch(e) {
    console.error('Failed to update inline role', e);
    window.showToast('Failed to update role', 'error');
  }
};

window.markBadgeGiven = async (id) => {
  const { supabase } = await import('./supabase-config.js');
  const { loadAllData } = await import('./admin-supabase.js');
  try {
    const { error } = await supabase.from('registrations').update({ status: 'BADGE_GIVEN' }).eq('id', id);
    if (error) throw error;
    window.showToast('Badge Marked as Given', 'success');
    const data = await loadAllData();
    if (data && data.registrations) window.renderAttendees(data.registrations);
  } catch(e) {
    console.error('Failed to mark badge', e);
    window.showToast('Failed to mark badge', 'error');
  }
};

window.openBulkEmailModal = () => {
  const selected = window.getSelectedAttendees();
  if (selected.length === 0) {
    return window.showToast('Select at least one attendee to send an email.', 'error');
  }
  document.getElementById('bulk-email-subject').value = '';
  document.getElementById('bulk-email-message').value = '';
  document.getElementById('bulk-email-error').style.display = 'none';
  document.getElementById('bulk-email-modal').style.display = 'flex';
};

window.sendBulkEmail = async () => {
  const selected = window.getSelectedAttendees();
  if (selected.length === 0) return;

  const subject = document.getElementById('bulk-email-subject').value.trim();
  const message = document.getElementById('bulk-email-message').value.trim();
  const errorEl = document.getElementById('bulk-email-error');

  if (!subject || !message) {
    errorEl.textContent = 'Please enter both a subject and a message.';
    errorEl.style.display = 'block';
    return;
  }
  
  errorEl.style.display = 'none';
  const btn = document.getElementById('btn-submit-bulk-email');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> Sending...';
  btn.disabled = true;

  try {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocalhost ? '/.netlify/functions' : 'https://elevateqa.netlify.app/.netlify/functions';

    // Map attendees to the expected format
    const toList = selected.map(a => ({ name: a.name, email: a.email }));

    const response = await fetch(`${baseUrl}/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subject,
        message: message,
        toList: toList
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send email. Status: ${response.status}`);
    }

    window.showToast(`Successfully sent email to ${selected.length} attendees!`, 'success');
    document.getElementById('bulk-email-modal').style.display = 'none';
  } catch (error) {
    console.error('Bulk email error:', error);
    errorEl.textContent = 'Failed to send emails. Please try again.';
    errorEl.style.display = 'block';
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
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

// Undoes a scanner check-in — puts a 'PRESENT' attendee back to 'TICKET_SENT'
// (Pass Sent) so the same QR code can be scanned again. Meant for testing
// the scanner without needing to delete/re-add the registration each time.
window.revokeAttendeePresent = async (id) => {
  const confirmed = await window.showConfirm("Are you sure you want to revoke this attendee's 'Present' status?", 'Revoke Check-in', 'REVOKE');
  if (!confirmed) return;
  const success = await updateRegistrationStatus(id, 'TICKET_SENT');
  if (success) {
    const data = await loadAllData();
    if (data && data.registrations) window.renderAttendees(data.registrations);
    window.showToast("Attendee status reverted to 'Pass Sent'", "success");
  } else {
    window.showToast("Failed to revoke check-in status", "error");
  }
};

window.markAttendeePresent = async (id) => {
  const confirmed = await window.showConfirm("Manually mark this attendee as PRESENT?", 'Mark Present', 'MARK PRESENT');
  if (!confirmed) return;
  const success = await updateRegistrationStatus(id, 'PRESENT');
  if (success) {
    const data = await loadAllData();
    if (data && data.registrations) window.renderAttendees(data.registrations);
    window.showToast("Attendee manually marked as Present", "success");
  } else {
    window.showToast("Failed to mark attendee as present", "error");
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

// "Clear Attendee List" (Settings tab). Permanently wipes every row in the
// live `registrations` table — this is deleting real event registrations,
// not just clearing a cache, so it's gated by a typed confirmation.
window.purgeAttendees = async () => {
  const confirmed = await window.showConfirm(
    'This will permanently delete ALL registered attendees from the live database. This cannot be undone.',
    'Clear Attendee List',
    'PURGE'
  );
  if (!confirmed) return;

  const success = await purgeAllRegistrations();
  if (success) {
    window.showToast('All attendee registrations have been purged.', 'success', 'Purged');
    const data = await loadAllData();
    if (data) window.renderAttendees(data.registrations);
  } else {
    window.showToast('Failed to purge attendees. Check console.', 'error');
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
    if (cells.length < 10) return;

    // Row layout (see the row template above): 0 checkbox, 1 name, 2 status,
    // 3 role, 4 company, 5 designation, 6 email, 7 phone, 8 linkedin, 9 date.
    excelData.push({
      "Name": cells[1]?.innerText.trim() || '',
      "Status": cells[2]?.innerText.trim() || '',
      "Role": cells[3]?.querySelector('select')?.value || '',
      "Company": cells[4]?.innerText.trim() || '',
      "Designation": cells[5]?.innerText.trim() || '',
      "Email": cells[6]?.innerText.trim() || '',
      "Mobile": cells[7]?.innerText.trim() || '',
      "LinkedIn": cells[8]?.querySelector('a')?.href || cells[8]?.innerText.trim() || '',
      "Registered Date": cells[9]?.innerText.trim() || ''
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
    const appKey = jsAttrSafe(app.id || app.email);
    const dateStr = app.created_at ? new Date(app.created_at).toLocaleDateString() : (app.date || new Date().toLocaleDateString());
    return `
      <tr data-id="${escapeHtml(app.id || '')}">
        <td>${escapeHtml(dateStr)}</td>
        <td><strong>${escapeHtml(app.name)}</strong><br><span style="font-size:11px;color:var(--ink-dim);">${escapeHtml(app.email)}</span></td>
        <td>${escapeHtml(app.company || app.organization || '—')}<br><span style="font-size:11px;color:var(--ink-dim);">${escapeHtml(app.designation || '—')}</span></td>
        <td><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(app.topic || 'N/A')}">${escapeHtml(app.topic || 'N/A')}</div></td>
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
  const safeLnUrl = safeHttpUrl(app.linkedin);
  if (safeLnUrl) {
    ln.href = safeLnUrl;
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

window.backupDataToJSON = (table) => {
  let data = [];
  if (table === 'registrations') data = window.rawAttendees || [];
  else if (table === 'speaker_applications') data = window.rawSpeakerApps || [];
  
  if (data.length === 0) {
    window.showToast('No data to backup', 'info');
    return;
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `elevate_${table}_backup_${dateStr}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  window.showToast(`Backup downloaded for ${table}`, 'success');
};

window.triggerRestoreJSON = (table) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        if (!Array.isArray(jsonData)) throw new Error('Invalid backup format: Expected an array.');
        
        const confirmed = await window.showConfirm(`Are you sure you want to restore ${jsonData.length} records? This will overwrite existing records with the same ID.`, 'Restore Data', 'RESTORE');
        if (!confirmed) return;

        window.showToast('Restoring data...', 'info');
        const success = await restoreData(table, jsonData);
        
        if (success) {
          window.showToast(`Successfully restored ${jsonData.length} records to ${table}`, 'success');
          const data = await loadAllData();
          if (data) {
            if (table === 'registrations') window.renderAttendees(data.registrations);
            if (table === 'speaker_applications') window.renderSpeakerApps(data.speaker_applications);
          }
        } else {
          window.showToast(`Failed to restore data to ${table}`, 'error');
        }
      } catch (err) {
        console.error('Restore parse error:', err);
        window.showToast('Failed to parse backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};
