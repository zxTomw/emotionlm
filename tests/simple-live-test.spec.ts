import { test } from '@playwright/test';

test('Simple Live App Test', async ({ page }) => {
  await page.goto('/');
  
  // Just check if the app loads
  const title = await page.locator('h1').textContent();
  console.log('App title:', title);
  
  // Check if we can type in the input
  const input = page.locator('input[placeholder="Type your message here..."]');
  const inputExists = await input.isVisible();
  console.log('Input field exists:', inputExists);
  
  if (inputExists) {
    await input.fill('test');
    const inputValue = await input.inputValue();
    console.log('Input value after typing:', inputValue);
  }
  
  // Take a screenshot to see the current state
  await page.screenshot({ path: 'debug-reports/current-app-state.png' });
  console.log('Screenshot saved to debug-reports/current-app-state.png');
  
  // Check for any immediate console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.waitForTimeout(3000);
  
  console.log('Console errors detected:', errors.length);
  if (errors.length > 0) {
    console.log('First few errors:', errors.slice(0, 3));
  }
});