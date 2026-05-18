import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const logoPath = resolve(__dirname, 'public', 'logo.png');
if (!existsSync(logoPath)) {
  console.error('[embed-preloader] ERROR: public/logo.png not found!');
  process.exit(1);
}

const logoBytes = readFileSync(logoPath);
const logoB64 = `data:image/png;base64,${logoBytes.toString('base64')}`;

const indexPath = resolve(__dirname, 'index.html');
if (!existsSync(indexPath)) {
  console.error('[embed-preloader] ERROR: index.html not found!');
  process.exit(1);
}

let html = readFileSync(indexPath, 'utf8');

// SVG regular expression pattern to find and replace the SVG with the base64 img tag
const svgRegex = /<!-- Inline SVG Logo for 100% instant, vector, zero-delay rendering -->([\s\S]*?)<\/svg>/;

if (svgRegex.test(html)) {
  const imgTag = `<!-- Embedded preloader logo for 0ms instant display -->
      <img id="preloader-logo-img" class="preloader-logo" style="display: block; margin: 0 auto 30px;" src="${logoB64}" alt="Elevate QA Logo">`;
  html = html.replace(svgRegex, imgTag);
  writeFileSync(indexPath, html, 'utf8');
  console.log('[embed-preloader] Success: logo.png successfully embedded inside preloader!');
} else {
  // If the SVG tag is already replaced, let's find the preloader img and update its source
  const imgRegex = /<img id="preloader-logo-img" class="preloader-logo" style="display: block; margin: 0 auto 30px;" src="[^"]*"/;
  if (imgRegex.test(html)) {
    html = html.replace(imgRegex, `<img id="preloader-logo-img" class="preloader-logo" style="display: block; margin: 0 auto 30px;" src="${logoB64}"`);
    writeFileSync(indexPath, html, 'utf8');
    console.log('[embed-preloader] Success: logo.png src successfully updated in preloader!');
  } else {
    console.warn('[embed-preloader] Warning: Preloader logo placeholder not found in index.html');
  }
}
