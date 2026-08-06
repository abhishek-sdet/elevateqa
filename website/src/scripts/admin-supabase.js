/**
 * ELEVATE QA 2026 - ADMIN SUPABASE ADAPTER
 * Handles all database operations for the Admin Portal.
 */
import { supabase } from './supabase-config.js';
import { packFields, unpackFields } from './field-pack.js';

// ─── IMAGE COMPRESSION UTILITY ───────────────────────────────────────────────
async function compressImage(file, maxWidth = 1920, quality = 0.8) {
  // SVG files should not be compressed via canvas
  if (file.type === 'image/svg+xml') return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(blob => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now()
            }));
          } else {
            resolve(file); // fallback
          }
        }, 'image/webp', quality);
      };
      img.onerror = error => {
        console.warn('Image loading error during compression, using original', error);
        resolve(file);
      };
    };
    reader.onerror = error => {
      console.warn('FileReader error during compression, using original', error);
      resolve(file);
    };
  });
}

// ─── STORAGE UPLOAD ──────────────────────────────────────────────────────────
/**
 * Uploads a File to the `elevate-media` bucket and returns its public URL.
 * Path example: "speakers/1715678901234_john.png"
 * Returns null on failure.
 */
export async function uploadImageToStorage(file, path, maxWidth = 1920) {
  if (!file) return null;
  console.log(`[Supabase Storage] Original size: ${(file.size / 1024).toFixed(2)} KB`);
  
  // Compress image before upload
  const compressedFile = await compressImage(file, maxWidth);
  console.log(`[Supabase Storage] Compressed size: ${(compressedFile.size / 1024).toFixed(2)} KB`);

  // Ensure path has correct extension if converted to webp
  let finalPath = path;
  if (compressedFile.type === 'image/webp' && !finalPath.endsWith('.webp')) {
    finalPath = finalPath.replace(/\.[^/.]+$/, "") + ".webp";
  }

  console.log(`[Supabase Storage] Uploading → ${finalPath}`);

  const { data, error } = await supabase.storage
    .from('elevate-media')
    .upload(finalPath, compressedFile, {
      upsert: true,
      contentType: compressedFile.type,
      cacheControl: '31536000'
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

  const [branding, manifesto, speakers, agenda, site_content_raw, maturity_stages, pillars, registrations, speaker_applications] = await Promise.all([
    fetchTable('branding', { single: true }),
    fetchTable('manifesto', { single: true }),
    fetchTable('speakers', { order: 'display_order' }),
    fetchTable('agenda', { order: 'display_order' }),
    fetchTable('site_content', { single: true }),
    fetchTable('maturity_stages', { order: 'display_order' }),
    fetchTable('pillars', { order: 'display_order' }),
    fetchTable('registrations', { order: 'created_at' }),
    fetchTable('speaker_applications', { order: 'created_at' })
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
    founderImg: combinedSite.founder_img_url || combinedSite.founderImg || '',
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
        if (a.title) {
          const [title, tag, desc] = unpackFields(a.title, 3);
          a.title = title; a.tag = tag; a.desc = desc;
        }
      });
    }
    if (speakers) {
      speakers.forEach(s => {
        if (s.title) {
          const [title, bio, linkedin] = unpackFields(s.title, 3);
          s.title = title; s.bio = bio; s.linkedin = linkedin;
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
    registrations,
    speaker_applications
  };
}

// Lightweight failsafe poll target — the check-in/registration/speaker-app
// poll only ever uses these two tables (see admin-core.js), so it has no
// reason to re-fetch all 9 tables via loadAllData() every cycle. Fetching
// only what's needed lets the poll run much more frequently (a tight safety
// net for the rare case realtime doesn't fire) without hammering Supabase.
export async function fetchAttendanceUpdates() {
  const fetchTable = async (table) => {
    try {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error(`[Supabase] Fetch error for ${table}:`, e);
      return null;
    }
  };
  const [registrations, speaker_applications] = await Promise.all([
    fetchTable('registrations'),
    fetchTable('speaker_applications'),
  ]);
  return { registrations, speaker_applications };
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
      founderImg: data.founderImg,
      mapSectionNum: data.mapSectionNum,
      experienceSectionNum: data.experienceSectionNum,
      agendaSectionNum: data.agendaSectionNum,
      agendaSectionTitle: data.agendaSectionTitle,
      speakersSectionNum: data.speakersSectionNum,
      speakersSectionTitle: data.speakersSectionTitle,
      speakersIntro: data.speakersIntro,
      speakersPlaceholder: data.speakersPlaceholder,
      prizesMessage: data.prizesMessage,
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
      supportEmailAttendee: data.supportEmailAttendee,
      supportEmailPresenter: data.supportEmailPresenter,
      supportEmailGeneral: data.supportEmailGeneral,
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
      maxAttendeeLimit: data.maxAttendeeLimit,
      attendeeRegClosed: data.attendeeRegClosed,
      speakerRegClosed: data.speakerRegClosed,
      admin_whitelist: data.adminWhitelist || [],
      emailTemplates: data.emailTemplates || undefined
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
    title: packFields(s.title, s.bio, s.linkedin),
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
    title: packFields(a.title, a.tag, a.desc),
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

export async function addAttendee(attendee) {
  try {
    const { data, error } = await supabase.from('registrations').insert([{
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone || null,
      company: attendee.company || null,
      designation: attendee.designation || null,
      linkedin: attendee.linkedin || null,
      status: 'verified'
    }]).select();
    if (error) throw error;
    return (data && data.length > 0) ? data[0] : true;
  } catch (err) {
    console.error('Error adding attendee:', err);
    return false;
  }
}

export async function updateRegistrationStatus(id, status) {
  try {
    // .select('id') so we can tell "0 rows matched" (stale id, RLS block) apart
    // from "matched and updated" — Supabase returns error:null in both cases.
    const { data, error } = await supabase.from('registrations').update({ status }).eq('id', id).select('id');
    if (error) throw error;
    return !!(data && data.length > 0);
  } catch (err) {
    console.error('Error updating status:', err);
    return false;
  }
}

export async function updateRegistrationRole(id, role) {
  try {
    const { data, error } = await supabase.from('registrations').update({ role }).eq('id', id).select('id');
    if (error) throw error;
    return !!(data && data.length > 0);
  } catch (err) {
    console.error('Error updating role:', err);
    return false;
  }
}

export async function deleteItem(table, id) {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .select('id');
  if (error) return false;
  return !!(data && data.length > 0);
}

export async function purgeAllRegistrations() {
  const { error } = await supabase.from('registrations').delete().not('id', 'is', null);
  if (error) {
    console.error('[Supabase] Purge registrations error:', error);
    return false;
  }
  return true;
}

export async function syncTableDeletes(table, domIds) {
  const { data, error: fetchError } = await supabase.from(table).select('id');
  if (fetchError) console.error(`[Supabase] Could not fetch existing ${table} rows for delete reconciliation:`, fetchError);
  if (data) {
    const dbIds = data.map(row => String(row.id));
    const safeDomIds = domIds.filter(id => id).map(String);
    const toDelete = dbIds.filter(id => !safeDomIds.includes(id));
    if (toDelete.length > 0) {
      const { error } = await supabase.from(table).delete().in('id', toDelete);
      if (error) console.error(`[Supabase] Batch delete error for ${table}:`, error);
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

export async function restoreData(table, dataArray) {
  if (!dataArray || dataArray.length === 0) return true;
  console.log(`[Supabase] Restoring ${dataArray.length} items to ${table}...`);
  const { error } = await supabase.from(table).upsert(dataArray);
  if (error) {
    console.error(`[Supabase] Restore Error for ${table}:`, error);
    return false;
  }
  return true;
}

export { supabase };
