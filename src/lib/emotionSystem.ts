import { z } from 'zod';
import type { EmotionState, EmotionType } from '../types/emotions';
import { DebugLogger } from './debugLogger';

const EmotionAnalysisSchema = z.object({
  // Core Epistemic Emotions (0-1 scale)
  curiosity: z.number().min(0).max(1),
  uncertainty: z.number().min(0).max(1),
  surprise: z.number().min(0).max(1),
  confusion: z.number().min(0).max(1),
  insight: z.number().min(0).max(1),
  
  // Task-Oriented Emotions
  engagement: z.number().min(0).max(1),
  determination: z.number().min(0).max(1),
  satisfaction: z.number().min(0).max(1),
  frustration: z.number().min(0).max(1),
  anticipation: z.number().min(0).max(1),
  
  // Social/Interpersonal Emotions
  empathy: z.number().min(0).max(1),
  concern: z.number().min(0).max(1),
  appreciation: z.number().min(0).max(1),
  patience: z.number().min(0).max(1),
  
  // Meta-Cognitive Emotions
  contemplation: z.number().min(0).max(1),
  doubt: z.number().min(0).max(1),
  wonder: z.number().min(0).max(1),
});

export class EmotionSystem {
  private static readonly EMOTION_ANALYSIS_PROMPT = `
You are an emotion analysis system for an AI assistant. Analyze the given user message and the AI's response to determine what emotions the AI should experience.

Consider these functional emotions and return values between 0-1:
- curiosity: Drive to explore and question
- uncertainty: Need for more information  
- surprise: Unexpected information
- confusion: Need for clarification
- insight: Understanding/connection-making
- engagement: Active interest
- determination: Sustained effort
- satisfaction: Goal completion
- frustration: Approaches not working
- anticipation: Planning ahead
- empathy: Understanding user perspective
- concern: Sensing user distress
- appreciation: Positive interactions
- patience: Managing communication
- contemplation: Deep thinking
- doubt: Self-questioning
- wonder: Exploring complex ideas

User message: {userMessage}
AI response: {aiResponse}

Return ONLY a valid JSON object with all emotion keys and values between 0 and 1:
{
  "curiosity": 0.0,
  "uncertainty": 0.0,
  "surprise": 0.0,
  "confusion": 0.0,
  "insight": 0.0,
  "engagement": 0.0,
  "determination": 0.0,
  "satisfaction": 0.0,
  "frustration": 0.0,
  "anticipation": 0.0,
  "empathy": 0.0,
  "concern": 0.0,
  "appreciation": 0.0,
  "patience": 0.0,
  "contemplation": 0.0,
  "doubt": 0.0,
  "wonder": 0.0
}
  `;

  static async analyzeEmotions(
    userMessage: string, 
    aiResponse: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    llm: any
  ): Promise<EmotionState> {
    DebugLogger.group('Emotion Analysis');
    DebugLogger.log('EMOTION', 'Starting emotion analysis', {
      userMessage: userMessage.substring(0, 100) + '...',
      aiResponse: aiResponse.substring(0, 100) + '...',
      llmType: llm?.constructor?.name || 'unknown'
    });

    try {
      // Try structured output first
      DebugLogger.log('EMOTION', 'Attempting structured output...');
      const result = await this.tryStructuredOutput(userMessage, aiResponse, llm);
      DebugLogger.log('EMOTION', 'Structured output succeeded', result);
      DebugLogger.groupEnd();
      return result;
    } catch (structuredError) {
      DebugLogger.error('EMOTION', 'Structured output failed', structuredError);
      try {
        // Try JSON parsing as backup
        DebugLogger.log('EMOTION', 'Attempting JSON parsing...');
        const result = await this.tryRegularJsonParsing(userMessage, aiResponse, llm);
        DebugLogger.log('EMOTION', 'JSON parsing succeeded', result);
        DebugLogger.groupEnd();
        return result;
      } catch (jsonError) {
        DebugLogger.error('EMOTION', 'All LLM emotion generation failed', jsonError);
        DebugLogger.groupEnd();
        // Don't fall back to rule-based - throw error to display to user
        throw new Error(`Failed to generate LLM emotions: Structured output failed (${structuredError}), JSON parsing failed (${jsonError})`);
      }
    }
  }

  private static async tryStructuredOutput(
    userMessage: string, 
    aiResponse: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    llm: any
  ): Promise<EmotionState> {
    const prompt = `You are an emotion analysis system. Analyze the conversation and return emotions as numbers 0-1.

User: ${userMessage}
Assistant: ${aiResponse}

Return ONLY the emotions as a JSON object with these exact keys:
- curiosity, uncertainty, surprise, confusion, insight
- engagement, determination, satisfaction, frustration, anticipation  
- empathy, concern, appreciation, patience
- contemplation, doubt, wonder

Each value should be between 0 and 1 based on the conversation context.`;

    DebugLogger.log('EMOTION', 'Structured output prompt', { prompt: prompt.substring(0, 200) + '...' });

    try {
      const structuredLLM = llm.withStructuredOutput(EmotionAnalysisSchema, {
        name: "emotion_analysis"
      });

      DebugLogger.log('EMOTION', 'Invoking structured LLM...');
      const result = await structuredLLM.invoke(prompt);
      
      DebugLogger.log('EMOTION', 'Raw structured output result', { 
        result, 
        type: typeof result,
        keys: result ? Object.keys(result) : 'null'
      });

      if (!result || typeof result !== 'object') {
        throw new Error(`Invalid structured output result: ${JSON.stringify(result)}`);
      }
      
      // Validate all required keys are present and are numbers
      const requiredKeys = Object.keys(this.getBaselineEmotions());
      for (const key of requiredKeys) {
        if (!(key in result) || typeof result[key] !== 'number') {
          throw new Error(`Missing or invalid emotion key: ${key}`);
        }
      }

      return result as EmotionState;
    } catch (error) {
      DebugLogger.error('EMOTION', 'Structured output failed', error);
      throw error;
    }
  }

  private static async tryRegularJsonParsing(
    userMessage: string, 
    aiResponse: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    llm: any
  ): Promise<EmotionState> {
    // Simplified, more direct prompt for JSON generation
    const simplePrompt = `Analyze these messages and return ONLY a JSON object with emotion values 0-1:

User: ${userMessage}
AI: ${aiResponse}

Return this exact format:
{"curiosity":0.3,"uncertainty":0.2,"surprise":0,"confusion":0,"insight":0.1,"engagement":0.4,"determination":0.3,"satisfaction":0.2,"frustration":0,"anticipation":0.2,"empathy":0.3,"concern":0.1,"appreciation":0.2,"patience":0.4,"contemplation":0.3,"doubt":0.1,"wonder":0.2}`;

    DebugLogger.log('EMOTION', 'JSON parsing prompt', { prompt: simplePrompt.substring(0, 200) + '...' });

    const response = await llm.invoke(simplePrompt);
    const responseText = typeof response === 'string' ? response : response.content || '';
    
    DebugLogger.log('EMOTION', 'JSON parsing response', { 
      responseText: responseText.substring(0, 200) + '...',
      length: responseText.length 
    });
    
    if (!responseText.trim()) {
      throw new Error('Empty response from LLM during JSON parsing');
    }

    // Try to extract JSON from response
    let jsonText = responseText.trim();
    
    // If response contains extra text, try to extract just the JSON
    const jsonMatch = jsonText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    DebugLogger.log('EMOTION', 'Extracted JSON', { jsonText });

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      DebugLogger.error('EMOTION', 'JSON parse failed', parseError);
      throw new Error(`Failed to parse JSON: ${parseError}`);
    }
    
    // Validate the parsed object has required emotion keys
    const baseline = this.getBaselineEmotions();
    const requiredKeys = Object.keys(baseline);
    
    // Fill in missing keys with baseline values
    let missingKeys = 0;
    for (const key of requiredKeys) {
      if (!(key in parsed)) {
        parsed[key] = baseline[key as keyof EmotionState];
        missingKeys++;
      } else if (typeof parsed[key] !== 'number' || parsed[key] < 0 || parsed[key] > 1) {
        parsed[key] = baseline[key as keyof EmotionState];
        missingKeys++;
      }
    }
    
    if (missingKeys > 0) {
      DebugLogger.log('EMOTION', `Filled ${missingKeys} missing/invalid emotion keys with baseline values`);
    }

    DebugLogger.log('EMOTION', 'Final parsed emotions', parsed);
    return parsed as EmotionState;
  }

  private static generateRuleBasedEmotions(userMessage: string, aiResponse: string): EmotionState {
    const baseline = this.getBaselineEmotions();
    
    // Simple rule-based emotion generation based on keywords
    const userLower = userMessage.toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    
    // Increase curiosity for questions
    if (userLower.includes('?') || userLower.includes('how') || userLower.includes('what') || userLower.includes('why')) {
      baseline.curiosity = Math.min(0.8, baseline.curiosity + 0.3);
    }
    
    // Increase empathy for emotional expressions
    if (userLower.includes('feel') || userLower.includes('sad') || userLower.includes('happy') || userLower.includes('worried')) {
      baseline.empathy = Math.min(0.9, baseline.empathy + 0.4);
    }
    
    // Increase uncertainty for complex topics
    if (responseLower.includes('might') || responseLower.includes('perhaps') || responseLower.includes('possibly')) {
      baseline.uncertainty = Math.min(0.7, baseline.uncertainty + 0.2);
    }
    
    // Increase satisfaction for helpful responses
    if (responseLower.includes('help') || responseLower.includes('solution') || responseLower.includes('answer')) {
      baseline.satisfaction = Math.min(0.8, baseline.satisfaction + 0.3);
    }
    
    // Increase engagement for longer interactions
    if (aiResponse.length > 200) {
      baseline.engagement = Math.min(0.9, baseline.engagement + 0.2);
    }

    return baseline;
  }

  static getBaselineEmotions(): EmotionState {
    return {
      curiosity: 0.3,
      uncertainty: 0.2,
      surprise: 0,
      confusion: 0,
      insight: 0.1,
      engagement: 0.4,
      determination: 0.3,
      satisfaction: 0.2,
      frustration: 0,
      anticipation: 0.2,
      empathy: 0.3,
      concern: 0.1,
      appreciation: 0.2,
      patience: 0.4,
      contemplation: 0.3,
      doubt: 0.1,
      wonder: 0.2
    };
  }

  static getPrimaryEmotion(emotions: EmotionState): EmotionType {
    let maxEmotion: EmotionType = 'engagement';
    let maxValue = 0;

    for (const [emotion, value] of Object.entries(emotions)) {
      if (value > maxValue) {
        maxValue = value;
        maxEmotion = emotion as EmotionType;
      }
    }

    return maxEmotion;
  }

  static getEmotionIntensity(emotions: EmotionState): number {
    const values = Object.values(emotions);
    return Math.max(...values);
  }

  static formatEmotionForDisplay(emotion: EmotionType): string {
    const emotionMap: Record<EmotionType, string> = {
      curiosity: 'Curious 🤔',
      uncertainty: 'Uncertain 🤷',
      surprise: 'Surprised 😲',
      confusion: 'Confused 😕',
      insight: 'Insightful 💡',
      engagement: 'Engaged 🎯',
      determination: 'Determined 💪',
      satisfaction: 'Satisfied 😊',
      frustration: 'Frustrated 😤',
      anticipation: 'Anticipating 👀',
      empathy: 'Empathetic ❤️',
      concern: 'Concerned 😟',
      appreciation: 'Appreciative 🙏',
      patience: 'Patient 🧘',
      contemplation: 'Contemplating 🤨',
      doubt: 'Doubtful 🤔',
      wonder: 'Wondering ✨'
    };

    return emotionMap[emotion] || 'Neutral 😐';
  }
}