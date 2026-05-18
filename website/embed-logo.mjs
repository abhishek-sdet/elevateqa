import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const logoPath = resolve(__dirname, 'dist', 'logo.png');
if (!existsSync(logoPath)) {
  console.error('[embed-logo] ERROR: dist/logo.png not found!');
  process.exit(1);
}

const logoBytes = readFileSync(logoPath);
const logoB64 = `data:image/png;base64,${logoBytes.toString('base64')}`;

const htmlFiles = ['dist/index.html', 'dist/admin.html', 'dist/scanner.html'];

for (const file of htmlFiles) {
  const filePath = resolve(__dirname, file);
  if (!existsSync(filePath)) {
    console.warn(`[embed-logo] Skipping (not found): ${file}`);
    continue;
  }

  let html = readFileSync(filePath, 'utf8');
  const before = html.length;

  // Replace all relative and absolute logo references with the embedded data URI
  html = html.replaceAll('./logo.png', logoB64);
  html = html.replaceAll('./logo-elevate-clean.svg', logoB64);
  html = html.replaceAll('/logo-elevate-clean.svg', logoB64);
  html = html.replaceAll('/logo.png', logoB64);

  writeFileSync(filePath, html, 'utf8');
  const after = html.length;
  console.log(`[embed-logo] ✓ ${file} (${before} → ${after} bytes, logo embedded)`);
}

console.log('[embed-logo] ✅ All HTML files are now fully self-contained!');
