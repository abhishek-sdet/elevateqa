const fs = require('fs');
const files = ['index.html', 'admin.html', 'scanner.html', 'speaker.html'];
for (const file of files) {
  if (fs.existsSync(file)) {
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/src=\"data:image\/png;base64,[^\"]+\"/g, 'src=\"./logo.png\"');
    fs.writeFileSync(file, html, 'utf8');
    console.log(`Updated ${file}`);
  }
}
