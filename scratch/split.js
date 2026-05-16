import fs from 'fs';

let html = fs.readFileSync('elevate-qa (1).html', 'utf-8');

// Replace the entire style block
html = html.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="src/style/elevate-main.css">');

// Remove the inline script that generates the modal ticket
html = html.replace(/<script>[\s\S]*?function openModal[\s\S]*?<\/script>/, '');

// Replace the trailing inline script at the bottom with the external module
html = html.replace(/<script>\s*const io = new IntersectionObserver[\s\S]*?<\/script>/, '<script type="module" src="src/scripts/main.js"></script>');

fs.writeFileSync('elevate-qa (1).html', html);
console.log('Successfully split the HTML file.');
