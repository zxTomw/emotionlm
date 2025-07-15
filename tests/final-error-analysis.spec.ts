import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Final Error Analysis - Complete Flow Debug', async ({ page }) => {
  const errorReport = {
    timestamp: new Date().toISOString(),
    allLogs: [] as Array<{
      timestamp: string;
      type: string;
      text: string;
      location?: string;
    }>,
    errorAnalysis: {
      totalErrors: 0,
      uniqueErrors: [] as string[],
      errorPatterns: [] as string[],
      repeatingErrors: [] as Array<{ error: string; count: number }>
    },
    chatFlow: {
      messagesSent: [] as string[],
      responsesReceived: [] as Array<{ content: string; hasEmotions: boolean }>,
      emotionAnalysisResults: [] as Array<{ success: boolean; fallbackUsed: string }>
    }
  };

  // Capture ALL console output with detailed tracking
  page.on('console', (msg) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text(),
      location: msg.location()?.url
    };
    
    errorReport.allLogs.push(logEntry);
    
    // Track errors specifically
    if (msg.type() === 'error') {
      errorReport.errorAnalysis.totalErrors++;
      
      // Extract key error patterns
      const errorText = msg.text();
      if (errorText.includes('OutputParserException')) {
        errorReport.errorAnalysis.errorPatterns.push('OutputParserException');
      }
      if (errorText.includes('Unexpected end of JSON input')) {
        errorReport.errorAnalysis.errorPatterns.push('JSON_PARSE_ERROR');
      }
      if (errorText.includes('Failed to parse')) {
        errorReport.errorAnalysis.errorPatterns.push('PARSE_FAILURE');
      }
      
      // Track unique errors
      const shortError = errorText.substring(0, 100);
      if (!errorReport.errorAnalysis.uniqueErrors.includes(shortError)) {
        errorReport.errorAnalysis.uniqueErrors.push(shortError);
      }
    }
  });

  await page.goto('/');
  
  // Test the exact same interaction flow as in the screenshot
  const testMessage = 'hi';
  errorReport.chatFlow.messagesSent.push(testMessage);
  
  await page.fill('input[placeholder="Type your message here..."]', testMessage);
  await page.click('button:has-text("📤")');
  
  // Wait for the full interaction to complete
  try {
    await page.waitForSelector('.chat-message:last-child .message-content', { timeout: 15000 });
    
    // Get response details
    const responseContent = await page.locator('.chat-message:last-child .message-content').textContent();
    const hasEmotions = await page.locator('.chat-message:last-child .emotion-visualization').isVisible();
    
    errorReport.chatFlow.responsesReceived.push({
      content: responseContent || '',
      hasEmotions
    });
    
    // Wait extra time to capture all emotion analysis logs
    await page.waitForTimeout(5000);
    
  } catch {
    console.log('Timeout waiting for response');
  }
  
  // Analyze emotion analysis results from logs
  const emotionLogs = errorReport.allLogs.filter(log => log.text.includes('[EMOTION]'));
  
  let currentAnalysis = { success: false, fallbackUsed: 'none' };
  
  emotionLogs.forEach(log => {
    if (log.text.includes('Starting emotion analysis')) {
      currentAnalysis = { success: false, fallbackUsed: 'none' };
    }
    if (log.text.includes('Structured output failed')) {
      currentAnalysis.fallbackUsed = 'json_parsing';
    }
    if (log.text.includes('JSON parsing failed')) {
      currentAnalysis.fallbackUsed = 'rule_based';
    }
    if (log.text.includes('JSON parsing succeeded') || log.text.includes('Rule-based emotions generated')) {
      currentAnalysis.success = true;
    }
  });
  
  errorReport.chatFlow.emotionAnalysisResults.push(currentAnalysis);
  
  // Count repeating errors
  const errorCounts = new Map<string, number>();
  errorReport.allLogs
    .filter(log => log.type === 'error')
    .forEach(log => {
      const key = log.text.substring(0, 50);
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });
  
  errorReport.errorAnalysis.repeatingErrors = Array.from(errorCounts.entries())
    .map(([error, count]) => ({ error, count }))
    .filter(item => item.count > 1);
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'debug-reports', `final-error-analysis-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(errorReport, null, 2));
  
  // Generate comprehensive console output
  console.log('\n🔍 === FINAL ERROR ANALYSIS ===');
  console.log(`📊 Overview:`);
  console.log(`   Total Console Messages: ${errorReport.allLogs.length}`);
  console.log(`   Total Errors: ${errorReport.errorAnalysis.totalErrors}`);
  console.log(`   Unique Error Types: ${errorReport.errorAnalysis.uniqueErrors.length}`);
  console.log(`   Messages Sent: ${errorReport.chatFlow.messagesSent.length}`);
  console.log(`   Responses Received: ${errorReport.chatFlow.responsesReceived.length}`);
  
  if (errorReport.errorAnalysis.totalErrors > 0) {
    console.log('\n❌ === ERROR DETAILS ===');
    errorReport.errorAnalysis.uniqueErrors.forEach((error, i) => {
      console.log(`${i + 1}. ${error}...`);
    });
  }
  
  if (errorReport.errorAnalysis.errorPatterns.length > 0) {
    console.log('\n🔍 === ERROR PATTERNS ===');
    const patternCounts = new Map<string, number>();
    errorReport.errorAnalysis.errorPatterns.forEach(pattern => {
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    });
    
    patternCounts.forEach((count, pattern) => {
      console.log(`   ${pattern}: ${count} occurrences`);
    });
  }
  
  console.log('\n💬 === CHAT INTERACTION RESULTS ===');
  errorReport.chatFlow.messagesSent.forEach((msg, i) => {
    const response = errorReport.chatFlow.responsesReceived[i];
    const analysis = errorReport.chatFlow.emotionAnalysisResults[i];
    
    console.log(`Message ${i + 1}: "${msg}"`);
    if (response) {
      console.log(`   Response: "${response.content.substring(0, 100)}..."`);
      console.log(`   Has Emotions: ${response.hasEmotions}`);
    }
    if (analysis) {
      console.log(`   Analysis Success: ${analysis.success}`);
      console.log(`   Fallback Used: ${analysis.fallbackUsed}`);
    }
  });
  
  console.log('\n📋 === EMOTION ANALYSIS FLOW ===');
  const emotionSteps = errorReport.allLogs
    .filter(log => log.text.includes('[EMOTION]'))
    .slice(0, 15);
  
  emotionSteps.forEach((step, i) => {
    console.log(`${i + 1}. ${step.text.substring(0, 120)}...`);
  });
  
  console.log('\n🎯 === DIAGNOSIS ===');
  
  if (errorReport.errorAnalysis.totalErrors === 0) {
    console.log('✅ NO ERRORS DETECTED - System working correctly!');
  } else {
    console.log(`❌ ${errorReport.errorAnalysis.totalErrors} errors detected`);
    
    if (errorReport.errorAnalysis.errorPatterns.includes('OutputParserException')) {
      console.log('🔍 OutputParserException still occurring - structured output issue persists');
    }
    
    if (errorReport.errorAnalysis.errorPatterns.includes('JSON_PARSE_ERROR')) {
      console.log('🔍 JSON parsing errors - LLM response format issue');
    }
  }
  
  const hasWorkingEmotions = errorReport.chatFlow.responsesReceived.some(r => r.hasEmotions);
  if (hasWorkingEmotions) {
    console.log('✅ Emotions are displaying correctly');
  } else {
    console.log('❌ Emotions not displaying - check fallback systems');
  }
  
  console.log(`\n📄 Full report: ${reportPath}`);
});