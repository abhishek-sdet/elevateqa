import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    const preloader = document.getElementById('page-preloader');
    if (preloader) preloader.style.display = 'none';
  });
  
  // Scroll to Map section head
  await page.evaluate(() => {
    const el = document.getElementById('maturity-section-num');
    if (el) el.scrollIntoView();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'verify_map_num.png' });
  
  await browser.close();
  console.log('Screenshot captured: verify_map_num.png');
})();
