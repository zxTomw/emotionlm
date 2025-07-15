import React from 'react';
import type { ChatMessage as ChatMessageType } from '../types/emotions';
import { EmotionVisualization } from './EmotionVisualization';

interface ChatMessageProps {
  message: ChatMessageType;
  showEmotions?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  showEmotions = true
}) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="message-header">
        <span className="message-role">
          {isUser ? '👤 You' : '🤖 AI Assistant'}
        </span>
        <span className="message-timestamp">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      
      <div className="message-content">
        {message.content}
      </div>
      
      {!isUser && message.emotions && message.primaryEmotion && showEmotions && (
        <div className="message-emotions">
          <EmotionVisualization
            emotions={message.emotions}
            primaryEmotion={message.primaryEmotion}
            className="compact"
          />
        </div>
      )}
    </div>
  );
};