/**
 * ELEVATE QA 2026 - ADMIN SUPABASE ADAPTER
 * Handles all database operations for the Admin Portal.
 *
 * IMAGE STRATEGY:
 *   All images are uploaded to Supabase Storage (bucket: elevate-media).
 *   Only the resulting public CDN URL is stored in the database.
 */
import { supabase } from './supabase-config.js';

// ─── STORAGE UPLOAD ──────────────────────────────────────────────────────────
export async function uploadImageToStorage(file, path) {
  if (!file) return null;
  console.log(`[Supabase Storage] Uploading → ${path}`);

  const { data, error } = await supabase.storage
    .from('elevate-media')
    .upload(path, file, {
      upsert: true,
      contentType: file.type
    });

  if (error) {
    console.error('[Supabase Storage] Upload Error:', error.message, error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('elevate-media')
    .getPublicUrl(data.path);

  console.log('[Supabase Storage] Public URL:', urlData.publicUrl);
  return urlData.publicUrl;
}

/** Transform raw DB row (snake_case) → camelCase object for main.js compatibility */
function transformSiteContent(raw) {
  if (!raw) return {};
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
  // Unbundle hero_meta JSON
  if (sc.heroMeta && (typeof sc.heroMeta === 'string' || typeof sc.heroMeta === 'object')) {
    try {
      const extra = (typeof sc.heroMeta === 'string') ? JSON.parse(sc.heroMeta) : sc.heroMeta;
      Object.assign(sc, extra);
      if (extra.heroMetaText) sc.heroMeta = extra.heroMetaText;
    } catch(e) {}
  }
  return sc;
}

/** Transform Branding DB row → visuals object */
function transformBranding(raw) {
  if (!raw) return {};
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

export async function loadAllData() {
  console.log('[ElevateAdmin] Initializing failsafe data fetch...');
  
  const fetchTable = async (table, options = {}) => {
    try {
      let query = supabase.from(table).select('*');
      if (options.single) query = query.maybeSingle();
      
      const { data, error } = await query;
      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error(`[Supabase] Error fetching ${table}:`, error);
        return options.single ? null : [];
      }
      return data || (options.single ? null : []);
    } catch (e) { 
      console.warn(`[Supabase] Failsafe triggered for ${table}:`, e);
      return options.single ? null : []; 
    }
  };

  const [branding, manifesto, speakers, agenda, site_content, maturity_stages, pillars, registrations] = await Promise.all([
    fetchTable('branding', { single: true }),
    fetchTable('manifesto', { single: true }),
    fetchTable('speakers'),
    fetchTable('agenda'),
    fetchTable('site_content', { single: true }),
    fetchTable('maturity_stages'),
    fetchTable('pillars'),
    fetchTable('registrations')
  ]);

  const combined = transformSiteContent(site_content || {}) || {};
  const visuals = transformBranding(branding || {});

  const combinedSite = {
    ...(site_content || {}),
    ...(branding || {})
  };

  // Explicitly map branding fields onto siteContent returned to UI
  combined.logoUrl = combinedSite.logo_url || combinedSite.logoUrl || '';
  combined.logo_height = combinedSite.logo_height || 48;
  combined.primary_color = combinedSite.primary_color || '#d4ff3a';
  combined.accent_color = combinedSite.accent_color || '#d4ff3a';
  combined.heroBg = combinedSite.hero_bg_url || combinedSite.heroBg || '';
  combined.strip01Img = combinedSite.strip_img_1 || combinedSite.strip01Img || '';
  combined.strip01Cap = (combinedSite.strip_cap_1 !== undefined && combinedSite.strip_cap_1 !== null) ? combinedSite.strip_cap_1 : (combinedSite.strip01Cap || '');
  combined.strip02Img = combinedSite.strip_img_2 || combinedSite.strip02Img || '';
  combined.strip02Cap = (combinedSite.strip_cap_2 !== undefined && combinedSite.strip_cap_2 !== null) ? combinedSite.strip_cap_2 : (combinedSite.strip02Cap || '');
  combined.strip03Img = combinedSite.strip_img_3 || combinedSite.strip03Img || '';
  combined.strip03Cap = (combinedSite.strip_cap_3 !== undefined && combinedSite.strip_cap_3 !== null) ? combinedSite.strip_cap_3 : (combinedSite.strip03Cap || '');
  
  localStorage.setItem('elevate_site_content', JSON.stringify(combined));
  localStorage.setItem('elevate_visuals', JSON.stringify(visuals));
  if (speakers) localStorage.setItem('elevate_speakers', JSON.stringify(speakers));
  if (agenda) {
    agenda.forEach(a => {
      if (a.title && a.title.includes('||')) {
        const parts = a.title.split('||');
        a.title = parts[0] || '';
        a.tag = parts[1] || '';
        a.desc = parts[2] || '';
      } else {
        a.tag = '';
        a.desc = '';
      }
    });
    localStorage.setItem('elevate_agenda', JSON.stringify(agenda));
  }
  if (maturity_stages) localStorage.setItem('elevate_maturity_stages', JSON.stringify(maturity_stages));
  if (pillars) localStorage.setItem('elevate_experience_pillars', JSON.stringify(pillars));
  if (manifesto) localStorage.setItem('elevate_manifesto', JSON.stringify([{ content: manifesto.content || '' }]));

  return {
    siteContent: combined,
    speakers: speakers || [],
    agenda: agenda || [],
    maturity: maturity_stages || [],
    pillars: pillars || [],
    manifesto: manifesto || {},
    registrations: registrations || []
  };
}

export async function saveSiteContent(data) {
  const dbData = {
    id: 1,
    hero_headline: data.heroHeadline,
    hero_tagline: data.heroTagline,
    hero_eyebrow: data.heroEyebrow,
    hero_edition: data.heroEdition,
    event_date: data.eventDate,
    event_venue: data.eventVenue,
    hero_meta: {
      heroMetaText: data.heroMeta,
      heroFormat: data.heroFormat,
      heroAudience: data.heroAudience,
      heroCtaText: data.heroCtaText,
      heroBg: data.heroBg,
      strip01Img: data.strip01Img, strip01Cap: data.strip01Cap,
      strip02Img: data.strip02Img, strip02Cap: data.strip02Cap,
      strip03Img: data.strip03Img, strip03Cap: data.strip03Cap,
      stat1Num: data.stat1Num, stat1Lbl: data.stat1Lbl,
      stat2Num: data.stat2Num, stat2Lbl: data.stat2Lbl,
      stat3Num: data.stat3Num, stat3Lbl: data.stat3Lbl,
      stat4Num: data.stat4Num, stat4Lbl: data.stat4Lbl,
      ticker1: data.ticker1, ticker2: data.ticker2, 
      ticker3: data.ticker3, ticker4: data.ticker4,
      ticker5: data.ticker5, ticker6: data.ticker6,
      ticker7: data.ticker7, ticker8: data.ticker8,
      manifestoSectionNum: data.manifestoSectionNum,
      manifestoPill: data.manifestoPill,
      manifestoAside: data.manifestoAside,
      speakersSectionNum: data.speakersSectionNum,
      speakersSectionTitle: data.speakersSectionTitle,
      speakersIntro: data.speakersIntro,
      involveTitle: data.involveTitle,
      involveCard1Title: data.involveCard1Title, involveCard1Desc: data.involveCard1Desc,
      involveCard2Title: data.involveCard2Title, involveCard2Desc: data.involveCard2Desc,
      involveCard3Title: data.involveCard3Title, involveCard3Desc: data.involveCard3Desc,
      comingTitle: data.comingTitle,
      comingDesc: data.comingDesc,
      comingSectionNum: data.comingSectionNum,
      comingItem1Status: data.comingItem1Status, comingItem2Status: data.comingItem2Status,
      comingItem3Status: data.comingItem3Status, comingItem4Status: data.comingItem4Status,
      comingItem5Status: data.comingItem5Status, comingItem6Status: data.comingItem6Status,
      footerTagline: data.footerTagline,
      footerLocation: data.footerLocation,
      footerEdition: data.footerEdition,
      navManifesto: data.navManifesto,
      navMaturity: data.navMaturity,
      navExperience: data.navExperience,
      navAgenda: data.navAgenda,
      navSpeakers: data.navSpeakers,
      navJoin: data.navJoin,
      modalPriceScarcity: data.modalPriceScarcity,
      modalPriceOld: data.modalPriceOld,
      modalPriceNew: data.modalPriceNew,
      modalPriceCaption: data.modalPriceCaption,
      modalPriceBtn: data.modalPriceBtn,
      modalFormTitle: data.modalFormTitle,
      modalFormDesc: data.modalFormDesc,
      mapSectionNum: data.mapSectionNum,
      maturityTitle: data.maturityTitle,
      experienceSectionNum: data.experienceSectionNum,
      pillarsTitle: data.pillarsTitle,
      prizesHeadline: data.prizesHeadline,
      prizesS1Num: data.prizesS1Num, prizesS1Lbl: data.prizesS1Lbl,
      prizesS2Num: data.prizesS2Num, prizesS2Lbl: data.prizesS2Lbl,
      prizesS3Num: data.prizesS3Num, prizesS3Lbl: data.prizesS3Lbl
    }
  };

  const { error } = await supabase.from('site_content').upsert([dbData]);
  return !error;
}

export async function saveBranding(data) {
  const dbData = {
    id: '00000000-0000-0000-0000-000000000001',
    logo_url: data.logoUrl,
    logo_height: parseInt(data.logoHeight) || 48,
    hero_bg_url: data.heroBg,
    strip_img_1: data.stripImg1, strip_cap_1: data.stripCap1,
    strip_img_2: data.stripImg2, strip_cap_2: data.stripCap2,
    strip_img_3: data.stripImg3, strip_cap_3: data.stripCap3,
    primary_color: data.primaryColor || '#d4ff3a',
    accent_color: data.accentColor || '#d4ff3a'
  };

  console.log('[Supabase] Saving Branding Assets...', dbData);
  const { error } = await supabase.from('branding').upsert([dbData]);
  if (error) {
    console.error('[Supabase] Branding Save Error:', error);
    return false;
  }
  return true;
}

export async function saveManifesto(data) {
  const { error } = await supabase
    .from('manifesto')
    .upsert([{ id: '00000000-0000-0000-0000-000000000001', content: data.content }]);
  return !error;
}

export async function saveSpeaker(s) {
  const dbData = {
    name: s.name || 'Unnamed Speaker',
    role: s.role || '',
    status: s.status || 'CONFIRMED',
    image_url: s.img || '',
    title: s.title || '',
    display_order: s.display_order || 0
  };
  if (s.id && s.id.length > 10) dbData.id = s.id;
  const { error } = await supabase.from('speakers').upsert([dbData]);
  return !error;
}

export async function saveAgendaItem(a) {
  const packedTitle = `${a.title || ''}||${a.tag || ''}||${a.desc || ''}`;
  const dbData = {
    time_slot: a.time || '',
    title: packedTitle,
    display_order: a.display_order || 0
  };
  if (a.id && a.id.length > 10) dbData.id = a.id;
  const { error } = await supabase.from('agenda').upsert([dbData]);
  return !error;
}

export async function saveMaturityStage(m) {
  const dbData = {
    label: m.label || '',
    name: m.name || '',
    pct: m.pct || '',
    description: m.desc || m.description || '',
    color: m.color || '',
    display_order: m.display_order || 0
  };
  if (m.id && m.id.length > 10) dbData.id = m.id;
  const { error } = await supabase.from('maturity_stages').upsert([dbData]);
  return !error;
}

export async function savePillar(item) {
  const dbData = {
    title: item.title || '',
    desc: item.desc || '',
    icon: item.icon || '',
    display_order: item.display_order || 0
  };
  if (item.id && item.id.length > 10) dbData.id = item.id;
  const { error } = await supabase.from('pillars').upsert([dbData]);
  return !error;
}

export async function deleteItem(table, id) {
  if (!id) return true;
  const { error } = await supabase.from(table).delete().eq('id', id);
  return !error;
}

export function getLocalData() {
  const safeParse = (key, defaultVal) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultVal;
    } catch(e) {
      return defaultVal;
    }
  };

  return {
    siteContent: safeParse('elevate_site_content', {}),
    speakers: safeParse('elevate_speakers', []),
    agenda: safeParse('elevate_agenda', []),
    maturity: safeParse('elevate_maturity_stages', []),
    pillars: safeParse('elevate_experience_pillars', []),
    manifesto: safeParse('elevate_manifesto', [{ content: '' }])[0] || {},
    registrations: safeParse('elevate_registrations', [])
  };
}
