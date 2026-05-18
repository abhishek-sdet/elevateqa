const fs = require('fs');
const html = fs.readFileSync('c:/Users/abhishek.johri/OneDrive - SDET TECH/Documents/Elevate QA New Design/website/dist/index.html', 'utf8');
const m = html.match(/<script id="baked-content">([\s\S]*?)<\/script>/);
if (m) {
  console.log('MATCH FOUND');
  try {
    eval(m[1]);
    console.log('Syntax OK');
  } catch (e) {
    console.error('Syntax Error:', e);
  }
} else {
  console.log('NO MATCH');
}
