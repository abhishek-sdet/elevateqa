/**
 * BAKE-CONTENT.MJS — Elevate QA Build Tool
 * ==========================================
 * Fetches ALL site content from Supabase at BUILD TIME and injects it as a
 * pre-populated localStorage script into dist/index.html.
 *
 * Result: dist/index.html is 100% self-contained — works when:
 *   - Opened directly via file:// (double-click)
 *   - Hosted on ANY web server (no CORS config needed)
 *   - On a network with no Supabase access
 *   - On first visit (no prior localStorage data)
 *
 * Real-time sync still works in the background when Supabase IS reachable.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Supabase credentials (anon/public key — safe to embed) ─────────────────
const SUPABASE_URL = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const distIndexPath = resolve(__dirname, 'dist', 'index.html');

// ── Mirrors the transform logic in main-sync.js ────────────────────────────
function transformSiteContent(rows) {
  const raw = Array.isArray(rows) ? rows[0] : rows;
  if (!raw) return null;

  // Start with top-level snake_case columns
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

  // hero_meta is a JSONB column that contains ALL other settings bundled together.
  // Unpack it so every field inside becomes a top-level property.
  const heroMeta = raw.hero_meta;
  if (heroMeta) {
    try {
      const extra = (typeof heroMeta === 'string') ? JSON.parse(heroMeta) : heroMeta;
      Object.assign(sc, extra);           // spreads ALL nested fields (nav labels, stats, ticker, etc.)
      sc.heroMeta = extra.heroMetaText || '';  // keep the plain text version for the meta bar
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

// ── Main bake logic ────────────────────────────────────────────────────────
async function bakeContent() {
  console.log('[bake-content] 🌐 Connecting to Supabase to fetch site content...');

  if (!existsSync(distIndexPath)) {
    console.error('[bake-content] ❌ dist/index.html not found. Run "npm run build" first.');
    process.exit(1);
  }

  const orderedTables   = ['speakers', 'agenda', 'maturity_stages', 'pillars'];
  const unorderedTables = ['branding', 'site_content', 'manifesto'];
  const allTables       = [...orderedTables, ...unorderedTables];

  const bakedData = {};
  let successCount = 0;

  for (const table of allTables) {
    try {
      let query = supabase.from(table).select('*');
      if (orderedTables.includes(table)) {
        query = query.order('display_order', { ascending: true, nullsFirst: false });
      }

      const { data, error } = await query;

      if (error) {
        console.warn(`[bake-content] ⚠  ${table}: ${error.message}`);
        continue;
      }

      if (!data || data.length === 0) {
        console.warn(`[bake-content] ⚠  ${table}: empty result — skipping`);
        continue;
      }

      // Mirror the agenda title-split from main-sync.js
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

      if (table === 'site_content') {
        bakedData['elevate_site_content'] = JSON.stringify(transformSiteContent(data));
      } else if (table === 'branding') {
        bakedData['elevate_visuals'] = JSON.stringify(transformBranding(data));
      } else {
        bakedData[`elevate_${table}`] = JSON.stringify(data);
      }

      successCount++;
      console.log(`[bake-content] ✓  ${table} (${data.length} rows)`);
    } catch (e) {
      console.warn(`[bake-content] ⚠  ${table}: ${e.message}`);
    }
  }

  if (successCount === 0) {
    console.warn('[bake-content] ⚠  No data fetched — dist/index.html left unchanged.');
    console.warn('[bake-content]    The site will still work when Supabase is reachable at runtime.');
    return;
  }

  // ── Build the inline preload script ──────────────────────────────────────
  // We double-stringify so we can safely inject it as a string literal and JSON.parse it at runtime.
  // This completely avoids any JS syntax errors caused by unescaped newlines, quotes, or backslashes.
  const escapedData = JSON.stringify(JSON.stringify(bakedData))
    .replace(/<\/script>/gi, '<\\/script>');

  const bakedScript = [
    `<script id="baked-content">`,
    `/* Elevate QA — content baked at build time (${new Date().toISOString()}) */`,
    `/* Allows the site to render instantly with no network / Supabase dependency */`,
    `(function(){`,
    `  try {`,
    `    var d=JSON.parse(${escapedData});`,
    `    for(var k in d){`,
    `      if(Object.prototype.hasOwnProperty.call(d,k)){`,
    `        localStorage.setItem(k, d[k]);`,
    `      }`,
    `    }`,
    `  } catch(e){ /* private browsing / storage quota — ignore */ }`,
    `})();`,
    `</script>`,
  ].join('\n');

  // ── Inject into dist/index.html (before </head>) ──────────────────────────
  let html = readFileSync(distIndexPath, 'utf8');

  // Remove any previously baked script to avoid duplicates on re-runs
  html = html.replace(/<script id="baked-content">[\s\S]*?<\/script>/g, '');

  if (!html.includes('</head>')) {
    console.error('[bake-content] ❌ Could not find </head> tag in dist/index.html');
    process.exit(1);
  }

  html = html.replace('</head>', bakedScript + '\n</head>');
  writeFileSync(distIndexPath, html, 'utf8');

  const fileSizeKb = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
  console.log(`[bake-content] ✅ Baked ${successCount}/${allTables.length} tables into dist/index.html`);
  console.log(`[bake-content] 📦 dist/index.html is now ${fileSizeKb} KB — fully self-contained!`);
}

// Run — never fail the build on error, just warn
bakeContent().catch(e => {
  console.error('[bake-content] ❌ Fatal error:', e.message);
  console.warn('[bake-content]    Continuing build without baked content.');
  process.exit(0);
});
