import { useState, useCallback, useMemo } from 'react';
import { ChatOllama } from '@langchain/ollama';
import type { ChatMessage } from '../types/emotions';
import { EmotionSystem } from '../lib/emotionSystem';
import { DebugLogger } from '../lib/debugLogger';

export const useChat = (modelName: string = 'llama3.2:1b') => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const llm = useMemo(() => new ChatOllama({
    model: modelName,
    temperature: 0.7,
    maxRetries: 2,
  }), [modelName]);


  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    DebugLogger.group('Chat Message');
    DebugLogger.log('CHAT', 'Sending message', { content, modelName });

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      DebugLogger.log('CHAT', 'Generating combined response with emotions...');
      const combinedResult = await EmotionSystem.generateResponseWithEmotions(content, llm);
      
      DebugLogger.log('CHAT', 'Combined response received', {
        responseLength: combinedResult.response.length,
        responsePreview: combinedResult.response.substring(0, 100),
        emotionKeys: Object.keys(combinedResult.emotions).length
      });

      if (!combinedResult.response || combinedResult.response.trim() === '') {
        throw new Error('Empty response from LLM');
      }

      const primaryEmotion = EmotionSystem.getPrimaryEmotion(combinedResult.emotions);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: combinedResult.response,
        emotions: combinedResult.emotions,
        primaryEmotion,
        timestamp: new Date()
      };

      DebugLogger.log('CHAT', 'Message completed successfully', {
        primaryEmotion,
        emotionIntensity: EmotionSystem.getEmotionIntensity(combinedResult.emotions)
      });

      setMessages(prev => [...prev, assistantMessage]);
      DebugLogger.groupEnd();
    } catch (err) {
      DebugLogger.error('CHAT', 'Chat error occurred', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure Ollama is running and the model is available.',
        emotions: EmotionSystem.getBaselineEmotions(),
        primaryEmotion: 'concern',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      DebugLogger.groupEnd();
    } finally {
      setIsLoading(false);
    }
  }, [llm, modelName]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    error
  };
};