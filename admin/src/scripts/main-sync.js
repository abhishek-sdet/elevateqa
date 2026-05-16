/**
 * ELEVATE QA 2026 - MAIN SYNC MODULE
 * Handles Cloud Database listeners and LocalStorage synchronization.
 */

function initCloudSync() {
  console.log('[ElevateQA] ⚡ Sync Engine Starting...');
  
  if (typeof firebase !== 'undefined') {
    try {
      const config = window.firebaseConfig || (typeof firebaseConfig !== 'undefined' ? firebaseConfig : null);
      if (config && !firebase.apps.length) firebase.initializeApp(config);
      
      window.db = firebase.database();
      console.log('[ElevateQA] ✓ Cloud Connection Established');

      let syncTimer;
      const sections = ['site_content', 'agenda', 'speakers', 'visuals', 'settings'];
      
      // Force initial render from local cache to prevent flicker
      if (typeof syncEverything === 'function') {
        console.log('[ElevateQA] Performing initial cache-render...');
        syncEverything();
      }

      sections.forEach(node => {
        window.db.ref(node).on('value', (snap) => {
          const data = snap.val();
          if (data) {
            console.log(`[ElevateQA] Update received: ${node}`, data);
            if (!window._cloudCache) window._cloudCache = {};
            window._cloudCache[node] = data;

            try {
              localStorage.setItem(`elevate_${node}`, JSON.stringify(data));
            } catch(e) {
              console.warn(`[ElevateQA] LocalStorage sync failed for ${node}:`, e);
            }
            
            clearTimeout(syncTimer);
            syncTimer = setTimeout(() => {
              console.log(`[ElevateQA] 🔄 Full UI Synchronization Triggered`);
              if (typeof syncEverything === 'function') {
                syncEverything();
                // Re-observe new dynamic elements for reveal animations
                if (typeof window._observeNewReveal === 'function') {
                  setTimeout(window._observeNewReveal, 100);
                }
              } else {
                console.error('[ElevateQA] syncEverything function not found!');
              }
              
              const shield = document.getElementById('page-shield');
              if (shield) {
                shield.style.opacity = '0';
                setTimeout(() => { shield.style.visibility = 'hidden'; }, 800);
              }
            }, 150);
          }
        }, (err) => {
          console.error(`[ElevateQA] ✗ Node listener error [${node}]:`, err);
        });
      });

    } catch(e) { 
      console.error('[ElevateQA] ✗ Firebase Initialization Error:', e); 
      fallbackToCache();
    }
  } else {
    console.warn('[ElevateQA] ⚠ Firebase SDK not found. Using local cache.');
    fallbackToCache();
  }
}

function fallbackToCache() {
  if (typeof syncEverything === 'function') syncEverything();
  const shield = document.getElementById('page-shield');
  if (shield) {
    shield.style.opacity = '0';
    setTimeout(() => { shield.style.visibility = 'hidden'; }, 800);
  }
}
