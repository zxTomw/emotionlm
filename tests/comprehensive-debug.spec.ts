import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Comprehensive Error Analysis', async ({ page }) => {
  const debugData: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    allConsoleMessages: [],
    emotionSystemLogs: [],
    langchainErrors: [],
    jsonParsingLogs: [],
    networkRequests: [],
    pageErrors: [],
    performanceMetrics: {}
  };

  // Capture ALL console messages with detailed context
  page.on('console', (msg) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      args: msg.args().length
    };

    // Add to main log
    (debugData.allConsoleMessages as Record<string, unknown>[]).push(logEntry);

    // Categorize specific types
    if (msg.text().includes('EMOTION') || msg.text().includes('emotion')) {
      (debugData.emotionSystemLogs as Record<string, unknown>[]).push(logEntry);
    }

    if (msg.text().includes('LangChain') || msg.text().includes('OutputParser') || 
        msg.text().includes('withStructuredOutput') || msg.text().includes('invoke')) {
      (debugData.langchainErrors as Record<string, unknown>[]).push(logEntry);
    }

    if (msg.text().includes('JSON') || msg.text().includes('parse')) {
      (debugData.jsonParsingLogs as Record<string, unknown>[]).push(logEntry);
    }
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    (debugData.pageErrors as Record<string, unknown>[]).push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  });

  // Capture network requests to Ollama
  page.on('request', (request) => {
    if (request.url().includes('localhost:11434')) {
      (debugData.networkRequests as Record<string, unknown>[]).push({
        timestamp: new Date().toISOString(),
        type: 'request',
        url: request.url(),
        method: request.method(),
        postData: request.postData()?.substring(0, 500)
      });
    }
  });

  page.on('response', async (response) => {
    if (response.url().includes('localhost:11434')) {
      try {
        const responseText = await response.text();
        (debugData.networkRequests as Record<string, unknown>[]).push({
          timestamp: new Date().toISOString(),
          type: 'response',
          url: response.url(),
          status: response.status(),
          bodyPreview: responseText.substring(0, 500)
        });
      } catch {
        (debugData.networkRequests as Record<string, unknown>[]).push({
          timestamp: new Date().toISOString(),
          type: 'response_error',
          url: response.url(),
          status: response.status(),
          error: 'Failed to read response body'
        });
      }
    }
  });

  // Navigate and perform comprehensive test
  await page.goto('/');
  
  // Test multiple interactions to gather comprehensive data
  const testScenarios = [
    { message: 'hi', description: 'Simple greeting' },
    { message: 'How are you feeling today?', description: 'Emotion-focused question' },
    { message: 'What is artificial intelligence?', description: 'Complex topic' },
    { message: 'Can you help me with a problem?', description: 'Help request' }
  ];

  for (const scenario of testScenarios) {
    console.log(`\n=== Testing: ${scenario.description} ===`);
    
    // Clear input and send message
    await page.fill('input[placeholder="Type your message here..."]', scenario.message);
    await page.click('button:has-text("📤")');
    
    // Wait for response with timeout
    try {
      await page.waitForSelector('.chat-message:last-child .message-content', { timeout: 15000 });
      console.log(`✅ Response received for: ${scenario.message}`);
      
      // Wait for emotion analysis to complete
      await page.waitForTimeout(3000);
      
      // Check if emotions are displayed
      const emotionVisible = await page.locator('.emotion-visualization').isVisible();
      console.log(`📊 Emotions displayed: ${emotionVisible}`);
      
    } catch {
      console.log(`❌ Timeout waiting for response to: ${scenario.message}`);
    }
    
    // Small delay between tests
    await page.waitForTimeout(1000);
  }

  // Collect performance metrics
  const performanceEntries = await page.evaluate(() => {
    return {
      navigation: performance.getEntriesByType('navigation')[0],
      paintEntries: performance.getEntriesByType('paint'),
      memoryInfo: (performance as any).memory || null
    };
  });
  
  debugData.performanceMetrics = performanceEntries;

  // Generate comprehensive analysis
  const analysis = {
    summary: {
      totalConsoleMessages: (debugData.allConsoleMessages as unknown[]).length,
      emotionSystemLogs: (debugData.emotionSystemLogs as unknown[]).length,
      langchainErrors: (debugData.langchainErrors as unknown[]).length,
      jsonParsingLogs: (debugData.jsonParsingLogs as unknown[]).length,
      networkRequests: (debugData.networkRequests as unknown[]).length,
      pageErrors: (debugData.pageErrors as unknown[]).length
    },
    errors: {
      hasPageErrors: (debugData.pageErrors as unknown[]).length > 0,
      hasLangChainErrors: (debugData.langchainErrors as unknown[]).length > 0,
      hasJSONParsingIssues: (debugData.jsonParsingLogs as unknown[]).length > 0
    }
  };

  // Save comprehensive report
  const reportPath = path.join(process.cwd(), 'debug-reports', `comprehensive-debug-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const fullReport = {
    analysis,
    debugData,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));

  // Output detailed analysis
  console.log('\n=== COMPREHENSIVE DEBUG ANALYSIS ===');
  console.log('Summary:', JSON.stringify(analysis.summary, null, 2));
  console.log('Error Flags:', JSON.stringify(analysis.errors, null, 2));

  if ((debugData.langchainErrors as unknown[]).length > 0) {
    console.log('\n=== LANGCHAIN ERRORS ===');
    (debugData.langchainErrors as Record<string, unknown>[]).forEach((error, i) => {
      console.log(`${i + 1}. [${error.type}] ${error.text}`);
    });
  }

  if ((debugData.jsonParsingLogs as unknown[]).length > 0) {
    console.log('\n=== JSON PARSING LOGS ===');
    (debugData.jsonParsingLogs as Record<string, unknown>[]).forEach((log, i) => {
      console.log(`${i + 1}. [${log.type}] ${log.text}`);
    });
  }

  if ((debugData.emotionSystemLogs as unknown[]).length > 0) {
    console.log('\n=== EMOTION SYSTEM FLOW ===');
    (debugData.emotionSystemLogs as Record<string, unknown>[]).forEach((log, i) => {
      console.log(`${i + 1}. [${log.type}] ${log.text}`);
    });
  }

  console.log(`\nFull report saved to: ${reportPath}`);
});