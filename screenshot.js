import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5173/admin.html#identity', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    const preloader = document.getElementById('admin-preloader');
    if (preloader) preloader.style.display = 'none';
    const auth = document.getElementById('admin-auth');
    if (auth) auth.style.display = 'none';
    
    if (window.showSection) window.showSection('identity');
    if (window.showIdentitySubSection) window.showIdentitySubSection('map');
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'test_screenshot.png' });
  
  await browser.close();
})();
