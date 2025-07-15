import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Deep Debug Structured Output Failure', async ({ page }) => {
  const structuredOutputDebug: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    llmCalls: [],
    structuredOutputAttempts: [],
    errors: [],
    ollmaRequests: [],
    responses: []
  };

  // Intercept all network requests to Ollama
  page.on('request', (request) => {
    if (request.url().includes('localhost:11434')) {
      const ollmaRequest = {
        timestamp: new Date().toISOString(),
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      };
      console.log('🌐 Ollama Request:', ollmaRequest);
      (structuredOutputDebug.ollmaRequests as unknown[]).push(ollmaRequest);
    }
  });

  page.on('response', async (response) => {
    if (response.url().includes('localhost:11434')) {
      try {
        const responseBody = await response.text();
        const ollmaResponse = {
          timestamp: new Date().toISOString(),
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: responseBody
        };
        console.log('🔄 Ollama Response:', {
          status: ollmaResponse.status,
          bodyLength: responseBody.length,
          bodyPreview: responseBody.substring(0, 200)
        });
        (structuredOutputDebug.responses as unknown[]).push(ollmaResponse);
      } catch (e) {
        console.log('❌ Failed to read Ollama response:', e);
      }
    }
  });

  // Capture all console messages
  page.on('console', (msg) => {
    const text = msg.text();
    
    if (text.includes('withStructuredOutput') || text.includes('StructuredOutputParser')) {
      const structuredAttempt = {
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: text,
        location: msg.location()
      };
      console.log('🔧 Structured Output:', structuredAttempt);
      (structuredOutputDebug.structuredOutputAttempts as unknown[]).push(structuredAttempt);
    }

    if (msg.type() === 'error') {
      const error = {
        timestamp: new Date().toISOString(),
        text: text,
        location: msg.location()
      };
      console.log('❌ Console Error:', error);
      (structuredOutputDebug.errors as unknown[]).push(error);
    }

    if (text.includes('LLM') || text.includes('invoke') || text.includes('ChatOllama')) {
      const llmCall = {
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: text
      };
      (structuredOutputDebug.llmCalls as unknown[]).push(llmCall);
    }
  });

  await page.goto('/');

  // Enable debug mode
  await page.click('button:has-text("Show Debug")');
  
  console.log('\n🧪 Testing Structured Output Manually...');
  
  // Test structured output component
  await page.click('button:has-text("Test Structured Output")');
  
  // Wait for test to complete
  await page.waitForTimeout(10000);
  
  console.log('\n💬 Testing Chat Interaction...');
  
  // Send a simple message to trigger emotion analysis
  await page.fill('input[placeholder="Type your message here..."]', 'Hello, tell me about emotions');
  await page.click('button:has-text("📤")');
  
  // Wait for response
  await page.waitForTimeout(15000);

  // Save debug report
  const reportPath = path.join(process.cwd(), 'debug-reports', `structured-output-debug-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(structuredOutputDebug, null, 2));

  console.log('\n📊 === STRUCTURED OUTPUT DEBUG SUMMARY ===');
  console.log(`Ollama Requests: ${(structuredOutputDebug.ollmaRequests as unknown[]).length}`);
  console.log(`Ollama Responses: ${(structuredOutputDebug.responses as unknown[]).length}`);
  console.log(`Structured Output Attempts: ${(structuredOutputDebug.structuredOutputAttempts as unknown[]).length}`);
  console.log(`Errors: ${(structuredOutputDebug.errors as unknown[]).length}`);
  console.log(`LLM Calls: ${(structuredOutputDebug.llmCalls as unknown[]).length}`);

  // Analyze the actual structured output failure
  if ((structuredOutputDebug.structuredOutputAttempts as unknown[]).length > 0) {
    console.log('\n🔍 === STRUCTURED OUTPUT ANALYSIS ===');
    (structuredOutputDebug.structuredOutputAttempts as Record<string, unknown>[]).forEach((attempt, i) => {
      console.log(`${i + 1}. ${attempt.text}`);
    });
  }

  // Check if Ollama is responding correctly
  if ((structuredOutputDebug.responses as unknown[]).length > 0) {
    console.log('\n🌐 === OLLAMA COMMUNICATION ===');
    (structuredOutputDebug.responses as Record<string, unknown>[]).forEach((response, i) => {
      console.log(`${i + 1}. Status: ${response.status}`);
      if (typeof response.body === 'string') {
        console.log(`   Body Length: ${response.body.length}`);
        console.log(`   Content Preview: ${response.body.substring(0, 150)}...`);
      }
    });
  }

  console.log(`\n📄 Full debug report: ${reportPath}`);
});