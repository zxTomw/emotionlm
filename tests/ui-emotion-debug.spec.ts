import { test } from '@playwright/test';

test('UI Emotion Display Debug', async ({ page }) => {
  await page.goto('/');
  
  // Send a message
  await page.fill('input[placeholder="Type your message here..."]', 'hello');
  await page.click('button:has-text("📤")');
  
  // Wait for response
  await page.waitForSelector('.chat-message:last-child .message-content', { timeout: 20000 });
  
  // Wait for emotion processing
  await page.waitForTimeout(5000);
  
  // Check what's actually in the DOM
  const chatMessages = await page.locator('.chat-message').count();
  console.log(`Total chat messages: ${chatMessages}`);
  
  if (chatMessages >= 2) {
    const lastMessage = page.locator('.chat-message').last();
    
    // Check message structure
    const hasMessageContent = await lastMessage.locator('.message-content').isVisible();
    const hasEmotionVisualization = await lastMessage.locator('.emotion-visualization').isVisible();
    const hasEmotionLabel = await lastMessage.locator('.emotion-label').isVisible();
    const hasEmotionBreakdown = await lastMessage.locator('.emotion-breakdown').isVisible();
    
    console.log('UI Element Check:');
    console.log(`  Message content visible: ${hasMessageContent}`);
    console.log(`  Emotion visualization visible: ${hasEmotionVisualization}`);
    console.log(`  Emotion label visible: ${hasEmotionLabel}`);
    console.log(`  Emotion breakdown visible: ${hasEmotionBreakdown}`);
    
    // Get the HTML structure
    const messageHTML = await lastMessage.innerHTML();
    console.log('Message HTML structure:');
    console.log(messageHTML.substring(0, 500) + '...');
    
    // Check if emotion data exists but is hidden
    const emotionElements = await lastMessage.locator('[class*="emotion"]').count();
    console.log(`Elements with 'emotion' in class: ${emotionElements}`);
    
    // Check for any emotion-related text
    const messageText = await lastMessage.textContent();
    const hasEmotionText = messageText?.includes('Engaged') || 
                          messageText?.includes('Patient') || 
                          messageText?.includes('Curious');
    console.log(`Has emotion text: ${hasEmotionText}`);
    
    if (hasEmotionText) {
      console.log('✅ Emotions are present in text');
    } else {
      console.log('❌ No emotion text found');
      console.log('Message text:', messageText?.substring(0, 200));
    }
  }
});