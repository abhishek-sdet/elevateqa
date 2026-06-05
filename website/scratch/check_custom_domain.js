import fs from 'fs';

const livePath = 'c:/Users/abhishek.johri/.gemini/antigravity-ide/brain/4d8f4bdd-71b3-4490-b9bb-31d07fb942d0/.system_generated/steps/507/content.md';
const content = fs.readFileSync(livePath, 'utf8');

console.log('File size:', content.length, 'bytes');

// Search for any occurrence of localhost in the fetched HTML of the custom domain
const regexLocal = /localhost:\d+/gi;
let match;
console.log('--- Search for localhost in elevateqa.sdettech.com ---');
while ((match = regexLocal.exec(content)) !== null) {
  const startIndex = Math.max(0, match.index - 50);
  const endIndex = Math.min(content.length, match.index + 50);
  console.log(`Found at index ${match.index}: "${content.substring(startIndex, endIndex)}"`);
}

// Find send-ticket variable in custom domain HTML
const regexTicket = /send-ticket/gi;
console.log('--- Search for send-ticket in elevateqa.sdettech.com ---');
while ((match = regexTicket.exec(content)) !== null) {
  const startIndex = Math.max(0, match.index - 50);
  const endIndex = Math.min(content.length, match.index + 50);
  console.log(`Found at index ${match.index}: "${content.substring(startIndex, endIndex)}"`);
}
