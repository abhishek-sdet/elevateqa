import { readFileSync } from 'fs';

const html = readFileSync('website/dist/index.html', 'utf8');

// The baked content is in the <script id="baked-content"> tag as an inline localStorage preload.
const scriptMatch = html.match(/<script id="baked-content">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('baked-content script tag not found!');
  process.exit(1);
}

const scriptText = scriptMatch[1];
const jsonMatch = scriptText.match(/JSON\.parse\("(.*?)"\)/);
if (!jsonMatch) {
  console.error('JSON.parse not found in script!');
  process.exit(1);
}

// The string is double-escaped, let's unescape it
const rawJson = jsonMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
const parsedStore = JSON.parse(rawJson);
const agenda = JSON.parse(parsedStore.elevate_agenda);

console.log(`Verified ${agenda.length} items in baked agenda:`);
agenda.forEach((a, i) => {
  console.log(`${i+1}. Time: ${a.time_slot} | Title: ${a.title} | Tag: ${a.tag} | Desc: ${a.desc}`);
});
