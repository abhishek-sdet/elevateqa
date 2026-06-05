import fs from 'fs';

const distPath = 'c:/Users/abhishek.johri/OneDrive - SDET TECH/Documents/Elevate QA New Design/website/dist/index.html';
const content = fs.readFileSync(distPath, 'utf8');

function findDefinition(varName, searchStart) {
  console.log(`\n--- Searching definition for: ${varName} near ${searchStart} ---`);
  // Let's scan backwards from searchStart to find where varName is defined or assigned
  const minifiedDefRegex = new RegExp(`const\\s+[^=]*\\b${varName}\\b\\s*=`, 'g');
  
  // Or simply find all occurrences of varName in the JS code (excluding huge static content at the end)
  const regex = new RegExp(`\\b${varName}\\b\\s*=([^,;}]+)`, 'g');
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > 3000000) continue; // skip baked data at the end
    const startIndex = Math.max(0, match.index - 50);
    const endIndex = Math.min(content.length, match.index + 100);
    console.log(`Found assignment at index ${match.index}: "${content.substring(startIndex, endIndex)}"`);
  }
}

findDefinition('ki', 1162235);
findDefinition('Ji', 2155979);
