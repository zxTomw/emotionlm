import { test, expect } from '@playwright/test';

test('Final EmotionLM Validation', async ({ page }) => {
  let hasErrors = false;
  const errorMessages: string[] = [];

  // Capture any actual errors (not debug logs)
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('[EMOTION]')) {
      hasErrors = true;
      errorMessages.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    hasErrors = true;
    errorMessages.push(`Page Error: ${error.message}`);
  });

  // Navigate to app
  await page.goto('/');
  
  // Check basic UI elements
  await expect(page.locator('h1')).toContainText('EmotionLM Chat');
  await expect(page.locator('input[placeholder="Type your message here..."]')).toBeVisible();
  
  // Test basic interaction
  await page.fill('input[placeholder="Type your message here..."]', 'Hello, how are you today?');
  await page.click('button:has-text("📤")');
  
  // Wait for response
  await page.waitForSelector('.chat-message:nth-child(2)', { timeout: 15000 });
  
  // Check if AI responded
  const messages = await page.locator('.chat-message').count();
  expect(messages).toBeGreaterThanOrEqual(2);
  
  // Check if emotions are displayed
  await page.locator('.emotion-visualization').count();
  
  // Check emotion details panel
  await page.click('button:has-text("Show Emotion Details")');
  await expect(page.locator('.emotion-details-panel')).toBeVisible();
  
  // Test another interaction
  await page.fill('input[placeholder="Type your message here..."]', 'What makes you happy?');
  await page.click('button:has-text("📤")');
  
  // Wait for second response
  await page.waitForSelector('.chat-message:nth-child(4)', { timeout: 15000 });
  
  // Final validation
  const finalMessages = await page.locator('.chat-message').count();
  expect(finalMessages).toBe(4); // 2 user + 2 AI messages
  
  const finalEmotionCount = await page.locator('.emotion-visualization').count();
  expect(finalEmotionCount).toBeGreaterThan(0);
  
  // Output results
  console.log('\n=== FINAL VALIDATION RESULTS ===');
  console.log(`✅ Chat Messages: ${finalMessages}`);
  console.log(`✅ Emotion Visualizations: ${finalEmotionCount}`);
  console.log(`✅ Console Errors: ${errorMessages.length}`);
  console.log(`✅ Page Errors: ${hasErrors ? 'YES' : 'NO'}`);
  
  if (errorMessages.length > 0) {
    console.log('\n❌ Errors Found:');
    errorMessages.forEach((error, i) => {
      console.log(`${i + 1}. ${error}`);
    });
  } else {
    console.log('\n🎉 NO ERRORS DETECTED - EmotionLM IS WORKING PERFECTLY!');
  }
  
  // Assertions
  expect(hasErrors).toBe(false);
  expect(finalMessages).toBe(4);
  expect(finalEmotionCount).toBeGreaterThan(0);
});