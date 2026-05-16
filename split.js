import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

const partialsDir = path.resolve('src/partials');
if (!fs.existsSync(partialsDir)) {
  fs.mkdirSync(partialsDir, { recursive: true });
}

// Define the chunks to extract
const chunks = [
  { name: 'ticker', regex: /<div class="ticker".*?<\/div>\s*<\/div>/s },
  { name: 'header', regex: /<header>.*?<\/header>/s },
  { name: 'hero', regex: /<section class="hero".*?<\/section>/s },
  { name: 'proof-bar', regex: /<section class="proof-bar".*?<\/section>/s },
  { name: 'manifesto', regex: /<section id="manifesto".*?<\/section>/s },
  { name: 'map', regex: /<section id="maturity".*?<\/section>/s },
  { name: 'experience', regex: /<div class="image-strip".*?<\/section>/s },
  { name: 'agenda', regex: /<section id="agenda".*?<\/section>/s },
  { name: 'speakers', regex: /<section id="speakers".*?<\/section>/s },
  { name: 'prizes', regex: /<section class="prizes-strip".*?<\/section>/s },
  { name: 'coming', regex: /<section id="coming".*?<\/section>/s },
  { name: 'involve', regex: /<section id="join".*?<\/section>/s },
  { name: 'footer', regex: /<section class="finale".*?<\/section>/s },
  { name: 'modal', regex: /<!-- Attend Application Modal -->.*?<\/dialog>/s }
];

chunks.forEach(chunk => {
  const match = html.match(chunk.regex);
  if (match) {
    const content = match[0];
    fs.writeFileSync(path.join(partialsDir, `${chunk.name}.html`), content);
    html = html.replace(content, `{{> ${chunk.name} }}`);
  } else {
    console.warn(`Could not find chunk: ${chunk.name}`);
  }
});

fs.writeFileSync(indexPath, html);
console.log('Successfully split index.html into partials.');
