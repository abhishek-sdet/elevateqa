/**
 * ELEVATE QA 2026 - ADMIN SYNC MODULE
 * Handles all Cloud (Firebase) and LocalStorage synchronization.
 */

// 1. Helper to push to Cloud with status tracking
function syncToCloud(path, data) {
  if (window.db) {
    console.log(`[ElevateQA] ⬆ Attempting sync to path: /${path}...`, { payloadSize: JSON.stringify(data).length });
    
    // Add a safety timeout for large payloads
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sync Timeout')), 15000)
    );

    return Promise.race([
      window.db.ref(path).set(data),
      timeoutPromise
    ])
      .then(() => {
        console.log(`[ElevateQA] ✓ ${path} synced successfully`);
        return true;
      })
      .catch(err => {
        console.error(`[ElevateQA] ✗ ${path} sync failed:`, err);
        if (err.message && err.message.includes('permission_denied')) {
          alert('Database Error: Permission Denied. Please check your Firebase rules (current rules may require authentication).');
        } else if (err.message === 'Sync Timeout') {
          alert(`Sync Timeout: The ${path} data is too large or connection is unstable.`);
        }
        return false;
      });
  } else {
    console.warn(`[ElevateQA] ⚠ Cannot sync ${path}: Database not initialized`);
    return Promise.resolve(false);
  }
}

// 2. Data Loader - Pulls from Cloud and fallbacks to LocalStorage
function loadAllData() {
  console.log('[ElevateQA] Initializing Data Sync...');
  
  const sections = [
    { node: 'site_content', key: 'elevate_site_content', loader: loadSiteContent },
    { node: 'agenda',       key: 'elevate_agenda',       loader: loadAgenda },
    { node: 'speakers',     key: 'elevate_speakers',     loader: loadSpeakers },
    { node: 'visuals',      key: 'elevate_visuals',      loader: loadVisuals },
    { node: 'settings',     key: 'elevate_settings',     loader: loadSettings },
    { node: 'attendees',    key: 'elevate_attendees',    loader: loadAttendees }
  ];

  sections.forEach(sec => {
    // 1. Try Cloud
    if (window.db) {
      window.db.ref(sec.node).once('value', (snap) => {
        const data = snap.val();
        if (data) {
          console.log(`[ElevateQA] Loaded ${sec.node} from Cloud`);
          if (!window._cloudCache) window._cloudCache = {};
          window._cloudCache[sec.node] = data;
          
          try {
            localStorage.setItem(sec.key, JSON.stringify(data));
          } catch(e) { console.warn(`[ElevateQA] Local cache fail for ${sec.node}`); }
          
          if (sec.loader) sec.loader(data);
        } else {
          console.log(`[ElevateQA] No data for ${sec.node} in Cloud, trying local...`);
          // 2. Try LocalStorage
          try {
            const local = JSON.parse(localStorage.getItem(sec.key));
            if (local) {
              console.log(`[ElevateQA] Loaded ${sec.node} from LocalStorage`);
              if (sec.loader) sec.loader(local);
            } else {
              // 3. Final Fallback to Hardcoded Defaults
              if (typeof DEFAULT_ADMIN_DATA !== 'undefined' && DEFAULT_ADMIN_DATA[sec.node]) {
                console.log(`[ElevateQA] Using DEFAULT_ADMIN_DATA for ${sec.node}`);
                if (sec.loader) sec.loader(DEFAULT_ADMIN_DATA[sec.node]);
              }
            }
          } catch(e) { console.warn(`[ElevateQA] Local storage parse error for ${sec.node}`); }
        }
      }, (err) => {
        console.error(`[ElevateQA] ✗ ${sec.node} cloud read failed:`, err);
        // Fallback on error
        const local = JSON.parse(localStorage.getItem(sec.key));
        if (local && sec.loader) sec.loader(local);
      });
    } else {
      // Offline fallback
      try {
        const local = JSON.parse(localStorage.getItem(sec.key));
        if (local && sec.loader) sec.loader(local);
      } catch(e) {}
    }
  });
}

// 3. UI Feedback
function showSavedToast(msg = '✓ Synced to live site') {
  let toast = document.getElementById('save-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'save-toast';
    toast.style.cssText = `
      position: fixed; bottom: 30px; right: 30px;
      background: var(--accent); color: var(--bg);
      padding: 14px 24px; border-radius: 40px;
      font-weight: 700; font-size: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 9999; transform: translateY(100px);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = msg;
  toast.style.transform = 'translateY(0)';
  setTimeout(() => { toast.style.transform = 'translateY(100px)'; }, 3000);
}
