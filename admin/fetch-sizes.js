const url = 'https://wbgxcadajmdjxfhsgose.supabase.co/storage/v1/object/list/elevate-media';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

async function listFiles(prefix = '') {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'apikey': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } })
  });
  const data = await res.json();
  let files = [];
  for (let item of data) {
    if (item.id === null) {
      // It's a folder
      files = files.concat(await listFiles(prefix + item.name + '/'));
    } else {
      files.push({ name: prefix + item.name, size: item.metadata.size });
    }
  }
  return files;
}

listFiles('').then(files => {
  files.sort((a, b) => b.size - a.size); // Sort by size descending
  files.forEach(f => {
    console.log(`${f.name} - ${(f.size / 1024 / 1024).toFixed(2)} MB`);
  });
}).catch(console.error);
