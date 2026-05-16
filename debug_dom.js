import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/admin.html', { waitUntil: 'networkidle2' });
  
  const html = await page.evaluate(() => {
    // Force call the functions to simulate the clicks
    if (window.showSection) window.showSection('identity');
    if (window.showIdentitySubSection) window.showIdentitySubSection('map');
    
    const map = document.getElementById('sub-identity-map');
    if (!map) return 'sub-identity-map is null';
    
    return map.outerHTML;
  });
  
  console.log("DOM output:");
  console.log(html);

  await browser.close();
})();
