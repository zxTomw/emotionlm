import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: string;
  location?: string;
}

interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  requestBody?: string;
  responseBody?: string;
  timestamp: string;
  error?: string;
}

interface DebugReport {
  timestamp: string;
  consoleLogs: ConsoleMessage[];
  networkRequests: NetworkRequest[];
  errors: Record<string, unknown>[];
  llmResponses: ConsoleMessage[];
  emotionAnalysis: ConsoleMessage[];
}

test.describe('EmotionLM Debugging', () => {
  let debugReport: DebugReport;
  const consoleLogs: ConsoleMessage[] = [];
  const networkRequests: NetworkRequest[] = [];
  const errors: Record<string, unknown>[] = [];

  test.beforeEach(async ({ page }) => {
    // Initialize debug report
    debugReport = {
      timestamp: new Date().toISOString(),
      consoleLogs: [],
      networkRequests: [],
      errors: [],
      llmResponses: [],
      emotionAnalysis: []
    };

    // Capture console messages
    page.on('console', (msg) => {
      const consoleMsg: ConsoleMessage = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
        location: msg.location()?.url
      };
      consoleLogs.push(consoleMsg);
      debugReport.consoleLogs.push(consoleMsg);
    });

    // Capture network requests
    page.on('request', (request) => {
      const networkReq: NetworkRequest = {
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString(),
        requestBody: request.postData() || undefined
      };
      networkRequests.push(networkReq);
    });

    page.on('response', async (response) => {
      const request = networkRequests.find(req => 
        req.url === response.url() && 
        req.method === response.request().method()
      );
      
      if (request) {
        request.status = response.status();
        try {
          request.responseBody = await response.text();
        } catch (e) {
          request.error = `Failed to read response: ${e}`;
        }
        debugReport.networkRequests.push(request);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      errors.push(errorInfo);
      debugReport.errors.push(errorInfo);
    });

    // Navigate to the app
    await page.goto('/');
  });

  test('Debug Basic App Loading', async ({ page }) => {
    // Wait for app to load
    await expect(page.locator('h1')).toContainText('EmotionLM Chat');
    
    // Check for initial console errors
    const initialErrors = consoleLogs.filter(log => log.type === 'error');
    
    console.log('=== INITIAL LOAD ANALYSIS ===');
    console.log(`Console Errors: ${initialErrors.length}`);
    console.log(`Network Requests: ${networkRequests.length}`);
    console.log(`Page Errors: ${errors.length}`);
    
    if (initialErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      initialErrors.forEach((error, i) => {
        console.log(`${i + 1}. [${error.timestamp}] ${error.text}`);
      });
    }
  });

  test('Debug Connection Test', async ({ page }) => {
    // Click Show Debug button
    await page.click('button:has-text("Show Debug")');
    
    // Wait for connection test component
    await expect(page.locator('h3:has-text("Ollama Connection Test")')).toBeVisible();
    
    // Click Test Basic Connection
    await page.click('button:has-text("Test Basic Connection")');
    
    // Wait for test to complete (up to 30 seconds)
    await page.waitForFunction(() => {
      const statusElement = document.querySelector('strong:has-text("Status:")');
      return statusElement && 
             statusElement.textContent &&
             !statusElement.textContent.includes('Testing...');
    }, { timeout: 30000 });
    
    // Capture the test results
    const status = await page.locator('strong:has-text("Status:")').textContent();
    const details = await page.locator('pre').textContent();
    
    console.log('\n=== CONNECTION TEST RESULTS ===');
    console.log(`Status: ${status}`);
    console.log(`Details: ${details}`);
    
    // Filter LLM-related console logs
    const llmLogs = consoleLogs.filter(log => 
      log.text.includes('CHAT') || 
      log.text.includes('EMOTION') || 
      log.text.includes('TEST') ||
      log.text.includes('LLM') ||
      log.text.includes('Ollama')
    );
    
    debugReport.llmResponses = llmLogs;
    
    console.log('\n=== LLM-RELATED LOGS ===');
    llmLogs.forEach((log, i) => {
      console.log(`${i + 1}. [${log.type.toUpperCase()}] ${log.text}`);
    });
  });

  test('Debug Chat Interaction', async ({ page }) => {
    // Type a simple message
    const testMessage = 'Hello, how are you?';
    await page.fill('input[placeholder="Type your message here..."]', testMessage);
    
    // Send the message
    await page.click('button:has-text("📤")');
    
    // Wait for loading to start
    await expect(page.locator('text=🤖 Thinking...')).toBeVisible();
    
    // Wait for response (up to 60 seconds)
    await page.waitForFunction(() => {
      const loadingIndicator = document.querySelector('text=🤖 Thinking...');
      return !loadingIndicator || getComputedStyle(loadingIndicator).display === 'none';
    }, { timeout: 60000 });
    
    // Wait a bit more for emotion analysis
    await page.waitForTimeout(2000);
    
    // Capture emotion-related logs
    const emotionLogs = consoleLogs.filter(log => 
      log.text.includes('EMOTION') || 
      log.text.includes('emotion') ||
      log.text.includes('structured output') ||
      log.text.includes('JSON parsing')
    );
    
    debugReport.emotionAnalysis = emotionLogs;
    
    console.log('\n=== CHAT INTERACTION ANALYSIS ===');
    console.log(`Total Console Messages: ${consoleLogs.length}`);
    console.log(`Emotion-related Messages: ${emotionLogs.length}`);
    console.log(`Network Requests: ${networkRequests.length}`);
    
    console.log('\n=== EMOTION ANALYSIS LOGS ===');
    emotionLogs.forEach((log, i) => {
      console.log(`${i + 1}. [${log.type.toUpperCase()}] ${log.text}`);
    });
    
    // Check for structured output errors specifically
    const structuredOutputErrors = consoleLogs.filter(log => 
      log.text.includes('Structured output failed') ||
      log.text.includes('OutputParserException') ||
      log.text.includes('Unexpected end of JSON input')
    );
    
    console.log('\n=== STRUCTURED OUTPUT ERRORS ===');
    structuredOutputErrors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.text}`);
    });
    
    // Check if there are any AI responses
    const chatMessages = await page.locator('.chat-message').count();
    console.log(`\nTotal Chat Messages: ${chatMessages}`);
    
    if (chatMessages > 1) {
      const lastMessage = page.locator('.chat-message').last();
      const messageContent = await lastMessage.locator('.message-content').textContent();
      const emotions = await lastMessage.locator('.emotion-visualization').isVisible();
      
      console.log(`Last AI Response: "${messageContent?.substring(0, 100)}..."`);
      console.log(`Emotions Displayed: ${emotions}`);
    }
  });

  test.afterEach(async () => {
    // Save debug report to file
    const reportPath = path.join(process.cwd(), 'debug-reports', `debug-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(debugReport, null, 2));
    console.log(`\n=== DEBUG REPORT SAVED ===`);
    console.log(`Report saved to: ${reportPath}`);
    
    // Generate summary
    const summary = {
      totalConsoleMessages: debugReport.consoleLogs.length,
      errorMessages: debugReport.consoleLogs.filter(log => log.type === 'error').length,
      warningMessages: debugReport.consoleLogs.filter(log => log.type === 'warn').length,
      networkRequests: debugReport.networkRequests.length,
      pageErrors: debugReport.errors.length,
      emotionAnalysisAttempts: debugReport.emotionAnalysis.length,
      llmResponses: debugReport.llmResponses.length
    };
    
    console.log('\n=== DEBUGGING SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
  });
});