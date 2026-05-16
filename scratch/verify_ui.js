import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  
  // Desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const preloader = document.getElementById('page-preloader');
    if (preloader) preloader.style.display = 'none';
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verify_desktop.png' });
  
  // Mobile
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const preloader = document.getElementById('page-preloader');
    if (preloader) preloader.style.display = 'none';
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verify_mobile.png' });
  
  await browser.close();
  console.log('Screenshots captured: verify_desktop.png, verify_mobile.png');
})();
