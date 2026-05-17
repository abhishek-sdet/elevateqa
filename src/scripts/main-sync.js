/**
 * ELEVATE QA 2026 - MAIN SYNC MODULE (SUPABASE VERSION)
 * Handles Real-time synchronization from Supabase to Local UI.
 */
import { supabase } from './supabase-config.js';

/** Transform raw DB row (snake_case) → camelCase object for main-ui.js */
function transformSiteContent(rows) {
  const raw = Array.isArray(rows) ? rows[0] : rows;
  if (!raw) return null;

  const sc = {
    heroHeadline: raw.hero_headline || '',
    heroTagline:  raw.hero_tagline  || '',
    heroEyebrow:  raw.hero_eyebrow  || '',
    heroEdition:  raw.hero_edition  || '',
    eventDate:    raw.event_date    || '',
    eventVenue:   raw.event_venue   || '',
    heroMeta:     raw.hero_meta     || '',
    heroFormat:   raw.hero_format   || '',
    heroAudience: raw.hero_audience || '',
  };

  // UNBUNDLE JSON extras packed into hero_meta
  if (sc.heroMeta && typeof sc.heroMeta === 'string' && sc.heroMeta.startsWith('{')) {
    try {
      const extra = JSON.parse(sc.heroMeta);
      Object.assign(sc, extra);
      sc.heroMeta = extra.heroMetaText || '';
    } catch(e) {}
  } else if (typeof sc.heroMeta === 'object' && sc.heroMeta !== null) {
      const extra = sc.heroMeta;
      Object.assign(sc, extra);
      sc.heroMeta = extra.heroMetaText || '';
  }

  return sc;
}

/** Transform Branding DB row → visuals object for main-ui.js */
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

export function initCloudSync() {
  console.log('[ElevateQA] ⚡ Supabase Sync Engine Starting...');
  
  // 1. Initial Data Fetch starts immediately
  const orderedTables   = ['speakers', 'agenda', 'maturity_stages', 'pillars'];
  const unorderedTables = ['branding', 'site_content', 'manifesto'];
  const allTables       = [...orderedTables, ...unorderedTables];
  
  allTables.forEach(async (table) => {
    let query = supabase.from(table).select('*');
    if (orderedTables.includes(table)) {
      query = query.order('display_order', { ascending: true, nullsFirst: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[ElevateQA] Error fetching ${table}:`, error);
      return;
    }

    if (data) {
      if (table === 'site_content') {
        const transformed = transformSiteContent(data);
        localStorage.setItem('elevate_site_content', JSON.stringify(transformed));
      } else if (table === 'branding') {
        const transformed = transformBranding(data);
        localStorage.setItem('elevate_visuals', JSON.stringify(transformed));
      } else {
        localStorage.setItem(`elevate_${table}`, JSON.stringify(data));
      }
      if (typeof window.syncEverything === 'function') window.syncEverything();
    }
  });

  // 2. Real-time Subscriptions setup after initial cleanup
  supabase.removeAllChannels().then(() => {
    allTables.forEach((table) => {
      supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table: table }, (payload) => {
          console.log(`[ElevateQA] Real-time update for ${table}:`, payload);
          fetchAndSync(table, orderedTables.includes(table));
        })
        .subscribe();
    });
  });
}

async function fetchAndSync(table, ordered = false) {
  let query = supabase.from(table).select('*');
  if (ordered) {
    query = query.order('display_order', { ascending: true, nullsFirst: false });
  }

  const { data, error } = await query;

  if (data) {
    if (table === 'site_content') {
      const transformed = transformSiteContent(data);
      localStorage.setItem('elevate_site_content', JSON.stringify(transformed));
    } else if (table === 'branding') {
      const transformed = transformBranding(data);
      localStorage.setItem('elevate_visuals', JSON.stringify(transformed));
    } else {
      localStorage.setItem(`elevate_${table}`, JSON.stringify(data));
    }
    if (typeof window.syncEverything === 'function') window.syncEverything();
  }
}
