/**
 * BAKE-CONTENT.MJS — Elevate QA Build Tool
 * ==========================================
 * Bakes initial site content into dist/index.html so it renders instantly
 * without waiting for any initial network roundtrip.
 * Reads directly from local backup / dump (no external Supabase dependency).
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distIndexPath = resolve(__dirname, 'dist', 'index.html');
const dumpPath = resolve(__dirname, '..', 'backend', 'supabase_dump.json');

function transformSiteContent(rows) {
  const raw = Array.isArray(rows) ? rows[0] : rows;
  if (!raw) return null;

  const sc = {
    heroHeadline:   raw.hero_headline   || '',
    heroTagline:    raw.hero_tagline    || '',
    heroEyebrow:    raw.hero_eyebrow    || '',
    heroEdition:    raw.hero_edition    || '',
    heroMeta:       raw.hero_meta       || '',
    heroFormat:     raw.hero_format     || '',
    heroAudience:   raw.hero_audience   || '',
    eventDate:      raw.event_date      || '',
    eventVenue:     raw.event_venue     || '',
  };

  const heroMeta = raw.hero_meta;
  if (heroMeta) {
    try {
      const extra = (typeof heroMeta === 'string') ? JSON.parse(heroMeta) : heroMeta;
      Object.assign(sc, extra);
      sc.heroMeta = extra.heroMetaText || '';
    } catch (_) {}
  }

  return sc;
}

function transformBranding(rows) {
  const raw = Array.isArray(rows) ? rows[0] : rows;
  if (!raw) return null;
  return {
    logo:         raw.logo_url,
    logoHeight:   raw.logo_height || 48,
    heroBg:       raw.hero_bg_url,
    primaryColor: raw.primary_color,
    strip: [
      { img: raw.strip_img_1, cap: raw.strip_cap_1 },
      { img: raw.strip_img_2, cap: raw.strip_cap_2 },
      { img: raw.strip_img_3, cap: raw.strip_cap_3 },
    ],
  };
}

async function bakeContent() {
  console.log('[bake-content] Baking site content from local data...');

  if (!existsSync(distIndexPath)) {
    console.error('[bake-content] ❌ dist/index.html not found.');
    return;
  }

  if (!existsSync(dumpPath)) {
    console.warn('[bake-content] ⚠ supabase_dump.json not found, skipping bake.');
    return;
  }

  const dump = JSON.parse(readFileSync(dumpPath, 'utf8'));
  const bakedData = {};
  let successCount = 0;

  const tables = ['branding', 'site_content', 'manifesto', 'speakers', 'agenda', 'maturity_stages', 'pillars'];

  for (const table of tables) {
    const data = dump[table];
    if (!data || data.length === 0) continue;

    if (table === 'agenda') {
      data.forEach(a => {
        if (a.title && a.title.includes('||')) {
          const parts = a.title.split('||');
          a.title = parts[0] || '';
          a.tag   = parts[1] || '';
          a.desc  = parts[2] || '';
        }
      });
    }

    if (table === 'speakers') {
      data.forEach(s => {
        if (s.title && s.title.includes('||')) {
          const parts = s.title.split('||');
          s.title = parts[0] || '';
          s.bio = parts[1] || '';
          s.linkedin = parts[2] || '';
        }
      });
    }

    if (table === 'site_content') {
      bakedData['elevate_site_content'] = JSON.stringify(transformSiteContent(data));
    } else if (table === 'branding') {
      bakedData['elevate_visuals'] = JSON.stringify(transformBranding(data));
    } else {
      bakedData[`elevate_${table}`] = JSON.stringify(data);
    }
    successCount++;
  }

  const escapedData = JSON.stringify(JSON.stringify(bakedData))
    .replace(/<\/script>/gi, '<\\/script>');

  const bakedScript = [
    `<script id="baked-content">`,
    `/* Elevate QA — content baked at build time (${new Date().toISOString()}) */`,
    `(function(){`,
    `  try {`,
    `    var d=JSON.parse(${escapedData});`,
    `    for(var k in d){`,
    `      if(Object.prototype.hasOwnProperty.call(d,k)){`,
    `        localStorage.setItem(k, d[k]);`,
    `      }`,
    `    }`,
    `  } catch(e){}`,
    `})();`,
    `</script>`,
  ].join('\n');

  let html = readFileSync(distIndexPath, 'utf8');
  html = html.replace(/<script id="baked-content">[\s\S]*?<\/script>/g, '');

  if (html.includes('</head>')) {
    html = html.replace('</head>', bakedScript + '\n</head>');
    writeFileSync(distIndexPath, html, 'utf8');
    const fileSizeKb = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
    console.log(`[bake-content] ✅ Baked ${successCount}/${tables.length} tables into dist/index.html (${fileSizeKb} KB)`);
  }
}

bakeContent().catch(e => {
  console.warn('[bake-content] Warning:', e.message);
});
