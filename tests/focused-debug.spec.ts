import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Focused Structured Output Debug', async ({ page }) => {
  const debugData: Record<string, unknown>[] = [];
  
  // Capture ALL console messages
  page.on('console', (msg) => {
    const text = msg.text();
    debugData.push({
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: text,
      location: msg.location()
    });
  });

  await page.goto('/');
  
  // Send one simple message
  await page.fill('input[placeholder="Type your message here..."]', 'hello');
  await page.click('button:has-text("📤")');
  
  // Wait for processing
  await page.waitForTimeout(10000);
  
  // Filter for relevant messages
  const emotionLogs = debugData.filter(log => 
    log.text.includes('EMOTION') || 
    log.text.includes('structured') ||
    log.text.includes('JSON') ||
    log.text.includes('OutputParser') ||
    log.text.includes('Ollama') ||
    log.text.includes('invoke')
  );
  
  const errorLogs = debugData.filter(log => log.type === 'error');
  
  // Save all data
  const reportPath = path.join(process.cwd(), 'debug-reports', `focused-debug-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    allLogs: debugData,
    emotionLogs,
    errorLogs,
    summary: {
      totalLogs: debugData.length,
      emotionLogs: emotionLogs.length,
      errorLogs: errorLogs.length
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n=== FOCUSED DEBUG ANALYSIS ===');
  console.log(`Total Console Messages: ${debugData.length}`);
  console.log(`Emotion-related Messages: ${emotionLogs.length}`);
  console.log(`Error Messages: ${errorLogs.length}`);
  
  console.log('\n=== EMOTION PROCESSING FLOW ===');
  emotionLogs.forEach((log, i) => {
    console.log(`${i + 1}. [${log.type}] ${log.text}`);
  });
  
  console.log('\n=== ERROR MESSAGES ===');
  errorLogs.forEach((error, i) => {
    console.log(`${i + 1}. ${error.text}`);
  });
  
  console.log(`\nFull report saved to: ${reportPath}`);
});