import fs from 'fs';
import path from 'path';

const distPath = 'c:/Users/abhishek.johri/OneDrive - SDET TECH/Documents/Elevate QA New Design/website/dist/index.html';

if (!fs.existsSync(distPath)) {
  console.log('dist/index.html does not exist!');
  process.exit(1);
}

const content = fs.readFileSync(distPath, 'utf8');
console.log('File size:', content.length, 'bytes');

// Find all occurrences of localhost
const regexLocal = /localhost:\d+/gi;
let match;
console.log('--- Search for localhost ---');
while ((match = regexLocal.exec(content)) !== null) {
  const startIndex = Math.max(0, match.index - 50);
  const endIndex = Math.min(content.length, match.index + 50);
  console.log(`Found at index ${match.index}: "${content.substring(startIndex, endIndex)}"`);
}

// Find all occurrences of send-ticket
const regexTicket = /send-ticket/gi;
console.log('--- Search for send-ticket ---');
while ((match = regexTicket.exec(content)) !== null) {
  const startIndex = Math.max(0, match.index - 50);
  const endIndex = Math.min(content.length, match.index + 50);
  console.log(`Found at index ${match.index}: "${content.substring(startIndex, endIndex)}"`);
}

// Find all occurrences of verify-otp
const regexOtp = /verify-otp/gi;
console.log('--- Search for verify-otp ---');
while ((match = regexOtp.exec(content)) !== null) {
  const startIndex = Math.max(0, match.index - 50);
  const endIndex = Math.min(content.length, match.index + 50);
  console.log(`Found at index ${match.index}: "${content.substring(startIndex, endIndex)}"`);
}
