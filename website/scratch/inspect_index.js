import fs from 'fs';

const distPath = 'c:/Users/abhishek.johri/OneDrive - SDET TECH/Documents/Elevate QA New Design/website/dist/index.html';
const content = fs.readFileSync(distPath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
if (lines.length >= 98) {
  const line98 = lines[97]; // 0-indexed is line 98
  console.log('Line 98 length:', line98.length);
  const targetChar = 49894;
  const startChar = Math.max(0, targetChar - 100);
  const endChar = Math.min(line98.length, targetChar + 100);
  console.log('Substring around char 49894 of line 98:');
  console.log('"', line98.substring(startChar, endChar), '"');
} else {
  console.log('Line 98 does not exist in dist/index.html!');
}
