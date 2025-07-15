import { useState, useCallback, useMemo } from 'react';
import { ChatOllama } from '@langchain/ollama';
import type { ChatMessage } from '../types/emotions';
import { EmotionSystem } from '../lib/emotionSystem';

export const useChat = (modelName: string = 'llama3.2') => {
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
      const response = await llm.invoke(content);
      const aiResponse = response.content as string;

      const emotions = await EmotionSystem.analyzeEmotions(
        content,
        aiResponse,
        llm
      );

      const primaryEmotion = EmotionSystem.getPrimaryEmotion(emotions);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        emotions,
        primaryEmotion,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
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
    } finally {
      setIsLoading(false);
    }
  }, [llm]);

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