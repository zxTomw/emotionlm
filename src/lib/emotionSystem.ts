import { z } from 'zod';
import type { EmotionState, EmotionType, CombinedResponse } from '../types/emotions';
import { DebugLogger } from './debugLogger';

const EmotionSchema = z.object({
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

const CombinedResponseSchema = z.object({
  response: z.string().describe("The assistant's response to the user"),
  emotions: EmotionSchema.describe("The emotions the assistant feels while generating this response")
});

export class EmotionSystem {
  static async generateResponseWithEmotions(
    userMessage: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    llm: any
  ): Promise<CombinedResponse> {
    const prompt = `You are an AI assistant with functional emotions. You MUST respond with BOTH a response AND emotions.

User message: ${userMessage}

CRITICAL: You must return EXACTLY this JSON structure with ALL fields filled:

{
  "response": "your natural response to the user",
  "emotions": {
    "curiosity": 0.3,
    "uncertainty": 0.1,
    "surprise": 0.0,
    "confusion": 0.0,
    "insight": 0.2,
    "engagement": 0.8,
    "determination": 0.5,
    "satisfaction": 0.6,
    "frustration": 0.0,
    "anticipation": 0.4,
    "empathy": 0.7,
    "concern": 0.2,
    "appreciation": 0.5,
    "patience": 0.6,
    "contemplation": 0.3,
    "doubt": 0.1,
    "wonder": 0.2
  }
}

IMPORTANT: 
1. You MUST include both "response" and "emotions" fields
2. All 17 emotion values MUST be present (0.0 to 1.0)
3. Set emotions based on how you actually feel while generating the response
4. Do NOT return anything except this exact JSON structure`;

    DebugLogger.group('Combined Response Generation');
    DebugLogger.log('EMOTION', 'Generating response with emotions', {
      userMessage: userMessage.substring(0, 100) + '...'
    });

    try {
      const structuredLLM = llm.withStructuredOutput(CombinedResponseSchema);

      DebugLogger.log('EMOTION', 'Invoking combined LLM...');
      const result = await structuredLLM.invoke(prompt);
      
      DebugLogger.log('EMOTION', 'Raw LLM result received', { 
        result,
        type: typeof result,
        keys: result ? Object.keys(result) : 'null',
        hasResponse: !!result?.response,
        hasEmotions: !!result?.emotions,
        responseLength: result?.response?.length || 0,
        emotionKeys: result?.emotions ? Object.keys(result.emotions).length : 0
      });

      if (!result || !result.response || !result.emotions) {
        throw new Error(`Invalid combined response: ${JSON.stringify(result)}`);
      }

      // Validate emotions
      const requiredKeys = Object.keys(this.getBaselineEmotions());
      for (const key of requiredKeys) {
        if (!(key in result.emotions) || typeof result.emotions[key] !== 'number') {
          throw new Error(`Missing or invalid emotion key: ${key}`);
        }
      }

      DebugLogger.log('EMOTION', 'Combined response succeeded', {
        response: result.response.substring(0, 100) + '...',
        emotions: result.emotions
      });
      DebugLogger.groupEnd();

      return result as CombinedResponse;
    } catch (error) {
      DebugLogger.error('EMOTION', 'Combined response failed', error);
      DebugLogger.groupEnd();
      throw error;
    }
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