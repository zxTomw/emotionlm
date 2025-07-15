import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Structured Output Analysis', () => {
  test('Analyze Structured Output Failures', async ({ page }) => {
    const analysisReport: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      rawLLMResponses: [],
      structuredOutputAttempts: [],
      jsonParsingAttempts: [],
      ruleBasedFallbacks: [],
      networkActivity: []
    };

    // Enhanced console capture for LangChain specific messages
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      
      // Capture LangChain structured output attempts
      if (text.includes('withStructuredOutput') || text.includes('StructuredOutputParser')) {
        analysisReport.structuredOutputAttempts.push({
          timestamp: new Date().toISOString(),
          type,
          message: text,
          args: msg.args()
        });
      }
      
      // Capture raw LLM responses
      if (text.includes('Raw structured output result') || text.includes('LLM response received')) {
        analysisReport.rawLLMResponses.push({
          timestamp: new Date().toISOString(),
          type,
          message: text
        });
      }
      
      // Capture JSON parsing attempts
      if (text.includes('JSON parsing') || text.includes('tryRegularJsonParsing')) {
        analysisReport.jsonParsingAttempts.push({
          timestamp: new Date().toISOString(),
          type,
          message: text
        });
      }
      
      // Capture rule-based fallbacks
      if (text.includes('rule-based emotions') || text.includes('generateRuleBasedEmotions')) {
        analysisReport.ruleBasedFallbacks.push({
          timestamp: new Date().toISOString(),
          type,
          message: text
        });
      }
    });

    // Capture network requests to Ollama
    page.on('request', (request) => {
      if (request.url().includes('localhost:11434') || request.url().includes('ollama')) {
        analysisReport.networkActivity.push({
          timestamp: new Date().toISOString(),
          type: 'request',
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('localhost:11434') || response.url().includes('ollama')) {
        try {
          const responseText = await response.text();
          analysisReport.networkActivity.push({
            timestamp: new Date().toISOString(),
            type: 'response',
            url: response.url(),
            status: response.status(),
            headers: response.headers(),
            body: responseText.substring(0, 1000) // Limit size
          });
        } catch {
          analysisReport.networkActivity.push({
            timestamp: new Date().toISOString(),
            type: 'response_error',
            url: response.url(),
            status: response.status(),
            error: String(e)
          });
        }
      }
    });

    // Navigate to app
    await page.goto('/');
    
    // Enable debug mode
    await page.click('button:has-text("Show Debug")');
    
    // Test structured output specifically
    await page.click('button:has-text("Test Structured Output")');
    await page.waitForTimeout(5000);
    
    // Try multiple chat interactions to gather more data
    const testMessages = [
      'Hello',
      'How are you feeling today?',
      'What is the meaning of life?',
      'Can you help me with programming?'
    ];
    
    for (const message of testMessages) {
      await page.fill('input[placeholder="Type your message here..."]', message);
      await page.click('button:has-text("📤")');
      
      // Wait for response
      try {
        await page.waitForSelector('.chat-message:last-child .message-content', { timeout: 30000 });
        await page.waitForTimeout(2000); // Wait for emotion analysis
      } catch {
        console.log(`Timeout waiting for response to: ${message}`);
      }
    }
    
    // Save detailed analysis report
    const reportPath = path.join(process.cwd(), 'debug-reports', `structured-output-analysis-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(analysisReport, null, 2));
    
    // Generate analysis
    console.log('\n=== STRUCTURED OUTPUT ANALYSIS ===');
    console.log(`Structured Output Attempts: ${analysisReport.structuredOutputAttempts.length}`);
    console.log(`Raw LLM Responses: ${analysisReport.rawLLMResponses.length}`);
    console.log(`JSON Parsing Attempts: ${analysisReport.jsonParsingAttempts.length}`);
    console.log(`Rule-based Fallbacks: ${analysisReport.ruleBasedFallbacks.length}`);
    console.log(`Network Activity: ${analysisReport.networkActivity.length}`);
    
    if (Array.isArray(analysisReport.structuredOutputAttempts) && analysisReport.structuredOutputAttempts.length > 0) {
      console.log('\n=== STRUCTURED OUTPUT DETAILS ===');
      analysisReport.structuredOutputAttempts.forEach((attempt: Record<string, unknown>, i: number) => {
        console.log(`${i + 1}. [${attempt.type}] ${attempt.message}`);
      });
    }
    
    if (Array.isArray(analysisReport.networkActivity) && analysisReport.networkActivity.length > 0) {
      console.log('\n=== OLLAMA NETWORK ACTIVITY ===');
      analysisReport.networkActivity.forEach((activity: Record<string, unknown>, i: number) => {
        console.log(`${i + 1}. [${activity.type}] ${activity.url} - Status: ${activity.status || 'N/A'}`);
        if (activity.body && typeof activity.body === 'string') {
          console.log(`   Response: ${activity.body.substring(0, 200)}...`);
        }
      });
    }
    
    console.log(`\nDetailed report saved to: ${reportPath}`);
  });
  
  test('Monitor LangChain Internal Calls', async ({ page }) => {
    const langchainCalls: Record<string, unknown>[] = [];
    
    // Intercept and log all console messages that might reveal LangChain internals
    page.on('console', (msg) => {
      const text = msg.text();
      
      // Look for specific LangChain patterns
      if (text.includes('invoke') || 
          text.includes('ChatOllama') || 
          text.includes('withStructuredOutput') ||
          text.includes('_RunnableSequence') ||
          text.includes('StructuredOutputParser')) {
        langchainCalls.push({
          timestamp: new Date().toISOString(),
          type: msg.type(),
          text: text,
          location: msg.location()
        });
      }
    });
    
    await page.goto('/');
    
    // Trigger a single chat interaction
    await page.fill('input[placeholder="Type your message here..."]', 'Test message for LangChain analysis');
    await page.click('button:has-text("📤")');
    
    // Wait for completion
    await page.waitForTimeout(15000);
    
    console.log('\n=== LANGCHAIN INTERNAL CALLS ===');
    langchainCalls.forEach((call, i) => {
      console.log(`${i + 1}. [${call.type}] ${call.text}`);
      if (call.location) {
        console.log(`   Location: ${call.location.url}:${call.location.lineNumber}`);
      }
    });
    
    // Save the LangChain call analysis
    const reportPath = path.join(process.cwd(), 'debug-reports', `langchain-calls-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(langchainCalls, null, 2));
    console.log(`\nLangChain calls report saved to: ${reportPath}`);
  });
});