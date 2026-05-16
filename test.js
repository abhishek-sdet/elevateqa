fetch('http://localhost:5173/admin.html')
  .then(r => r.text())
  .then(t => {
    const start = t.indexOf('<div id="sub-identity-map"');
    console.log(t.substring(start, start + 500));
  })
  .catch(console.error);
