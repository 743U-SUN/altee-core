import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

try {
  console.log('Navigating to admin/links page...');
  await page.goto('http://localhost:3000/admin/links');
  await page.waitForTimeout(3000);
  
  console.log('Current URL:', page.url());
  
  // Check if we need to login
  if (page.url().includes('/auth/signin') || page.url().includes('/unauthorized')) {
    console.log('Not authenticated - please login as admin first');
    console.log('Waiting 30 seconds for manual login...');
    await page.waitForTimeout(30000);
    
    // Try again
    await page.goto('http://localhost:3000/admin/links');
    await page.waitForTimeout(3000);
  }
  
  console.log('Waiting for page content...');
  await page.waitForSelector('h1', { timeout: 10000 });
  
  const heading = await page.locator('h1').textContent();
  console.log('Page heading:', heading);
  
  // Take initial screenshot
  await page.screenshot({ path: 'admin-links-initial.png', fullPage: true });
  console.log('Screenshot saved: admin-links-initial.png');
  
  // Wait for table
  const hasTable = await page.locator('table').count() > 0;
  console.log('Has table:', hasTable);
  
  if (hasTable) {
    // Find the first row with a dropdown menu (MoreHorizontal icon)
    const dropdownButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    
    console.log('Clicking dropdown menu...');
    await dropdownButton.click();
    await page.waitForTimeout(1000);
    
    // Click edit option
    console.log('Clicking edit option...');
    await page.locator('text=編集').first().click();
    await page.waitForTimeout(2000);
    
    // Take screenshot of modal
    await page.screenshot({ path: 'admin-links-edit-modal.png', fullPage: true });
    console.log('Screenshot saved: admin-links-edit-modal.png');
    
    // Find displayName input
    const displayNameInput = page.locator('input').filter({ has: page.locator('xpath=ancestor::*[contains(text(), "表示名")]') }).or(
      page.locator('label:has-text("表示名")').locator('..').locator('input')
    ).first();
    
    const currentValue = await displayNameInput.inputValue();
    console.log('Current displayName:', currentValue);
    
    // Update value
    const testValue = currentValue + ' - Updated';
    await displayNameInput.fill(testValue);
    console.log('Changed to:', testValue);
    await page.waitForTimeout(500);
    
    // Click update button
    console.log('Clicking update button...');
    await page.locator('button[type="submit"]:has-text("更新")').click();
    await page.waitForTimeout(3000);
    
    // Take screenshot after update
    await page.screenshot({ path: 'admin-links-after-update.png', fullPage: true });
    console.log('Screenshot saved: admin-links-after-update.png');
    
    // Check if value appears in table
    const tableText = await page.locator('table').textContent();
    if (tableText.includes(testValue)) {
      console.log('✅ SUCCESS: Updated value appears in table immediately!');
    } else {
      console.log('❌ ISSUE: Updated value not found in table');
      console.log('Table contains:', tableText.substring(0, 200));
    }
  } else {
    console.log('No table found - might be empty or loading');
  }
  
  await page.waitForTimeout(3000);
  
} catch (error) {
  console.error('Error:', error.message);
  await page.screenshot({ path: 'admin-links-error.png', fullPage: true });
} finally {
  await browser.close();
}
