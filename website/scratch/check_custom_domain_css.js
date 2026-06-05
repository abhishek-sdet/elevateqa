import fs from 'fs';

const livePath = 'c:/Users/abhishek.johri/.gemini/antigravity-ide/brain/4d8f4bdd-71b3-4490-b9bb-31d07fb942d0/.system_generated/steps/507/content.md';
const content = fs.readFileSync(livePath, 'utf8');

// Find all matches of nav.scrolled { ... }
const regex = /nav\.scrolled\s*\{([^}]+)\}/gi;
let match;
console.log('--- nav.scrolled rules in custom domain ---');
while ((match = regex.exec(content)) !== null) {
  console.log(`Found: "${match[0]}"`);
}
