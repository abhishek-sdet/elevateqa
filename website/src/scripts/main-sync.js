/**
 * ELEVATE QA 2026 - MAIN SYNC MODULE (REST API VERSION)
 * Handles synchronization from backend REST API to Local UI.
 * Completely decoupled from database engine and credentials.
 */
import { unpackFields } from './field-pack.js';

function transformSiteContent(rows) {
  const raw = Array.isArray(rows) ? rows[0] : rows;
  if (!raw) return null;

  const sc = {
    heroHeadline: raw.hero_headline || '',
    heroTagline: raw.hero_tagline || '',
    heroEyebrow: raw.hero_eyebrow || '',
    heroEdition: raw.hero_edition || '',
    eventDate: raw.event_date || '',
    eventVenue: raw.event_venue || '',
    heroMeta: raw.hero_meta || '',
    heroFormat: raw.hero_format || '',
    heroAudience: raw.hero_audience || ''
  };

  if (sc.heroMeta && typeof sc.heroMeta === 'string' && sc.heroMeta.startsWith('{')) {
    try {
      const extra = JSON.parse(sc.heroMeta);
      Object.assign(sc, extra);
      sc.heroMeta = extra.heroMetaText || '';
    } catch (e) {}
  } else if (typeof sc.heroMeta === 'object' && sc.heroMeta !== null) {
    const extra = sc.heroMeta;
    Object.assign(sc, extra);
    sc.heroMeta = extra.heroMetaText || '';
  }

  return sc;
}

function transformBranding(rows) {
  const raw = Array.isArray(rows) ? rows[0] : rows;
  if (!raw) return null;

  return {
    logo: raw.logo_url,
    logoHeight: raw.logo_height || 48,
    heroBg: raw.hero_bg_url,
    primaryColor: raw.primary_color,
    strip: [
      { img: raw.strip_img_1, cap: raw.strip_cap_1 },
      { img: raw.strip_img_2, cap: raw.strip_cap_2 },
      { img: raw.strip_img_3, cap: raw.strip_cap_3 }
    ]
  };
}

let syncTimeout = null;
const debouncedSyncEverything = () => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    if (typeof window.syncEverything === 'function') {
      window.syncEverything();
    }
  }, 150);
};

export async function initCloudSync() {
  console.log('[ElevateQA] ⚡ REST API Sync Engine Starting...');

  try {
    const [contentRes, speakersRes, agendaRes] = await Promise.all([
      fetch('/api/site-content'),
      fetch('/api/speakers'),
      fetch('/api/agenda')
    ]);

    if (contentRes.ok) {
      const { site_content, branding, manifesto, maturity_stages, pillars } = await contentRes.json();
      if (site_content) {
        localStorage.setItem('elevate_site_content', JSON.stringify(transformSiteContent(site_content)));
      }
      if (branding) {
        localStorage.setItem('elevate_visuals', JSON.stringify(transformBranding(branding)));
      }
      if (manifesto) {
        localStorage.setItem('elevate_manifesto', JSON.stringify([{ content: manifesto.content }]));
      }
      if (maturity_stages) {
        localStorage.setItem('elevate_maturity_stages', JSON.stringify(maturity_stages));
      }
      if (pillars) {
        localStorage.setItem('elevate_experience_pillars', JSON.stringify(pillars));
      }
    }

    if (speakersRes.ok) {
      const speakers = await speakersRes.json();
      speakers.forEach((s) => {
        if (s.title) {
          const [title, bio, linkedin] = unpackFields(s.title, 3);
          s.title = title; s.bio = bio; s.linkedin = linkedin;
        }
      });
      localStorage.setItem('elevate_speakers', JSON.stringify(speakers));
    }

    if (agendaRes.ok) {
      const agenda = await agendaRes.json();
      agenda.forEach((a) => {
        if (a.title) {
          const [title, tag, desc] = unpackFields(a.title, 3);
          a.title = title; a.tag = tag; a.desc = desc;
        }
      });
      localStorage.setItem('elevate_agenda', JSON.stringify(agenda));
    }

    if (typeof window.syncEverything === 'function') {
      window.syncEverything();
    }
  } catch (err) {
    console.warn('[ElevateQA] REST Sync error, fallback to cache:', err);
  }

  // Periodic background refresh every 30 seconds
  setInterval(async () => {
    try {
      const [contentRes, speakersRes, agendaRes] = await Promise.all([
        fetch('/api/site-content'),
        fetch('/api/speakers'),
        fetch('/api/agenda')
      ]);
      if (contentRes.ok) {
        const { site_content, branding, manifesto, maturity_stages, pillars } = await contentRes.json();
        if (site_content) localStorage.setItem('elevate_site_content', JSON.stringify(transformSiteContent(site_content)));
        if (branding) localStorage.setItem('elevate_visuals', JSON.stringify(transformBranding(branding)));
        if (manifesto) localStorage.setItem('elevate_manifesto', JSON.stringify([{ content: manifesto.content }]));
        if (maturity_stages) localStorage.setItem('elevate_maturity_stages', JSON.stringify(maturity_stages));
        if (pillars) localStorage.setItem('elevate_experience_pillars', JSON.stringify(pillars));
      }
      if (speakersRes.ok) {
        const speakers = await speakersRes.json();
        speakers.forEach((s) => {
          if (s.title) {
            const [title, bio, linkedin] = unpackFields(s.title, 3);
            s.title = title; s.bio = bio; s.linkedin = linkedin;
          }
        });
        localStorage.setItem('elevate_speakers', JSON.stringify(speakers));
      }
      if (agendaRes.ok) {
        const agenda = await agendaRes.json();
        agenda.forEach((a) => {
          if (a.title) {
            const [title, tag, desc] = unpackFields(a.title, 3);
            a.title = title; a.tag = tag; a.desc = desc;
          }
        });
        localStorage.setItem('elevate_agenda', JSON.stringify(agenda));
      }
      debouncedSyncEverything();
    } catch (e) {}
  }, 30000);
}
