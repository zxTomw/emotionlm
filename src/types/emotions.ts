export interface EmotionState {
  // Core Epistemic Emotions
  curiosity: number;
  uncertainty: number;
  surprise: number;
  confusion: number;
  insight: number;
  
  // Task-Oriented Emotions
  engagement: number;
  determination: number;
  satisfaction: number;
  frustration: number;
  anticipation: number;
  
  // Social/Interpersonal Emotions
  empathy: number;
  concern: number;
  appreciation: number;
  patience: number;
  
  // Meta-Cognitive Emotions
  contemplation: number;
  doubt: number;
  wonder: number;
}

export type EmotionType = keyof EmotionState;

export interface EmotionResponse {
  content: string;
  emotions: EmotionState;
  primaryEmotion: EmotionType;
  emotionIntensity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotions?: EmotionState;
  primaryEmotion?: EmotionType;
  timestamp: Date;
}

export const EMOTION_CATEGORIES = {
  epistemic: ['curiosity', 'uncertainty', 'surprise', 'confusion', 'insight'],
  taskOriented: ['engagement', 'determination', 'satisfaction', 'frustration', 'anticipation'],
  social: ['empathy', 'concern', 'appreciation', 'patience'],
  metaCognitive: ['contemplation', 'doubt', 'wonder']
} as const;

export const EMOTION_COLORS = {
  // Core Epistemic Emotions
  curiosity: '#4F46E5',
  uncertainty: '#F59E0B',
  surprise: '#EC4899',
  confusion: '#EF4444',
  insight: '#10B981',
  
  // Task-Oriented Emotions
  engagement: '#3B82F6',
  determination: '#DC2626',
  satisfaction: '#059669',
  frustration: '#B91C1C',
  anticipation: '#7C3AED',
  
  // Social/Interpersonal Emotions
  empathy: '#06B6D4',
  concern: '#F97316',
  appreciation: '#84CC16',
  patience: '#6366F1',
  
  // Meta-Cognitive Emotions
  contemplation: '#8B5CF6',
  doubt: '#6B7280',
  wonder: '#F472B6'
} as const;