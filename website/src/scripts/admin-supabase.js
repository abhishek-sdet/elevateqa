/**
 * ELEVATE QA 2026 - ADMIN SUPABASE ADAPTER
 * Handles all database operations for the Admin Portal.
 */
import { supabase } from './supabase-config.js';

// ─── STORAGE UPLOAD ──────────────────────────────────────────────────────────
/**
 * Uploads a File to the `elevate-media` bucket and returns its public URL.
 * Path example: "speakers/1715678901234_john.png"
 * Returns null on failure.
 */
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
      if (options.order) query = query.order(options.order, { ascending: true });
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (options.single) return (data && data.length > 0) ? data[0] : null;
      return data;
    } catch (e) { 
      console.error(`[Supabase] Fetch error for ${table}:`, e);
      return null; 
    }
  };

  const [branding, manifesto, speakers, agenda, site_content_raw, maturity_stages, pillars, registrations] = await Promise.all([
    fetchTable('branding', { single: true }),
    fetchTable('manifesto', { single: true }),
    fetchTable('speakers', { order: 'display_order' }),
    fetchTable('agenda', { order: 'display_order' }),
    fetchTable('site_content', { single: true }),
    fetchTable('maturity_stages', { order: 'display_order' }),
    fetchTable('pillars', { order: 'display_order' }),
    fetchTable('registrations', { order: 'created_at' })
  ]);

  const combinedSite = {
    ...(site_content_raw || {}),
    ...(branding || {})
  };

  const siteContent = {
    heroHeadline: combinedSite.hero_headline || combinedSite.heroHeadline || combinedSite.headline || '',
    heroTagline: combinedSite.hero_tagline || combinedSite.heroTagline || combinedSite.tagline || '',
    heroEyebrow: combinedSite.hero_eyebrow || combinedSite.heroEyebrow || combinedSite.eyebrow || '',
    heroEdition: combinedSite.hero_edition || combinedSite.heroEdition || combinedSite.edition || '',
    eventDate: combinedSite.event_date || combinedSite.eventDate || combinedSite.date || '',
    eventVenue: combinedSite.event_venue || combinedSite.eventVenue || combinedSite.venue || '',
    heroMeta: combinedSite.hero_meta || '',
    heroFormat: combinedSite.hero_format || combinedSite.heroFormat || '',
    heroAudience: combinedSite.hero_audience || combinedSite.heroAudience || '',
    logoUrl: combinedSite.logo_url || combinedSite.logoUrl || '',
    logoHeight: combinedSite.logo_height || 48,
    heroBg: combinedSite.hero_bg_url || combinedSite.heroBg || '',
    primaryColor: combinedSite.primary_color || combinedSite.primaryColor || '#d4ff3a',
    stripImg1: combinedSite.strip_img_1, stripCap1: combinedSite.strip_cap_1,
    stripImg2: combinedSite.strip_img_2, stripCap2: combinedSite.strip_cap_2,
    stripImg3: combinedSite.strip_img_3, stripCap3: combinedSite.strip_cap_3,
    adminWhitelist: combinedSite.admin_whitelist || []
  };

  // UNPACK JSONB hero_meta
  if (siteContent.heroMeta) {
    try {
      const extra = (typeof siteContent.heroMeta === 'string') ? JSON.parse(siteContent.heroMeta) : siteContent.heroMeta;
      Object.assign(siteContent, extra);
      if (extra.heroMetaText) siteContent.heroMeta = extra.heroMetaText;
    } catch(e) { console.error('[Supabase] hero_meta parse error:', e); }
  }

  try {
    if (agenda) {
      agenda.forEach(a => {
        if (a.title && a.title.includes('||')) {
          const parts = a.title.split('||');
          a.title = parts[0] || '';
          a.tag = parts[1] || '';
          a.desc = parts[2] || '';
        }
      });
    }
    const combined = transformSiteContent(site_content_raw || {});
    const visuals = transformBranding(branding || {});
    
    localStorage.setItem('elevate_site_content', JSON.stringify(combined));
    localStorage.setItem('elevate_visuals', JSON.stringify(visuals));
    if (branding) localStorage.setItem('elevate_branding', JSON.stringify([branding]));
    if (speakers) localStorage.setItem('elevate_speakers', JSON.stringify(speakers));
    if (agenda) localStorage.setItem('elevate_agenda', JSON.stringify(agenda));
    if (maturity_stages) localStorage.setItem('elevate_maturity_stages', JSON.stringify(maturity_stages));
    if (pillars) localStorage.setItem('elevate_experience_pillars', JSON.stringify(pillars));

    if (manifesto) {
      const content = manifesto.content || manifesto.manifesto_lines || '';
      localStorage.setItem('elevate_manifesto', JSON.stringify([{ content }]));
    }
  } catch (err) {
    console.warn('[ElevateAdmin] LocalStorage cache fail:', err);
  }

  return { 
    branding, 
    manifesto, 
    speakers, 
    agenda, 
    site_content: siteContent, 
    maturity_stages, 
    pillars, 
    registrations 
  };
}

export async function saveSiteContent(data) {
  const dbData = {
    id: 1,
    hero_headline: data.heroHeadline,
    hero_tagline:  data.heroTagline,
    hero_eyebrow:  data.heroEyebrow,
    hero_edition:  data.heroEdition,
    event_date:    data.eventDate,
    event_venue:   data.eventVenue,
    hero_format:   data.heroFormat,
    hero_audience: data.heroAudience,
    hero_meta: {
      heroMetaText: data.heroMeta,
      heroCtaText:  data.heroCtaText,
      stat1Num: data.stat1Num, stat1Lbl: data.stat1Lbl,
      stat2Num: data.stat2Num, stat2Lbl: data.stat2Lbl,
      stat3Num: data.stat3Num, stat3Lbl: data.stat3Lbl,
      stat4Num: data.stat4Num, stat4Lbl: data.stat4Lbl,
      ticker1: data.ticker1, ticker2: data.ticker2, ticker3: data.ticker3, ticker4: data.ticker4,
      ticker5: data.ticker5, ticker6: data.ticker6, ticker7: data.ticker7, ticker8: data.ticker8,
      ticker9: data.ticker9,
      manifestoSectionNum: data.manifestoSectionNum,
      manifestoPill: data.manifestoPill,
      manifestoAside: data.manifestoAside,
      mapSectionNum: data.mapSectionNum,
      experienceSectionNum: data.experienceSectionNum,
      agendaSectionNum: data.agendaSectionNum,
      agendaSectionTitle: data.agendaSectionTitle,
      speakersSectionNum: data.speakersSectionNum,
      speakersSectionTitle: data.speakersSectionTitle,
      speakersIntro: data.speakersIntro,
      prizesHeadline: data.prizesHeadline,
      prizesS1Num: data.prizesS1Num, prizesS1Lbl: data.prizesS1Lbl,
      prizesS2Num: data.prizesS2Num, prizesS2Lbl: data.prizesS2Lbl,
      prizesS3Num: data.prizesS3Num, prizesS3Lbl: data.prizesS3Lbl,
      involveSectionNum: data.involveSectionNum,
      involveTitle: data.involveTitle,
      involveCard1Title: data.involveCard1Title, involveCard1Desc: data.involveCard1Desc,
      involveCard1Link: data.involveCard1Link, involveCard1LinkText: data.involveCard1LinkText,
      involveCard2Title: data.involveCard2Title, involveCard2Desc: data.involveCard2Desc,
      involveCard2LinkText: data.involveCard2LinkText,
      involveCard3Title: data.involveCard3Title, involveCard3Desc: data.involveCard3Desc,
      involveCard3LinkText: data.involveCard3LinkText,
      comingSectionNum: data.comingSectionNum,
      comingTitle: data.comingTitle,
      comingDesc: data.comingDesc,
      comingVisualLabel: data.comingVisualLabel,
      comingVisualSub: data.comingVisualSub,
      comingItem1Label: data.comingItem1Label, comingItem1Status: data.comingItem1Status,
      comingItem2Label: data.comingItem2Label, comingItem2Status: data.comingItem2Status,
      comingItem3Label: data.comingItem3Label, comingItem3Status: data.comingItem3Status,
      comingItem4Label: data.comingItem4Label, comingItem4Status: data.comingItem4Status,
      comingItem5Label: data.comingItem5Label, comingItem5Status: data.comingItem5Status,
      comingItem6Label: data.comingItem6Label, comingItem6Status: data.comingItem6Status,
      footerTagline: data.footerTagline,
      footerLocation: data.footerLocation,
      footerEdition: data.footerEdition,
      footerCopyright: data.footerCopyright,
      footerEmail: data.footerEmail,
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
      maturityTitle: data.maturityTitle,
      pillarsTitle: data.pillarsTitle,
      admin_whitelist: data.adminWhitelist || []
    }
  };

  const { error } = await supabase.from('site_content').upsert([dbData]);
  if (error) console.error('[Supabase] Site Content Save Error:', error);
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

  console.log('[Supabase] Syncing Branding Assets...', dbData);
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
    .upsert([{ id: '00000000-0000-0000-0000-000000000001', content: data.content || data.manifesto_lines }]);
  if (error) console.error('[Supabase] Manifesto Save Error:', error);
  return !error;
}

function sanitizeId(id) {
  if (!id || id === 'null' || id === 'undefined' || id.trim() === '') return null;
  return id;
}

export async function saveSpeaker(s) {
  const validId = sanitizeId(s.id);
  const dbData = {
    name: s.name,
    role: s.role,
    title: s.title,
    status: s.status,
    image_url: s.img || s.image_url,
    display_order: s.display_order
  };

  let res;
  if (validId) {
    dbData.id = validId;
    res = await supabase.from('speakers').upsert([dbData]).select('id');
  } else {
    res = await supabase.from('speakers').insert([dbData]).select('id');
  }
  
  if (res.error) {
    console.error('[Supabase] Speaker Save Error:', res.error);
    return null;
  }
  return res.data && res.data[0] ? res.data[0].id : null;
}

export async function saveAgendaItem(a) {
  const validId = sanitizeId(a.id);
  const dbData = {
    time_slot: a.time || a.time_slot,
    title: `${a.title || ''}||${a.tag || ''}||${a.desc || ''}`,
    speaker_name: a.speaker_name || a.speaker,
    display_order: a.display_order
  };

  let res;
  if (validId) {
    dbData.id = validId;
    res = await supabase.from('agenda').upsert([dbData]).select('id');
  } else {
    res = await supabase.from('agenda').insert([dbData]).select('id');
  }
  
  if (res.error) {
    console.error('[Supabase] Agenda Save Error:', res.error);
    return null;
  }
  return res.data && res.data[0] ? res.data[0].id : null;
}

export async function saveMaturityStage(item) {
  const validId = sanitizeId(item.id);
  const dbData = {
    name: item.name,
    pct: item.pct,
    desc: item.desc,
    display_order: item.display_order
  };

  let res;
  if (validId) {
    dbData.id = validId;
    res = await supabase.from('maturity_stages').upsert([dbData]).select('id');
  } else {
    res = await supabase.from('maturity_stages').insert([dbData]).select('id');
  }
  if (res.error) {
    console.error('[Supabase] Maturity Stage Save Error:', res.error);
    return null;
  }
  return res.data && res.data[0] ? res.data[0].id : null;
}

export async function savePillar(item) {
  const validId = sanitizeId(item.id);
  const dbData = {
    title: item.title,
    desc: item.desc,
    display_order: item.display_order
  };

  let res;
  if (validId) {
    dbData.id = validId;
    res = await supabase.from('pillars').upsert([dbData]).select('id');
  } else {
    res = await supabase.from('pillars').insert([dbData]).select('id');
  }
  if (res.error) {
    console.error('[Supabase] Pillar Save Error:', res.error);
    return null;
  }
  return res.data && res.data[0] ? res.data[0].id : null;
}

export async function deleteItem(table, id) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  return !error;
}

export async function syncTableDeletes(table, domIds) {
  const { data } = await supabase.from(table).select('id');
  if (data) {
    const dbIds = data.map(row => String(row.id));
    const safeDomIds = domIds.filter(id => id).map(String);
    const toDelete = dbIds.filter(id => !safeDomIds.includes(id));
    for (const id of toDelete) {
      await deleteItem(table, id);
    }
  }
}

export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  return !error;
}
