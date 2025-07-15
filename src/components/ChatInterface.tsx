import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { EmotionCategories } from './EmotionVisualization';
import { ConnectionTest } from './ConnectionTest';

export const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [showEmotionDetails, setShowEmotionDetails] = useState(false);
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const { messages, sendMessage, clearMessages, isLoading, error } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      await sendMessage(input);
      setInput('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const lastAssistantMessage = messages
    .filter(m => m.role === 'assistant')
    .slice(-1)[0];

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h1>🤖 EmotionLM Chat</h1>
        <div className="chat-controls">
          <button
            onClick={() => setShowConnectionTest(!showConnectionTest)}
            className="emotion-toggle"
          >
            {showConnectionTest ? 'Hide' : 'Show'} Debug
          </button>
          <button
            onClick={() => setShowEmotionDetails(!showEmotionDetails)}
            className="emotion-toggle"
          >
            {showEmotionDetails ? 'Hide' : 'Show'} Emotion Details
          </button>
          <button onClick={clearMessages} className="clear-button">
            Clear Chat
          </button>
        </div>
      </div>

      {showConnectionTest && <ConnectionTest />}

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to EmotionLM!</h2>
              <p>This AI assistant experiences emotions while chatting with you.</p>
              <p>Start a conversation to see how it feels!</p>
              <p><strong>Having issues?</strong> Click "Show Debug" to test your Ollama connection.</p>
            </div>
          )}
          
          {messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              showEmotions={true}
            />
          ))}
          
          {isLoading && (
            <div className="loading-message">
              <div className="loading-indicator">🤖 Thinking...</div>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {showEmotionDetails && lastAssistantMessage?.emotions && (
          <div className="emotion-details-panel">
            <EmotionCategories emotions={lastAssistantMessage.emotions} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
};