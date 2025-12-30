import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  console.log('Navigating to http://localhost:3000/usun...');
  await page.goto('http://localhost:3000/usun', { waitUntil: 'networkidle' });
  
  console.log('Taking screenshot...');
  await page.screenshot({ 
    path: '/tmp/usun-profile-full.png',
    fullPage: true 
  });
  
  console.log('Screenshot saved!');
  await browser.close();
})();
