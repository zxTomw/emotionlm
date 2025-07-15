import React, { useState } from 'react';
import { ChatOllama } from '@langchain/ollama';
import { DebugLogger } from '../lib/debugLogger';

export const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Not tested');
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setStatus('Testing...');
    setDetails(null);

    try {
      DebugLogger.log('TEST', 'Creating ChatOllama instance...');
      const llm = new ChatOllama({
        model: 'llama3.2:latest',
        temperature: 0.7,
        maxRetries: 1,
      });

      DebugLogger.log('TEST', 'Testing basic invoke...');
      const response = await llm.invoke('Say "Hello test" and nothing else.');
      
      DebugLogger.log('TEST', 'Response received', response);

      setDetails({
        response,
        type: typeof response,
        hasContent: !!response?.content,
        contentType: typeof response?.content,
        contentLength: response?.content?.length || 0,
        content: response?.content
      });

      if (response?.content && response.content.length > 0) {
        setStatus('✅ Connection successful');
      } else {
        setStatus('❌ Empty response from LLM');
      }
    } catch (error) {
      DebugLogger.error('TEST', 'Connection test failed', error);
      setStatus(`❌ Connection failed: ${error}`);
      setDetails({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const testStructuredOutput = async () => {
    setIsLoading(true);
    setStatus('Testing structured output...');

    try {
      const llm = new ChatOllama({
        model: 'llama3.2:latest',
        temperature: 0.7,
      });

      const structuredLLM = llm.withStructuredOutput({
        type: 'object',
        properties: {
          emotion: { type: 'string' },
          intensity: { type: 'number' }
        }
      });

      const result = await structuredLLM.invoke('Return emotion: happy, intensity: 0.8');
      
      setDetails({ structuredResult: result });
      setStatus('✅ Structured output works');
    } catch (error) {
      setStatus(`❌ Structured output failed: ${error}`);
      setDetails({ structuredError: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #333', margin: '1rem', borderRadius: '8px' }}>
      <h3>🔧 Ollama Connection Test</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={testConnection} 
          disabled={isLoading}
          style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}
        >
          Test Basic Connection
        </button>
        
        <button 
          onClick={testStructuredOutput} 
          disabled={isLoading}
          style={{ padding: '0.5rem 1rem' }}
        >
          Test Structured Output
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Status:</strong> {status}
      </div>

      {details && (
        <div>
          <strong>Details:</strong>
          <pre style={{ 
            background: '#1a1a1a', 
            padding: '1rem', 
            borderRadius: '4px', 
            overflow: 'auto',
            fontSize: '0.8rem'
          }}>
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
        <strong>Prerequisites:</strong>
        <ul>
          <li>Ollama should be running: <code>ollama serve</code></li>
          <li>Model should be available: <code>ollama pull llama3.2</code></li>
          <li>Check Ollama at: <a href="http://localhost:11434" target="_blank">http://localhost:11434</a></li>
        </ul>
      </div>
    </div>
  );
};