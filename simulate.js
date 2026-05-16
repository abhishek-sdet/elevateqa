import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/admin.html', { waitUntil: 'networkidle2' });
  
  // Wait for login or preloader
  await new Promise(r => setTimeout(r, 2000));
  
  // Bypass auth if needed by executing the bypass function
  await page.evaluate(() => {
    if (document.getElementById('admin-auth')) document.getElementById('admin-auth').style.display = 'none';
    if (document.getElementById('admin-preloader')) document.getElementById('admin-preloader').style.display = 'none';
  });

  // Check the DOM for the tab buttons
  const domState = await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabTexts = Array.from(tabs).map(t => t.textContent);
    
    // Simulate clicking 'map'
    if (window.showSection) window.showSection('identity');
    if (window.showIdentitySubSection) window.showIdentitySubSection('map');
    
    const mapInput = document.getElementById('map-section-num');
    const experienceInput = document.getElementById('experience-section-num');
    
    return {
      tabTexts,
      mapInputValue: mapInput ? mapInput.value : 'INPUT NOT FOUND',
      experienceInputValue: experienceInput ? experienceInput.value : 'INPUT NOT FOUND'
    };
  });
  
  console.log("DOM State:", JSON.stringify(domState, null, 2));
  
  await browser.close();
})();
