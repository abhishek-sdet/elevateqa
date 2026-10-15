/**
 * ELEVATE QA 2026 - ADMIN API ADAPTER (REST / DECOUPLED)
 * Handles all database and file operations via backend REST API.
 * Completely decoupled from database engine and credentials.
 */
import { packFields, unpackFields } from './field-pack.js';
import { supabase } from './supabase-config.js';

// ─── IMAGE COMPRESSION UTILITY ───────────────────────────────────────────────
async function compressImage(file, maxWidth = 1920, quality = 0.8) {
  if (file.type === 'image/svg+xml') return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
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

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp',
              lastModified: Date.now()
            }));
          } else {
            resolve(file);
          }
        }, 'image/webp', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

// ─── FILE UPLOAD VIA REST ────────────────────────────────────────────────────
export async function uploadImageToStorage(file, path = '', maxWidth = 1920) {
  if (!file) return null;
  try {
    const compressedFile = await compressImage(file, maxWidth);
    const formData = new FormData();
    formData.append('file', compressedFile);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      console.error('[Upload Error]', await res.text());
      return null;
    }

    const data = await res.json();
    return data.url;
  } catch (err) {
    console.error('[Upload Exception]', err);
    return null;
  }
}

function transformSiteContent(raw) {
  if (!raw) return {};
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
  if (sc.heroMeta && (typeof sc.heroMeta === 'string' || typeof sc.heroMeta === 'object')) {
    try {
      const extra = (typeof sc.heroMeta === 'string') ? JSON.parse(sc.heroMeta) : sc.heroMeta;
      Object.assign(sc, extra);
      if (extra.heroMetaText) sc.heroMeta = extra.heroMetaText;
    } catch (e) {}
  }
  return sc;
}

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
  console.log('[ElevateAdmin] Fetching all admin data via REST API...');
  try {
    const res = await fetch('/api/admin/all-data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const {
      branding,
      manifesto,
      speakers,
      agenda,
      site_content: site_content_raw,
      maturity_stages,
      pillars,
      registrations,
      speaker_applications
    } = data;

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

    if (siteContent.heroMeta) {
      try {
        const extra = (typeof siteContent.heroMeta === 'string') ? JSON.parse(siteContent.heroMeta) : siteContent.heroMeta;
        Object.assign(siteContent, extra);
        if (extra.heroMetaText) siteContent.heroMeta = extra.heroMetaText;
      } catch (e) {}
    }

    if (agenda) {
      agenda.forEach((a) => {
        if (a.title) {
          const [title, tag, desc] = unpackFields(a.title, 3);
          a.title = title; a.tag = tag; a.desc = desc;
        }
      });
    }
    if (speakers) {
      speakers.forEach((s) => {
        if (s.title) {
          const [title, bio, linkedin] = unpackFields(s.title, 3);
          s.title = title; s.bio = bio; s.linkedin = linkedin;
        }
      });
    }

    try {
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
    } catch (err) {}

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
  } catch (err) {
    console.error('[Admin loadAllData Error]', err);
    return null;
  }
}

export async function fetchAttendanceUpdates() {
  try {
    const res = await fetch('/api/admin/attendance-updates');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('[Admin fetchAttendanceUpdates Error]', e);
    return { registrations: null, speaker_applications: null };
  }
}

export async function saveSiteContent(data) {
  try {
    const res = await fetch('/api/admin/save-site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heroHeadline: data.heroHeadline,
        heroTagline: data.heroTagline,
        heroEyebrow: data.heroEyebrow,
        heroEdition: data.heroEdition,
        eventDate: data.eventDate,
        eventVenue: data.eventVenue,
        heroFormat: data.heroFormat,
        heroAudience: data.heroAudience,
        hero_meta: {
          heroMetaText: data.heroMeta,
          heroCtaText: data.heroCtaText,
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
      })
    });
    return res.ok;
  } catch (err) {
    console.error('[Save Site Content Error]', err);
    return false;
  }
}

export async function saveBranding(data) {
  try {
    const res = await fetch('/api/admin/save-branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: '00000000-0000-0000-0000-000000000001',
        logo_url: data.logoUrl,
        logo_height: parseInt(data.logoHeight, 10) || 48,
        hero_bg_url: data.heroBg,
        strip_img_1: data.stripImg1, strip_cap_1: data.stripCap1,
        strip_img_2: data.stripImg2, strip_cap_2: data.stripCap2,
        strip_img_3: data.stripImg3, strip_cap_3: data.stripCap3,
        primary_color: data.primaryColor || '#d4ff3a',
        accent_color: data.accentColor || '#d4ff3a'
      })
    });
    return res.ok;
  } catch (err) {
    console.error('[Save Branding Error]', err);
    return false;
  }
}

export async function saveManifesto(data) {
  try {
    const res = await fetch('/api/admin/save-manifesto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: data.content || data.manifesto_lines })
    });
    return res.ok;
  } catch (err) {
    console.error('[Save Manifesto Error]', err);
    return false;
  }
}

function sanitizeId(id) {
  if (!id || id === 'null' || id === 'undefined' || String(id).trim() === '') return null;
  return id;
}

export async function saveSpeaker(s) {
  try {
    const validId = sanitizeId(s.id);
    const body = {
      id: validId,
      name: s.name,
      role: s.role,
      title: packFields(s.title, s.bio, s.linkedin),
      status: s.status,
      image_url: s.img || s.image_url,
      display_order: s.display_order
    };
    const res = await fetch('/api/admin/save-speaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch (err) {
    console.error('[Save Speaker Error]', err);
    return null;
  }
}

export async function saveAgendaItem(a) {
  try {
    const validId = sanitizeId(a.id);
    const body = {
      id: validId,
      time_slot: a.time || a.time_slot,
      title: packFields(a.title, a.tag, a.desc),
      speaker_name: a.speaker_name || a.speaker,
      display_order: a.display_order
    };
    const res = await fetch('/api/admin/save-agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch (err) {
    console.error('[Save Agenda Error]', err);
    return null;
  }
}

export async function saveMaturityStage(item) {
  try {
    const validId = sanitizeId(item.id);
    const body = {
      id: validId,
      name: item.name,
      pct: item.pct,
      desc: item.desc,
      display_order: item.display_order
    };
    const res = await fetch('/api/admin/save-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch (err) {
    console.error('[Save Stage Error]', err);
    return null;
  }
}

export async function savePillar(item) {
  try {
    const validId = sanitizeId(item.id);
    const body = {
      id: validId,
      title: item.title,
      desc: item.desc,
      display_order: item.display_order
    };
    const res = await fetch('/api/admin/save-pillar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch (err) {
    console.error('[Save Pillar Error]', err);
    return null;
  }
}

export async function addAttendee(attendee) {
  try {
    const res = await fetch('/api/admin/attendee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone || null,
        company: attendee.company || null,
        designation: attendee.designation || null,
        linkedin: attendee.linkedin || null,
        status: 'verified'
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Error adding attendee:', err);
    return false;
  }
}

export async function updateRegistrationStatus(id, status) {
  try {
    const res = await fetch('/api/admin/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    return res.ok;
  } catch (err) {
    console.error('Error updating status:', err);
    return false;
  }
}

export async function updateRegistrationRole(id, role) {
  try {
    const res = await fetch('/api/admin/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role })
    });
    return res.ok;
  } catch (err) {
    console.error('Error updating role:', err);
    return false;
  }
}

export async function updateRegistrationField(id, field, value) {
  try {
    const res = await fetch('/api/admin/update-field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, field, value })
    });
    return res.ok;
  } catch (err) {
    console.error(`Error updating ${field}:`, err);
    return false;
  }
}

export async function deleteItem(table, id) {
  try {
    const res = await fetch('/api/admin/delete-row', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id })
    });
    return res.ok;
  } catch (err) {
    console.error('[Delete Item Error]', err);
    return false;
  }
}

export async function purgeAllRegistrations() {
  try {
    const res = await fetch('/api/admin/purge-registrations', {
      method: 'POST'
    });
    return res.ok;
  } catch (err) {
    console.error('[Purge Registrations Error]', err);
    return false;
  }
}

export async function syncTableDeletes(table, domIds) {
  // Gracefully handled via explicit deletions
}

export async function sendMagicLink(email) {
  return true;
}

export async function restoreData(table, dataArray) {
  try {
    const res = await fetch('/api/admin/restore-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, dataArray })
    });
    return res.ok;
  } catch (err) {
    console.error('[Restore Data Error]', err);
    return false;
  }
}

export { supabase };
